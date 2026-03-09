from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, AccountBrainLift, User
from backend.schemas import BrainLiftResponse
from backend.services.document_service import save_file, delete_file, extract_text
from backend.config import DATA_DIR, settings

router = APIRouter(tags=["brainlift"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/api/accounts/{account_id}/brainlift", response_model=BrainLiftResponse)
async def upload_brainlift(
    account_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload or replace the Account BrainLift (master context document)."""
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    # Delete existing BrainLift if one exists
    existing = db.query(AccountBrainLift).filter(AccountBrainLift.account_id == account_id).first()
    if existing:
        delete_file(existing.file_path)
        # Clean up embedding chunks if applicable
        if settings.openai_api_key:
            try:
                from backend.services.embedding_service import delete_document_chunks
                from backend.models import DocumentChunk
                db.query(DocumentChunk).filter(
                    DocumentChunk.account_id == account_id,
                    DocumentChunk.document_id == existing.id,
                ).delete()
            except Exception:
                pass
        db.delete(existing)
        db.flush()

    stored_name, file_path = save_file(account_id, file.filename or "brainlift", content)
    extracted = extract_text(file.filename or "", content)

    brainlift = AccountBrainLift(
        account_id=account_id,
        filename=stored_name,
        original_filename=file.filename or "brainlift",
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type or "",
        extracted_text=extracted,
        uploaded_by_id=user.id,
    )
    db.add(brainlift)
    db.commit()
    db.refresh(brainlift)

    return _to_response(brainlift)


@router.get("/api/accounts/{account_id}/brainlift", response_model=BrainLiftResponse)
def get_brainlift(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bl = db.query(AccountBrainLift).filter(AccountBrainLift.account_id == account_id).first()
    if not bl:
        raise HTTPException(status_code=404, detail="No BrainLift uploaded for this account")
    return _to_response(bl)


@router.delete("/api/accounts/{account_id}/brainlift", status_code=204)
def delete_brainlift(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bl = db.query(AccountBrainLift).filter(AccountBrainLift.account_id == account_id).first()
    if not bl:
        raise HTTPException(status_code=404, detail="No BrainLift uploaded")
    delete_file(bl.file_path)
    db.delete(bl)
    db.commit()


@router.get("/api/accounts/{account_id}/brainlift/download")
def download_brainlift(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bl = db.query(AccountBrainLift).filter(AccountBrainLift.account_id == account_id).first()
    if not bl:
        raise HTTPException(status_code=404, detail="No BrainLift uploaded")

    full_path = DATA_DIR.parent / bl.file_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=str(full_path),
        filename=bl.original_filename,
        media_type=bl.mime_type or "application/octet-stream",
    )


def _to_response(bl: AccountBrainLift) -> dict:
    text = bl.extracted_text or ""
    return {
        "id": bl.id,
        "account_id": bl.account_id,
        "original_filename": bl.original_filename,
        "file_size": bl.file_size,
        "mime_type": bl.mime_type,
        "has_extracted_text": bool(text),
        "text_preview": text[:500] if text else "",
        "uploaded_by_id": bl.uploaded_by_id,
        "created_at": bl.created_at,
        "updated_at": bl.updated_at,
    }
