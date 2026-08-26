from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.ml.feature_extraction import KeystrokeValidationError
from app.ml.inference import verify_typing_pattern
from app.ml.training import train_user_verification_model
from app.models.enums import ProfileStatus, SamplePurpose
from app.models.user import User
from app.schemas.typing import EnrollRequest, EnrollResponse, VerifyPreviewRequest, VerifyPreviewResponse
from app.security.dependencies import get_current_user
from app.services.keystroke_service import (
    count_enrollment_samples,
    store_typing_sample,
    update_profile_status,
)

router = APIRouter(prefix="/api/typing", tags=["typing"])


@router.post("/enroll", response_model=EnrollResponse)
def enroll(
    payload: EnrollRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EnrollResponse:
    raw_events = [e.model_dump() for e in payload.events]
    try:
        sample, features = store_typing_sample(db, current_user, raw_events, SamplePurpose.ENROLLMENT)
    except KeystrokeValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    status_after = update_profile_status(db, current_user)
    samples_collected = count_enrollment_samples(db, current_user.id)

    training_triggered = False
    training_message = None
    if status_after == ProfileStatus.READY:
        run = train_user_verification_model(db, current_user.id)
        training_triggered = True
        training_message = run.message

    return EnrollResponse(
        sample_number=samples_collected,
        samples_collected=samples_collected,
        min_required=settings.MIN_ENROLLMENT_SAMPLES,
        profile_status=status_after,
        ready_for_authentication=(status_after == ProfileStatus.READY),
        training_triggered=training_triggered,
        training_message=training_message,
        feature_summary={
            "mean_dwell_ms": round(features.mean_dwell, 2),
            "mean_flight_ms": round(features.mean_flight, 2),
            "typing_speed_cps": round(features.typing_speed_cps, 2),
            "total_duration_ms": round(features.total_duration_ms, 2),
        },
    )


@router.post("/verify-preview", response_model=VerifyPreviewResponse)
def verify_preview(
    payload: VerifyPreviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VerifyPreviewResponse:
    """Score a typing sample against the current user's profile without
    it being a real login attempt. Used by Demo Mode to show a genuine
    vs. impostor typing pattern side by side without touching the audit
    log or requiring the password again."""
    raw_events = [e.model_dump() for e in payload.events]
    try:
        from app.ml.feature_extraction import extract_features

        extracted = extract_features(raw_events, settings.AUTH_PHRASE)
    except KeystrokeValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    result = verify_typing_pattern(db, current_user.id, extracted.feature_vector)
    match = result.similarity_score >= settings.VERIFICATION_MATCH_THRESHOLD
    label = "High" if match else ("Medium" if result.similarity_score >= settings.VERIFICATION_SUSPICIOUS_THRESHOLD else "Low")

    return VerifyPreviewResponse(
        similarity_score=result.similarity_score,
        similarity_label=label,
        method_used=result.method,
        match=match,
    )
