from pydantic import BaseModel, EmailStr

from app.models.enums import AuthDecision, ModelType, RiskLevel
from app.schemas.common import KeystrokeEvent
from app.schemas.user import UserPublic


class RegisterResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
    message: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    events: list[KeystrokeEvent] = []


class LoginResponse(BaseModel):
    decision: AuthDecision
    risk_level: RiskLevel
    password_correct: bool
    typing_evaluated: bool
    similarity_score: float | None = None
    similarity_label: str | None = None
    method_used: ModelType | None = None
    message: str
    access_token: str | None = None
    token_type: str = "bearer"
    user: UserPublic | None = None
