"""The core authentication decision: password check + typing-pattern
verification -> risk level -> final SUCCESS/FAILED decision.

See docs/09_Model_Evaluation.md and docs/10_Security.md for why the
thresholds are configurable values rather than hardcoded magic numbers.
"""
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.config import settings
from app.ml.feature_extraction import KeystrokeValidationError
from app.ml.inference import verify_typing_pattern
from app.models.authentication_attempt import AuthenticationAttempt
from app.models.enums import AuthDecision, ModelType, ProfileStatus, RiskLevel, SamplePurpose
from app.models.user import User
from app.services.keystroke_service import store_typing_sample


@dataclass
class AuthOutcome:
    decision: AuthDecision
    risk_level: RiskLevel
    password_correct: bool
    typing_evaluated: bool
    similarity_score: float | None
    similarity_label: str | None
    method_used: ModelType | None
    message: str
    user: User | None


def _similarity_label(score: float) -> str:
    if score >= settings.VERIFICATION_MATCH_THRESHOLD:
        return "High"
    if score >= settings.VERIFICATION_SUSPICIOUS_THRESHOLD:
        return "Medium"
    return "Low"


def _risk_level(score: float) -> RiskLevel:
    if score >= settings.VERIFICATION_MATCH_THRESHOLD:
        return RiskLevel.LOW
    if score >= settings.VERIFICATION_SUSPICIOUS_THRESHOLD:
        return RiskLevel.MEDIUM
    return RiskLevel.HIGH


def evaluate_login(db: Session, email: str, password: str, events: list[dict]) -> AuthOutcome:
    from app.services.user_service import authenticate_password

    user, password_correct = authenticate_password(db, email, password)

    if not password_correct:
        outcome = AuthOutcome(
            decision=AuthDecision.FAILED,
            risk_level=RiskLevel.UNKNOWN,
            password_correct=False,
            typing_evaluated=False,
            similarity_score=None,
            similarity_label=None,
            method_used=None,
            message="Incorrect email or password.",
            user=None,
        )
        _log_attempt(db, user, email, outcome)
        return outcome

    # Password correct — still capture the typing sample even without a
    # trained profile yet, so the sample can contribute to enrollment/
    # future verification and the audit log is complete either way.
    if not events:
        status = user.typing_profile_status
        decision = AuthDecision.SUCCESS  # password-only path; profile not established yet
        outcome = AuthOutcome(
            decision=decision, risk_level=RiskLevel.UNKNOWN, password_correct=True,
            typing_evaluated=False, similarity_score=None, similarity_label=None,
            method_used=None,
            message="Password correct. No typing sample was captured for this attempt.",
            user=user,
        )
        _log_attempt(db, user, email, outcome)
        return outcome

    try:
        typing_sample, features = store_typing_sample(db, user, events, SamplePurpose.VERIFICATION)
    except KeystrokeValidationError as exc:
        outcome = AuthOutcome(
            decision=AuthDecision.FAILED, risk_level=RiskLevel.UNKNOWN, password_correct=True,
            typing_evaluated=False, similarity_score=None, similarity_label=None, method_used=None,
            message=f"Typing capture was invalid: {exc}",
            user=None,
        )
        _log_attempt(db, user, email, outcome)
        return outcome

    if user.typing_profile_status != ProfileStatus.READY:
        # Profile not established yet — authenticate on password alone,
        # but still report the (currently uncalibrated) similarity for
        # transparency, and don't let it fail the login.
        outcome = AuthOutcome(
            decision=AuthDecision.SUCCESS, risk_level=RiskLevel.UNKNOWN, password_correct=True,
            typing_evaluated=False, similarity_score=None, similarity_label=None, method_used=None,
            message="Password correct. Typing profile is still being enrolled.",
            user=user,
        )
        _log_attempt(db, user, email, outcome, typing_sample_id=typing_sample.id)
        return outcome

    result = verify_typing_pattern(db, user.id, features.feature_vector)
    label = _similarity_label(result.similarity_score)
    risk = _risk_level(result.similarity_score)
    typing_matches = result.similarity_score >= settings.VERIFICATION_MATCH_THRESHOLD

    if typing_matches:
        decision = AuthDecision.SUCCESS
        message = "Password correct. Typing pattern matches your enrolled profile."
    elif settings.AUTH_ENFORCEMENT_MODE == "advisory":
        decision = AuthDecision.SUCCESS
        message = (
            "Password correct. Typing pattern differs from your enrolled profile "
            "(flagged for review, but not blocked in advisory mode)."
        )
    else:
        decision = AuthDecision.FAILED
        message = (
            "Password was correct, but the typing behavior differs significantly "
            "from the enrolled profile."
        )

    outcome = AuthOutcome(
        decision=decision, risk_level=risk, password_correct=True, typing_evaluated=True,
        similarity_score=result.similarity_score, similarity_label=label,
        method_used=result.method, message=message, user=user,
    )
    _log_attempt(
        db, user, email, outcome,
        typing_sample_id=typing_sample.id, model_version_id=result.model_version_id,
    )
    return outcome


def _log_attempt(
    db: Session, user: User | None, attempted_email: str, outcome: AuthOutcome,
    typing_sample_id: int | None = None, model_version_id: int | None = None,
) -> None:
    attempt = AuthenticationAttempt(
        user_id=user.id if user else None,
        attempted_email=attempted_email.lower().strip(),
        password_correct=outcome.password_correct,
        typing_sample_id=typing_sample_id,
        method_used=outcome.method_used,
        similarity_score=outcome.similarity_score,
        risk_level=outcome.risk_level,
        decision=outcome.decision,
        details={
            "similarity_label": outcome.similarity_label,
            "message": outcome.message,
            "enforcement_mode": settings.AUTH_ENFORCEMENT_MODE,
            "model_version_id": model_version_id,
        },
    )
    db.add(attempt)
    db.commit()
