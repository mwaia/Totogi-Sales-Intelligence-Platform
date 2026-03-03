import json

from duckduckgo_search import DDGS


async def search_web(query: str, num_results: int = 5) -> str:
    """Search the web using DuckDuckGo and return results as JSON string."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=min(num_results, 10)))

        formatted = []
        for r in results:
            formatted.append({
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "snippet": r.get("body", ""),
            })

        return json.dumps(formatted, indent=2)
    except Exception as e:
        return json.dumps({"error": f"Search failed: {str(e)}"})
