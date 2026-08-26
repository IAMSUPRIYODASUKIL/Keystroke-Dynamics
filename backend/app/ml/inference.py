"""Load a persisted model and score a single login-time typing sample
against it. Falls back to the statistical baseline verifier when no
trained ML model is active yet for the user (see
app/ml/statistical_verifier.py for why that is a real fallback, not a
stub)."""
from dataclasses import dataclass

import joblib
from sqlalchemy.orm import Session

from app.ml.statistical_verifier import fit_statistical_profile, statistical_similarity
from app.models.enums import ModelType
from app.models.model_version import ModelVersion


@dataclass
class VerificationResult:
    method: ModelType
    similarity_score: float
    model_version_id: int | None = None


_model_cache: dict[str, object] = {}


def _load_pipeline(file_path: str):
    if file_path not in _model_cache:
        _model_cache[file_path] = joblib.load(file_path)
    return _model_cache[file_path]


def verify_typing_pattern(db: Session, user_id: int, feature_vector: list[float]) -> VerificationResult:
    active_model = (
        db.query(ModelVersion)
        .filter(ModelVersion.user_id == user_id, ModelVersion.is_active.is_(True))
        .order_by(ModelVersion.created_at.desc())
        .first()
    )

    if active_model is not None:
        try:
            pipeline = _load_pipeline(active_model.file_path)
            proba = pipeline.predict_proba([feature_vector])[0]
            # Class labels are [0, 1]; index 1 = "genuine".
            classes = list(pipeline.named_steps["model"].classes_)
            genuine_idx = classes.index(1)
            score = float(proba[genuine_idx])
            return VerificationResult(
                method=active_model.model_type, similarity_score=score,
                model_version_id=active_model.id,
            )
        except Exception:
            pass  # fall through to the statistical baseline below

    # No trained ML model yet (or it failed to load) — statistical fallback.
    positive_vectors = _enrollment_vectors_only(db, user_id)
    if len(positive_vectors) < 2:
        # Not even enough samples for a std-dev — treat as unknown/neutral.
        return VerificationResult(method=ModelType.STATISTICAL, similarity_score=0.5)

    profile = fit_statistical_profile(positive_vectors)
    score = statistical_similarity(profile, feature_vector)
    return VerificationResult(method=ModelType.STATISTICAL, similarity_score=score)


def _enrollment_vectors_only(db: Session, user_id: int) -> list[list[float]]:
    from app.models.enums import SamplePurpose
    from app.models.typing_feature import TypingFeature
    from app.models.typing_sample import TypingSample

    rows = (
        db.query(TypingFeature)
        .join(TypingSample, TypingFeature.sample_id == TypingSample.id)
        .filter(
            TypingFeature.user_id == user_id,
            TypingSample.purpose == SamplePurpose.ENROLLMENT,
        )
        .all()
    )
    return [r.feature_vector for r in rows]
