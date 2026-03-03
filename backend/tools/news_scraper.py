import json

import httpx
from bs4 import BeautifulSoup


async def scrape_url(url: str) -> str:
    """Fetch a URL and extract the main text content."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
            response = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; SalesIntelBot/1.0)"
            })
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove scripts, styles, nav elements
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        # Try to find the main content area
        main = soup.find("main") or soup.find("article") or soup.find("body")
        if not main:
            return json.dumps({"error": "Could not extract content"})

        text = main.get_text(separator="\n", strip=True)

        # Truncate to avoid overwhelming the context
        if len(text) > 5000:
            text = text[:5000] + "\n\n[Content truncated...]"

        return json.dumps({
            "url": url,
            "title": soup.title.string if soup.title else "",
            "content": text,
        })
    except Exception as e:
        return json.dumps({"error": f"Failed to scrape {url}: {str(e)}"})
