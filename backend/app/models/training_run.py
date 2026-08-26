from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import TrainingScope, TrainingStatus


class TrainingRun(Base):
    """One invocation of the training pipeline. Groups the candidate
    ModelVersion rows (Random Forest / SVM / Logistic Regression) produced
    by that run so the dashboard can show "what happened when you last
    clicked Train" rather than just the currently active model."""

    __tablename__ = "training_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    scope: Mapped[TrainingScope] = mapped_column(Enum(TrainingScope), nullable=False)
    # Null user_id => GLOBAL_MULTICLASS run (trained across all users)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    status: Mapped[TrainingStatus] = mapped_column(Enum(TrainingStatus), default=TrainingStatus.PENDING)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    dataset_samples: Mapped[int] = mapped_column(Integer, default=0)
    dataset_users: Mapped[int] = mapped_column(Integer, default=0)
    dataset_version: Mapped[str] = mapped_column(String(64), default="v1")

    best_model_type: Mapped[str | None] = mapped_column(String(32), nullable=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    model_versions = relationship(
        "ModelVersion", back_populates="training_run", cascade="all, delete-orphan"
    )
