from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.authentication_attempt import AuthenticationAttempt
from app.models.enums import AuthDecision
from app.models.user import User
from app.schemas.activity import ActivityResponse, AttemptRecord
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/api/authentication", tags=["activity"])


@router.get("/history", response_model=ActivityResponse)
def authentication_history(
    limit: int = 25,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ActivityResponse:
    query = db.query(AuthenticationAttempt).filter(AuthenticationAttempt.user_id == current_user.id)
    attempts = query.order_by(AuthenticationAttempt.created_at.desc()).limit(limit).all()

    total_success = query.filter(AuthenticationAttempt.decision == AuthDecision.SUCCESS).count()
    total_failed = query.filter(AuthenticationAttempt.decision == AuthDecision.FAILED).count()

    return ActivityResponse(
        attempts=[AttemptRecord.model_validate(a) for a in attempts],
        total_success=total_success,
        total_failed=total_failed,
    )
