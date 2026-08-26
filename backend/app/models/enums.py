"""Shared enums used across ORM models and API schemas."""
import enum


class ProfileStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    READY = "ready"


class SamplePurpose(str, enum.Enum):
    ENROLLMENT = "enrollment"
    VERIFICATION = "verification"


class ModelType(str, enum.Enum):
    STATISTICAL = "statistical"
    RANDOM_FOREST = "random_forest"
    SVM = "svm"
    LOGISTIC_REGRESSION = "logistic_regression"


class TrainingScope(str, enum.Enum):
    USER_VERIFICATION = "user_verification"  # binary: this user vs. others
    GLOBAL_MULTICLASS = "global_multiclass"  # which enrolled user does this sample resemble


class TrainingStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    INSUFFICIENT_DATA = "insufficient_data"


class RiskLevel(str, enum.Enum):
    UNKNOWN = "unknown"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AuthDecision(str, enum.Enum):
    SUCCESS = "success"
    FAILED = "failed"
