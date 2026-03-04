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

    "executive_summary": """Create a customer-facing Executive Summary / One-Pager for {company_name}.

This is a document the sales rep can share directly with a prospect. Structure:

1. **The Challenge** — 2-3 sentences on the specific business challenge this customer faces in their BSS/telecom operations
2. **Why Now** — Why the timing is critical (market forces, competitive pressure, technology shifts)
3. **The BSS Magic Approach** — How our ontology-based approach specifically addresses their challenge (3-4 bullet points, customer-value-focused, NOT feature-focused)
4. **Expected Outcomes** — 3-4 quantified or estimated business outcomes
5. **Recommended Next Step** — One clear call-to-action (diagnostic session, architecture review, etc.)

IMPORTANT: This is customer-facing. No internal jargon, no "selling" language. Diagnostic, professional, executive-level tone. Lead with their problem, not our solution.""",

    "roi_business_case": """Build an ROI Business Case for BSS Magic deployment at {company_name}.

Structure:
1. **Current State Costs** — Estimate operational costs of their current BSS approach (manual processes, system integration overhead, data inconsistency costs, failed automation attempts)
2. **Cost of Inaction** — What happens if they don't modernize? Competitive risk, regulatory risk, technical debt accumulation
3. **Investment Framework** — Phased investment model (beachhead to expansion to transformation)
4. **ROI Projections** — Conservative, moderate, and aggressive scenarios with estimated payback period
5. **Value Drivers** — Specific operational improvements and their estimated financial impact
6. **Competitive Benchmark** — How similar-sized telcos have approached this investment
7. **Risk Mitigation** — How the beachhead approach de-risks the investment

Use realistic industry benchmarks. BSS transformation typically yields 15-30% operational cost reduction. Be conservative in estimates.""",

    "battle_card": """Create a Competitive Battle Card for the {company_name} deal.

This is an internal-only document for the sales team. Be direct and tactical.

Structure:
1. **Competitive Landscape** — Who are we likely competing against at this account? (Amdocs, Ericsson, Nokia, CSG, Netcracker, in-house, horizontal AI platforms)
2. **For Each Competitor**:
   - Their likely pitch / positioning
   - Their strengths at this account
   - Their weaknesses / gaps
   - Our differentiation (ontology vs. their approach)
   - Trap questions to ask in competitive situations
   - Red flags that indicate they're entrenched
3. **Objection Handling** — Top 5 likely objections and specific responses
4. **Proof Points** — Reference stories, technical validations, or analogies that resonate
5. **Win Strategy** — If we're behind, how do we reframe? If we're ahead, how do we protect the lead?

Remember: We don't win on features. We win by reframing the conversation from "which BSS vendor" to "do you need an ontology or not?" """,

    "talk_track": """Develop a Talk Track and Discovery Questions for {company_name}.

Create a structured conversation guide for the next meeting.

Structure:
1. **Opening (2 minutes)** — How to open the conversation. Diagnostic question, not a pitch. Something that reveals a pain point.
2. **Discovery Questions (15 minutes)** — 8-10 carefully sequenced questions that:
   - Start broad (business priorities, challenges)
   - Narrow to BSS/operational pain
   - Identify semantic failure points (where AI/automation breaks down)
   - Reveal budget ownership and decision timeline
   - Uncover competitor relationships
3. **Moment of Belief Setup (5 minutes)** — The specific analogy, example, or mini-demo that shifts their thinking from "product evaluation" to "we have an architecture problem"
4. **Objection-Ready Responses** — Pre-loaded responses for the 3 most likely pushbacks for this specific account
5. **Close / Next Step** — How to end with a concrete next action (not "we'll follow up" — something specific)

Each question should have a follow-up probe and notes on what the answer reveals about deal viability.""",

    "email_sequences": """Create Email Sequences for {company_name}.

Generate three separate email sequences:

## Sequence 1: Cold Outreach (3 emails)
- Email 1: Initial contact. Diagnostic-first, not a pitch. Reference something specific about their company. One provocative question. Under 100 words.
- Email 2: Follow-up (3 days later). Share a relevant insight or data point. No attachment. Under 80 words.
- Email 3: Break-up email (5 days later). Light touch, leave the door open. Under 60 words.

## Sequence 2: Post-Meeting Follow-Up (3 emails)
- Email 1: Same-day recap. Summarize what was discussed, confirm next steps.
- Email 2: Value-add (3 days later). Share something relevant to their specific situation.
- Email 3: Advance the deal (7 days later). Propose specific next step.

## Sequence 3: Champion Nurture (4 emails)
- Email 1: Enable the champion. Give them language to sell internally.
- Email 2: Arm with proof points. Data, case studies, ROI frameworks.
- Email 3: Stakeholder expansion. Help them bring in other decision-makers.
- Email 4: Executive access. Help champion arrange executive-level conversation.

For each email: provide subject line, body text, and call-to-action. Keep all emails professional but not corporate. No buzzwords.""",

    "win_loss_analysis": """Create a Win/Loss Analysis Template for {company_name}.

Structure this as a framework for analyzing the deal outcome (to be filled in as the deal progresses or after conclusion):

1. **Deal Overview** — Key facts: timeline, deal size estimate, competitors involved, decision-makers
2. **Win/Loss Factors Checklist**:
   - Did we reach the executive layer? Y/N
   - Was there an identified internal champion? Y/N / How strong?
   - Did the customer understand the ontology premise? Y/N
   - Was there a clear beachhead identified? Y/N
   - Were we competing on the right battlefield (architecture vs. features)? Y/N
   - Was there a budgeted initiative tied to our solution? Y/N
3. **Anti-Pattern Assessment** — For each of the 6 loss patterns from the brainlift, assess whether it applied
4. **Competitive Analysis** — What did the competitor do well/poorly?
5. **Key Moments** — What were the 2-3 pivotal moments in the deal?
6. **Lessons Learned** — What would we do differently?
7. **Follow-Up Actions** — Even if lost: re-engagement strategy. If won: expansion strategy.""",

    "qbr_brief": """Prepare a QBR (Quarterly Business Review) Preparation Brief for {company_name}.

This document prepares the sales rep for their internal QBR presentation about this account.

Structure:
1. **Account Health Score** — Overall assessment: Green/Yellow/Red with justification
2. **Quarter Summary** — Key activities, meetings held, progress made, obstacles encountered
3. **Pipeline Impact** — Deal stage, estimated value, probability, expected close date, what changed this quarter
4. **Stakeholder Status** — For each known contact: relationship health, engagement level, concerns
5. **Strategic Priorities Next Quarter** — Top 3 specific actions with owners and deadlines
6. **Competitive Threats** — Any new competitive developments or threats
7. **Resource Requests** — What support does the rep need? (Executive engagement, technical resources, marketing support)
8. **Risk Register** — Top 3 risks to this deal with mitigation plans
9. **Success Metrics** — What does "good" look like by end of next quarter?

Be specific and actionable. This will be presented to sales leadership.""",

    "expansion_plan": """Create an Account Expansion Plan for {company_name}.

This is a land-and-expand strategy document. The assumption is we have (or will have) a beachhead — now map the expansion path.

Structure:
1. **Current Footprint Assessment** — What system/use case are we in (or entering) today? What value has been proven?
2. **Expansion Vectors** — Map 3-5 adjacent systems or use cases we can expand into. For each:
   - What it is and why it's a natural next step
   - Which stakeholder owns it
   - Estimated timeline to pursue
   - Dependencies (what needs to be true first)
3. **Land-and-Expand Timeline** — Quarter-by-quarter expansion roadmap from beachhead through full platform adoption
4. **Revenue Growth Model** — How deal size grows at each expansion stage (beachhead → adjacent → platform)
5. **Expansion Triggers** — What signals indicate the account is ready for the next expansion wave? (Success metrics hit, budget cycle, champion promotion, etc.)
6. **Risk to Expansion** — What could prevent expansion? Competitor entrenchment in adjacent systems, executive turnover, budget freezes
7. **Executive Engagement Strategy** — How to elevate the relationship from tactical (beachhead) to strategic (platform partner)

Ground this in the BSS Magic methodology. The ontology's power is that it connects systems — each expansion proves the ontology's value in a new domain.""",

    "land_expand": """Create a Land & Expand Strategy with Visual Diagram for {company_name}.

This artifact is a concise, visually-driven strategy document that maps the expansion journey from initial beachhead to full platform adoption. It should be easy to present in a meeting or share with leadership.

Structure:

## 1. Land & Expand Diagram

Create an ASCII/text-based visual diagram showing the expansion journey. Use a clear visual format like:

```
LAND (Beachhead)                    EXPAND                           PLATFORM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  BEACHHEAD  │────▶│  EXPAND #1   │────▶│  EXPAND #2   │────▶│  STRATEGIC   │
  │             │     │              │     │              │     │  PLATFORM    │
  │ [System]    │     │ [System]     │     │ [System]     │     │             │
  │ [Use Case]  │     │ [Use Case]   │     │ [Use Case]   │     │ Full Ontol. │
  │ $XXK        │     │ +$XXK        │     │ +$XXK        │     │ $X.XM+      │
  └─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       Q1-Q2               Q3-Q4               Q1-Q2               Q3+
       ▲                   ▲                   ▲                   ▲
       │                   │                   │                   │
   [Trigger]           [Trigger]           [Trigger]           [Trigger]
```

Replace the placeholders with ACTUAL systems, use cases, dollar values, and timelines specific to {company_name}. Make the diagram as detailed and account-specific as possible.

## 2. Beachhead Definition
- The specific system, use case, and pain point we're entering with
- Why this is the right starting point (technical feasibility + business visibility + champion access)
- Success criteria that unlock the first expansion

## 3. Expansion Sequence
For each expansion wave (3-4 waves):
- **Target system/domain** and why it's the natural next step
- **Connection to previous wave** — how the ontology's value compounds
- **Stakeholder** who owns this domain
- **Trigger event** that signals readiness
- **Estimated deal value increment**

## 4. Value Waterfall Diagram
Show how deal value grows at each stage:

```
Beachhead:    ████████░░░░░░░░░░░░░░░░░  $XXK
Expand #1:    ████████████████░░░░░░░░░░  $XXK  (cumulative: $XXK)
Expand #2:    ████████████████████████░░  $X.XM (cumulative: $X.XM)
Platform:     ████████████████████████████ $X.XM+ (cumulative: $X.XM+)
```

## 5. Risk Gates
At each expansion transition, what could block progress? One line per gate:
- Gate 1 (Land → Expand #1): [specific risk]
- Gate 2 (Expand #1 → #2): [specific risk]
- Gate 3 (Expand → Platform): [specific risk]

## 6. 90-Day Quick Reference
A simple table: What to do in the next 90 days to secure the land and set up the first expansion.

| Week | Action | Owner | Purpose |
|------|--------|-------|---------|

Keep this artifact VISUAL and CONCISE. It should fit on 2-3 pages when printed. Use the diagrams to tell the story — minimize dense paragraphs. This is a document a rep presents to their VP of Sales, not a novel.""",

    "next_steps": """Generate prioritized Next Steps for the {company_name} deal.

Based on the current deal stage, account context, recent interactions (call transcripts, meeting notes), and intelligence data, produce a concrete action plan.

Structure:

For each recommended next step (provide 3-5):
1. **Action** — What specifically needs to happen (be concrete: "Schedule architecture review with CTO", not "Follow up")
2. **Owner** — Who should do this (rep, SE, executive sponsor, champion)
3. **Timeline** — When this should happen (e.g., "Within 48 hours", "Before end of week", "Next budget cycle")
4. **Rationale** — Why this action matters now — connect it to something specific from the account context, a recent conversation, or an intelligence signal
5. **Success Indicator** — How we'll know this step was successful

Also include:
- **Blockers** — Anything that needs to be resolved before these steps can happen
- **What NOT to Do** — Common mistakes or anti-patterns for this deal stage that the rep should avoid

Prioritize actions by urgency and impact. The first step should be the single most important thing to do right now.""",
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
    "executive_summary": "Executive Summary",
    "roi_business_case": "ROI Business Case",
    "battle_card": "Competitive Battle Card",
    "talk_track": "Talk Track & Discovery Questions",
    "email_sequences": "Email Sequences",
    "win_loss_analysis": "Win/Loss Analysis",
    "qbr_brief": "QBR Preparation Brief",
    "expansion_plan": "Account Expansion Plan",
    "land_expand": "Land & Expand Strategy",
    "next_steps": "Next Steps Recommendation",
}


def get_plan_title(plan_type: str, company_name: str) -> str:
    """Get a human-readable title for a plan."""
    base = PLAN_TITLES.get(plan_type, plan_type.replace("_", " ").title())
    return f"{base} — {company_name}"
