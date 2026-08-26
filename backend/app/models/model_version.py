from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import ModelType


class ModelVersion(Base):
    """One trained, persisted model artifact (one row per candidate model
    per training run — e.g. a single training run produces three rows:
    random_forest, svm, logistic_regression). `is_active` marks the model
    actually used for live authentication decisions for its scope/user."""

    __tablename__ = "model_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    training_run_id: Mapped[int] = mapped_column(ForeignKey("training_runs.id", ondelete="CASCADE"))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    model_type: Mapped[ModelType] = mapped_column(Enum(ModelType), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    precision: Mapped[float] = mapped_column(Float, default=0.0)
    recall: Mapped[float] = mapped_column(Float, default=0.0)
    f1_score: Mapped[float] = mapped_column(Float, default=0.0)
    far: Mapped[float] = mapped_column(Float, default=0.0)  # False Acceptance Rate
    frr: Mapped[float] = mapped_column(Float, default=0.0)  # False Rejection Rate
    cv_accuracy_mean: Mapped[float] = mapped_column(Float, default=0.0)
    cv_accuracy_std: Mapped[float] = mapped_column(Float, default=0.0)

    # confusion_matrix, feature_importance, classification_report, params
    metrics_json: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    training_run = relationship("TrainingRun", back_populates="model_versions")
    user = relationship("User", back_populates="model_versions")
