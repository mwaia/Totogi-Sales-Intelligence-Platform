import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, AccountDocument, AccountPlan, User
from backend.services.document_service import get_account_document_context
from backend.services.intelligence_service import get_intelligence_context
from backend.schemas import PlanGenerateRequest, PlanResponse
from backend.services.ai_service import stream_plan
from backend.services.plan_service import get_plan_prompt, get_plan_title

router = APIRouter(tags=["plans"])


@router.post("/api/accounts/{account_id}/plans/generate")
async def generate_plan(
    account_id: int,
    body: PlanGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account_context = {
        "company_name": account.company_name,
        "industry": account.industry,
        "country": account.country,
        "website": account.website,
        "employee_count": account.employee_count,
        "annual_revenue": account.annual_revenue,
        "current_status": account.current_status,
        "notes": account.notes,
        "key_contacts": account.key_contacts,
    }

    prompt = get_plan_prompt(body.plan_type, account.company_name)
    title = get_plan_title(body.plan_type, account.company_name)

    # Get document and intelligence context
    docs = db.query(AccountDocument).filter(AccountDocument.account_id == account_id).all()
    document_context = get_account_document_context(docs)
    intelligence_ctx = get_intelligence_context(account_id, db)

    async def event_generator():
        full_content = ""
        try:
            async for event in stream_plan(account_context, body.plan_type, prompt, document_context=document_context, intelligence_context=intelligence_ctx):
                if event["type"] == "text":
                    full_content += event["content"]
                    yield {"event": "text", "data": json.dumps({"content": event["content"]})}
                elif event["type"] == "thinking":
                    yield {"event": "thinking", "data": json.dumps({"content": event["content"]})}
                elif event["type"] == "done":
                    # Save the plan
                    plan = AccountPlan(
                        account_id=account_id,
                        plan_type=body.plan_type,
                        title=title,
                        content=full_content,
                        model_used="claude-opus-4-6",
                        created_by_id=user.id,
                    )
                    db.add(plan)
                    db.commit()
                    db.refresh(plan)
                    yield {"event": "done", "data": json.dumps({"plan_id": plan.id, "done": True})}
        except Exception as e:
            yield {"event": "error", "data": json.dumps({"error": str(e)})}

    return EventSourceResponse(event_generator())


@router.get("/api/accounts/{account_id}/plans", response_model=list[PlanResponse])
def list_plans(
    account_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(AccountPlan)
        .filter(AccountPlan.account_id == account_id)
        .order_by(AccountPlan.created_at.desc())
        .all()
    )


@router.get("/api/plans/{plan_id}", response_model=PlanResponse)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan = db.query(AccountPlan).filter(AccountPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.delete("/api/plans/{plan_id}", status_code=204)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan = db.query(AccountPlan).filter(AccountPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
