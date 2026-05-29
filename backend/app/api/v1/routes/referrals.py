from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_roles
from app.crud.referral import (
    add_evaluation,
    create_referral,
    delete_referral,
    get_referral,
    get_referrals,
    start_review,
    submit_referral,
    update_referral,
)
from app.db.session import get_db
from app.models import Priority, ReferralStatus, User, UserRole
from app.schemas import (
    ClinicalCriterionCreate,
    EvaluationCreate,
    EvaluationRead,
    LabResultCreate,
    PriorityPreview,
    PriorityPreviewRequest,
    ReferralCreate,
    ReferralDetail,
    ReferralRead,
    ReferralUpdate,
)
from app.services.priority import calculate_priority, recalculate_referral_priority
from app.services.referrals import can_edit_referral, can_transition

router = APIRouter(prefix="/referrals", tags=["referrals"])


@router.get("/", response_model=list[ReferralRead])
def list_referrals(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 100,
    status_filter: ReferralStatus | None = None,
    priority_filter: Priority | None = None,
):
    return get_referrals(db, skip=skip, limit=limit, status=status_filter, priority=priority_filter)


@router.post("/", response_model=ReferralDetail, status_code=status.HTTP_201_CREATED)
def create_referral_route(
    referral_in: ReferralCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.requester))],
):
    return create_referral(db, referral_in, current_user)


@router.post("/preview-priority", response_model=PriorityPreview)
def preview_priority(
    payload: PriorityPreviewRequest,
    _: Annotated[User, Depends(get_current_user)],
):
    from app.models import ClinicalCriterion, LabResult

    temp_labs = [LabResult(referral_id=0, **item.model_dump()) for item in payload.lab_results]
    temp_criteria = [
        ClinicalCriterion(referral_id=0, **item.model_dump()) for item in payload.clinical_criteria
    ]
    score, priority, matched = calculate_priority(temp_labs, temp_criteria)
    return PriorityPreview(priority_score=score, calculated_priority=priority, matched_criteria=matched)


@router.get("/{referral_id}", response_model=ReferralDetail)
def read_referral(
    referral_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    referral = get_referral(db, referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Encaminhamento não encontrado")
    return referral


@router.patch("/{referral_id}", response_model=ReferralDetail)
def patch_referral(
    referral_id: int,
    referral_in: ReferralUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.requester))],
):
    referral = get_referral(db, referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Encaminhamento não encontrado")
    if not can_edit_referral(referral.status, current_user.role):
        raise HTTPException(status_code=400, detail="Encaminhamento não pode ser editado neste status")
    return update_referral(db, referral, referral_in)


@router.delete("/{referral_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_referral(
    referral_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.requester))],
) -> None:
    referral = get_referral(db, referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Encaminhamento não encontrado")
    if referral.status != ReferralStatus.draft:
        raise HTTPException(status_code=400, detail="Somente rascunhos podem ser excluídos")
    delete_referral(db, referral)


@router.post("/{referral_id}/submit", response_model=ReferralRead)
def submit_referral_route(
    referral_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.requester))],
):
    referral = get_referral(db, referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Encaminhamento não encontrado")
    if not can_transition(referral.status, ReferralStatus.submitted):
        raise HTTPException(status_code=400, detail="Transição de status inválida")
    return submit_referral(db, referral)


@router.post("/{referral_id}/review", response_model=ReferralRead)
def review_referral_route(
    referral_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.regulator))],
):
    referral = get_referral(db, referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Encaminhamento não encontrado")
    if not can_transition(referral.status, ReferralStatus.in_review):
        raise HTTPException(status_code=400, detail="Transição de status inválida")
    return start_review(db, referral)


@router.post("/{referral_id}/evaluate", response_model=EvaluationRead)
def evaluate_referral_route(
    referral_id: int,
    evaluation_in: EvaluationCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.regulator))],
):
    referral = get_referral(db, referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Encaminhamento não encontrado")
    if referral.status not in {ReferralStatus.submitted, ReferralStatus.in_review}:
        raise HTTPException(status_code=400, detail="Encaminhamento não está disponível para avaliação")

    score, calculated, _ = recalculate_referral_priority(referral)
    if evaluation_in.priority != calculated and len(evaluation_in.justification.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Justificativa obrigatória quando a prioridade final difere da calculada",
        )

    if referral.status == ReferralStatus.submitted:
        start_review(db, referral)

    return add_evaluation(db, referral, evaluation_in, current_user)
