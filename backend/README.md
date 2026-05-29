# Backend - Triagem Hematológica

API FastAPI com SQLAlchemy e PostgreSQL.

## Desenvolvimento local

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

## Testes

```bash
pytest tests/ -v
```

## Endpoints principais

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- CRUD `/api/v1/patients`
- CRUD `/api/v1/referrals`
- `POST /api/v1/referrals/{id}/submit`
- `POST /api/v1/referrals/{id}/evaluate`
- `GET /api/v1/reports/dashboard`

Documentação interativa: http://localhost:8000/docs
