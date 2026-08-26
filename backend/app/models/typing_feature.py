from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class TypingFeature(Base):
    """Derived numeric features for one TypingSample.

    `feature_vector` + `feature_names` hold the exact ordered vector fed to
    the ML models (positional hold/flight/inter-key times for the fixed
    phrase, plus session-level statistics — see
    app/ml/feature_extraction.py). The individual summary columns
    duplicate a subset of that vector in a queryable form purely so the
    dashboard/analytics endpoints can aggregate with plain SQL instead of
    deserializing JSON for every row.
    """

    __tablename__ = "typing_features"

    id: Mapped[int] = mapped_column(primary_key=True)
    sample_id: Mapped[int] = mapped_column(
        ForeignKey("typing_samples.id", ondelete="CASCADE"), unique=True, index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    feature_names: Mapped[list] = mapped_column(JSON, nullable=False)
    feature_vector: Mapped[list] = mapped_column(JSON, nullable=False)

    # Queryable summary columns (milliseconds unless noted)
    mean_dwell: Mapped[float] = mapped_column(Float)
    std_dwell: Mapped[float] = mapped_column(Float)
    cv_dwell: Mapped[float] = mapped_column(Float)
    mean_flight: Mapped[float] = mapped_column(Float)
    std_flight: Mapped[float] = mapped_column(Float)
    cv_flight: Mapped[float] = mapped_column(Float)
    mean_inter_key: Mapped[float] = mapped_column(Float)
    std_inter_key: Mapped[float] = mapped_column(Float)
    typing_speed_cps: Mapped[float] = mapped_column(Float)
    total_duration_ms: Mapped[float] = mapped_column(Float)
    key_count: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    sample = relationship("TypingSample", back_populates="features")
