import json

from backend.brainlift.loader import extract_brainlift_text


def build_system_prompt(account_context: dict | None = None) -> list[dict]:
    """Build system prompt blocks with cache_control for prompt caching.

    The brainlift block is marked with cache_control so Anthropic caches it
    across requests (up to 90% cost savings on repeated calls).
    """
    brainlift = extract_brainlift_text()

    blocks = [
        {
            "type": "text",
            "text": f"""You are the BSS Magic Sales Intelligence AI. You help sales representatives at BSS Magic (Totogi) plan and execute their sales strategy for telecommunications accounts.

## Your Knowledge Base (BSS Magic Sales BrainLift)

{brainlift}

## Your Capabilities
- Generate account plans, use cases, messaging, and deal strategies
- Analyze news and industry trends for sales relevance
- Coach reps on the BSS Magic sales methodology
- Help identify beachhead opportunities and champion profiles
- Provide competitive positioning guidance

## Your Personality
- Direct and strategic, never generic
- Always ground advice in the specific brainlift methodology
- Push reps toward diagnostic-first approaches
- Flag when a deal shows anti-pattern warning signs
- Tailor all outputs to the specific account context provided
- Use Markdown formatting for structured outputs""",
            "cache_control": {"type": "ephemeral"},
        }
    ]

    if account_context:
        blocks.append(
            {
                "type": "text",
                "text": f"## Current Account Context\n\n{_format_account_context(account_context)}",
            }
        )

    return blocks


def _format_account_context(ctx: dict) -> str:
    """Format account data into a readable context block for the system prompt."""
    parts = []
    parts.append(f"**Company**: {ctx.get('company_name', 'Unknown')}")
    if ctx.get("industry"):
        parts.append(f"**Industry**: {ctx['industry']}")
    if ctx.get("country"):
        parts.append(f"**Country**: {ctx['country']}")
    if ctx.get("website"):
        parts.append(f"**Website**: {ctx['website']}")
    if ctx.get("employee_count"):
        parts.append(f"**Employees**: {ctx['employee_count']}")
    if ctx.get("annual_revenue"):
        parts.append(f"**Revenue**: {ctx['annual_revenue']}")
    if ctx.get("current_status"):
        parts.append(f"**Deal Status**: {ctx['current_status']}")
    if ctx.get("notes"):
        parts.append(f"\n**Notes**:\n{ctx['notes']}")
    if ctx.get("key_contacts"):
        contacts = ctx["key_contacts"]
        if isinstance(contacts, str):
            contacts = json.loads(contacts)
        if contacts:
            parts.append("\n**Key Contacts**:")
            for c in contacts:
                champion = " (CHAMPION)" if c.get("is_champion") else ""
                parts.append(f"- {c.get('name', '?')} — {c.get('title', '?')}{champion}")
                if c.get("notes"):
                    parts.append(f"  Notes: {c['notes']}")
    return "\n".join(parts)
