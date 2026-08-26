from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import ProfileStatus


class UserPublic(BaseModel):
    id: int
    name: str
    email: EmailStr
    typing_profile_status: ProfileStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match.")
        return v
