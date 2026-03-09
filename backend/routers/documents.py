from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, AccountDocument, User
from backend.schemas import DocumentResponse
from backend.services.document_service import save_file, delete_file, extract_text
from backend.config import DATA_DIR, settings

router = APIRouter(tags=["documents"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/api/accounts/{account_id}/documents", response_model=DocumentResponse, status_code=201)
async def upload_document(
    account_id: int,
    file: UploadFile = File(...),
    doc_type: str = Query("activity"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    stored_name, file_path = save_file(account_id, file.filename or "unnamed", content)
    extracted = extract_text(file.filename or "", content)

    doc = AccountDocument(
        account_id=account_id,
        filename=stored_name,
        original_filename=file.filename or "unnamed",
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type or "",
        extracted_text=extracted,
        doc_type=doc_type if doc_type in ("knowledge", "activity") else "activity",
        uploaded_by_id=user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Auto-embed if OpenAI key is configured
    if settings.openai_api_key and extracted:
        try:
            from backend.services.embedding_service import embed_document
            embed_document(doc, db)
        except Exception:
            pass  # Embedding is best-effort; don't fail the upload

    return _to_response(doc)


@router.get("/api/accounts/{account_id}/documents", response_model=list[DocumentResponse])
def list_documents(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return [
        _to_response(d)
        for d in db.query(AccountDocument)
        .filter(AccountDocument.account_id == account_id)
        .order_by(AccountDocument.created_at.desc())
        .all()
    ]


@router.get("/api/documents/{doc_id}/download")
def download_document(
    doc_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    doc = db.query(AccountDocument).filter(AccountDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    full_path = DATA_DIR.parent / doc.file_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=str(full_path),
        filename=doc.original_filename,
        media_type=doc.mime_type or "application/octet-stream",
    )


@router.delete("/api/documents/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    doc = db.query(AccountDocument).filter(AccountDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Clean up embedding chunks
    if settings.openai_api_key:
        try:
            from backend.services.embedding_service import delete_document_chunks
            delete_document_chunks(doc.id, db)
        except Exception:
            pass

    delete_file(doc.file_path)
    db.delete(doc)
    db.commit()


def _to_response(doc: AccountDocument) -> dict:
    return {
        "id": doc.id,
        "account_id": doc.account_id,
        "original_filename": doc.original_filename,
        "file_size": doc.file_size,
        "mime_type": doc.mime_type,
        "has_extracted_text": bool(doc.extracted_text),
        "doc_type": doc.doc_type or "activity",
        "uploaded_by_id": doc.uploaded_by_id,
        "created_at": doc.created_at,
    }
