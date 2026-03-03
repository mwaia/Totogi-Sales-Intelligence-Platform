import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from backend.models import Account, NewsItem
from backend.tools.web_search import search_web
from backend.tools.twitter_search import search_twitter


async def refresh_account_news(account_id: int, db: Session) -> list[dict]:
    """Search for news about an account and store results."""
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return []

    company = account.company_name
    year = datetime.now().year
    results = []

    # Web search for general news (biased toward current year)
    web_results = await search_web(f"{company} telecom news {year}", 5)
    try:
        web_data = json.loads(web_results)
        if isinstance(web_data, list):
            for item in web_data:
                results.append({
                    "title": item.get("title", ""),
                    "source": "Web Search",
                    "url": item.get("url", ""),
                    "summary": item.get("snippet", ""),
                    "category": "news",
                    "relevance_score": 0.6,
                })
    except (json.JSONDecodeError, TypeError):
        pass

    # Search for press releases
    pr_results = await search_web(f"{company} press release announcement {year}", 3)
    try:
        pr_data = json.loads(pr_results)
        if isinstance(pr_data, list):
            for item in pr_data:
                results.append({
                    "title": item.get("title", ""),
                    "source": "Press Release",
                    "url": item.get("url", ""),
                    "summary": item.get("snippet", ""),
                    "category": "press_release",
                    "relevance_score": 0.7,
                })
    except (json.JSONDecodeError, TypeError):
        pass

    # Twitter/X search
    tw_results = await search_twitter(company)
    try:
        tw_data = json.loads(tw_results)
        if isinstance(tw_data, list):
            for item in tw_data:
                results.append({
                    "title": item.get("title", ""),
                    "source": "X/Twitter",
                    "url": item.get("url", ""),
                    "summary": item.get("snippet", ""),
                    "category": "social",
                    "relevance_score": 0.5,
                })
    except (json.JSONDecodeError, TypeError):
        pass

    # Store results in DB (avoid duplicates by URL)
    existing_urls = {n.url for n in db.query(NewsItem).filter(NewsItem.account_id == account_id).all()}
    saved = []

    for item in results:
        if item["url"] and item["url"] not in existing_urls:
            news = NewsItem(
                account_id=account_id,
                title=item["title"],
                source=item["source"],
                url=item["url"],
                summary=item["summary"],
                category=item["category"],
                relevance_score=item["relevance_score"],
                scraped_at=datetime.now(timezone.utc),
            )
            db.add(news)
            saved.append(item)
            existing_urls.add(item["url"])

    if saved:
        db.commit()

    return saved
