"""initial migration

Revision ID: 001
Revises:
Create Date: 2026-05-27

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.Enum("admin", "requester", "regulator", name="userrole"), nullable=False),
        sa.Column("health_unit", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "patients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("sus_card", sa.String(length=20), nullable=False),
        sa.Column("birth_date", sa.Date(), nullable=False),
        sa.Column("sex", sa.Enum("male", "female", "other", name="sex"), nullable=False),
        sa.Column("city", sa.String(length=255), nullable=False),
        sa.Column("health_unit", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_patients_id"), "patients", ["id"], unique=False)
    op.create_index(op.f("ix_patients_sus_card"), "patients", ["sus_card"], unique=True)

    op.create_table(
        "referrals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "draft",
                "submitted",
                "in_review",
                "approved",
                "returned",
                "scheduled",
                "cancelled",
                name="referralstatus",
            ),
            nullable=False,
        ),
        sa.Column(
            "calculated_priority",
            sa.Enum("low", "medium", "high", "urgent", name="priority"),
            nullable=False,
        ),
        sa.Column("final_priority", sa.Enum("low", "medium", "high", "urgent", name="priority"), nullable=True),
        sa.Column("priority_score", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_referrals_created_by_id"), "referrals", ["created_by_id"], unique=False)
    op.create_index(op.f("ix_referrals_id"), "referrals", ["id"], unique=False)
    op.create_index(op.f("ix_referrals_patient_id"), "referrals", ["patient_id"], unique=False)

    op.create_table(
        "clinical_criteria",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("referral_id", sa.Integer(), nullable=False),
        sa.Column("criterion_key", sa.String(length=100), nullable=False),
        sa.Column("is_present", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["referral_id"], ["referrals.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("referral_id", "criterion_key", name="uq_referral_criterion"),
    )
    op.create_index(op.f("ix_clinical_criteria_id"), "clinical_criteria", ["id"], unique=False)
    op.create_index(op.f("ix_clinical_criteria_referral_id"), "clinical_criteria", ["referral_id"], unique=False)

    op.create_table(
        "evaluations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("referral_id", sa.Integer(), nullable=False),
        sa.Column("evaluator_id", sa.Integer(), nullable=False),
        sa.Column(
            "decision",
            sa.Enum("approve", "return", "schedule", "cancel", name="evaluationdecision"),
            nullable=False,
        ),
        sa.Column("priority", sa.Enum("low", "medium", "high", "urgent", name="priority"), nullable=False),
        sa.Column("justification", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["evaluator_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["referral_id"], ["referrals.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_evaluations_evaluator_id"), "evaluations", ["evaluator_id"], unique=False)
    op.create_index(op.f("ix_evaluations_id"), "evaluations", ["id"], unique=False)
    op.create_index(op.f("ix_evaluations_referral_id"), "evaluations", ["referral_id"], unique=False)

    op.create_table(
        "lab_results",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("referral_id", sa.Integer(), nullable=False),
        sa.Column("exam_name", sa.String(length=100), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(length=50), nullable=False),
        sa.Column("collected_at", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["referral_id"], ["referrals.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_lab_results_id"), "lab_results", ["id"], unique=False)
    op.create_index(op.f("ix_lab_results_referral_id"), "lab_results", ["referral_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_lab_results_referral_id"), table_name="lab_results")
    op.drop_index(op.f("ix_lab_results_id"), table_name="lab_results")
    op.drop_table("lab_results")
    op.drop_index(op.f("ix_evaluations_referral_id"), table_name="evaluations")
    op.drop_index(op.f("ix_evaluations_id"), table_name="evaluations")
    op.drop_index(op.f("ix_evaluations_evaluator_id"), table_name="evaluations")
    op.drop_table("evaluations")
    op.drop_index(op.f("ix_clinical_criteria_referral_id"), table_name="clinical_criteria")
    op.drop_index(op.f("ix_clinical_criteria_id"), table_name="clinical_criteria")
    op.drop_table("clinical_criteria")
    op.drop_index(op.f("ix_referrals_patient_id"), table_name="referrals")
    op.drop_index(op.f("ix_referrals_id"), table_name="referrals")
    op.drop_index(op.f("ix_referrals_created_by_id"), table_name="referrals")
    op.drop_table("referrals")
    op.drop_index(op.f("ix_patients_sus_card"), table_name="patients")
    op.drop_index(op.f("ix_patients_id"), table_name="patients")
    op.drop_table("patients")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
