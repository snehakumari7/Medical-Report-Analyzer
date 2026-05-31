"""create medical records schema

Revision ID: 20260531_0001
Revises: None
Create Date: 2026-05-31
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260531_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "reports",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("user_id", sa.String(length=32), nullable=True),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("file_type", sa.String(length=20), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("upload_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("processing_status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reports_user_id"), "reports", ["user_id"], unique=False)

    op.create_table(
        "extracted_parameters",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("report_id", sa.String(length=32), nullable=False),
        sa.Column("parameter_name", sa.String(length=120), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(length=50), nullable=False),
        sa.Column("reference_range", sa.String(length=255), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("extraction_log", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_extracted_parameters_parameter_name"), "extracted_parameters", ["parameter_name"], unique=False)
    op.create_index(op.f("ix_extracted_parameters_report_id"), "extracted_parameters", ["report_id"], unique=False)

    op.create_table(
        "health_scores",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("report_id", sa.String(length=32), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("risk_level", sa.String(length=40), nullable=False),
        sa.Column("risk_indicators", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_health_scores_report_id"), "health_scores", ["report_id"], unique=False)

    op.create_table(
        "ai_summaries",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("report_id", sa.String(length=32), nullable=False),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("model_name", sa.String(length=120), nullable=False),
        sa.Column("summary_type", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_summaries_report_id"), "ai_summaries", ["report_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_summaries_report_id"), table_name="ai_summaries")
    op.drop_table("ai_summaries")
    op.drop_index(op.f("ix_health_scores_report_id"), table_name="health_scores")
    op.drop_table("health_scores")
    op.drop_index(op.f("ix_extracted_parameters_report_id"), table_name="extracted_parameters")
    op.drop_index(op.f("ix_extracted_parameters_parameter_name"), table_name="extracted_parameters")
    op.drop_table("extracted_parameters")
    op.drop_index(op.f("ix_reports_user_id"), table_name="reports")
    op.drop_table("reports")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
