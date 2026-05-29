from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import EvaluationDecision, Priority, ReferralStatus, Sex, UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None


class UserBase(BaseModel):
    email: str = Field(min_length=5)
    full_name: str
    role: UserRole
    health_unit: str | None = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserUpdate(BaseModel):
    email: str | None = Field(default=None, min_length=5)
    full_name: str | None = None
    role: UserRole | None = None
    health_unit: str | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=6)


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class PatientBase(BaseModel):
    full_name: str
    sus_card: str
    birth_date: date
    sex: Sex
    city: str
    health_unit: str


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: str | None = None
    sus_card: str | None = None
    birth_date: date | None = None
    sex: Sex | None = None
    city: str | None = None
    health_unit: str | None = None


class PatientRead(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class LabResultBase(BaseModel):
    exam_name: str
    value: float
    unit: str
    collected_at: date


class LabResultCreate(LabResultBase):
    pass


class LabResultUpdate(BaseModel):
    exam_name: str | None = None
    value: float | None = None
    unit: str | None = None
    collected_at: date | None = None


class LabResultRead(LabResultBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    referral_id: int


class ClinicalCriterionBase(BaseModel):
    criterion_key: str
    is_present: bool = False
    notes: str | None = None


class ClinicalCriterionCreate(ClinicalCriterionBase):
    pass


class ClinicalCriterionUpdate(BaseModel):
    is_present: bool | None = None
    notes: str | None = None


class ClinicalCriterionRead(ClinicalCriterionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    referral_id: int


class ReferralBase(BaseModel):
    patient_id: int
    reason: str


class ReferralCreate(ReferralBase):
    lab_results: list[LabResultCreate] = []
    clinical_criteria: list[ClinicalCriterionCreate] = []


class ReferralUpdate(BaseModel):
    reason: str | None = None
    lab_results: list[LabResultCreate] | None = None
    clinical_criteria: list[ClinicalCriterionCreate] | None = None


class ReferralRead(ReferralBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_by_id: int
    status: ReferralStatus
    calculated_priority: Priority
    final_priority: Priority | None
    priority_score: int
    created_at: datetime
    updated_at: datetime
    lab_results: list[LabResultRead] = []
    clinical_criteria: list[ClinicalCriterionRead] = []
    patient: PatientRead | None = None


class ReferralDetail(ReferralRead):
    patient: PatientRead | None = None
    evaluations: list["EvaluationRead"] = []


class EvaluationCreate(BaseModel):
    decision: EvaluationDecision
    priority: Priority
    justification: str = Field(min_length=3)


class EvaluationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    referral_id: int
    evaluator_id: int
    decision: EvaluationDecision
    priority: Priority
    justification: str
    created_at: datetime


class DashboardReport(BaseModel):
    total_patients: int
    total_referrals: int
    by_status: dict[str, int]
    by_priority: dict[str, int]
    pending_review: int


class PriorityPreview(BaseModel):
    priority_score: int
    calculated_priority: Priority
    matched_criteria: list[str]


class PriorityPreviewRequest(BaseModel):
    lab_results: list[LabResultCreate] = []
    clinical_criteria: list[ClinicalCriterionCreate] = []


ReferralDetail.model_rebuild()
