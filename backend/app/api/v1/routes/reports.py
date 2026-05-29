from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models import Patient, Priority, Referral, ReferralStatus, User
from app.schemas import DashboardReport

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard", response_model=DashboardReport)
def dashboard(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> DashboardReport:
    total_patients = db.query(func.count(Patient.id)).scalar() or 0
    total_referrals = db.query(func.count(Referral.id)).scalar() or 0

    by_status: dict[str, int] = {}
    for status in ReferralStatus:
        count = db.query(func.count(Referral.id)).filter(Referral.status == status).scalar() or 0
        by_status[status.value] = count

    by_priority: dict[str, int] = {}
    for priority in Priority:
        count = (
            db.query(func.count(Referral.id))
            .filter(
                (Referral.final_priority == priority)
                | ((Referral.final_priority.is_(None)) & (Referral.calculated_priority == priority))
            )
            .scalar()
            or 0
        )
        by_priority[priority.value] = count

    pending_review = (
        db.query(func.count(Referral.id))
        .filter(Referral.status.in_([ReferralStatus.submitted, ReferralStatus.in_review]))
        .scalar()
        or 0
    )

    return DashboardReport(
        total_patients=total_patients,
        total_referrals=total_referrals,
        by_status=by_status,
        by_priority=by_priority,
        pending_review=pending_review,
    )
