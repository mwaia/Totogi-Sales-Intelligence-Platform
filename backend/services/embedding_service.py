"""Document chunking, embedding, and similarity search."""

import json
import math
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from backend.models import AccountDocument, DocumentChunk
from backend.services.openai_service import embed_texts, embed_single


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

CHUNK_SIZE = 1000  # characters per chunk
CHUNK_OVERLAP = 200  # overlap between chunks


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    if not text or not text.strip():
        return []

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        # Try to break at a sentence or paragraph boundary
        if end < len(text):
            # Look for the last sentence-ending punctuation
            for sep in ["\n\n", "\n", ". ", "! ", "? "]:
                last_sep = chunk.rfind(sep)
                if last_sep > chunk_size // 2:
                    chunk = chunk[: last_sep + len(sep)]
                    end = start + len(chunk)
                    break

        if chunk.strip():
            chunks.append(chunk.strip())

        start = end - overlap
        if start >= len(text):
            break

    return chunks


# ---------------------------------------------------------------------------
# Embedding storage
# ---------------------------------------------------------------------------

def embed_document(doc: AccountDocument, db: Session) -> int:
    """Chunk and embed a document. Returns number of chunks created."""
    if not doc.extracted_text:
        return 0

    # Delete existing chunks for this document
    db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()

    chunks = chunk_text(doc.extracted_text)
    if not chunks:
        return 0

    # Generate embeddings in batch
    vectors = embed_texts(chunks)

    for i, (chunk_text_content, vector) in enumerate(zip(chunks, vectors)):
        chunk = DocumentChunk(
            document_id=doc.id,
            account_id=doc.account_id,
            chunk_index=i,
            content=chunk_text_content,
            embedding_json=json.dumps(vector),
        )
        db.add(chunk)

    db.commit()
    return len(chunks)


def delete_document_chunks(document_id: int, db: Session) -> None:
    """Delete all chunks for a document."""
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
    db.commit()


# ---------------------------------------------------------------------------
# Similarity search
# ---------------------------------------------------------------------------

def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def search_similar(
    query: str,
    account_id: int,
    db: Session,
    top_k: int = 5,
    min_score: float = 0.3,
) -> list[dict]:
    """Find document chunks most similar to query text.

    Returns list of {content, score, document_id, original_filename, chunk_index}.
    """
    query_vector = embed_single(query)
    if not query_vector:
        return []

    # Get all chunks for this account
    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.account_id == account_id)
        .all()
    )

    if not chunks:
        return []

    # Score each chunk
    scored = []
    for chunk in chunks:
        try:
            chunk_vector = json.loads(chunk.embedding_json)
        except (json.JSONDecodeError, TypeError):
            continue

        score = _cosine_similarity(query_vector, chunk_vector)
        if score >= min_score:
            scored.append((chunk, score))

    # Sort by score descending
    scored.sort(key=lambda x: x[1], reverse=True)

    # Get document info for top results
    results = []
    for chunk, score in scored[:top_k]:
        doc = db.query(AccountDocument).filter(AccountDocument.id == chunk.document_id).first()
        results.append({
            "content": chunk.content,
            "score": round(score, 4),
            "document_id": chunk.document_id,
            "original_filename": doc.original_filename if doc else "Unknown",
            "chunk_index": chunk.chunk_index,
        })

    return results


def get_relevant_context(
    query: str,
    account_id: int,
    db: Session,
    max_chars: int = 8000,
) -> str:
    """Get relevant document context for a query via semantic search.

    Returns a formatted string of the most relevant document chunks.
    """
    results = search_similar(query, account_id, db, top_k=8)
    if not results:
        return ""

    parts = ["## Relevant Document Context (semantic search)"]
    total_chars = 0

    for r in results:
        entry = f"\n### {r['original_filename']} (relevance: {r['score']})\n{r['content']}"
        if total_chars + len(entry) > max_chars:
            break
        parts.append(entry)
        total_chars += len(entry)

    return "\n".join(parts)
