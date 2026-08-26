from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.auth import LoginRequest, LoginResponse, RegisterResponse
from app.schemas.user import RegisterRequest, UserPublic
from app.security.tokens import create_access_token
from app.services.auth_service import evaluate_login
from app.services.user_service import create_user, get_user_by_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    if get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = create_user(db, payload.name, payload.email, payload.password)
    token = create_access_token(subject=str(user.id))
    return RegisterResponse(
        access_token=token,
        user=UserPublic.model_validate(user),
        message="Account created. Now let's learn your typing pattern.",
    )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    raw_events = [e.model_dump() for e in payload.events]
    outcome = evaluate_login(db, payload.email, payload.password, raw_events)

    token = None
    if outcome.decision.value == "success" and outcome.user is not None:
        token = create_access_token(subject=str(outcome.user.id))

    return LoginResponse(
        decision=outcome.decision,
        risk_level=outcome.risk_level,
        password_correct=outcome.password_correct,
        typing_evaluated=outcome.typing_evaluated,
        similarity_score=outcome.similarity_score,
        similarity_label=outcome.similarity_label,
        method_used=outcome.method_used,
        message=outcome.message,
        access_token=token,
        user=UserPublic.model_validate(outcome.user) if outcome.user else None,
    )
