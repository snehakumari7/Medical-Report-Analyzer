from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


def new_uuid() -> str:
    return uuid4().hex


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    reports: Mapped[list["Report"]] = relationship(back_populates="user")


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_uuid)
    user_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    upload_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    processing_status: Mapped[str] = mapped_column(String(40), default="uploaded", nullable=False)

    user: Mapped[User | None] = relationship(back_populates="reports")
    extracted_parameters: Mapped[list["ExtractedParameter"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    health_scores: Mapped[list["HealthScore"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    ai_summaries: Mapped[list["AISummary"]] = relationship(back_populates="report", cascade="all, delete-orphan")


class ExtractedParameter(Base, TimestampMixin):
    __tablename__ = "extracted_parameters"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_uuid)
    report_id: Mapped[str] = mapped_column(String(32), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    parameter_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    reference_range: Mapped[str | None] = mapped_column(String(255), nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    extraction_log: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    report: Mapped[Report] = relationship(back_populates="extracted_parameters")


class HealthScore(Base, TimestampMixin):
    __tablename__ = "health_scores"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_uuid)
    report_id: Mapped[str] = mapped_column(String(32), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(40), nullable=False)
    risk_indicators: Mapped[list | None] = mapped_column(JSON, nullable=True)

    report: Mapped[Report] = relationship(back_populates="health_scores")


class AISummary(Base, TimestampMixin):
    __tablename__ = "ai_summaries"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_uuid)
    report_id: Mapped[str] = mapped_column(String(32), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    summary_text: Mapped[str] = mapped_column(Text, nullable=False)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    summary_type: Mapped[str] = mapped_column(String(40), default="general", nullable=False)

    report: Mapped[Report] = relationship(back_populates="ai_summaries")
