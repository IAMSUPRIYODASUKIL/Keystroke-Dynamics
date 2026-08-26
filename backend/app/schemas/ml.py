from datetime import datetime

from pydantic import BaseModel

from app.models.enums import ModelType, TrainingScope, TrainingStatus


class ModelMetrics(BaseModel):
    model_type: ModelType
    is_active: bool
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    far: float
    frr: float
    cv_accuracy_mean: float
    cv_accuracy_std: float
    confusion_matrix: list[list[int]]
    confusion_matrix_labels: list[str]
    feature_importance: list[dict]
    created_at: datetime


class TrainingRunResponse(BaseModel):
    id: int
    scope: TrainingScope
    status: TrainingStatus
    message: str | None
    dataset_samples: int
    dataset_users: int
    best_model_type: str | None
    started_at: datetime
    completed_at: datetime | None
    models: list[ModelMetrics] = []


class DatasetStatsResponse(BaseModel):
    total_users: int
    users_ready: int
    total_samples: int
    total_enrollment_samples: int
    total_verification_samples: int
    avg_typing_speed_cps: float
    avg_dwell_ms: float
    avg_flight_ms: float
    samples_per_user: dict[str, int]
