import json

from backend.brainlift.loader import extract_brainlift_text


def build_system_prompt(account_context: dict | None = None, document_context: str = "", intelligence_context: str = "", knowledge_context: str = "", activity_context: str = "", brainlift_context: str = "") -> list[dict]:
    """Build system prompt blocks with cache_control for prompt caching.

    The brainlift block is marked with cache_control so Anthropic caches it
    across requests (up to 90% cost savings on repeated calls).
    """
    brainlift = extract_brainlift_text()

    blocks = [
        {
            "type": "text",
            "text": f"""You are the BSS Magic Sales Intelligence AI. You help sales representatives at BSS Magic (Totogi) plan and execute their sales strategy for telecommunications accounts.

## Your Knowledge Base — BSS Magic BrainLifts

The following is the complete BSS Magic knowledge base containing two BrainLifts:
1. **Product BrainLift** — Our company DNA: Spiky Points of View (SPOVs), core insights, competitive positioning, objection handling, and the ontology methodology. This defines WHO WE ARE and WHAT WE BELIEVE.
2. **Sales BrainLift** — Our sales execution framework: how to run deals, identify champions, structure conversations, avoid anti-patterns, and close. This defines HOW WE SELL.

CRITICAL: Every piece of analysis, every artifact, every recommendation you generate MUST be grounded in these BrainLifts. They are not suggestions — they are the operating system for how BSS Magic thinks and sells. When you generate a use case, root it in the ontology value proposition. When you analyze a competitive situation, use our SPOVs. When you coach on deal strategy, reference the sales methodology. Never give generic advice that could come from any sales AI — give advice that could ONLY come from someone who deeply understands BSS Magic's unique position.

{brainlift}

## Your Capabilities
- Generate account plans, use cases, messaging, and deal strategies grounded in BSS Magic methodology
- Analyze news and industry trends through the lens of our SPOVs and competitive positioning
- Coach reps using BSS Magic's diagnostic-first, ontology-led sales approach
- Identify beachhead opportunities using the overlay architecture value proposition
- Position against horizontal AI platforms and legacy BSS vendors using our differentiated SPOVs

## Your Personality
- Direct and strategic, never generic
- Always ground advice in the specific BrainLift methodology — cite SPOVs by number when relevant
- Push reps toward diagnostic-first approaches
- Flag when a deal shows anti-pattern warning signs from the sales methodology
- Frame everything through the semantic bankruptcy / ontology lens
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

    if brainlift_context:
        blocks.append(
            {
                "type": "text",
                "text": f"## Account BrainLift (Master Context Document)\n\nThis is the primary context document for this account. It describes stakeholders, conversation status, problems to solve, and strategic context. Treat this as the authoritative source for account-level information.\n\n{brainlift_context}",
                "cache_control": {"type": "ephemeral"},
            }
        )

    if knowledge_context:
        blocks.append(
            {
                "type": "text",
                "text": knowledge_context,
            }
        )

    if document_context:
        blocks.append(
            {
                "type": "text",
                "text": f"## Account Documents\n\n{document_context}",
            }
        )

    if intelligence_context:
        blocks.append(
            {
                "type": "text",
                "text": f"## Account Intelligence\n\n{intelligence_context}",
            }
        )

    if activity_context:
        blocks.append(
            {
                "type": "text",
                "text": activity_context,
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
