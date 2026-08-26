from datetime import datetime

from pydantic import BaseModel

from app.models.enums import AuthDecision, ModelType, RiskLevel


class AttemptRecord(BaseModel):
    id: int
    attempted_email: str
    password_correct: bool
    method_used: ModelType | None
    similarity_score: float | None
    risk_level: RiskLevel
    decision: AuthDecision
    details: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityResponse(BaseModel):
    attempts: list[AttemptRecord]
    total_success: int
    total_failed: int
