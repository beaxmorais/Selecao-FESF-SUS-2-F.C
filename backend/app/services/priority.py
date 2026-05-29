"""Priority calculation service based on explicit clinical rules."""

from app.models import LabResult, Priority, Referral, ClinicalCriterion

PRIORITY_SCORE_MAP: dict[str, int] = {
    "hemoglobina_abaixo_8": 3,
    "calcio_acima_11": 2,
    "creatinina_acima_2": 2,
    "dor_ossea_persistente": 2,
    "perda_peso_nao_explicada": 1,
    "infeccoes_recorrentes": 1,
    "suspeita_forte_unidade": 2,
}

LAB_THRESHOLDS: dict[str, tuple[str, float, str]] = {
    "hemoglobina_abaixo_8": ("hemoglobina", 8.0, "lt"),
    "calcio_acima_11": ("calcio", 11.0, "gt"),
    "creatinina_acima_2": ("creatinina", 2.0, "gt"),
}


def score_to_priority(score: int) -> Priority:
    if score >= 8:
        return Priority.urgent
    if score >= 5:
        return Priority.high
    if score >= 3:
        return Priority.medium
    return Priority.low


def _check_lab(lab_results: list[LabResult], exam_name: str, threshold: float, op: str) -> bool:
    for lab in lab_results:
        if lab.exam_name.lower() == exam_name.lower():
            if op == "lt":
                return lab.value < threshold
            if op == "gt":
                return lab.value > threshold
    return False


def calculate_priority(
    lab_results: list[LabResult],
    clinical_criteria: list[ClinicalCriterion],
) -> tuple[int, Priority, list[str]]:
    score = 0
    matched: list[str] = []

    for key, (exam_name, threshold, op) in LAB_THRESHOLDS.items():
        if _check_lab(lab_results, exam_name, threshold, op):
            score += PRIORITY_SCORE_MAP[key]
            matched.append(key)

    for criterion in clinical_criteria:
        if criterion.is_present and criterion.criterion_key in PRIORITY_SCORE_MAP:
            if criterion.criterion_key not in LAB_THRESHOLDS:
                score += PRIORITY_SCORE_MAP[criterion.criterion_key]
                matched.append(criterion.criterion_key)

    return score, score_to_priority(score), matched


def recalculate_referral_priority(referral: Referral) -> tuple[int, Priority, list[str]]:
    return calculate_priority(referral.lab_results, referral.clinical_criteria)
