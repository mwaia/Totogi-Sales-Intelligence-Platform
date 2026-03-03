import json

from backend.tools.web_search import search_web


async def search_twitter(company_name: str, topic: str = "") -> str:
    """Search for X/Twitter posts about a company using web search as a fallback.

    This uses DuckDuckGo with site:x.com filtering rather than the X API
    to avoid the $100/month API cost. Can be upgraded to the real X API later.
    """
    query = f"site:x.com {company_name}"
    if topic:
        query += f" {topic}"
    query += " telecom"

    return await search_web(query, 5)
