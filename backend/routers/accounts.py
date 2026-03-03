from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, User
from backend.schemas import AccountCreate, AccountUpdate, AccountResponse

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountResponse])
def list_accounts(
    search: str = Query("", description="Search by company name"),
    status: str = Query("", description="Filter by status"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Account)
    if search:
        query = query.filter(Account.company_name.ilike(f"%{search}%"))
    if status:
        query = query.filter(Account.current_status == status)
    return query.order_by(Account.updated_at.desc()).all()


@router.post("", response_model=AccountResponse, status_code=201)
def create_account(
    body: AccountCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = db.query(Account).filter(Account.company_name == body.company_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account with this company name already exists")
    account = Account(
        **body.model_dump(exclude={"key_contacts"}),
        key_contacts=[c.model_dump() for c in body.key_contacts],
        owner_id=user.id,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    body: AccountUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    update_data = body.model_dump(exclude_unset=True)
    if "key_contacts" in update_data and update_data["key_contacts"] is not None:
        update_data["key_contacts"] = [c.model_dump() if hasattr(c, "model_dump") else c for c in update_data["key_contacts"]]

    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
