from fastapi import APIRouter

from app.api.v1.routes import auth, patients, referrals, reports, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(patients.router)
api_router.include_router(referrals.router)
api_router.include_router(reports.router)
