"""Seed and reset database."""

import argparse

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models import ClinicalCriterion, Evaluation, LabResult, Patient, Referral, User, UserRole


def reset_database() -> None:
    db = SessionLocal()
    try:
        db.query(Evaluation).delete()
        db.query(ClinicalCriterion).delete()
        db.query(LabResult).delete()
        db.query(Referral).delete()
        db.query(Patient).delete()
        db.query(User).delete()
        db.commit()

        users = [
            User(
                email="admin@example.com",
                full_name="Administrador Sistema",
                role=UserRole.admin,
                health_unit="Central de Regulação",
                hashed_password=get_password_hash("admin123"),
            ),
            User(
                email="solicitante@example.com",
                full_name="Dr. João Solicitante",
                role=UserRole.requester,
                health_unit="UBS Centro",
                hashed_password=get_password_hash("solicit123"),
            ),
            User(
                email="regulador@example.com",
                full_name="Dra. Maria Reguladora",
                role=UserRole.regulator,
                health_unit="Central de Regulação",
                hashed_password=get_password_hash("regul123"),
            ),
        ]
        db.add_all(users)
        db.commit()
        print("Database reset completed. Users created: admin, requester and regulator.")
    finally:
        db.close()


def seed() -> None:
    db = SessionLocal()
    try:
        if db.query(User).first():
            print("Database already has data. Use --reset to clear and recreate.")
            return

        reset_database()
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed or reset application database")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear all data and recreate default users (admin, requester, regulator)",
    )
    args = parser.parse_args()

    if args.reset:
        reset_database()
    else:
        seed()
