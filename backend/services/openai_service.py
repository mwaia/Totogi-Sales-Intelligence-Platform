"""OpenAI integration: Deep Research, Web Search, and Embeddings."""

from datetime import datetime
from typing import AsyncGenerator

from openai import OpenAI

from backend.config import settings
from backend.brainlift.loader import extract_brainlift_text

def get_client() -> OpenAI:
    """Create a fresh client each time to pick up env changes."""
    return OpenAI(api_key=settings.openai_api_key)


# ---------------------------------------------------------------------------
# 1. Web Search (quick) — Responses API with web_search_preview
# ---------------------------------------------------------------------------

async def openai_web_search(query: str, context: str = "") -> dict:
    """Quick web search via OpenAI Responses API with web_search_preview tool.

    Returns structured results with citations.
    """
    client = get_client()
    today = datetime.now().strftime("%B %d, %Y")

    prompt = f"Today is {today}. Only return information from the last 12 months. Ignore anything older than {datetime.now().year - 1}.\n\n"
    prompt += "You are researching for BSS Magic (Totogi), a telecom BSS platform company. Frame results through the lens of BSS/telecom relevance.\n\n"
    if context:
        prompt += f"Context: {context}\n\n"
    prompt += f"Search query: {query}"

    response = client.responses.create(
        model="gpt-4o",
        tools=[{"type": "web_search_preview"}],
        input=prompt,
    )

    # Extract text and citations from response
    result_text = ""
    citations = []

    for item in response.output:
        if item.type == "message":
            for content in item.content:
                if content.type == "output_text":
                    result_text = content.text
                    # Extract annotations/citations
                    if hasattr(content, "annotations"):
                        for ann in content.annotations:
                            if hasattr(ann, "url"):
                                citations.append({
                                    "title": getattr(ann, "title", ""),
                                    "url": ann.url,
                                })

    return {
        "text": result_text,
        "citations": citations,
        "model": "gpt-4o",
    }


# ---------------------------------------------------------------------------
# 2. Deep Research — multi-step comprehensive research
# ---------------------------------------------------------------------------

async def stream_deep_research(
    query: str,
    account_context: dict | None = None,
) -> AsyncGenerator[dict, None]:
    """Run deep research using OpenAI's Responses API with streaming.

    Uses web_search_preview tool with a thorough research prompt for
    comprehensive, multi-source analysis.

    Yields dicts: {"type": "text"|"status"|"citations"|"done", ...}
    """
    client = get_client()

    # Build a research-grade prompt
    context_parts = []
    if account_context:
        context_parts.append(f"Company: {account_context.get('company_name', '')}")
        if account_context.get("industry"):
            context_parts.append(f"Industry: {account_context['industry']}")
        if account_context.get("country"):
            context_parts.append(f"Country: {account_context['country']}")
        if account_context.get("website"):
            context_parts.append(f"Website: {account_context['website']}")

    context_block = "\n".join(context_parts) if context_parts else ""

    today = datetime.now().strftime("%B %d, %Y")
    cutoff_year = datetime.now().year - 1

    brainlift_summary = extract_brainlift_text()[:3000]  # Truncate for OpenAI context

    research_prompt = f"""You are a senior sales intelligence analyst for BSS Magic (Totogi), conducting deep research for our B2B sales team.

## Our Company DNA
{brainlift_summary}

**CRITICAL: Today's date is {today}. ALL information MUST be from the last 12 months (since {cutoff_year}). Exclude anything older. Prioritize the last 3 months.**

{f"## Target Account{chr(10)}{context_block}" if context_block else ""}

## Research Task
{query}

## Instructions
Conduct thorough, multi-faceted research. Frame findings through BSS Magic's lens — identify where our three-layer ontology platform creates unique value vs. their current stack. Cover:
1. Recent news and press releases (last 3-6 months)
2. Latest financial performance and outlook (most recent quarter)
3. Current strategic initiatives and digital transformation efforts
4. Recent leadership changes and organizational shifts
5. Current competitive landscape and vendor relationships (especially BSS vendors like Amdocs, Netcracker, Ericsson, CloudSense)
6. Technology stack and active modernization plans
7. Signs of "semantic bankruptcy" — data/AI investments that can't drive operational action

Provide a comprehensive, well-structured research report with:
- Executive summary
- Key findings organized by theme (with dates for each finding)
- Strategic implications for BSS Magic's sales engagement
- Beachhead opportunity assessment
- Specific citations for all claims

**For every claim, include the date or timeframe. Exclude anything older than 12 months.**"""

    yield {"type": "status", "content": "Starting deep research..."}

    try:
        stream = client.responses.create(
            model="gpt-4o",
            tools=[{"type": "web_search_preview"}],
            input=research_prompt,
            stream=True,
        )

        all_citations = []

        for event in stream:
            if event.type == "response.output_text.delta":
                yield {"type": "text", "content": event.delta}
            elif event.type == "response.output_text.done":
                # Extract citations from annotations
                if hasattr(event, "annotations"):
                    for ann in event.annotations:
                        if hasattr(ann, "url"):
                            all_citations.append({
                                "title": getattr(ann, "title", ""),
                                "url": ann.url,
                            })

        if all_citations:
            yield {"type": "citations", "citations": all_citations}

    except Exception as e:
        yield {"type": "error", "content": str(e)}

    yield {"type": "done"}


async def run_deep_research(
    query: str,
    account_context: dict | None = None,
) -> dict:
    """Non-streaming deep research. Returns complete result."""
    client = get_client()

    context_parts = []
    if account_context:
        context_parts.append(f"Company: {account_context.get('company_name', '')}")
        if account_context.get("industry"):
            context_parts.append(f"Industry: {account_context['industry']}")
        if account_context.get("country"):
            context_parts.append(f"Country: {account_context['country']}")

    context_block = "\n".join(context_parts) if context_parts else ""

    today = datetime.now().strftime("%B %d, %Y")
    cutoff_year = datetime.now().year - 1

    brainlift_summary = extract_brainlift_text()[:3000]

    research_prompt = f"""You are a senior sales intelligence analyst for BSS Magic (Totogi).

## Our Company DNA
{brainlift_summary}

**CRITICAL: Today is {today}. ALL information MUST be from the last 12 months (since {cutoff_year}). Exclude anything older. Prioritize the last 3 months.**

{f"## Target Account{chr(10)}{context_block}" if context_block else ""}

## Research Task
{query}

Conduct thorough research. Frame findings through BSS Magic's lens — identify beachhead opportunities, competitive positioning vs. legacy BSS vendors, and signs of semantic bankruptcy. Provide executive summary, key findings by theme (with dates), strategic implications for our sales engagement, and citations. Exclude all information older than 12 months."""

    response = client.responses.create(
        model="gpt-4o",
        tools=[{"type": "web_search_preview"}],
        input=research_prompt,
    )

    result_text = ""
    citations = []

    for item in response.output:
        if item.type == "message":
            for content in item.content:
                if content.type == "output_text":
                    result_text = content.text
                    if hasattr(content, "annotations"):
                        for ann in content.annotations:
                            if hasattr(ann, "url"):
                                citations.append({
                                    "title": getattr(ann, "title", ""),
                                    "url": ann.url,
                                })

    return {
        "text": result_text,
        "citations": citations,
        "model": "gpt-4o",
    }


# ---------------------------------------------------------------------------
# 3. Embeddings
# ---------------------------------------------------------------------------

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts.

    Returns list of embedding vectors.
    """
    if not texts:
        return []

    client = get_client()

    # OpenAI API accepts up to ~8K tokens per text, batch up to 2048 items
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )

    return [item.embedding for item in response.data]


def embed_single(text: str) -> list[float]:
    """Generate embedding for a single text."""
    results = embed_texts([text])
    return results[0] if results else []
