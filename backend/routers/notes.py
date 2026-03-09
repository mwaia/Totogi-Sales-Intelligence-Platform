from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, AccountNote, User
from backend.schemas import NoteCreate, NoteResponse

router = APIRouter(tags=["notes"])


@router.post("/api/accounts/{account_id}/notes", response_model=NoteResponse, status_code=201)
def create_note(
    account_id: int,
    req: NoteCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    note = AccountNote(
        account_id=account_id,
        content=req.content,
        created_by_id=user.id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return _to_response(note)


@router.get("/api/accounts/{account_id}/notes", response_model=list[NoteResponse])
def list_notes(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    notes = (
        db.query(AccountNote)
        .filter(AccountNote.account_id == account_id)
        .order_by(AccountNote.created_at.desc())
        .all()
    )
    return [_to_response(n) for n in notes]


@router.delete("/api/notes/{note_id}", status_code=204)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    note = db.query(AccountNote).filter(AccountNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()


def _to_response(note: AccountNote) -> dict:
    return {
        "id": note.id,
        "account_id": note.account_id,
        "content": note.content,
        "created_by_id": note.created_by_id,
        "created_by_name": note.created_by.full_name if note.created_by else None,
        "created_at": note.created_at,
    }
