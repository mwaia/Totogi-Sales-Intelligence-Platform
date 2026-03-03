from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, NewsItem, User
from backend.schemas import NewsItemResponse
from backend.services.news_service import refresh_account_news

router = APIRouter(tags=["news"])


@router.post("/api/accounts/{account_id}/news/refresh")
async def refresh_news(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    saved = await refresh_account_news(account_id, db)
    return {"message": f"Found {len(saved)} new articles", "count": len(saved)}


@router.get("/api/accounts/{account_id}/news", response_model=list[NewsItemResponse])
def list_news(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(NewsItem)
        .filter(NewsItem.account_id == account_id)
        .order_by(NewsItem.scraped_at.desc())
        .all()
    )
