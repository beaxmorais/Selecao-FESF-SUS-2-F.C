import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import User, UserRole

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    admin = User(
        email="admin@test.com",
        full_name="Admin Test",
        role=UserRole.admin,
        hashed_password=get_password_hash("admin123"),
    )
    requester = User(
        email="requester@test.com",
        full_name="Requester Test",
        role=UserRole.requester,
        health_unit="UBS Test",
        hashed_password=get_password_hash("solicit123"),
    )
    regulator = User(
        email="regulator@test.com",
        full_name="Regulator Test",
        role=UserRole.regulator,
        hashed_password=get_password_hash("regul123"),
    )
    db.add_all([admin, requester, regulator])
    db.commit()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def get_token(client: TestClient, email: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]
