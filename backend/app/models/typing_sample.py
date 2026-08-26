from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import SamplePurpose


class TypingSample(Base):
    """One typing session: the raw keydown/keyup events for one attempt at
    typing the fixed authentication phrase. Kept separate from the derived
    TypingFeature row so raw data and derived features have independent
    lifecycles (e.g. raw events can be purged for privacy while keeping
    the numeric features used for the trained model)."""

    __tablename__ = "typing_samples"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    phrase: Mapped[str] = mapped_column(Text, nullable=False)
    purpose: Mapped[SamplePurpose] = mapped_column(Enum(SamplePurpose), nullable=False)

    # Raw keyboard events: [{"key": "m", "type": "keydown"|"keyup", "t": 123.4}, ...]
    # "t" is a high-resolution timestamp in milliseconds, relative to the
    # start of the sample (NOT wall-clock time) — see docs/13_Security.md
    # (Privacy) for why absolute timestamps are not stored.
    raw_events: Mapped[list] = mapped_column(JSON, nullable=False)

    used_for_training: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="typing_samples")
    features = relationship(
        "TypingFeature", back_populates="sample", uselist=False, cascade="all, delete-orphan"
    )
