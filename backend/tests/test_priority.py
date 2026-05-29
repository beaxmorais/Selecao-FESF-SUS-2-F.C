from datetime import date

from app.models import ClinicalCriterion, LabResult
from app.services.priority import calculate_priority, score_to_priority


def test_score_to_priority_levels():
    assert score_to_priority(0).value == "low"
    assert score_to_priority(3).value == "medium"
    assert score_to_priority(6).value == "high"
    assert score_to_priority(8).value == "urgent"


def test_calculate_priority_urgent_case():
    labs = [
        LabResult(referral_id=1, exam_name="hemoglobina", value=7.0, unit="g/dL", collected_at=date(2026, 5, 1)),
        LabResult(referral_id=1, exam_name="calcio", value=12.0, unit="mg/dL", collected_at=date(2026, 5, 1)),
        LabResult(referral_id=1, exam_name="creatinina", value=2.5, unit="mg/dL", collected_at=date(2026, 5, 1)),
    ]
    criteria = [
        ClinicalCriterion(referral_id=1, criterion_key="dor_ossea_persistente", is_present=True),
        ClinicalCriterion(referral_id=1, criterion_key="suspeita_forte_unidade", is_present=True),
    ]
    score, priority, matched = calculate_priority(labs, criteria)
    assert score >= 8
    assert priority.value == "urgent"
    assert "hemoglobina_abaixo_8" in matched


def test_calculate_priority_low_case():
    score, priority, matched = calculate_priority([], [])
    assert score == 0
    assert priority.value == "low"
    assert matched == []
