from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    jwt_secret: str = "change-me-to-a-random-32-char-string"
    database_url: str = "sqlite:///./backend/data/sales_intelligence.db"
    cors_origins: str = "http://localhost:5173"
    debug: bool = True

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
