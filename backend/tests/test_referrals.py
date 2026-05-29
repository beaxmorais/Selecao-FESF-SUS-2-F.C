from datetime import date

from fastapi.testclient import TestClient

from tests.conftest import get_token


def test_requester_can_create_patient_and_referral(client: TestClient):
    token = get_token(client, "requester@test.com", "solicit123")
    headers = {"Authorization": f"Bearer {token}"}

    patient_response = client.post(
        "/api/v1/patients/",
        json={
            "full_name": "Paciente Teste",
            "sus_card": "700111222333444",
            "birth_date": "1980-01-01",
            "sex": "female",
            "city": "São Paulo",
            "health_unit": "UBS Test",
        },
        headers=headers,
    )
    assert patient_response.status_code == 201
    patient_id = patient_response.json()["id"]

    referral_response = client.post(
        "/api/v1/referrals/",
        json={
            "patient_id": patient_id,
            "reason": "Suspeita hematológica",
            "lab_results": [
                {
                    "exam_name": "hemoglobina",
                    "value": 7.5,
                    "unit": "g/dL",
                    "collected_at": str(date.today()),
                }
            ],
            "clinical_criteria": [
                {"criterion_key": "dor_ossea_persistente", "is_present": True}
            ],
        },
        headers=headers,
    )
    assert referral_response.status_code == 201
    data = referral_response.json()
    assert data["priority_score"] >= 5
    assert data["status"] == "draft"


def test_regulator_can_evaluate_referral(client: TestClient):
    requester_token = get_token(client, "requester@test.com", "solicit123")
    requester_headers = {"Authorization": f"Bearer {requester_token}"}

    patient_response = client.post(
        "/api/v1/patients/",
        json={
            "full_name": "Paciente Avaliação",
            "sus_card": "700999888777666",
            "birth_date": "1975-05-05",
            "sex": "male",
            "city": "Campinas",
            "health_unit": "UBS Test",
        },
        headers=requester_headers,
    )
    patient_id = patient_response.json()["id"]

    referral_response = client.post(
        "/api/v1/referrals/",
        json={
            "patient_id": patient_id,
            "reason": "Encaminhamento para avaliação",
            "clinical_criteria": [
                {"criterion_key": "infeccoes_recorrentes", "is_present": True}
            ],
        },
        headers=requester_headers,
    )
    referral_id = referral_response.json()["id"]

    submit_response = client.post(
        f"/api/v1/referrals/{referral_id}/submit",
        headers=requester_headers,
    )
    assert submit_response.status_code == 200

    regulator_token = get_token(client, "regulator@test.com", "regul123")
    regulator_headers = {"Authorization": f"Bearer {regulator_token}"}

    evaluate_response = client.post(
        f"/api/v1/referrals/{referral_id}/evaluate",
        json={
            "decision": "approve",
            "priority": "low",
            "justification": "Critérios clínicos leves, acompanhamento ambulatorial.",
        },
        headers=regulator_headers,
    )
    assert evaluate_response.status_code == 200
    assert evaluate_response.json()["decision"] == "approve"


def test_regulator_can_return_referral(client: TestClient):
    requester_token = get_token(client, "requester@test.com", "solicit123")
    requester_headers = {"Authorization": f"Bearer {requester_token}"}

    patient_response = client.post(
        "/api/v1/patients/",
        json={
            "full_name": "Paciente Devolução",
            "sus_card": "700444555666777",
            "birth_date": "1970-02-02",
            "sex": "female",
            "city": "Santos",
            "health_unit": "UBS Test",
        },
        headers=requester_headers,
    )
    referral_response = client.post(
        "/api/v1/referrals/",
        json={
            "patient_id": patient_response.json()["id"],
            "reason": "Encaminhamento incompleto",
            "clinical_criteria": [
                {"criterion_key": "infeccoes_recorrentes", "is_present": True}
            ],
        },
        headers=requester_headers,
    )
    referral_id = referral_response.json()["id"]
    client.post(f"/api/v1/referrals/{referral_id}/submit", headers=requester_headers)

    regulator_headers = {"Authorization": f"Bearer {get_token(client, 'regulator@test.com', 'regul123')}"}
    evaluate_response = client.post(
        f"/api/v1/referrals/{referral_id}/evaluate",
        json={
            "decision": "return",
            "priority": "low",
            "justification": "Documentação insuficiente para regulação.",
        },
        headers=regulator_headers,
    )
    assert evaluate_response.status_code == 200
    assert evaluate_response.json()["decision"] == "return"


def test_requester_cannot_access_users(client: TestClient):
    token = get_token(client, "requester@test.com", "solicit123")
    response = client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
