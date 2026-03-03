from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, IntelligenceBrief, NewsItem, User
from backend.schemas import IntelligenceBriefResponse, IntelligenceRefreshResponse, NewsItemResponse
from backend.services.intelligence_service import refresh_intelligence

router = APIRouter(tags=["intelligence"])


@router.post(
    "/api/accounts/{account_id}/intelligence/refresh",
    response_model=IntelligenceRefreshResponse,
)
async def refresh_account_intelligence(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    result = await refresh_intelligence(account_id, db, user_id=user.id)
    return result


@router.get("/api/accounts/{account_id}/intelligence")
def get_intelligence(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    brief = (
        db.query(IntelligenceBrief)
        .filter(IntelligenceBrief.account_id == account_id)
        .order_by(IntelligenceBrief.generated_at.desc())
        .first()
    )

    six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
    items = (
        db.query(NewsItem)
        .filter(NewsItem.account_id == account_id, NewsItem.scraped_at >= six_months_ago)
        .order_by(NewsItem.scraped_at.desc())
        .all()
    )

    return {
        "brief": IntelligenceBriefResponse.model_validate(brief).model_dump() if brief else None,
        "items": [NewsItemResponse.model_validate(i).model_dump() for i in items],
    }


@router.get(
    "/api/accounts/{account_id}/intelligence/briefs",
    response_model=list[IntelligenceBriefResponse],
)
def list_briefs(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(IntelligenceBrief)
        .filter(IntelligenceBrief.account_id == account_id)
        .order_by(IntelligenceBrief.generated_at.desc())
        .all()
    )
