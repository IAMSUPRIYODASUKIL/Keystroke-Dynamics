from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import ProfileStatus


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    typing_profile_status: Mapped[ProfileStatus] = mapped_column(
        Enum(ProfileStatus), default=ProfileStatus.NOT_STARTED, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    typing_samples = relationship("TypingSample", back_populates="user", cascade="all, delete-orphan")
    model_versions = relationship("ModelVersion", back_populates="user", cascade="all, delete-orphan")
    authentication_attempts = relationship(
        "AuthenticationAttempt", back_populates="user", cascade="all, delete-orphan"
    )
