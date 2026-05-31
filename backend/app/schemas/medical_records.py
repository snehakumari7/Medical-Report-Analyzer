from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class UserBase(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, pattern=EMAIL_PATTERN)
    full_name: str = Field(..., min_length=1, max_length=120)
    is_active: bool = True

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    email: str | None = Field(default=None, min_length=5, max_length=255, pattern=EMAIL_PATTERN)
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    is_active: bool | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return value.strip().lower() if value else value


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class ReportBase(BaseModel):
    user_id: str | None = Field(default=None, min_length=32, max_length=32)
    original_filename: str = Field(..., min_length=1, max_length=255)
    storage_path: str = Field(..., min_length=1, max_length=500)
    file_type: Literal["pdf", "png", "jpg", "jpeg"]
    file_size_bytes: int = Field(..., gt=0)
    processing_status: Literal["uploaded", "ocr_completed", "analyzed", "failed"] = "uploaded"


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    user_id: str | None = Field(default=None, min_length=32, max_length=32)
    original_filename: str | None = Field(default=None, min_length=1, max_length=255)
    storage_path: str | None = Field(default=None, min_length=1, max_length=500)
    file_type: Literal["pdf", "png", "jpg", "jpeg"] | None = None
    file_size_bytes: int | None = Field(default=None, gt=0)
    processing_status: Literal["uploaded", "ocr_completed", "analyzed", "failed"] | None = None


class ReportRead(ReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    upload_time: datetime
    created_at: datetime
    updated_at: datetime


class ExtractedParameterBase(BaseModel):
    report_id: str = Field(..., min_length=32, max_length=32)
    parameter_name: str = Field(..., min_length=1, max_length=120)
    value: float = Field(..., ge=0)
    unit: str = Field(..., min_length=1, max_length=50)
    reference_range: str | None = Field(default=None, max_length=255)
    confidence_score: float = Field(..., ge=0, le=1)
    extraction_log: dict[str, Any] | None = None


class ExtractedParameterCreate(ExtractedParameterBase):
    pass


class ExtractedParameterUpdate(BaseModel):
    parameter_name: str | None = Field(default=None, min_length=1, max_length=120)
    value: float | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, min_length=1, max_length=50)
    reference_range: str | None = Field(default=None, max_length=255)
    confidence_score: float | None = Field(default=None, ge=0, le=1)
    extraction_log: dict[str, Any] | None = None


class ExtractedParameterRead(ExtractedParameterBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class HealthScoreBase(BaseModel):
    report_id: str = Field(..., min_length=32, max_length=32)
    score: int = Field(..., ge=0, le=100)
    risk_level: Literal["low", "moderate", "high", "critical"]
    risk_indicators: list[dict[str, Any]] | None = None


class HealthScoreCreate(HealthScoreBase):
    pass


class HealthScoreUpdate(BaseModel):
    score: int | None = Field(default=None, ge=0, le=100)
    risk_level: Literal["low", "moderate", "high", "critical"] | None = None
    risk_indicators: list[dict[str, Any]] | None = None


class HealthScoreRead(HealthScoreBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class AISummaryBase(BaseModel):
    report_id: str = Field(..., min_length=32, max_length=32)
    summary_text: str = Field(..., min_length=1)
    model_name: str = Field(..., min_length=1, max_length=120)
    summary_type: Literal["general", "patient_friendly", "clinician_review"] = "general"


class AISummaryCreate(AISummaryBase):
    pass


class AISummaryUpdate(BaseModel):
    summary_text: str | None = Field(default=None, min_length=1)
    model_name: str | None = Field(default=None, min_length=1, max_length=120)
    summary_type: Literal["general", "patient_friendly", "clinician_review"] | None = None


class AISummaryRead(AISummaryBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
