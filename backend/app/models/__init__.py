import enum

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    requester = "requester"
    regulator = "regulator"


class Sex(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class ReferralStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    in_review = "in_review"
    approved = "approved"
    returned = "returned"
    scheduled = "scheduled"
    cancelled = "cancelled"


class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class EvaluationDecision(str, enum.Enum):
    approve = "approve"
    return_decision = "return"
    schedule = "schedule"
    cancel = "cancel"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    health_unit: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    referrals_created: Mapped[list["Referral"]] = relationship(
        "Referral", back_populates="created_by", foreign_keys="Referral.created_by_id"
    )
    evaluations: Mapped[list["Evaluation"]] = relationship("Evaluation", back_populates="evaluator")


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sus_card: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    birth_date: Mapped[Date] = mapped_column(Date, nullable=False)
    sex: Mapped[Sex] = mapped_column(Enum(Sex), nullable=False)
    city: Mapped[str] = mapped_column(String(255), nullable=False)
    health_unit: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    referrals: Mapped[list["Referral"]] = relationship("Referral", back_populates="patient")


class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False, index=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[ReferralStatus] = mapped_column(
        Enum(ReferralStatus), default=ReferralStatus.draft, nullable=False
    )
    calculated_priority: Mapped[Priority] = mapped_column(
        Enum(Priority), default=Priority.low, nullable=False
    )
    final_priority: Mapped[Priority | None] = mapped_column(Enum(Priority), nullable=True)
    priority_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    patient: Mapped["Patient"] = relationship("Patient", back_populates="referrals")
    created_by: Mapped["User"] = relationship(
        "User", back_populates="referrals_created", foreign_keys=[created_by_id]
    )
    lab_results: Mapped[list["LabResult"]] = relationship(
        "LabResult", back_populates="referral", cascade="all, delete-orphan"
    )
    clinical_criteria: Mapped[list["ClinicalCriterion"]] = relationship(
        "ClinicalCriterion", back_populates="referral", cascade="all, delete-orphan"
    )
    evaluations: Mapped[list["Evaluation"]] = relationship(
        "Evaluation", back_populates="referral", cascade="all, delete-orphan"
    )


class LabResult(Base):
    __tablename__ = "lab_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    referral_id: Mapped[int] = mapped_column(ForeignKey("referrals.id"), nullable=False, index=True)
    exam_name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    collected_at: Mapped[Date] = mapped_column(Date, nullable=False)

    referral: Mapped["Referral"] = relationship("Referral", back_populates="lab_results")


class ClinicalCriterion(Base):
    __tablename__ = "clinical_criteria"
    __table_args__ = (UniqueConstraint("referral_id", "criterion_key", name="uq_referral_criterion"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    referral_id: Mapped[int] = mapped_column(ForeignKey("referrals.id"), nullable=False, index=True)
    criterion_key: Mapped[str] = mapped_column(String(100), nullable=False)
    is_present: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    referral: Mapped["Referral"] = relationship("Referral", back_populates="clinical_criteria")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    referral_id: Mapped[int] = mapped_column(ForeignKey("referrals.id"), nullable=False, index=True)
    evaluator_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    decision: Mapped[EvaluationDecision] = mapped_column(
        Enum(EvaluationDecision, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    priority: Mapped[Priority] = mapped_column(Enum(Priority), nullable=False)
    justification: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    referral: Mapped["Referral"] = relationship("Referral", back_populates="evaluations")
    evaluator: Mapped["User"] = relationship("User", back_populates="evaluations")
