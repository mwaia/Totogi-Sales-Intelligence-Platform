from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import Base, engine
from backend.routers import auth_router, accounts, chat, plans, news, documents, intelligence, research, brainlift_router, tasks, notes, deals


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    # Migrations: add columns if they don't exist
    _text = __import__("sqlalchemy").text
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE account_documents ADD COLUMN doc_type VARCHAR(50) DEFAULT 'activity'",
            "ALTER TABLE accounts ADD COLUMN deal_value REAL DEFAULT 0.0",
            "ALTER TABLE account_tasks ADD COLUMN deal_id INTEGER REFERENCES deals(id)",
        ]:
            try:
                conn.execute(_text(stmt))
                conn.commit()
            except Exception:
                pass  # Column already exists

        # Migrate: create a Deal for each account that has current_status set but no deals yet
        try:
            existing_deals = conn.execute(_text("SELECT account_id FROM deals")).fetchall()
            accounts_with_deals = {r[0] for r in existing_deals}
            all_accounts = conn.execute(_text("SELECT id, company_name, current_status, deal_value FROM accounts")).fetchall()
            for acc_id, name, status, val in all_accounts:
                if acc_id not in accounts_with_deals:
                    conn.execute(_text(
                        "INSERT INTO deals (account_id, title, current_status, deal_value) VALUES (:aid, :title, :status, :val)"
                    ), {"aid": acc_id, "title": f"{name} — Initial Deal", "status": status or "prospect", "val": val or 0})
            conn.commit()

            # Link orphan tasks to their account's first deal
            orphan_tasks = conn.execute(_text("SELECT id, account_id FROM account_tasks WHERE deal_id IS NULL")).fetchall()
            for task_id, acc_id in orphan_tasks:
                first_deal = conn.execute(_text("SELECT id FROM deals WHERE account_id = :aid LIMIT 1"), {"aid": acc_id}).fetchone()
                if first_deal:
                    conn.execute(_text("UPDATE account_tasks SET deal_id = :did WHERE id = :tid"), {"did": first_deal[0], "tid": task_id})
            conn.commit()
        except Exception:
            pass
    yield


app = FastAPI(
    title="Sales Intelligence AI",
    description="AI-powered sales intelligence platform for BSS Magic",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router.router)
app.include_router(accounts.router)
app.include_router(chat.router)
app.include_router(plans.router)
app.include_router(news.router)
app.include_router(documents.router)
app.include_router(intelligence.router)
app.include_router(research.router)
app.include_router(brainlift_router.router)
app.include_router(tasks.router)
app.include_router(notes.router)
app.include_router(deals.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
