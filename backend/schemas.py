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


# --- Users ---

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "rep"


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
    deal_value: float = 0.0
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
    deal_value: Optional[float] = None
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
    deal_value: float
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


# --- Documents ---

class DocumentResponse(BaseModel):
    id: int
    account_id: int
    original_filename: str
    file_size: int
    mime_type: str
    has_extracted_text: bool
    doc_type: str
    uploaded_by_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Intelligence ---

class IntelligenceBriefResponse(BaseModel):
    id: int
    account_id: int
    summary: str
    key_highlights: list[dict]
    risk_signals: list[dict]
    opportunity_signals: list[dict]
    generated_at: datetime

    model_config = {"from_attributes": True}


class IntelligenceRefreshResponse(BaseModel):
    news_count: int
    brief_id: Optional[int]
    message: str


# --- BrainLift ---

class BrainLiftResponse(BaseModel):
    id: int
    account_id: int
    original_filename: str
    file_size: int
    mime_type: str
    has_extracted_text: bool
    text_preview: str
    uploaded_by_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Deals ---

class DealCreate(BaseModel):
    title: str
    description: str = ""
    current_status: str = "prospect"
    deal_value: float = 0.0


class DealUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    current_status: Optional[str] = None
    deal_value: Optional[float] = None


class DealResponse(BaseModel):
    id: int
    account_id: int
    title: str
    description: str
    current_status: str
    deal_value: float
    created_by_id: Optional[int]
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    task_count: int = 0
    open_task_count: int = 0

    model_config = {"from_attributes": True}


# --- Tasks ---

class TaskCreate(BaseModel):
    deal_id: int
    title: str
    description: str = ""
    due_date: Optional[datetime] = None
    status: str = "todo"
    priority: str = "medium"
    assigned_to_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to_id: Optional[int] = None


class TaskResponse(BaseModel):
    id: int
    deal_id: int
    account_id: int
    title: str
    description: str
    due_date: Optional[datetime]
    status: str
    priority: str
    assigned_to_id: Optional[int]
    assigned_to_name: Optional[str] = None
    created_by_id: Optional[int]
    created_by_name: Optional[str] = None
    deal_title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Notes ---

class NoteCreate(BaseModel):
    content: str


class NoteResponse(BaseModel):
    id: int
    account_id: int
    content: str
    created_by_id: Optional[int]
    created_by_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Research ---

class ResearchRequest(BaseModel):
    query: str
    report_type: str = "deep_research"  # "deep_research" or "web_search"


class ResearchReportResponse(BaseModel):
    id: int
    account_id: int
    query: str
    report_type: str
    content: str
    citations: list[dict]
    model_used: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SimilaritySearchRequest(BaseModel):
    query: str
    top_k: int = 5


class SimilaritySearchResult(BaseModel):
    content: str
    score: float
    document_id: int
    original_filename: str
    chunk_index: int


class EmbeddingStatusResponse(BaseModel):
    document_id: int
    original_filename: str
    chunk_count: int
    is_embedded: bool


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
