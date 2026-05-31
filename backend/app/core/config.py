from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    app_name: str = "AI-Powered Visual Medical Report Analyzer"
    app_env: str = "development"
    app_debug: bool = True
    backend_cors_origins: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    database_url: str = "postgresql+psycopg://medical_report_user:change_me@localhost:5432/medical_report_analyzer"
    upload_dir: Path = Field(default=Path("storage/uploads"))
    max_upload_size_bytes: int = Field(default=20 * 1024 * 1024, ge=1)
    tesseract_cmd: str = ""
    ocr_min_image_dimension: int = Field(default=50, ge=1)
    ocr_low_contrast_threshold: float = Field(default=8.0, ge=0)
    groq_api_key: str = ""
    groq_model: str = "deepseek-v3"
    groq_api_base_url: str = "https://api.groq.com/openai/v1"
    groq_timeout_seconds: float = Field(default=20.0, gt=0)
    groq_max_retries: int = Field(default=2, ge=0, le=5)

    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def resolved_upload_dir(self) -> Path:
        if self.upload_dir.is_absolute():
            return self.upload_dir
        return BACKEND_DIR / self.upload_dir


@lru_cache
def get_settings() -> Settings:
    return Settings()
