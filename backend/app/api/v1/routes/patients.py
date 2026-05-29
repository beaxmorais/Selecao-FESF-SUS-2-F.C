from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_roles
from app.crud.patient import create_patient, delete_patient, get_patient, get_patients, update_patient
from app.db.session import get_db
from app.models import User, UserRole
from app.schemas import PatientCreate, PatientRead, PatientUpdate

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/", response_model=list[PatientRead])
def list_patients(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.requester, UserRole.regulator))],
    skip: int = 0,
    limit: int = 100,
) -> list:
    return get_patients(db, skip=skip, limit=limit)


@router.post("/", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient_route(
    patient_in: PatientCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.requester))],
):
    return create_patient(db, patient_in)


@router.get("/{patient_id}", response_model=PatientRead)
def read_patient(
    patient_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.requester, UserRole.regulator))],
):
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return patient


@router.patch("/{patient_id}", response_model=PatientRead)
def patch_patient(
    patient_id: int,
    patient_in: PatientUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.requester))],
):
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return update_patient(db, patient, patient_in)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_patient(
    patient_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.admin))],
) -> None:
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    delete_patient(db, patient)
