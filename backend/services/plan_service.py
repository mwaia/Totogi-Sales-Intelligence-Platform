PLAN_PROMPTS = {
    "full": """Generate a comprehensive account plan for {company_name}. Include all of the following sections:

1. **Executive Summary** — Strategic overview of the opportunity
2. **Use Cases** — Top 3-5 specific BSS Magic use cases relevant to this account
3. **Custom Messaging** — Tailored messaging for different stakeholder levels (CTO, CFO, VP Engineering)
4. **Stakeholder Map** — Key people to engage, champion identification, gaps in coverage
5. **Deal Strategy** — Diagnostic approach, moment of belief engineering, anti-pattern risk assessment
6. **Beachhead Recommendation** — The single best starting point for a scoped POC engagement
7. **Competitive Positioning** — How to position against horizontal AI platforms and legacy BSS vendors
8. **Next Steps** — Concrete actions for the next 30/60/90 days

Ground everything in the BSS Magic sales methodology. Be specific to this account — no generic advice.""",

    "use_cases": """Identify the top 3-5 specific BSS Magic use cases for {company_name}.

For each use case:
- **Description**: What the use case is and how BSS Magic's ontology enables it
- **Business Impact**: Quantified or estimated business value
- **Technical Fit**: How it connects to their existing systems
- **Complexity**: Low/Medium/High implementation complexity
- **Beachhead Potential**: Could this serve as the initial scoped engagement?

Focus on use cases where the ontology's ability to connect semantic consistency to operational systems (not just analytics) creates unique value. Reference specific brainlift concepts where relevant.""",

    "messaging": """Create customized messaging for {company_name} targeting different stakeholder levels.

Generate messaging for each of these roles:

1. **CTO/CIO** — Architecture-focused. Lead with why their current approach (data lake / horizontal AI) fails when AI needs to act, not just analyze. Reference SPOV #1 and #2.

2. **CFO** — ROI-focused. Cost of the current state, cost of inaction, investment framework for the ontology approach.

3. **VP Engineering / Technical Lead** — Technical depth. Integration approach, how ontology connects to their existing billing/provisioning/CRM. This audience loves the architecture but remember: engineers don't control budgets.

4. **CEO / Executive Sponsor** — Strategic vision. Industry transformation, competitive positioning, what happens if they don't move.

5. **Cold Outreach** — Two variants:
   a. Email (3-4 sentences, diagnostic-first, not a pitch)
   b. LinkedIn message (2-3 sentences, provocative question approach)

Remember: First contact is diagnostic, not sales. If we're pitching before mapping semantic failure points, the deal is already lost.""",

    "stakeholder_map": """Map the key stakeholders for the {company_name} deal.

Based on the account context and contacts provided:

1. **Current Contact Map** — Who we know, their roles, their influence level
2. **Champion Assessment** — Who is the most likely internal champion? Can they explain ontology to peers without us present?
3. **Decision-Making Structure** — Who controls budget? Who has technical veto? Who is the executive sponsor?
4. **Coverage Gaps** — Which critical roles are we missing relationships with?
5. **Recommended Contacts** — Specific titles/roles we need to develop next
6. **Risk Assessment** — Is our champion too junior? Are we stuck in technical without executive access?

Remember from the brainlift: Discovery must reach the executive layer. Only understanding the technical team = losing the deal in the next budget cycle.""",

    "deal_strategy": """Develop a deal strategy for {company_name} based on the BSS Magic methodology.

Cover:

1. **Current Stage Assessment** — Where is this deal in the pipeline and is that assessment accurate?
2. **Diagnostic Plan** — What specific questions need answering in the next conversation? Map their semantic failure points.
3. **Moment of Belief Engineering** — What is the specific conversation or demonstration where this customer shifts from product view to solution view? Design that moment.
4. **Anti-Pattern Risk Assessment** — Check each of the 6 loss patterns:
   - Too technical too fast?
   - Too philosophical too long?
   - Can't find a beachhead?
   - Losing executive buy-in before earning it?
   - Technical champions selling alone?
   - Competing on the wrong battlefield?
5. **Competitive Positioning** — Who are we competing against? How do we reframe from features to architecture?
6. **Stall Risk** — If this deal stalls, what does it signal? Customer hasn't accepted the ontology premise, or it's not connected to a budgeted initiative?
7. **Timeline** — Realistic milestones with owner and deadlines""",

    "beachhead": """Identify the ideal beachhead for {company_name}.

BSS Magic is a wedge, not a big-bang deployment. Find the single best starting point:

1. **Recommended Beachhead** — One specific system, one use case, one pain point
2. **Why This Starting Point** — Why it's the right entry: visible pain, technical feasibility, executive sponsorship potential
3. **Scope Definition** — What's in scope and what's explicitly out of scope for the initial engagement
4. **POC Design** — 6-8 week co-investment engagement plan (remember: POC is co-investment, not a trial)
5. **Success Criteria** — Measurable outcomes that prove the ontology value
6. **Expansion Path** — Once the beachhead succeeds, what's the natural next system/use case to expand into?
7. **Risk Factors** — What could make this beachhead fail? How do we mitigate?

Remember: Without a clear scoped starting point, the customer sees an overwhelming project and freezes.""",
}


def get_plan_prompt(plan_type: str, company_name: str) -> str:
    """Get the plan generation prompt for a given type and company."""
    template = PLAN_PROMPTS.get(plan_type)
    if not template:
        return f"Generate a {plan_type} plan for {company_name}."
    return template.format(company_name=company_name)


PLAN_TITLES = {
    "full": "Full Account Plan",
    "use_cases": "Use Case Analysis",
    "messaging": "Custom Messaging",
    "stakeholder_map": "Stakeholder Map",
    "deal_strategy": "Deal Strategy",
    "beachhead": "Beachhead Identification",
}


def get_plan_title(plan_type: str, company_name: str) -> str:
    """Get a human-readable title for a plan."""
    base = PLAN_TITLES.get(plan_type, plan_type.replace("_", " ").title())
    return f"{base} — {company_name}"
