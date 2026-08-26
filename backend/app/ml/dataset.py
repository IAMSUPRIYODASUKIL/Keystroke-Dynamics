"""Build ML-ready datasets from the database.

Each row is one full typing SESSION (one TypingSample + its TypingFeature).
Because a session is never split across rows, there is no way for part of
one session to leak into both the train and test split — the leakage risk
called out in the project brief simply cannot occur at this granularity.
"""
from dataclasses import dataclass

import numpy as np
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import SamplePurpose
from app.models.typing_feature import TypingFeature
from app.models.typing_sample import TypingSample
from app.models.user import User

# Fixed random seed used anywhere sampling/shuffling happens in the ML
# pipeline, so that a training run is reproducible given the same data.
RANDOM_SEED = 42


@dataclass
class VerificationDataset:
    X: np.ndarray
    y: np.ndarray
    feature_names: list[str]
    positive_count: int
    negative_count: int
    negative_user_count: int
    insufficient_reason: str | None = None


def _user_enrollment_features(db: Session, user_id: int) -> list[TypingFeature]:
    return (
        db.query(TypingFeature)
        .join(TypingSample, TypingFeature.sample_id == TypingSample.id)
        .filter(
            TypingFeature.user_id == user_id,
            TypingSample.purpose == SamplePurpose.ENROLLMENT,
            TypingSample.used_for_training.is_(True),
        )
        .all()
    )


def build_user_verification_dataset(db: Session, user_id: int) -> VerificationDataset:
    """Binary dataset for "does this sample belong to user X": positive
    class = the user's own enrollment samples, negative class = other
    enrolled users' samples (an impostor pool)."""
    positive_rows = _user_enrollment_features(db, user_id)
    feature_names = positive_rows[0].feature_names if positive_rows else []

    if len(positive_rows) < settings.MIN_ENROLLMENT_SAMPLES:
        return VerificationDataset(
            X=np.empty((0, 0)), y=np.empty((0,)), feature_names=feature_names,
            positive_count=len(positive_rows), negative_count=0, negative_user_count=0,
            insufficient_reason=(
                f"User has {len(positive_rows)} enrollment samples; "
                f"{settings.MIN_ENROLLMENT_SAMPLES} required."
            ),
        )

    other_users = db.query(User).filter(User.id != user_id).all()
    negative_by_user: dict[int, list[TypingFeature]] = {}
    for other in other_users:
        rows = _user_enrollment_features(db, other.id)
        if len(rows) >= settings.MIN_IMPOSTOR_SAMPLES_PER_USER:
            negative_by_user[other.id] = rows

    if len(negative_by_user) < settings.MIN_OTHER_USERS_FOR_ML:
        return VerificationDataset(
            X=np.empty((0, 0)), y=np.empty((0,)), feature_names=feature_names,
            positive_count=len(positive_rows), negative_count=0,
            negative_user_count=len(negative_by_user),
            insufficient_reason=(
                f"Only {len(negative_by_user)} other user(s) have enough samples "
                f"to serve as impostor data; {settings.MIN_OTHER_USERS_FOR_ML} required. "
                "Enroll more users, or rely on the statistical baseline verifier."
            ),
        )

    # Cap the negative pool so one prolific "other user" can't dominate the
    # class balance: sample evenly across other users, up to 3x positives.
    rng = np.random.default_rng(RANDOM_SEED)
    max_negatives = max(len(positive_rows) * 3, 20)
    negative_rows: list[TypingFeature] = []
    per_user_cap = max(1, max_negatives // len(negative_by_user))
    for rows in negative_by_user.values():
        idx = rng.choice(len(rows), size=min(per_user_cap, len(rows)), replace=False)
        negative_rows.extend(rows[i] for i in idx)

    X = np.array([r.feature_vector for r in positive_rows + negative_rows], dtype=float)
    y = np.array([1] * len(positive_rows) + [0] * len(negative_rows), dtype=int)

    return VerificationDataset(
        X=X, y=y, feature_names=feature_names,
        positive_count=len(positive_rows), negative_count=len(negative_rows),
        negative_user_count=len(negative_by_user),
    )


@dataclass
class MulticlassDataset:
    X: np.ndarray
    y: np.ndarray
    feature_names: list[str]
    label_names: list[str]  # index-aligned with the integer labels in y
    user_count: int
    sample_count: int
    insufficient_reason: str | None = None


def build_global_multiclass_dataset(db: Session) -> MulticlassDataset:
    """"Which enrolled user does this sample resemble?" dataset — every
    enrolled user with enough samples becomes one class."""
    users = db.query(User).all()
    eligible: list[User] = []
    rows_by_user: dict[int, list[TypingFeature]] = {}
    for u in users:
        rows = _user_enrollment_features(db, u.id)
        if len(rows) >= settings.MIN_ENROLLMENT_SAMPLES:
            eligible.append(u)
            rows_by_user[u.id] = rows

    if len(eligible) < 2:
        return MulticlassDataset(
            X=np.empty((0, 0)), y=np.empty((0,)), feature_names=[], label_names=[],
            user_count=len(eligible), sample_count=0,
            insufficient_reason=(
                f"Only {len(eligible)} user(s) have completed enrollment; at least 2 "
                "are required to demonstrate multi-user classification."
            ),
        )

    feature_names = next(iter(rows_by_user.values()))[0].feature_names
    label_names = [u.name for u in eligible]
    X_list, y_list = [], []
    for label_idx, u in enumerate(eligible):
        for row in rows_by_user[u.id]:
            X_list.append(row.feature_vector)
            y_list.append(label_idx)

    return MulticlassDataset(
        X=np.array(X_list, dtype=float), y=np.array(y_list, dtype=int),
        feature_names=feature_names, label_names=label_names,
        user_count=len(eligible), sample_count=len(y_list),
    )
