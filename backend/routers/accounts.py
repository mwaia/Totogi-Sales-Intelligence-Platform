from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, AccountBrainLift, AccountDocument, AccountNote, AccountPlan, AccountTask, Deal, IntelligenceBrief, NewsItem, User
from backend.schemas import AccountCreate, AccountUpdate, AccountResponse

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("/pipeline-summary")
def get_pipeline_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Pipeline summary based on deals, with weighted values and stale detection."""
    # Scope deals by user's accounts
    if user.role != "admin":
        user_account_ids = [a.id for a in db.query(Account).filter(Account.owner_id == user.id).all()]
        all_deals = db.query(Deal).filter(Deal.account_id.in_(user_account_ids)).all() if user_account_ids else []
    else:
        all_deals = db.query(Deal).all()
    fourteen_days_ago = datetime.now(timezone.utc) - timedelta(days=14)

    stages = {}
    total_pipeline = 0.0
    total_weighted = 0.0
    stale_deals = []

    for deal in all_deals:
        status = deal.current_status or "prospect"
        if status not in stages:
            stages[status] = {"count": 0, "value": 0.0, "weighted": 0.0}

        val = float(deal.deal_value or 0)
        weight = STAGE_WEIGHTS.get(status, 0.05)
        stages[status]["count"] += 1
        stages[status]["value"] += val
        stages[status]["weighted"] += val * weight

        if status not in ("closed_won", "closed_lost"):
            total_pipeline += val
            total_weighted += val * weight

            # Stale check: last task activity or deal updated_at
            last_activity = deal.updated_at
            latest_task = (
                db.query(AccountTask)
                .filter(AccountTask.deal_id == deal.id)
                .order_by(AccountTask.updated_at.desc())
                .first()
            )
            if latest_task and latest_task.updated_at:
                last_activity = max(last_activity or datetime.min.replace(tzinfo=timezone.utc),
                                   latest_task.updated_at.replace(tzinfo=timezone.utc) if latest_task.updated_at.tzinfo is None else latest_task.updated_at)

            if last_activity:
                act_utc = last_activity.replace(tzinfo=timezone.utc) if last_activity.tzinfo is None else last_activity
                if act_utc < fourteen_days_ago:
                    days = (datetime.now(timezone.utc) - act_utc).days
                    account = db.query(Account).filter(Account.id == deal.account_id).first()
                    stale_deals.append({
                        "id": deal.id,
                        "account_id": deal.account_id,
                        "company_name": account.company_name if account else "Unknown",
                        "deal_title": deal.title,
                        "status": status,
                        "deal_value": val,
                        "days_inactive": days,
                    })

    return {
        "stages": stages,
        "total_pipeline": total_pipeline,
        "total_weighted": total_weighted,
        "total_deals": len(all_deals),
        "stale_deals": sorted(stale_deals, key=lambda d: d["days_inactive"], reverse=True)[:5],
    }


@router.get("", response_model=list[AccountResponse])
def list_accounts(
    search: str = Query("", description="Search by company name"),
    status: str = Query("", description="Filter by status"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Account)
    # Scope: reps see only their accounts, admins see all
    if user.role != "admin":
        query = query.filter(Account.owner_id == user.id)
    if search:
        query = query.filter(Account.company_name.ilike(f"%{search}%"))
    if status:
        query = query.filter(Account.current_status == status)
    return query.order_by(Account.updated_at.desc()).all()


@router.post("", response_model=AccountResponse, status_code=201)
def create_account(
    body: AccountCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = db.query(Account).filter(Account.company_name == body.company_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account with this company name already exists")
    account = Account(
        **body.model_dump(exclude={"key_contacts"}),
        key_contacts=[c.model_dump() for c in body.key_contacts],
        owner_id=user.id,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if user.role != "admin" and account.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return account


@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    body: AccountUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if user.role != "admin" and account.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = body.model_dump(exclude_unset=True)
    if "key_contacts" in update_data and update_data["key_contacts"] is not None:
        update_data["key_contacts"] = [c.model_dump() if hasattr(c, "model_dump") else c for c in update_data["key_contacts"]]

    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if user.role != "admin" and account.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(account)
    db.commit()


@router.get("/{account_id}/dashboard")
def get_dashboard(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Composite dashboard endpoint — returns everything needed for the overview tab."""
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if user.role != "admin" and account.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # BrainLift
    bl = db.query(AccountBrainLift).filter(AccountBrainLift.account_id == account_id).first()
    brainlift_data = None
    if bl:
        text = bl.extracted_text or ""
        brainlift_data = {
            "id": bl.id,
            "original_filename": bl.original_filename,
            "file_size": bl.file_size,
            "has_extracted_text": bool(text),
            "text_preview": text[:500] if text else "",
            "created_at": bl.created_at.isoformat() if bl.created_at else None,
        }

    # Recent notes (last 5)
    recent_notes = (
        db.query(AccountNote)
        .filter(AccountNote.account_id == account_id)
        .order_by(AccountNote.created_at.desc())
        .limit(5)
        .all()
    )

    # Upcoming tasks (not done, ordered by due date)
    upcoming_tasks = (
        db.query(AccountTask)
        .filter(AccountTask.account_id == account_id, AccountTask.status != "done")
        .order_by(AccountTask.due_date.asc().nullslast(), AccountTask.created_at.desc())
        .limit(5)
        .all()
    )

    # Latest news (last 5, within 6 months)
    six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
    recent_news = (
        db.query(NewsItem)
        .filter(NewsItem.account_id == account_id, NewsItem.scraped_at >= six_months_ago)
        .order_by(NewsItem.scraped_at.desc())
        .limit(5)
        .all()
    )

    # Latest intelligence brief
    brief = (
        db.query(IntelligenceBrief)
        .filter(IntelligenceBrief.account_id == account_id)
        .order_by(IntelligenceBrief.generated_at.desc())
        .first()
    )

    # Deals with per-deal health
    account_deals = db.query(Deal).filter(Deal.account_id == account_id).order_by(Deal.updated_at.desc()).all()
    deals_data = []
    for deal in account_deals:
        deal_tasks = db.query(AccountTask).filter(AccountTask.deal_id == deal.id).all()
        health_score, health_signals = _compute_deal_health(deal, db, bl, brief, recent_notes, deal_tasks)
        open_tasks = [t for t in deal_tasks if t.status != "done"]
        deals_data.append({
            "id": deal.id,
            "title": deal.title,
            "description": deal.description,
            "current_status": deal.current_status,
            "deal_value": deal.deal_value,
            "health_score": health_score,
            "health_signals": health_signals,
            "task_count": len(deal_tasks),
            "open_task_count": len(open_tasks),
            "updated_at": deal.updated_at.isoformat() if deal.updated_at else None,
        })

    # Activity timeline (last 10 events across notes, tasks, documents, plans)
    activity_timeline = _build_activity_timeline(account_id, db)

    # Stale account detection (based on notes activity)
    latest_note = recent_notes[0] if recent_notes else None
    is_stale = False
    days_inactive = 0
    has_active_deals = any(d["current_status"] not in ("closed_won", "closed_lost") for d in deals_data)
    if has_active_deals:
        if latest_note and latest_note.created_at:
            days_inactive = (datetime.now(timezone.utc) - latest_note.created_at.replace(tzinfo=timezone.utc)).days
            is_stale = days_inactive >= 14
        elif account.created_at:
            days_inactive = (datetime.now(timezone.utc) - account.created_at.replace(tzinfo=timezone.utc)).days
            is_stale = days_inactive >= 14

    # Next best actions (use first active deal for context)
    active_deal = next((d for d in deals_data if d["current_status"] not in ("closed_won", "closed_lost")), None)
    next_actions = _compute_next_actions(account, bl, brief, recent_notes, upcoming_tasks, is_stale, days_inactive, active_deal)

    return {
        "brainlift": brainlift_data,
        "deals": deals_data,
        "is_stale": is_stale,
        "days_inactive": days_inactive,
        "next_actions": next_actions,
        "activity_timeline": activity_timeline,
        "recent_notes": [
            {
                "id": n.id,
                "content": n.content,
                "created_by_name": n.created_by.full_name if n.created_by else None,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in recent_notes
        ],
        "upcoming_tasks": [
            {
                "id": t.id,
                "title": t.title,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "status": t.status,
                "priority": t.priority,
                "assigned_to_name": t.assigned_to.full_name if t.assigned_to else None,
            }
            for t in upcoming_tasks
        ],
        "recent_news": [
            {
                "id": ni.id,
                "title": ni.title,
                "url": ni.url,
                "summary": ni.summary,
                "category": ni.category,
                "scraped_at": ni.scraped_at.isoformat() if ni.scraped_at else None,
            }
            for ni in recent_news
        ],
        "intelligence": {
            "summary": brief.summary,
            "key_highlights": brief.key_highlights[:3] if brief.key_highlights else [],
            "risk_signals": brief.risk_signals[:2] if brief.risk_signals else [],
            "opportunity_signals": brief.opportunity_signals[:2] if brief.opportunity_signals else [],
            "generated_at": brief.generated_at.isoformat() if brief.generated_at else None,
        } if brief else None,
    }


# ---------------------------------------------------------------------------
# Deal Health Score
# ---------------------------------------------------------------------------

STAGE_WEIGHTS = {
    "prospect": 0.05, "qualified": 0.15, "discovery": 0.30,
    "poc": 0.50, "negotiation": 0.75, "closed_won": 1.0, "closed_lost": 0.0,
}


def _compute_deal_health(deal, db, brainlift, brief, notes, tasks) -> tuple[int, list[dict]]:
    """Compute a 0-100 deal health score based on deal stage and signals.

    The scoring adapts to deal stage:
    - closed_won: 100 automatically — the deal is won
    - closed_lost: 0 automatically — the deal is lost
    - Active deals: scored on a rubric that shifts weight by stage
    """
    status = deal.current_status or "prospect"
    signals = []

    # Terminal states — no scoring needed
    if status == "closed_won":
        signals.append({"text": "Deal closed — won!", "type": "positive"})
        if deal.deal_value and deal.deal_value > 0:
            signals.append({"text": f"Deal value: ${deal.deal_value:,.0f}", "type": "positive"})
        return 100, signals

    if status == "closed_lost":
        signals.append({"text": "Deal closed — lost", "type": "negative"})
        return 0, signals

    # Active deal scoring — collect raw signals first, then weight by stage
    raw = {}  # signal_name -> (earned_pts, max_pts, signal_dict)

    # 1. BrainLift uploaded
    if brainlift:
        raw["brainlift"] = (1, 1, {"text": "BrainLift uploaded", "type": "positive"})
    else:
        raw["brainlift"] = (0, 1, {"text": "No BrainLift — upload master context doc", "type": "negative"})

    # 2. Champion identified
    account = deal.account
    contacts = account.key_contacts or [] if account else []
    has_champion = any(c.get("is_champion") for c in contacts) if contacts else False
    if has_champion:
        raw["champion"] = (1, 1, {"text": "Champion identified", "type": "positive"})
    else:
        raw["champion"] = (0, 1, {"text": "No champion identified", "type": "negative"})

    # 3. Multi-threaded contacts
    if len(contacts) >= 3:
        raw["contacts"] = (1, 1, {"text": f"{len(contacts)} contacts mapped", "type": "positive"})
    elif len(contacts) >= 1:
        raw["contacts"] = (0.5, 1, {"text": f"Only {len(contacts)} contact(s) — multi-thread", "type": "warning"})
    else:
        raw["contacts"] = (0, 1, {"text": "No contacts mapped", "type": "negative"})

    # 4. Recent activity
    if notes:
        latest = notes[0]
        if latest.created_at:
            days = (datetime.now(timezone.utc) - latest.created_at.replace(tzinfo=timezone.utc)).days
            if days <= 7:
                raw["activity"] = (1, 1, {"text": "Active in last 7 days", "type": "positive"})
            elif days <= 14:
                raw["activity"] = (0.6, 1, {"text": f"Last activity {days} days ago", "type": "warning"})
            else:
                raw["activity"] = (0, 1, {"text": f"Stale — {days} days since last activity", "type": "negative"})
        else:
            raw["activity"] = (0, 1, {"text": "No recent activity", "type": "negative"})
    else:
        raw["activity"] = (0, 1, {"text": "No notes or activity logged", "type": "negative"})

    # 5. Intelligence gathered
    if brief:
        raw["intelligence"] = (1, 1, {"text": "Intelligence brief available", "type": "positive"})
    else:
        raw["intelligence"] = (0, 1, {"text": "No intelligence gathered", "type": "warning"})

    # 6. Tasks on track
    open_tasks = [t for t in tasks if t.status != "done"]
    overdue = [t for t in open_tasks if t.due_date and t.due_date < datetime.now(timezone.utc)]
    if open_tasks and not overdue:
        raw["tasks"] = (1, 1, {"text": f"{len(open_tasks)} active tasks on track", "type": "positive"})
    elif overdue:
        raw["tasks"] = (0.3, 1, {"text": f"{len(overdue)} overdue task(s)", "type": "negative"})
    elif not open_tasks and status in ("discovery", "poc", "negotiation"):
        raw["tasks"] = (0, 1, {"text": "No active tasks — deal lacks execution plan", "type": "warning"})
    else:
        raw["tasks"] = (0.5, 1, {"text": "No tasks yet", "type": "warning"})

    # 7. Deal value set
    if deal.deal_value and deal.deal_value > 0:
        raw["deal_value"] = (1, 1, {"text": f"Deal value: ${deal.deal_value:,.0f}", "type": "positive"})
    else:
        raw["deal_value"] = (0, 1, {"text": "No deal value set", "type": "warning"})

    # 8. Documents uploaded (account-level)
    acct_id = deal.account_id
    doc_count = db.query(AccountDocument).filter(AccountDocument.account_id == acct_id).count()
    if doc_count >= 2:
        raw["documents"] = (1, 1, {"text": f"{doc_count} documents uploaded", "type": "positive"})
    elif doc_count == 1:
        raw["documents"] = (0.5, 1, {"text": "1 document uploaded", "type": "warning"})
    else:
        raw["documents"] = (0, 1, {"text": "No documents uploaded", "type": "warning"})

    # Stage-based weighting — what matters changes as the deal progresses
    # Each weight dict must sum to 100
    STAGE_SIGNAL_WEIGHTS = {
        "prospect": {
            "brainlift": 15, "champion": 5, "contacts": 10, "activity": 15,
            "intelligence": 20, "tasks": 5, "deal_value": 15, "documents": 15,
        },
        "qualified": {
            "brainlift": 15, "champion": 10, "contacts": 15, "activity": 15,
            "intelligence": 15, "tasks": 5, "deal_value": 15, "documents": 10,
        },
        "discovery": {
            "brainlift": 10, "champion": 20, "contacts": 15, "activity": 20,
            "intelligence": 10, "tasks": 10, "deal_value": 10, "documents": 5,
        },
        "poc": {
            "brainlift": 5, "champion": 20, "contacts": 10, "activity": 20,
            "intelligence": 5, "tasks": 20, "deal_value": 10, "documents": 10,
        },
        "negotiation": {
            "brainlift": 5, "champion": 15, "contacts": 10, "activity": 25,
            "intelligence": 5, "tasks": 20, "deal_value": 15, "documents": 5,
        },
    }

    weights = STAGE_SIGNAL_WEIGHTS.get(status, STAGE_SIGNAL_WEIGHTS["prospect"])

    score = 0
    for key, (earned, max_pts, signal) in raw.items():
        weight = weights.get(key, 0)
        score += (earned / max_pts) * weight if max_pts > 0 else 0
        signals.append(signal)

    return min(round(score), 100), signals


# ---------------------------------------------------------------------------
# Activity Timeline
# ---------------------------------------------------------------------------

def _build_activity_timeline(account_id: int, db) -> list[dict]:
    """Build a unified activity timeline from notes, tasks, documents, and plans."""
    events = []

    # Notes
    for n in db.query(AccountNote).filter(AccountNote.account_id == account_id).order_by(AccountNote.created_at.desc()).limit(10).all():
        events.append({
            "type": "note",
            "text": n.content[:150] + ("..." if len(n.content) > 150 else ""),
            "by": n.created_by.full_name if n.created_by else None,
            "at": n.created_at.isoformat() if n.created_at else None,
        })

    # Tasks completed
    for t in db.query(AccountTask).filter(AccountTask.account_id == account_id, AccountTask.status == "done").order_by(AccountTask.updated_at.desc()).limit(5).all():
        events.append({
            "type": "task_done",
            "text": f"Completed: {t.title}",
            "by": t.assigned_to.full_name if t.assigned_to else (t.created_by.full_name if t.created_by else None),
            "at": t.updated_at.isoformat() if t.updated_at else None,
        })

    # Documents uploaded
    for d in db.query(AccountDocument).filter(AccountDocument.account_id == account_id).order_by(AccountDocument.created_at.desc()).limit(5).all():
        events.append({
            "type": "document",
            "text": f"Uploaded: {d.original_filename}",
            "by": None,
            "at": d.created_at.isoformat() if d.created_at else None,
        })

    # Plans generated
    for p in db.query(AccountPlan).filter(AccountPlan.account_id == account_id).order_by(AccountPlan.created_at.desc()).limit(5).all():
        events.append({
            "type": "artifact",
            "text": f"Generated: {p.title}",
            "by": None,
            "at": p.created_at.isoformat() if p.created_at else None,
        })

    # Sort by timestamp descending, return top 10
    events.sort(key=lambda e: e["at"] or "", reverse=True)
    return events[:10]


# ---------------------------------------------------------------------------
# Next Best Actions
# ---------------------------------------------------------------------------

def _compute_next_actions(account, brainlift, brief, notes, tasks, is_stale, days_inactive, active_deal=None) -> list[dict]:
    """Generate proactive coaching suggestions."""
    # If no active deal, suggest creating one
    if not active_deal:
        return [{"priority": "medium", "text": "Create a deal to start tracking this opportunity.", "action": "create_deal"}]

    status = active_deal.get("current_status", "prospect") if isinstance(active_deal, dict) else "prospect"

    actions = []

    if not brainlift:
        actions.append({
            "priority": "high",
            "text": "Upload an Account BrainLift to give the AI full context on this deal.",
            "action": "upload_brainlift",
        })

    contacts = account.key_contacts or []
    has_champion = any(c.get("is_champion") for c in contacts) if contacts else False
    if not has_champion:
        actions.append({
            "priority": "high",
            "text": "No champion identified. Map out your internal ally before advancing this deal.",
            "action": "edit_contacts",
        })

    if len(contacts) < 2:
        actions.append({
            "priority": "medium",
            "text": "Only 1 contact mapped. Multi-thread across economic buyer, technical buyer, and champion.",
            "action": "edit_contacts",
        })

    if is_stale:
        actions.append({
            "priority": "high",
            "text": f"No activity in {days_inactive} days. Reach out or log a note to keep this deal alive.",
            "action": "add_note",
        })

    if not brief:
        actions.append({
            "priority": "medium",
            "text": "Refresh intelligence to surface recent news, leadership changes, and competitive signals.",
            "action": "refresh_intelligence",
        })

    if not account.deal_value or account.deal_value == 0:
        actions.append({
            "priority": "medium",
            "text": "Set a deal value so leadership can forecast weighted pipeline.",
            "action": "edit_account",
        })

    overdue = [t for t in tasks if t.status != "done" and t.due_date and t.due_date < datetime.now(timezone.utc)]
    if overdue:
        actions.append({
            "priority": "high",
            "text": f"{len(overdue)} overdue task(s). Complete or reschedule to maintain deal momentum.",
            "action": "view_tasks",
        })

    # Stage-specific suggestions
    status = account.current_status
    if status == "prospect":
        actions.append({
            "priority": "low",
            "text": "Generate an Executive Summary artifact to qualify this opportunity.",
            "action": "generate_artifact",
        })
    elif status == "discovery":
        actions.append({
            "priority": "low",
            "text": "Consider generating a Use Cases artifact to align on specific value drivers.",
            "action": "generate_artifact",
        })
    elif status == "poc":
        actions.append({
            "priority": "low",
            "text": "Generate an ROI Business Case to build the economic justification for the POC.",
            "action": "generate_artifact",
        })
    elif status == "negotiation":
        actions.append({
            "priority": "low",
            "text": "Generate a Competitive Battle Card to handle late-stage competitor objections.",
            "action": "generate_artifact",
        })

    return actions[:6]  # Cap at 6 actions
