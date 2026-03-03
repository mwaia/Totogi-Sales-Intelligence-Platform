import json
from datetime import datetime, timezone

import anthropic
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models import Account, NewsItem, IntelligenceBrief
from backend.tools.web_search import search_web
from backend.services.news_service import refresh_account_news


INTELLIGENCE_SEARCHES = {
    "financial_update": [
        "{company} financial results earnings revenue",
        "{company} quarterly report annual results",
    ],
    "executive_change": [
        "{company} CEO CTO CIO appointment executive",
        "{company} leadership change new hire",
    ],
    "competitor_activity": [
        "{company} competitor BSS billing system vendor",
    ],
    "industry_trend": [
        "{company} 5G AI telecom transformation {year}",
    ],
    "technology_initiative": [
        "{company} digital cloud migration modernization",
    ],
}


async def refresh_intelligence(account_id: int, db: Session, user_id: int | None = None) -> dict:
    """Run comprehensive intelligence gathering for an account."""
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return {"news_count": 0, "brief_id": None, "message": "Account not found"}

    company = account.company_name
    year = datetime.now().year

    # Step 1: Run existing news refresh
    base_results = await refresh_account_news(account_id, db)

    # Step 2: Run categorized intelligence searches
    existing_urls = {n.url for n in db.query(NewsItem).filter(NewsItem.account_id == account_id).all()}
    new_items = []

    for category, queries in INTELLIGENCE_SEARCHES.items():
        for query_template in queries:
            query = query_template.format(company=company, year=year)
            raw = await search_web(query, 3)
            try:
                data = json.loads(raw)
                if isinstance(data, list):
                    for item in data:
                        url = item.get("url", "")
                        if url and url not in existing_urls:
                            news = NewsItem(
                                account_id=account_id,
                                title=item.get("title", ""),
                                source="Intelligence Search",
                                url=url,
                                summary=item.get("snippet", ""),
                                category=category,
                                relevance_score=0.6,
                                scraped_at=datetime.now(timezone.utc),
                            )
                            db.add(news)
                            new_items.append(news)
                            existing_urls.add(url)
            except (json.JSONDecodeError, TypeError):
                pass

    if new_items:
        db.commit()

    total_new = len(base_results) + len(new_items)

    # Step 3: Generate AI intelligence brief
    brief_id = await _generate_intelligence_brief(account_id, db, user_id)

    return {
        "news_count": total_new,
        "brief_id": brief_id,
        "message": f"Found {total_new} intelligence items and generated brief",
    }


async def _generate_intelligence_brief(account_id: int, db: Session, user_id: int | None) -> int | None:
    """Use Claude to generate a structured intelligence brief."""
    items = (
        db.query(NewsItem)
        .filter(NewsItem.account_id == account_id)
        .order_by(NewsItem.scraped_at.desc())
        .limit(50)
        .all()
    )

    if not items:
        return None

    account = db.query(Account).filter(Account.id == account_id).first()

    items_text = "\n".join([
        f"- [{item.category}] {item.title}: {item.summary}" for item in items
    ])

    prompt = f"""Analyze the following intelligence items for {account.company_name} and produce a structured intelligence brief.

## Raw Intelligence Items:
{items_text}

Respond ONLY with valid JSON in this exact format:
{{
    "summary": "2-3 paragraph executive summary of the intelligence landscape",
    "key_highlights": [
        {{"text": "highlight text", "category": "category_name", "signal_type": "positive|neutral|negative"}}
    ],
    "risk_signals": [
        {{"text": "risk description", "severity": "high|medium|low"}}
    ],
    "opportunity_signals": [
        {{"text": "opportunity description", "priority": "high|medium|low"}}
    ]
}}"""

    try:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = response.content[0].text
        # Strip markdown code fences if present
        if response_text.strip().startswith("```"):
            lines = response_text.strip().split("\n")
            response_text = "\n".join(lines[1:-1])

        data = json.loads(response_text)

        brief = IntelligenceBrief(
            account_id=account_id,
            summary=data.get("summary", ""),
            key_highlights=data.get("key_highlights", []),
            risk_signals=data.get("risk_signals", []),
            opportunity_signals=data.get("opportunity_signals", []),
            created_by_id=user_id,
        )
        db.add(brief)
        db.commit()
        db.refresh(brief)
        return brief.id
    except Exception:
        return None


def get_intelligence_context(account_id: int, db: Session) -> str:
    """Build intelligence context string for AI system prompt."""
    brief = (
        db.query(IntelligenceBrief)
        .filter(IntelligenceBrief.account_id == account_id)
        .order_by(IntelligenceBrief.generated_at.desc())
        .first()
    )

    if not brief:
        return ""

    parts = [f"## Latest Intelligence Brief\n\n{brief.summary}"]

    if brief.key_highlights:
        parts.append("\n**Key Highlights:**")
        for h in brief.key_highlights[:5]:
            parts.append(f"- [{h.get('signal_type', 'neutral')}] {h.get('text', '')}")

    if brief.risk_signals:
        parts.append("\n**Risk Signals:**")
        for r in brief.risk_signals[:3]:
            parts.append(f"- [{r.get('severity', 'medium')}] {r.get('text', '')}")

    if brief.opportunity_signals:
        parts.append("\n**Opportunity Signals:**")
        for o in brief.opportunity_signals[:3]:
            parts.append(f"- [{o.get('priority', 'medium')}] {o.get('text', '')}")

    return "\n".join(parts)
