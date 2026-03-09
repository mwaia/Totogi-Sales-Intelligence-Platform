import json
from typing import AsyncGenerator

import anthropic

from backend.brainlift.prompt import build_system_prompt
from backend.config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

MODEL = "claude-opus-4-6"


async def stream_chat(
    messages: list[dict],
    account_context: dict | None = None,
    tools: list[dict] | None = None,
    document_context: str = "",
    intelligence_context: str = "",
    knowledge_context: str = "",
    activity_context: str = "",
    brainlift_context: str = "",
) -> AsyncGenerator[dict, None]:
    """Stream a chat response, handling tool calls in an agentic loop.

    Yields dicts with keys: type ("text"|"thinking"|"tool_use"|"tool_result"|"done"), content.
    """
    system = build_system_prompt(account_context, document_context=document_context, intelligence_context=intelligence_context, knowledge_context=knowledge_context, activity_context=activity_context, brainlift_context=brainlift_context)
    working_messages = list(messages)

    while True:
        kwargs: dict = {
            "model": MODEL,
            "max_tokens": 16000,
            "system": system,
            "messages": working_messages,
            "thinking": {"type": "adaptive"},
        }
        if tools:
            kwargs["tools"] = tools

        with client.messages.stream(**kwargs) as stream:
            full_response = []
            tool_use_blocks = []

            for event in stream:
                if event.type == "content_block_start":
                    if event.content_block.type == "tool_use":
                        yield {"type": "tool_use", "tool": event.content_block.name, "id": event.content_block.id}
                elif event.type == "content_block_delta":
                    if event.delta.type == "text_delta":
                        yield {"type": "text", "content": event.delta.text}
                    elif event.delta.type == "thinking_delta":
                        yield {"type": "thinking", "content": event.delta.thinking}

            final = stream.get_final_message()
            full_response = final.content

            # Extract tool use blocks
            tool_use_blocks = [b for b in full_response if b.type == "tool_use"]

        # If no tool calls, we're done
        if final.stop_reason != "tool_use" or not tool_use_blocks:
            yield {"type": "done"}
            return

        # Execute tools and continue the loop
        working_messages.append({"role": "assistant", "content": full_response})

        tool_results = []
        for tool_block in tool_use_blocks:
            result = await execute_tool(tool_block.name, tool_block.input)
            yield {"type": "tool_result", "tool": tool_block.name, "result": result}
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_block.id,
                "content": result,
            })

        working_messages.append({"role": "user", "content": tool_results})


async def stream_plan(
    account_context: dict,
    plan_type: str,
    plan_prompt: str,
    document_context: str = "",
    intelligence_context: str = "",
    knowledge_context: str = "",
    activity_context: str = "",
    brainlift_context: str = "",
) -> AsyncGenerator[dict, None]:
    """Stream a plan generation with extended thinking."""
    system = build_system_prompt(account_context, document_context=document_context, intelligence_context=intelligence_context, knowledge_context=knowledge_context, activity_context=activity_context, brainlift_context=brainlift_context)

    with client.messages.stream(
        model=MODEL,
        max_tokens=16000,
        system=system,
        messages=[{"role": "user", "content": plan_prompt}],
        thinking={"type": "adaptive"},
    ) as stream:
        for event in stream:
            if event.type == "content_block_delta":
                if event.delta.type == "text_delta":
                    yield {"type": "text", "content": event.delta.text}
                elif event.delta.type == "thinking_delta":
                    yield {"type": "thinking", "content": event.delta.thinking}

    yield {"type": "done"}


async def execute_tool(name: str, input_data: dict) -> str:
    """Execute a tool by name and return the result as a string."""
    from backend.tools.web_search import search_web
    from backend.tools.news_scraper import scrape_url

    try:
        if name == "web_search":
            return await search_web(input_data.get("query", ""), input_data.get("num_results", 5))
        elif name == "scrape_url":
            return await scrape_url(input_data.get("url", ""))
        elif name == "search_account_news":
            query = input_data.get("company_name", "")
            if input_data.get("topic"):
                query += f" {input_data['topic']}"
            query += " telecom news"
            return await search_web(query, 5)
        else:
            return json.dumps({"error": f"Unknown tool: {name}"})
    except Exception as e:
        return json.dumps({"error": str(e)})


# Tool definitions for Claude
TOOLS = [
    {
        "name": "web_search",
        "description": "Search the web for recent news, press releases, and articles about a company or topic. Use this to gather intelligence about sales accounts.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query. Be specific - include company name and topic.",
                },
                "num_results": {
                    "type": "integer",
                    "description": "Number of results to return (1-10)",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "scrape_url",
        "description": "Fetch and extract the text content of a web page. Use this to read specific articles or press releases in full.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to fetch and extract text from",
                },
            },
            "required": ["url"],
        },
    },
    {
        "name": "search_account_news",
        "description": "Search for recent news specifically about a sales account company. Automatically adds telecom industry context.",
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {
                    "type": "string",
                    "description": "The company name to search for",
                },
                "topic": {
                    "type": "string",
                    "description": "Optional specific topic (e.g., 'AI initiatives', 'BSS transformation', 'executive changes')",
                },
            },
            "required": ["company_name"],
        },
    },
]
