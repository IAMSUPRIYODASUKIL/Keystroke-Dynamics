from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import AuthDecision, ModelType, RiskLevel


class AuthenticationAttempt(Base):
    """Audit log of every login attempt — password result, typing-pattern
    result, and the final decision. Powers the Security/Activity page."""

    __tablename__ = "authentication_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    # user_id is nullable because an attempt against an unknown email still
    # gets logged (for the activity feed) without a user to attach to.
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    attempted_email: Mapped[str] = mapped_column(String(255), nullable=False)

    password_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    typing_sample_id: Mapped[int | None] = mapped_column(
        ForeignKey("typing_samples.id", ondelete="SET NULL"), nullable=True
    )

    method_used: Mapped[ModelType | None] = mapped_column(Enum(ModelType), nullable=True)
    similarity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel), default=RiskLevel.UNKNOWN)
    decision: Mapped[AuthDecision] = mapped_column(Enum(AuthDecision), nullable=False)

    # Human-readable explanation breakdown shown in the dashboard, e.g.
    # {"password": "correct", "typing_similarity": "high", "reason": "..."}
    details: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="authentication_attempts")
