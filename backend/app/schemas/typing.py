from pydantic import BaseModel

from app.models.enums import ModelType, ProfileStatus
from app.schemas.common import KeystrokeEvent


class EnrollRequest(BaseModel):
    events: list[KeystrokeEvent]


class EnrollResponse(BaseModel):
    sample_number: int
    samples_collected: int
    min_required: int
    profile_status: ProfileStatus
    ready_for_authentication: bool
    training_triggered: bool
    training_message: str | None = None
    feature_summary: dict


class VerifyPreviewRequest(BaseModel):
    events: list[KeystrokeEvent]


class VerifyPreviewResponse(BaseModel):
    similarity_score: float
    similarity_label: str
    method_used: ModelType
    match: bool
