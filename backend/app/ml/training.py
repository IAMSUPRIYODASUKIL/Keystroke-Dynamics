"""Model training orchestration: split, cross-validate, evaluate, persist.

Trains all three candidate models (Random Forest, SVM, Logistic
Regression) on the same split so their metrics are directly comparable,
then marks the model with the highest F1 score (tie-broken by the lower
False Acceptance Rate, since accepting an impostor is the costlier
mistake for an authentication system) as active.
"""
import time
from pathlib import Path

import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sqlalchemy.orm import Session

from app.ml.dataset import (
    RANDOM_SEED,
    build_global_multiclass_dataset,
    build_user_verification_dataset,
)
from app.ml.evaluation import compute_feature_importance, evaluate_binary, evaluate_multiclass
from app.models.enums import ModelType, TrainingScope, TrainingStatus
from app.models.model_version import ModelVersion
from app.models.training_run import TrainingRun
from datetime import datetime, timezone

SAVED_MODELS_DIR = Path(__file__).resolve().parents[3] / "ml" / "saved_models"

_MODEL_TYPES = [ModelType.RANDOM_FOREST, ModelType.SVM, ModelType.LOGISTIC_REGRESSION]


def _build_pipeline(model_type: ModelType) -> Pipeline:
    if model_type == ModelType.RANDOM_FOREST:
        model = RandomForestClassifier(
            n_estimators=200, max_depth=6, random_state=RANDOM_SEED, class_weight="balanced"
        )
    elif model_type == ModelType.SVM:
        # SVC's own `probability=True` is deprecated (scikit-learn 1.9+) in
        # favor of wrapping with CalibratedClassifierCV. cv=3 (rather than
        # the default 5) is chosen so calibration still works with the
        # small per-class sample counts typical of this project (as few as
        # MIN_ENROLLMENT_SAMPLES per class) — see docs/09_Model_Evaluation.md.
        base_svc = SVC(kernel="rbf", C=1.0, random_state=RANDOM_SEED, class_weight="balanced")
        model = CalibratedClassifierCV(base_svc, method="sigmoid", cv=3, ensemble=False)
    elif model_type == ModelType.LOGISTIC_REGRESSION:
        model = LogisticRegression(max_iter=2000, C=1.0, class_weight="balanced", random_state=RANDOM_SEED)
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    return Pipeline([("scaler", StandardScaler()), ("model", model)])


def _cross_validate(model_type: ModelType, X: np.ndarray, y: np.ndarray) -> tuple[float, float]:
    min_class_count = int(np.min(np.bincount(y)))
    n_splits = max(2, min(5, min_class_count))
    if min_class_count < 2 or len(y) < n_splits * 2:
        return 0.0, 0.0
    try:
        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=RANDOM_SEED)
        scores = cross_val_score(_build_pipeline(model_type), X, y, cv=cv, scoring="accuracy")
        return float(scores.mean()), float(scores.std())
    except ValueError:
        return 0.0, 0.0


def _save_model(pipeline: Pipeline, scope_dir: str, model_type: ModelType, run_id: int) -> Path:
    directory = SAVED_MODELS_DIR / scope_dir
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{model_type.value}_run{run_id}_{int(time.time())}.joblib"
    joblib.dump(pipeline, path)
    return path


def train_user_verification_model(db: Session, user_id: int) -> TrainingRun:
    dataset = build_user_verification_dataset(db, user_id)

    run = TrainingRun(
        scope=TrainingScope.USER_VERIFICATION,
        user_id=user_id,
        status=TrainingStatus.RUNNING,
        dataset_samples=dataset.positive_count + dataset.negative_count,
        dataset_users=1 + dataset.negative_user_count,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    if dataset.insufficient_reason:
        run.status = TrainingStatus.INSUFFICIENT_DATA
        run.message = dataset.insufficient_reason
        run.completed_at = datetime.now(timezone.utc)
        db.commit()
        return run

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            dataset.X, dataset.y, test_size=0.25, stratify=dataset.y, random_state=RANDOM_SEED
        )

        candidates = []
        for model_type in _MODEL_TYPES:
            try:
                pipeline = _build_pipeline(model_type)
                pipeline.fit(X_train, y_train)
                metrics = evaluate_binary(pipeline, X_test, y_test)
                cv_mean, cv_std = _cross_validate(model_type, dataset.X, dataset.y)
                importance = compute_feature_importance(
                    pipeline, model_type.value, X_test, y_test, dataset.feature_names
                )
                candidates.append({
                    "model_type": model_type, "pipeline": pipeline, "metrics": metrics,
                    "cv_mean": cv_mean, "cv_std": cv_std, "importance": importance,
                })
            except Exception as exc:  # noqa: BLE001 — one model failing shouldn't kill the run
                candidates.append({"model_type": model_type, "error": str(exc)})

        successful = [c for c in candidates if "error" not in c]
        if not successful:
            run.status = TrainingStatus.FAILED
            run.message = "All candidate models failed to train."
            run.completed_at = datetime.now(timezone.utc)
            db.commit()
            return run

        best = max(successful, key=lambda c: (c["metrics"]["f1_score"], -c["metrics"]["far"]))

        # Deactivate any previously active model for this user/scope.
        db.query(ModelVersion).filter(
            ModelVersion.user_id == user_id, ModelVersion.is_active.is_(True)
        ).update({"is_active": False})

        for c in successful:
            path = _save_model(c["pipeline"], f"user_{user_id}", c["model_type"], run.id)
            db.add(ModelVersion(
                training_run_id=run.id,
                user_id=user_id,
                model_type=c["model_type"],
                file_path=str(path),
                is_active=(c["model_type"] == best["model_type"]),
                accuracy=c["metrics"]["accuracy"],
                precision=c["metrics"]["precision"],
                recall=c["metrics"]["recall"],
                f1_score=c["metrics"]["f1_score"],
                far=c["metrics"]["far"],
                frr=c["metrics"]["frr"],
                cv_accuracy_mean=c["cv_mean"],
                cv_accuracy_std=c["cv_std"],
                metrics_json={
                    "confusion_matrix": c["metrics"]["confusion_matrix"],
                    "confusion_matrix_labels": c["metrics"]["confusion_matrix_labels"],
                    "feature_importance": c["importance"],
                    "feature_names": dataset.feature_names,
                },
            ))

        run.status = TrainingStatus.COMPLETED
        run.best_model_type = best["model_type"].value
        run.completed_at = datetime.now(timezone.utc)
        run.message = (
            f"Trained on {dataset.positive_count} genuine + {dataset.negative_count} "
            f"impostor samples from {dataset.negative_user_count} other user(s)."
        )
        db.commit()
        return run

    except Exception as exc:  # noqa: BLE001
        run.status = TrainingStatus.FAILED
        run.message = f"Training failed: {exc}"
        run.completed_at = datetime.now(timezone.utc)
        db.commit()
        return run


def train_global_multiclass_model(db: Session) -> TrainingRun:
    dataset = build_global_multiclass_dataset(db)

    run = TrainingRun(
        scope=TrainingScope.GLOBAL_MULTICLASS,
        user_id=None,
        status=TrainingStatus.RUNNING,
        dataset_samples=dataset.sample_count,
        dataset_users=dataset.user_count,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    if dataset.insufficient_reason:
        run.status = TrainingStatus.INSUFFICIENT_DATA
        run.message = dataset.insufficient_reason
        run.completed_at = datetime.now(timezone.utc)
        db.commit()
        return run

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            dataset.X, dataset.y, test_size=0.25, stratify=dataset.y, random_state=RANDOM_SEED
        )

        candidates = []
        for model_type in _MODEL_TYPES:
            try:
                pipeline = _build_pipeline(model_type)
                pipeline.fit(X_train, y_train)
                metrics = evaluate_multiclass(pipeline, X_test, y_test, dataset.label_names)
                cv_mean, cv_std = _cross_validate(model_type, dataset.X, dataset.y)
                importance = compute_feature_importance(
                    pipeline, model_type.value, X_test, y_test, dataset.feature_names
                )
                candidates.append({
                    "model_type": model_type, "pipeline": pipeline, "metrics": metrics,
                    "cv_mean": cv_mean, "cv_std": cv_std, "importance": importance,
                })
            except Exception as exc:  # noqa: BLE001
                candidates.append({"model_type": model_type, "error": str(exc)})

        successful = [c for c in candidates if "error" not in c]
        if not successful:
            run.status = TrainingStatus.FAILED
            run.message = "All candidate models failed to train."
            run.completed_at = datetime.now(timezone.utc)
            db.commit()
            return run

        best = max(successful, key=lambda c: c["metrics"]["f1_score"])

        db.query(ModelVersion).filter(
            ModelVersion.user_id.is_(None), ModelVersion.is_active.is_(True)
        ).update({"is_active": False})

        for c in successful:
            path = _save_model(c["pipeline"], "global", c["model_type"], run.id)
            db.add(ModelVersion(
                training_run_id=run.id,
                user_id=None,
                model_type=c["model_type"],
                file_path=str(path),
                is_active=(c["model_type"] == best["model_type"]),
                accuracy=c["metrics"]["accuracy"],
                precision=c["metrics"]["precision"],
                recall=c["metrics"]["recall"],
                f1_score=c["metrics"]["f1_score"],
                far=c["metrics"]["far"],
                frr=c["metrics"]["frr"],
                cv_accuracy_mean=c["cv_mean"],
                cv_accuracy_std=c["cv_std"],
                metrics_json={
                    "confusion_matrix": c["metrics"]["confusion_matrix"],
                    "confusion_matrix_labels": c["metrics"]["confusion_matrix_labels"],
                    "feature_importance": c["importance"],
                    "feature_names": dataset.feature_names,
                    "label_names": dataset.label_names,
                },
            ))

        run.status = TrainingStatus.COMPLETED
        run.best_model_type = best["model_type"].value
        run.completed_at = datetime.now(timezone.utc)
        run.message = f"Trained across {dataset.user_count} users, {dataset.sample_count} samples."
        db.commit()
        return run

    except Exception as exc:  # noqa: BLE001
        run.status = TrainingStatus.FAILED
        run.message = f"Training failed: {exc}"
        run.completed_at = datetime.now(timezone.utc)
        db.commit()
        return run
