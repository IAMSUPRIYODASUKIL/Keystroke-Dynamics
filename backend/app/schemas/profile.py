from datetime import datetime

from pydantic import BaseModel

from app.models.enums import ModelType
from app.schemas.user import UserPublic


class ActiveModelInfo(BaseModel):
    model_type: ModelType
    accuracy: float
    f1_score: float
    far: float
    frr: float
    trained_at: datetime


class ProfileResponse(BaseModel):
    user: UserPublic
    samples_collected: int
    min_required: int
    active_model: ActiveModelInfo | None = None
    auth_phrase: str
