import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, AccountDocument, DocumentChunk, ResearchReport, User
from backend.schemas import (
    EmbeddingStatusResponse,
    ResearchReportResponse,
    ResearchRequest,
    SimilaritySearchRequest,
    SimilaritySearchResult,
)
from backend.services.openai_service import openai_web_search, stream_deep_research, run_deep_research
from backend.services.embedding_service import (
    embed_document,
    delete_document_chunks,
    search_similar,
)

router = APIRouter(tags=["research"])


# ---------------------------------------------------------------------------
# Deep Research (streaming)
# ---------------------------------------------------------------------------

@router.post("/api/accounts/{account_id}/research/stream")
async def stream_research(
    account_id: int,
    req: ResearchRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Stream a deep research report for an account."""
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account_context = {
        "company_name": account.company_name,
        "industry": account.industry,
        "country": account.country,
        "website": account.website,
    }

    async def event_generator():
        async for event in stream_deep_research(req.query, account_context):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# Deep Research (non-streaming, saves to DB)
# ---------------------------------------------------------------------------

@router.post(
    "/api/accounts/{account_id}/research",
    response_model=ResearchReportResponse,
)
async def create_research_report(
    account_id: int,
    req: ResearchRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Run research and save the report."""
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account_context = {
        "company_name": account.company_name,
        "industry": account.industry,
        "country": account.country,
        "website": account.website,
    }

    if req.report_type == "web_search":
        result = await openai_web_search(req.query, context=f"Company: {account.company_name}")
    else:
        result = await run_deep_research(req.query, account_context)

    report = ResearchReport(
        account_id=account_id,
        query=req.query,
        report_type=req.report_type,
        content=result["text"],
        citations=result.get("citations", []),
        model_used=result.get("model", "gpt-4o"),
        created_by_id=user.id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get(
    "/api/accounts/{account_id}/research",
    response_model=list[ResearchReportResponse],
)
def list_research_reports(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all research reports for an account."""
    return (
        db.query(ResearchReport)
        .filter(ResearchReport.account_id == account_id)
        .order_by(ResearchReport.created_at.desc())
        .all()
    )


@router.get(
    "/api/research/{report_id}",
    response_model=ResearchReportResponse,
)
def get_research_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    report = db.query(ResearchReport).filter(ResearchReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.delete("/api/research/{report_id}")
def delete_research_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    report = db.query(ResearchReport).filter(ResearchReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return {"message": "Deleted"}


# ---------------------------------------------------------------------------
# Quick Web Search
# ---------------------------------------------------------------------------

@router.post("/api/accounts/{account_id}/research/web-search")
async def web_search(
    account_id: int,
    req: ResearchRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Quick web search with OpenAI."""
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    result = await openai_web_search(req.query, context=f"Company: {account.company_name}")
    return result


# ---------------------------------------------------------------------------
# Embeddings & Similarity Search
# ---------------------------------------------------------------------------

@router.post("/api/accounts/{account_id}/documents/{doc_id}/embed")
def embed_doc(
    account_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Manually trigger embedding for a specific document."""
    doc = (
        db.query(AccountDocument)
        .filter(AccountDocument.id == doc_id, AccountDocument.account_id == account_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunk_count = embed_document(doc, db)
    return {"document_id": doc_id, "chunks_created": chunk_count}


@router.post("/api/accounts/{account_id}/embeddings/embed-all")
def embed_all_docs(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Embed all documents for an account."""
    docs = (
        db.query(AccountDocument)
        .filter(AccountDocument.account_id == account_id)
        .all()
    )

    total_chunks = 0
    embedded_docs = 0
    for doc in docs:
        if doc.extracted_text:
            count = embed_document(doc, db)
            total_chunks += count
            if count > 0:
                embedded_docs += 1

    return {
        "documents_processed": len(docs),
        "documents_embedded": embedded_docs,
        "total_chunks": total_chunks,
    }


@router.post(
    "/api/accounts/{account_id}/embeddings/search",
    response_model=list[SimilaritySearchResult],
)
def similarity_search(
    account_id: int,
    req: SimilaritySearchRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Search documents by semantic similarity."""
    results = search_similar(req.query, account_id, db, top_k=req.top_k)
    return results


@router.get(
    "/api/accounts/{account_id}/embeddings/status",
    response_model=list[EmbeddingStatusResponse],
)
def embedding_status(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get embedding status for all documents in an account."""
    docs = (
        db.query(AccountDocument)
        .filter(AccountDocument.account_id == account_id)
        .all()
    )

    results = []
    for doc in docs:
        chunk_count = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == doc.id)
            .count()
        )
        results.append({
            "document_id": doc.id,
            "original_filename": doc.original_filename,
            "chunk_count": chunk_count,
            "is_embedded": chunk_count > 0,
        })

    return results
