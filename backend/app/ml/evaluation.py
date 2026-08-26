"""Evaluation metrics shared by the training pipeline.

FAR/FRR are defined the standard way for a verification (binary) task,
where class 1 = "genuine user" and class 0 = "impostor":
    False Acceptance Rate (FAR) = impostors wrongly accepted / total impostors
    False Rejection Rate (FRR)  = genuine users wrongly rejected / total genuine
"""
import numpy as np
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)


def evaluate_binary(pipeline, X_test: np.ndarray, y_test: np.ndarray) -> dict:
    y_pred = pipeline.predict(X_test)
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()

    far = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    frr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    return {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, pos_label=1, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, pos_label=1, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, pos_label=1, zero_division=0)),
        "far": far,
        "frr": frr,
        "confusion_matrix": cm.tolist(),  # [[tn, fp], [fn, tp]]
        "confusion_matrix_labels": ["impostor (0)", "genuine (1)"],
    }


def evaluate_multiclass(pipeline, X_test: np.ndarray, y_test: np.ndarray, label_names: list[str]) -> dict:
    y_pred = pipeline.predict(X_test)
    cm = confusion_matrix(y_test, y_pred, labels=list(range(len(label_names))))

    return {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, average="macro", zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, average="macro", zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, average="macro", zero_division=0)),
        "far": 0.0,
        "frr": 0.0,
        "confusion_matrix": cm.tolist(),
        "confusion_matrix_labels": label_names,
    }


def compute_feature_importance(
    pipeline, model_type: str, X_test: np.ndarray, y_test: np.ndarray, feature_names: list[str]
) -> list[dict]:
    """Best-effort feature importance, computed the appropriate way per
    model family. Returned sorted by descending importance."""
    model = pipeline.named_steps["model"]

    if model_type == "random_forest":
        importances = model.feature_importances_
    elif model_type == "logistic_regression":
        coef = model.coef_[0] if model.coef_.ndim > 1 and model.coef_.shape[0] == 1 else model.coef_
        importances = np.abs(coef).mean(axis=0) if coef.ndim > 1 else np.abs(coef)
    else:
        # SVM (and anything without a native importance) — permutation
        # importance works model-agnostically but costs extra predictions.
        try:
            result = permutation_importance(
                pipeline, X_test, y_test, n_repeats=10, random_state=42, n_jobs=1
            )
            importances = result.importances_mean
        except Exception:
            importances = np.zeros(len(feature_names))

    importances = np.asarray(importances, dtype=float)
    total = float(np.sum(np.abs(importances))) or 1.0
    ranked = sorted(
        (
            {"feature": name, "importance": float(abs(val) / total)}
            for name, val in zip(feature_names, importances)
        ),
        key=lambda d: d["importance"],
        reverse=True,
    )
    return ranked
