import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Account, AccountDocument, ChatConversation, ChatMessage, User
from backend.services.document_service import get_knowledge_context, get_activity_context
from backend.services.intelligence_service import get_intelligence_context
from backend.schemas import ChatMessageRequest, ChatMessageResponse, ConversationCreate, ConversationResponse
from backend.services.ai_service import stream_chat, TOOLS

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
def create_conversation(
    body: ConversationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conv = ChatConversation(
        account_id=body.account_id,
        user_id=user.id,
        title=body.title,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(ChatConversation)
        .filter(ChatConversation.user_id == user.id)
        .order_by(ChatConversation.updated_at.desc())
        .all()
    )


@router.get("/conversations/{conv_id}")
def get_conversation(
    conv_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conv_id,
        ChatConversation.user_id == user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = [
        ChatMessageResponse.model_validate(m)
        for m in conv.messages
    ]

    return {
        **ConversationResponse.model_validate(conv).model_dump(),
        "messages": [m.model_dump() for m in messages],
    }


@router.delete("/conversations/{conv_id}", status_code=204)
def delete_conversation(
    conv_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conv_id,
        ChatConversation.user_id == user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()


@router.post("/conversations/{conv_id}/messages")
async def send_message(
    conv_id: int,
    body: ChatMessageRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conv_id,
        ChatConversation.user_id == user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save user message
    user_msg = ChatMessage(
        conversation_id=conv_id,
        role="user",
        content=body.content,
    )
    db.add(user_msg)
    db.commit()

    # Build message history for Claude
    history = []
    for msg in conv.messages:
        history.append({"role": msg.role, "content": msg.content})

    # Get account context if this conversation is linked to an account
    account_context = None
    if conv.account_id:
        account = db.query(Account).filter(Account.id == conv.account_id).first()
        if account:
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

    # Get document and intelligence context if account-linked
    knowledge_ctx = ""
    activity_ctx = ""
    intelligence_ctx = ""
    if conv.account_id:
        docs = db.query(AccountDocument).filter(AccountDocument.account_id == conv.account_id).all()
        knowledge_ctx = get_knowledge_context(docs)
        activity_ctx = get_activity_context(docs)
        intelligence_ctx = get_intelligence_context(conv.account_id, db)

    async def event_generator():
        full_content = ""
        try:
            async for event in stream_chat(history, account_context, TOOLS, intelligence_context=intelligence_ctx, knowledge_context=knowledge_ctx, activity_context=activity_ctx):
                if event["type"] == "text":
                    full_content += event["content"]
                    yield {"event": "text", "data": json.dumps({"content": event["content"]})}
                elif event["type"] == "thinking":
                    yield {"event": "thinking", "data": json.dumps({"content": event["content"]})}
                elif event["type"] == "tool_use":
                    yield {"event": "tool_use", "data": json.dumps({"tool": event["tool"]})}
                elif event["type"] == "tool_result":
                    yield {"event": "tool_result", "data": json.dumps({"tool": event["tool"], "preview": event["result"][:200]})}
                elif event["type"] == "done":
                    # Save assistant message
                    assistant_msg = ChatMessage(
                        conversation_id=conv_id,
                        role="assistant",
                        content=full_content,
                    )
                    db.add(assistant_msg)
                    db.commit()
                    yield {"event": "done", "data": json.dumps({"message_id": assistant_msg.id, "done": True})}
        except Exception as e:
            yield {"event": "error", "data": json.dumps({"error": str(e)})}

    return EventSourceResponse(event_generator())
