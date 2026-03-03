from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# --- Auth ---

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str

    model_config = {"from_attributes": True}


# --- Contacts ---

class ContactSchema(BaseModel):
    name: str = ""
    title: str = ""
    email: str = ""
    phone: str = ""
    is_champion: bool = False
    notes: str = ""


# --- Accounts ---

class AccountCreate(BaseModel):
    company_name: str
    industry: str = ""
    country: str = ""
    website: str = ""
    employee_count: str = ""
    annual_revenue: str = ""
    current_status: str = "prospect"
    notes: str = ""
    key_contacts: list[ContactSchema] = []


class AccountUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    employee_count: Optional[str] = None
    annual_revenue: Optional[str] = None
    current_status: Optional[str] = None
    notes: Optional[str] = None
    key_contacts: Optional[list[ContactSchema]] = None


class AccountResponse(BaseModel):
    id: int
    company_name: str
    industry: str
    country: str
    website: str
    employee_count: str
    annual_revenue: str
    current_status: str
    notes: str
    key_contacts: list[ContactSchema]
    owner_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Plans ---

class PlanGenerateRequest(BaseModel):
    plan_type: str  # full, use_cases, messaging, stakeholder_map, deal_strategy, beachhead


class PlanResponse(BaseModel):
    id: int
    account_id: int
    plan_type: str
    title: str
    content: str
    model_used: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- News ---

class NewsItemResponse(BaseModel):
    id: int
    account_id: Optional[int]
    title: str
    source: str
    url: str
    summary: str
    published_at: Optional[datetime]
    scraped_at: datetime
    relevance_score: float
    category: str

    model_config = {"from_attributes": True}


# --- Chat ---

class ConversationCreate(BaseModel):
    account_id: Optional[int] = None
    title: str = "New Conversation"


class ConversationResponse(BaseModel):
    id: int
    account_id: Optional[int]
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageRequest(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    tool_calls: Optional[list] = None
    created_at: datetime

    model_config = {"from_attributes": True}
