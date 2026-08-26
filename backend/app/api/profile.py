from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.models.typing_sample import TypingSample
from app.models.user import User
from app.schemas.profile import ActiveModelInfo, ProfileResponse
from app.schemas.user import UserPublic
from app.security.dependencies import get_current_user
from app.services.keystroke_service import count_enrollment_samples
from app.services.ml_service import get_active_model

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ProfileResponse:
    active_model = get_active_model(db, current_user.id)
    return ProfileResponse(
        user=UserPublic.model_validate(current_user),
        samples_collected=count_enrollment_samples(db, current_user.id),
        min_required=settings.MIN_ENROLLMENT_SAMPLES,
        auth_phrase=settings.AUTH_PHRASE,
        active_model=(
            ActiveModelInfo(
                model_type=active_model.model_type,
                accuracy=active_model.accuracy,
                f1_score=active_model.f1_score,
                far=active_model.far,
                frr=active_model.frr,
                trained_at=active_model.created_at,
            )
            if active_model
            else None
        ),
    )


@router.delete("/typing-data", status_code=status.HTTP_204_NO_CONTENT)
def delete_typing_profile(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    """Privacy control: permanently delete this user's collected typing
    samples/features and trained models, resetting their typing profile.
    The account and password remain untouched."""
    from app.models.enums import ProfileStatus
    from app.models.model_version import ModelVersion

    db.query(TypingSample).filter(TypingSample.user_id == current_user.id).delete()
    db.query(ModelVersion).filter(ModelVersion.user_id == current_user.id).delete()
    current_user.typing_profile_status = ProfileStatus.NOT_STARTED
    db.commit()
