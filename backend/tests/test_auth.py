from fastapi.testclient import TestClient

from tests.conftest import get_token


def test_login_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "admin123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_invalid_credentials(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "wrong"},
    )
    assert response.status_code == 401


def test_me_endpoint(client: TestClient):
    token = get_token(client, "admin@test.com", "admin123")
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "admin@test.com"
