from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import Base, engine
from backend.routers import auth_router, accounts, chat, plans, news, documents, intelligence


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    # Migrate: add doc_type column if it doesn't exist
    with engine.connect() as conn:
        try:
            conn.execute(__import__("sqlalchemy").text(
                "ALTER TABLE account_documents ADD COLUMN doc_type VARCHAR(50) DEFAULT 'activity'"
            ))
            conn.commit()
        except Exception:
            pass  # Column already exists
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


@app.get("/api/health")
def health():
    return {"status": "ok"}
