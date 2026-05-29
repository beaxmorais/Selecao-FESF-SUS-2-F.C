"""Referral status transition rules."""

from app.models import ReferralStatus, UserRole

ALLOWED_TRANSITIONS: dict[ReferralStatus, set[ReferralStatus]] = {
    ReferralStatus.draft: {ReferralStatus.submitted, ReferralStatus.cancelled},
    ReferralStatus.submitted: {ReferralStatus.in_review, ReferralStatus.cancelled},
    ReferralStatus.in_review: {
        ReferralStatus.approved,
        ReferralStatus.returned,
        ReferralStatus.scheduled,
        ReferralStatus.cancelled,
    },
    ReferralStatus.returned: {ReferralStatus.submitted, ReferralStatus.cancelled},
    ReferralStatus.approved: set(),
    ReferralStatus.scheduled: set(),
    ReferralStatus.cancelled: set(),
}

DECISION_TO_STATUS = {
    "approve": ReferralStatus.approved,
    "return": ReferralStatus.returned,
    "schedule": ReferralStatus.scheduled,
    "cancel": ReferralStatus.cancelled,
}


def can_transition(current: ReferralStatus, target: ReferralStatus) -> bool:
    return target in ALLOWED_TRANSITIONS.get(current, set())


def can_edit_referral(status: ReferralStatus, role: UserRole) -> bool:
    if role == UserRole.admin:
        return status in {ReferralStatus.draft, ReferralStatus.returned}
    if role == UserRole.requester:
        return status in {ReferralStatus.draft, ReferralStatus.returned}
    return False
