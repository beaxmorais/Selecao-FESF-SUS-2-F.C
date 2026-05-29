from sqlalchemy.orm import Session, joinedload

from app.models import (
    ClinicalCriterion,
    Evaluation,
    LabResult,
    Priority,
    Referral,
    ReferralStatus,
    User,
)
from app.schemas import (
    ClinicalCriterionCreate,
    EvaluationCreate,
    LabResultCreate,
    ReferralCreate,
    ReferralUpdate,
)
from app.services.priority import recalculate_referral_priority


def get_referral(db: Session, referral_id: int) -> Referral | None:
    return (
        db.query(Referral)
        .options(
            joinedload(Referral.patient),
            joinedload(Referral.lab_results),
            joinedload(Referral.clinical_criteria),
            joinedload(Referral.evaluations),
        )
        .filter(Referral.id == referral_id)
        .first()
    )


def get_referrals(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: ReferralStatus | None = None,
    priority: Priority | None = None,
) -> list[Referral]:
    query = db.query(Referral).options(
        joinedload(Referral.patient),
        joinedload(Referral.lab_results),
        joinedload(Referral.clinical_criteria),
    )
    if status:
        query = query.filter(Referral.status == status)
    if priority:
        query = query.filter(
            (Referral.final_priority == priority) | (
                (Referral.final_priority.is_(None)) & (Referral.calculated_priority == priority)
            )
        )
    return query.order_by(Referral.created_at.desc()).offset(skip).limit(limit).all()


def _apply_lab_results(db: Session, referral: Referral, lab_results: list[LabResultCreate]) -> None:
    referral.lab_results.clear()
    for item in lab_results:
        referral.lab_results.append(LabResult(**item.model_dump()))


def _apply_clinical_criteria(
    db: Session, referral: Referral, criteria: list[ClinicalCriterionCreate]
) -> None:
    referral.clinical_criteria.clear()
    for item in criteria:
        referral.clinical_criteria.append(ClinicalCriterion(**item.model_dump()))


def _update_priority(referral: Referral) -> None:
    score, priority, _ = recalculate_referral_priority(referral)
    referral.priority_score = score
    referral.calculated_priority = priority


def create_referral(db: Session, referral_in: ReferralCreate, created_by: User) -> Referral:
    referral = Referral(
        patient_id=referral_in.patient_id,
        created_by_id=created_by.id,
        reason=referral_in.reason,
        status=ReferralStatus.draft,
    )
    db.add(referral)
    db.flush()
    _apply_lab_results(db, referral, referral_in.lab_results)
    _apply_clinical_criteria(db, referral, referral_in.clinical_criteria)
    _update_priority(referral)
    db.commit()
    db.refresh(referral)
    return get_referral(db, referral.id)  # type: ignore[return-value]


def update_referral(db: Session, referral: Referral, referral_in: ReferralUpdate) -> Referral:
    if referral_in.reason is not None:
        referral.reason = referral_in.reason
    if referral_in.lab_results is not None:
        _apply_lab_results(db, referral, referral_in.lab_results)
    if referral_in.clinical_criteria is not None:
        _apply_clinical_criteria(db, referral, referral_in.clinical_criteria)
    _update_priority(referral)
    db.commit()
    db.refresh(referral)
    return get_referral(db, referral.id)  # type: ignore[return-value]


def delete_referral(db: Session, referral: Referral) -> None:
    db.delete(referral)
    db.commit()


def submit_referral(db: Session, referral: Referral) -> Referral:
    referral.status = ReferralStatus.submitted
    db.commit()
    db.refresh(referral)
    return referral


def start_review(db: Session, referral: Referral) -> Referral:
    referral.status = ReferralStatus.in_review
    db.commit()
    db.refresh(referral)
    return referral


def add_evaluation(
    db: Session,
    referral: Referral,
    evaluation_in: EvaluationCreate,
    evaluator: User,
) -> Evaluation:
    evaluation = Evaluation(
        referral_id=referral.id,
        evaluator_id=evaluator.id,
        decision=evaluation_in.decision,
        priority=evaluation_in.priority,
        justification=evaluation_in.justification,
    )
    referral.final_priority = evaluation_in.priority

    from app.services.referrals import DECISION_TO_STATUS

    referral.status = DECISION_TO_STATUS[evaluation_in.decision.value]

    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    return evaluation
