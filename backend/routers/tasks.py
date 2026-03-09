from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, AccountTask, Deal, User
from backend.schemas import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(tags=["tasks"])


@router.post("/api/accounts/{account_id}/tasks", response_model=TaskResponse, status_code=201)
def create_task(
    account_id: int,
    req: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Verify the deal belongs to this account
    deal = db.query(Deal).filter(Deal.id == req.deal_id, Deal.account_id == account_id).first()
    if not deal:
        raise HTTPException(status_code=400, detail="Deal not found for this account")

    task = AccountTask(
        deal_id=req.deal_id,
        account_id=account_id,
        title=req.title,
        description=req.description,
        due_date=req.due_date,
        status=req.status if req.status in ("todo", "in_progress", "done") else "todo",
        priority=req.priority if req.priority in ("low", "medium", "high") else "medium",
        assigned_to_id=req.assigned_to_id,
        created_by_id=user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _to_response(task)


@router.get("/api/accounts/{account_id}/tasks", response_model=list[TaskResponse])
def list_tasks(
    account_id: int,
    status: str = Query("", description="Filter by status"),
    deal_id: int = Query(0, description="Filter by deal"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(AccountTask).filter(AccountTask.account_id == account_id)
    if status:
        q = q.filter(AccountTask.status == status)
    if deal_id:
        q = q.filter(AccountTask.deal_id == deal_id)

    q = q.order_by(
        case(
            (AccountTask.status == "todo", 0),
            (AccountTask.status == "in_progress", 1),
            (AccountTask.status == "done", 2),
            else_=3,
        ),
        AccountTask.due_date.asc().nullslast(),
        AccountTask.created_at.desc(),
    )
    return [_to_response(t) for t in q.all()]


@router.put("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    req: TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(AccountTask).filter(AccountTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if req.title is not None:
        task.title = req.title
    if req.description is not None:
        task.description = req.description
    if req.due_date is not None:
        task.due_date = req.due_date
    if req.status is not None and req.status in ("todo", "in_progress", "done"):
        task.status = req.status
    if req.priority is not None and req.priority in ("low", "medium", "high"):
        task.priority = req.priority
    if req.assigned_to_id is not None:
        task.assigned_to_id = req.assigned_to_id

    db.commit()
    db.refresh(task)
    return _to_response(task)


@router.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(AccountTask).filter(AccountTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


def _to_response(task: AccountTask) -> dict:
    return {
        "id": task.id,
        "deal_id": task.deal_id,
        "account_id": task.account_id,
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date,
        "status": task.status,
        "priority": task.priority,
        "assigned_to_id": task.assigned_to_id,
        "assigned_to_name": task.assigned_to.full_name if task.assigned_to else None,
        "created_by_id": task.created_by_id,
        "created_by_name": task.created_by.full_name if task.created_by else None,
        "deal_title": task.deal.title if task.deal else None,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }
