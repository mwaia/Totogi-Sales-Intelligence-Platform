from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, AccountTask, Deal, User
from backend.schemas import DealCreate, DealResponse, DealUpdate

router = APIRouter(tags=["deals"])


@router.post("/api/accounts/{account_id}/deals", response_model=DealResponse, status_code=201)
def create_deal(
    account_id: int,
    req: DealCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    deal = Deal(
        account_id=account_id,
        title=req.title,
        description=req.description,
        current_status=req.current_status if req.current_status in ("prospect", "qualified", "discovery", "poc", "negotiation", "closed_won", "closed_lost") else "prospect",
        deal_value=req.deal_value,
        created_by_id=user.id,
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return _to_response(deal, db)


@router.get("/api/accounts/{account_id}/deals", response_model=list[DealResponse])
def list_deals(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deals = (
        db.query(Deal)
        .filter(Deal.account_id == account_id)
        .order_by(Deal.updated_at.desc())
        .all()
    )
    return [_to_response(d, db) for d in deals]


@router.get("/api/deals/{deal_id}", response_model=DealResponse)
def get_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return _to_response(deal, db)


@router.put("/api/deals/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: int,
    req: DealUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if req.title is not None:
        deal.title = req.title
    if req.description is not None:
        deal.description = req.description
    if req.current_status is not None and req.current_status in ("prospect", "qualified", "discovery", "poc", "negotiation", "closed_won", "closed_lost"):
        deal.current_status = req.current_status
    if req.deal_value is not None:
        deal.deal_value = req.deal_value

    db.commit()
    db.refresh(deal)
    return _to_response(deal, db)


@router.delete("/api/deals/{deal_id}", status_code=204)
def delete_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()


def _to_response(deal: Deal, db) -> dict:
    task_count = db.query(AccountTask).filter(AccountTask.deal_id == deal.id).count()
    open_count = db.query(AccountTask).filter(AccountTask.deal_id == deal.id, AccountTask.status != "done").count()
    return {
        "id": deal.id,
        "account_id": deal.account_id,
        "title": deal.title,
        "description": deal.description,
        "current_status": deal.current_status,
        "deal_value": deal.deal_value,
        "created_by_id": deal.created_by_id,
        "created_by_name": deal.created_by.full_name if deal.created_by else None,
        "created_at": deal.created_at,
        "updated_at": deal.updated_at,
        "task_count": task_count,
        "open_task_count": open_count,
    }
