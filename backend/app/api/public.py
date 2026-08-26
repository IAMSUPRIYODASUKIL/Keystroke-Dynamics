from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/config")
def public_config() -> dict:
    """Non-sensitive configuration the frontend needs before a user is
    authenticated (e.g. the login page needs to know the enrollment
    phrase to render the typing-capture box)."""
    return {
        "auth_phrase": settings.AUTH_PHRASE,
        "min_enrollment_samples": settings.MIN_ENROLLMENT_SAMPLES,
    }
