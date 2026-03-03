from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from backend.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(String(50), default="rep")  # "admin" or "rep"
    created_at = Column(DateTime, default=utcnow)

    accounts = relationship("Account", back_populates="owner")
    conversations = relationship("ChatConversation", back_populates="user")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(300), unique=True, nullable=False, index=True)
    industry = Column(String(200), default="")
    country = Column(String(100), default="")
    website = Column(String(500), default="")
    employee_count = Column(String(50), default="")
    annual_revenue = Column(String(100), default="")
    current_status = Column(String(50), default="prospect")  # prospect, qualified, discovery, poc, negotiation, closed_won, closed_lost
    notes = Column(Text, default="")
    key_contacts = Column(JSON, default=list)  # [{name, title, email, phone, is_champion, notes}]
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    owner = relationship("User", back_populates="accounts")
    plans = relationship("AccountPlan", back_populates="account", cascade="all, delete-orphan")
    news_items = relationship("NewsItem", back_populates="account", cascade="all, delete-orphan")
    conversations = relationship("ChatConversation", back_populates="account", cascade="all, delete-orphan")
    documents = relationship("AccountDocument", back_populates="account", cascade="all, delete-orphan")
    intelligence_briefs = relationship("IntelligenceBrief", back_populates="account", cascade="all, delete-orphan")


class AccountDocument(Base):
    __tablename__ = "account_documents"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(200), default="")
    extracted_text = Column(Text, default="")
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    account = relationship("Account", back_populates="documents")


class AccountPlan(Base):
    __tablename__ = "account_plans"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    plan_type = Column(String(50), nullable=False)  # full, use_cases, messaging, stakeholder_map, deal_strategy, beachhead
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=False)
    model_used = Column(String(100), default="claude-opus-4-6")
    created_at = Column(DateTime, default=utcnow)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    account = relationship("Account", back_populates="plans")


class NewsItem(Base):
    __tablename__ = "news_items"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    title = Column(String(500), nullable=False)
    source = Column(String(300), default="")
    url = Column(String(1000), default="")
    summary = Column(Text, default="")
    published_at = Column(DateTime, nullable=True)
    scraped_at = Column(DateTime, default=utcnow)
    relevance_score = Column(Float, default=0.5)
    category = Column(String(100), default="news")  # press_release, news, social, industry_trend

    account = relationship("Account", back_populates="news_items")


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(300), default="New Conversation")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    account = relationship("Account", back_populates="conversations")
    user = relationship("User", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    tool_calls = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    conversation = relationship("ChatConversation", back_populates="messages")


class IntelligenceBrief(Base):
    __tablename__ = "intelligence_briefs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    summary = Column(Text, nullable=False)
    key_highlights = Column(JSON, default=list)
    risk_signals = Column(JSON, default=list)
    opportunity_signals = Column(JSON, default=list)
    generated_at = Column(DateTime, default=utcnow)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    account = relationship("Account", back_populates="intelligence_briefs")
