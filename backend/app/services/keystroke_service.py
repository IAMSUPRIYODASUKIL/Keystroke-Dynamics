from sqlalchemy.orm import Session

from app.core.config import settings
from app.ml.feature_extraction import KeystrokeValidationError, extract_features
from app.models.enums import ProfileStatus, SamplePurpose
from app.models.typing_feature import TypingFeature
from app.models.typing_sample import TypingSample
from app.models.user import User


def store_typing_sample(
    db: Session, user: User, events: list[dict], purpose: SamplePurpose
) -> tuple[TypingSample, TypingFeature]:
    """Validate raw events against the configured phrase, extract
    features, and persist both the raw sample and derived features.
    Raises KeystrokeValidationError (→ 400 at the API layer) on bad input.
    """
    extracted = extract_features(events, settings.AUTH_PHRASE)

    sample = TypingSample(
        user_id=user.id,
        phrase=settings.AUTH_PHRASE,
        purpose=purpose,
        raw_events=events,
        used_for_training=(purpose == SamplePurpose.ENROLLMENT),
    )
    db.add(sample)
    db.flush()  # assign sample.id without committing yet

    feature = TypingFeature(
        sample_id=sample.id,
        user_id=user.id,
        feature_names=extracted.feature_names,
        feature_vector=extracted.feature_vector,
        mean_dwell=extracted.summary["mean_dwell"],
        std_dwell=extracted.summary["std_dwell"],
        cv_dwell=extracted.summary["cv_dwell"],
        mean_flight=extracted.summary["mean_flight"],
        std_flight=extracted.summary["std_flight"],
        cv_flight=extracted.summary["cv_flight"],
        mean_inter_key=extracted.summary["mean_inter_key"],
        std_inter_key=extracted.summary["std_inter_key"],
        typing_speed_cps=extracted.summary["typing_speed_cps"],
        total_duration_ms=extracted.summary["total_duration_ms"],
        key_count=extracted.summary["key_count"],
    )
    db.add(feature)
    db.commit()
    db.refresh(sample)
    db.refresh(feature)
    return sample, feature


def count_enrollment_samples(db: Session, user_id: int) -> int:
    return (
        db.query(TypingSample)
        .filter(TypingSample.user_id == user_id, TypingSample.purpose == SamplePurpose.ENROLLMENT)
        .count()
    )


def update_profile_status(db: Session, user: User) -> ProfileStatus:
    count = count_enrollment_samples(db, user.id)
    if count == 0:
        status = ProfileStatus.NOT_STARTED
    elif count < settings.MIN_ENROLLMENT_SAMPLES:
        status = ProfileStatus.IN_PROGRESS
    else:
        status = ProfileStatus.READY
    if user.typing_profile_status != status:
        user.typing_profile_status = status
        db.commit()
    return status
