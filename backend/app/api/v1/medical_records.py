from typing import TypeVar

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.medical_records import AISummary, ExtractedParameter, HealthScore, Report, User
from app.schemas.medical_records import (
    AISummaryCreate,
    AISummaryRead,
    AISummaryUpdate,
    ExtractedParameterCreate,
    ExtractedParameterRead,
    ExtractedParameterUpdate,
    HealthScoreCreate,
    HealthScoreRead,
    HealthScoreUpdate,
    ReportCreate,
    ReportRead,
    ReportUpdate,
    UserCreate,
    UserRead,
    UserUpdate,
)

router = APIRouter(tags=["Medical Records CRUD"])

ModelT = TypeVar("ModelT", User, Report, ExtractedParameter, HealthScore, AISummary)


def get_or_404(db: Session, model: type[ModelT], record_id: str, label: str) -> ModelT:
    record = db.get(model, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found.")
    return record


def ensure_user_exists(db: Session, user_id: str | None) -> None:
    if user_id and db.get(User, user_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referenced user does not exist.")


def ensure_report_exists(db: Session, report_id: str) -> None:
    if db.get(Report, report_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referenced report does not exist.")


def commit_or_400(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Database constraint violation.") from exc


def apply_updates(record: object, updates: dict) -> None:
    for field, value in updates.items():
        setattr(record, field, value)


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")

    user = User(**payload.model_dump())
    db.add(user)
    commit_or_400(db)
    db.refresh(user)
    return user


@router.get("/users", response_model=list[UserRead])
def list_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[User]:
    return db.query(User).offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=UserRead)
def read_user(user_id: str, db: Session = Depends(get_db)) -> User:
    return get_or_404(db, User, user_id, "User")


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(user_id: str, payload: UserUpdate, db: Session = Depends(get_db)) -> User:
    user = get_or_404(db, User, user_id, "User")
    updates = payload.model_dump(exclude_unset=True)
    if "email" in updates:
        existing_user = db.query(User).filter(User.email == updates["email"], User.id != user_id).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")

    apply_updates(user, updates)
    commit_or_400(db)
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, db: Session = Depends(get_db)) -> None:
    user = get_or_404(db, User, user_id, "User")
    db.delete(user)
    commit_or_400(db)


@router.post("/reports", response_model=ReportRead, status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)) -> Report:
    ensure_user_exists(db, payload.user_id)
    report = Report(**payload.model_dump())
    db.add(report)
    commit_or_400(db)
    db.refresh(report)
    return report


@router.get("/reports", response_model=list[ReportRead])
def list_reports(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[Report]:
    return db.query(Report).offset(skip).limit(limit).all()


@router.get("/reports/{report_id}", response_model=ReportRead)
def read_report(report_id: str, db: Session = Depends(get_db)) -> Report:
    return get_or_404(db, Report, report_id, "Report")


@router.patch("/reports/{report_id}", response_model=ReportRead)
def update_report(report_id: str, payload: ReportUpdate, db: Session = Depends(get_db)) -> Report:
    report = get_or_404(db, Report, report_id, "Report")
    updates = payload.model_dump(exclude_unset=True)
    if "user_id" in updates:
        ensure_user_exists(db, updates["user_id"])

    apply_updates(report, updates)
    commit_or_400(db)
    db.refresh(report)
    return report


@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(report_id: str, db: Session = Depends(get_db)) -> None:
    report = get_or_404(db, Report, report_id, "Report")
    db.delete(report)
    commit_or_400(db)


@router.post("/extracted-parameters", response_model=ExtractedParameterRead, status_code=status.HTTP_201_CREATED)
def create_extracted_parameter(payload: ExtractedParameterCreate, db: Session = Depends(get_db)) -> ExtractedParameter:
    ensure_report_exists(db, payload.report_id)
    parameter = ExtractedParameter(**payload.model_dump())
    db.add(parameter)
    commit_or_400(db)
    db.refresh(parameter)
    return parameter


@router.get("/extracted-parameters", response_model=list[ExtractedParameterRead])
def list_extracted_parameters(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[ExtractedParameter]:
    return db.query(ExtractedParameter).offset(skip).limit(limit).all()


@router.get("/extracted-parameters/{parameter_id}", response_model=ExtractedParameterRead)
def read_extracted_parameter(parameter_id: str, db: Session = Depends(get_db)) -> ExtractedParameter:
    return get_or_404(db, ExtractedParameter, parameter_id, "Extracted parameter")


@router.patch("/extracted-parameters/{parameter_id}", response_model=ExtractedParameterRead)
def update_extracted_parameter(parameter_id: str, payload: ExtractedParameterUpdate, db: Session = Depends(get_db)) -> ExtractedParameter:
    parameter = get_or_404(db, ExtractedParameter, parameter_id, "Extracted parameter")
    apply_updates(parameter, payload.model_dump(exclude_unset=True))
    commit_or_400(db)
    db.refresh(parameter)
    return parameter


@router.delete("/extracted-parameters/{parameter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_extracted_parameter(parameter_id: str, db: Session = Depends(get_db)) -> None:
    parameter = get_or_404(db, ExtractedParameter, parameter_id, "Extracted parameter")
    db.delete(parameter)
    commit_or_400(db)


@router.post("/health-scores", response_model=HealthScoreRead, status_code=status.HTTP_201_CREATED)
def create_health_score(payload: HealthScoreCreate, db: Session = Depends(get_db)) -> HealthScore:
    ensure_report_exists(db, payload.report_id)
    health_score = HealthScore(**payload.model_dump())
    db.add(health_score)
    commit_or_400(db)
    db.refresh(health_score)
    return health_score


@router.get("/health-scores", response_model=list[HealthScoreRead])
def list_health_scores(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[HealthScore]:
    return db.query(HealthScore).offset(skip).limit(limit).all()


@router.get("/health-scores/{health_score_id}", response_model=HealthScoreRead)
def read_health_score(health_score_id: str, db: Session = Depends(get_db)) -> HealthScore:
    return get_or_404(db, HealthScore, health_score_id, "Health score")


@router.patch("/health-scores/{health_score_id}", response_model=HealthScoreRead)
def update_health_score(health_score_id: str, payload: HealthScoreUpdate, db: Session = Depends(get_db)) -> HealthScore:
    health_score = get_or_404(db, HealthScore, health_score_id, "Health score")
    apply_updates(health_score, payload.model_dump(exclude_unset=True))
    commit_or_400(db)
    db.refresh(health_score)
    return health_score


@router.delete("/health-scores/{health_score_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_health_score(health_score_id: str, db: Session = Depends(get_db)) -> None:
    health_score = get_or_404(db, HealthScore, health_score_id, "Health score")
    db.delete(health_score)
    commit_or_400(db)


@router.post("/ai-summaries", response_model=AISummaryRead, status_code=status.HTTP_201_CREATED)
def create_ai_summary(payload: AISummaryCreate, db: Session = Depends(get_db)) -> AISummary:
    ensure_report_exists(db, payload.report_id)
    ai_summary = AISummary(**payload.model_dump())
    db.add(ai_summary)
    commit_or_400(db)
    db.refresh(ai_summary)
    return ai_summary


@router.get("/ai-summaries", response_model=list[AISummaryRead])
def list_ai_summaries(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[AISummary]:
    return db.query(AISummary).offset(skip).limit(limit).all()


@router.get("/ai-summaries/{summary_id}", response_model=AISummaryRead)
def read_ai_summary(summary_id: str, db: Session = Depends(get_db)) -> AISummary:
    return get_or_404(db, AISummary, summary_id, "AI summary")


@router.patch("/ai-summaries/{summary_id}", response_model=AISummaryRead)
def update_ai_summary(summary_id: str, payload: AISummaryUpdate, db: Session = Depends(get_db)) -> AISummary:
    ai_summary = get_or_404(db, AISummary, summary_id, "AI summary")
    apply_updates(ai_summary, payload.model_dump(exclude_unset=True))
    commit_or_400(db)
    db.refresh(ai_summary)
    return ai_summary


@router.delete("/ai-summaries/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ai_summary(summary_id: str, db: Session = Depends(get_db)) -> None:
    ai_summary = get_or_404(db, AISummary, summary_id, "AI summary")
    db.delete(ai_summary)
    commit_or_400(db)
