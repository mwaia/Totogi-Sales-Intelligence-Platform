# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sales Intelligence AI — a full-stack platform for BSS Magic (Totogi) sales reps. AI-powered account planning, news monitoring, and strategic coaching built on Claude Opus with extended thinking and tool use.

## Development Commands

### Start Both Servers
```bash
./start.sh
# Backend: http://localhost:8000 (Swagger: /docs)
# Frontend: http://localhost:5173
```

### Backend (Python/FastAPI)
```bash
# From project root:
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Install dependencies:
pip install -r backend/requirements.txt

# Seed initial admin user (first run only):
curl -X POST http://localhost:8000/api/auth/seed
# Default credentials: admin / admin123
```

### Frontend (React/TypeScript/Vite)
```bash
cd frontend
npm install
npm run dev        # Dev server with HMR
npm run build      # TypeScript check + production build
npm run lint       # ESLint
npm run preview    # Preview production build
```

### Environment Setup
Copy `.env.example` to `.env` and set:
- `ANTHROPIC_API_KEY` (required)
- `JWT_SECRET` (change from default for production)
- `DATABASE_URL` (default: SQLite in `backend/data/`)
- `CORS_ORIGINS` (default: `http://localhost:5173`)

## Architecture

### Backend (`backend/`)
Layered Python FastAPI app:
- **`main.py`** — App init, CORS, router registration, DB table creation on startup
- **`config.py`** — Pydantic BaseSettings loading from env vars
- **`database.py`** — SQLAlchemy engine (SQLite with WAL mode, foreign keys enabled)
- **`models.py`** — ORM models: User, Account, AccountPlan, NewsItem, ChatConversation, ChatMessage
- **`schemas.py`** — Pydantic request/response validation
- **`auth.py`** — JWT token generation/verification, password hashing (bcrypt)
- **`routers/`** — API endpoints (all prefixed `/api/`): auth, accounts, chat, plans, news
- **`services/`** — Business logic:
  - `ai_service.py` — Core agentic loop: streams Claude responses, handles tool calls iteratively until complete. Uses `claude-opus-4-6` with `thinking: {"type": "adaptive"}`
  - `plan_service.py` — Prompt templates for plan types (full plan, use cases, messaging, stakeholder map, deal strategy, beachhead)
  - `news_service.py` — News aggregation orchestration
- **`tools/`** — AI function-calling tools: `web_search` (DuckDuckGo), `scrape_url` (BeautifulSoup), `search_account_news`
- **`brainlift/`** — Sales methodology knowledge base:
  - `loader.py` — Parses `BSS_Magic_Sales_BrainLift.docx` (cached after first load)
  - `prompt.py` — Builds system prompt blocks with Anthropic `cache_control` for prompt caching

### Frontend (`frontend/src/`)
React 19 + TypeScript + Vite + Tailwind CSS:
- **`api.ts`** — Centralized API client with JWT auth, auto-redirect on 401. Streaming endpoints (plans, chat) use raw `fetch` for SSE
- **`types.ts`** — Shared TypeScript interfaces
- **`pages/`** — Route components: Login, Dashboard, AccountList, AccountNew, AccountDetail, ChatPage
- **`components/`** — Layout, ChatPanel, PlanSection, NewsSection
- **`hooks/`** — Custom React hooks

### Key Patterns
- **Streaming**: Backend uses `sse-starlette` for Server-Sent Events. Frontend reads SSE streams via raw fetch + ReadableStream for plans and chat
- **Agentic AI loop**: `ai_service.stream_chat()` iterates: send to Claude → if tool_use stop_reason, execute tools → append results → re-send until text completion
- **Prompt caching**: The BrainLift document (~large DOCX) is embedded in system prompt with `cache_control: {"type": "ephemeral"}` for cross-request caching
- **User-scoped data**: All queries filter by `user_id` from JWT — users only see their own accounts/conversations
- **Vite proxy**: Dev server proxies `/api` requests to `localhost:8000` (configured in `vite.config.ts`)
- **No test suite**: There are currently no automated tests
