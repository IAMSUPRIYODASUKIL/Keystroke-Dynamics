from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.enums import ProfileStatus, SamplePurpose
from app.models.model_version import ModelVersion
from app.models.training_run import TrainingRun
from app.models.typing_feature import TypingFeature
from app.models.typing_sample import TypingSample
from app.models.user import User


def get_latest_training_run(db: Session, user_id: int | None) -> TrainingRun | None:
    return (
        db.query(TrainingRun)
        .filter(TrainingRun.user_id == user_id)
        .order_by(TrainingRun.started_at.desc())
        .first()
    )


def get_active_model(db: Session, user_id: int | None) -> ModelVersion | None:
    return (
        db.query(ModelVersion)
        .filter(ModelVersion.user_id == user_id, ModelVersion.is_active.is_(True))
        .order_by(ModelVersion.created_at.desc())
        .first()
    )


def get_dataset_stats(db: Session) -> dict:
    total_users = db.query(func.count(User.id)).scalar() or 0
    users_ready = (
        db.query(func.count(User.id)).filter(User.typing_profile_status == ProfileStatus.READY).scalar()
        or 0
    )
    total_samples = db.query(func.count(TypingSample.id)).scalar() or 0
    enrollment_samples = (
        db.query(func.count(TypingSample.id))
        .filter(TypingSample.purpose == SamplePurpose.ENROLLMENT)
        .scalar()
        or 0
    )
    verification_samples = total_samples - enrollment_samples

    avg_speed = db.query(func.avg(TypingFeature.typing_speed_cps)).scalar() or 0.0
    avg_dwell = db.query(func.avg(TypingFeature.mean_dwell)).scalar() or 0.0
    avg_flight = db.query(func.avg(TypingFeature.mean_flight)).scalar() or 0.0

    samples_per_user = dict(
        db.query(User.name, func.count(TypingSample.id))
        .join(TypingSample, TypingSample.user_id == User.id)
        .group_by(User.name)
        .all()
    )

    return {
        "total_users": total_users,
        "users_ready": users_ready,
        "total_samples": total_samples,
        "total_enrollment_samples": enrollment_samples,
        "total_verification_samples": verification_samples,
        "avg_typing_speed_cps": float(avg_speed),
        "avg_dwell_ms": float(avg_dwell),
        "avg_flight_ms": float(avg_flight),
        "samples_per_user": samples_per_user,
    }
