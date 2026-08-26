from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.ml.training import train_global_multiclass_model, train_user_verification_model
from app.models.model_version import ModelVersion
from app.models.user import User
from app.schemas.ml import DatasetStatsResponse, ModelMetrics, TrainingRunResponse
from app.security.dependencies import get_current_user
from app.services.ml_service import get_dataset_stats, get_latest_training_run

router = APIRouter(prefix="/api/ml", tags=["ml"])


def _serialize_run(run) -> TrainingRunResponse:
    models = [
        ModelMetrics(
            model_type=m.model_type,
            is_active=m.is_active,
            accuracy=m.accuracy,
            precision=m.precision,
            recall=m.recall,
            f1_score=m.f1_score,
            far=m.far,
            frr=m.frr,
            cv_accuracy_mean=m.cv_accuracy_mean,
            cv_accuracy_std=m.cv_accuracy_std,
            confusion_matrix=m.metrics_json.get("confusion_matrix", []),
            confusion_matrix_labels=m.metrics_json.get("confusion_matrix_labels", []),
            feature_importance=m.metrics_json.get("feature_importance", []),
            created_at=m.created_at,
        )
        for m in run.model_versions
    ]
    return TrainingRunResponse(
        id=run.id, scope=run.scope, status=run.status, message=run.message,
        dataset_samples=run.dataset_samples, dataset_users=run.dataset_users,
        best_model_type=run.best_model_type, started_at=run.started_at,
        completed_at=run.completed_at, models=models,
    )


@router.post("/train", response_model=TrainingRunResponse)
def train_my_model(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> TrainingRunResponse:
    """Manually (re)train the current user's personal verification model.
    Also used by the enrollment flow automatically once enough samples
    exist (see app/api/typing.py)."""
    run = train_user_verification_model(db, current_user.id)
    return _serialize_run(run)


@router.post("/train/global", response_model=TrainingRunResponse)
def train_global_model(db: Session = Depends(get_db)) -> TrainingRunResponse:
    """Train the multi-user classification model ("which enrolled user
    does this sample resemble?") across every eligible user. Intended for
    the ML Analytics / demo page, not the live login path."""
    run = train_global_multiclass_model(db)
    return _serialize_run(run)


@router.get("/status", response_model=TrainingRunResponse | None)
def my_training_status(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    run = get_latest_training_run(db, current_user.id)
    return _serialize_run(run) if run else None


@router.get("/status/global", response_model=TrainingRunResponse | None)
def global_training_status(db: Session = Depends(get_db)):
    run = get_latest_training_run(db, None)
    return _serialize_run(run) if run else None


@router.get("/dataset-stats", response_model=DatasetStatsResponse)
def dataset_stats(db: Session = Depends(get_db)) -> DatasetStatsResponse:
    return DatasetStatsResponse(**get_dataset_stats(db))
