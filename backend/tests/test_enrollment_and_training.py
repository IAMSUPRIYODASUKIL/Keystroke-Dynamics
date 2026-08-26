"""API + ML tests for typing enrollment and model training
(app/api/typing.py, app/api/ml.py, app/ml/training.py, app/ml/dataset.py)."""
from app.core.config import settings
from tests.conftest import enroll_samples, make_phrase_events, register_user


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_enrollment_progress_and_readiness(client):
    user = register_user(client, "Alice", "alice@example.com", "correcthorse123")
    token = user["access_token"]

    for i in range(settings.MIN_ENROLLMENT_SAMPLES - 1):
        events = make_phrase_events(seed=i)
        response = client.post("/api/typing/enroll", json={"events": events}, headers=_headers(token))
        body = response.json()
        assert body["profile_status"] == "in_progress"
        assert body["ready_for_authentication"] is False

    final = enroll_samples(client, token, 1, dwell_ms=90, flight_ms=110)
    assert final["profile_status"] == "ready"
    assert final["ready_for_authentication"] is True
    assert final["samples_collected"] == settings.MIN_ENROLLMENT_SAMPLES


def test_enroll_rejects_phrase_mismatch(client):
    user = register_user(client, "Alice", "alice@example.com", "correcthorse123")
    events = make_phrase_events(phrase="not the right phrase")
    response = client.post(
        "/api/typing/enroll", json={"events": events}, headers=_headers(user["access_token"])
    )
    assert response.status_code == 400


def test_enroll_requires_authentication(client):
    events = make_phrase_events()
    response = client.post("/api/typing/enroll", json={"events": events})
    assert response.status_code == 401


def test_training_reports_insufficient_data_with_only_one_user(client):
    user = register_user(client, "Alice", "alice@example.com", "correcthorse123")
    token = user["access_token"]
    enroll_samples(client, token, settings.MIN_ENROLLMENT_SAMPLES, dwell_ms=90, flight_ms=110)

    response = client.post("/api/ml/train", headers=_headers(token))
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "insufficient_data"
    assert body["models"] == []


def test_training_produces_comparable_metrics_for_all_three_models(client):
    alice = register_user(client, "Alice", "alice@example.com", "correcthorse123")
    bob = register_user(client, "Bob", "bob@example.com", "differentpass456")

    enroll_samples(client, alice["access_token"], settings.MIN_ENROLLMENT_SAMPLES, dwell_ms=90, flight_ms=110)
    enroll_samples(client, bob["access_token"], settings.MIN_ENROLLMENT_SAMPLES, dwell_ms=200, flight_ms=260)

    response = client.post("/api/ml/train", headers=_headers(alice["access_token"]))
    body = response.json()

    assert body["status"] == "completed"
    model_types = {m["model_type"] for m in body["models"]}
    assert model_types == {"random_forest", "svm", "logistic_regression"}

    active_models = [m for m in body["models"] if m["is_active"]]
    assert len(active_models) == 1

    for model in body["models"]:
        for metric in ("accuracy", "precision", "recall", "f1_score", "far", "frr"):
            assert 0.0 <= model[metric] <= 1.0
        assert len(model["confusion_matrix"]) == 2
        assert len(model["feature_importance"]) > 0

    # Two very clearly distinct typing rhythms should be trivially separable.
    best = active_models[0]
    assert best["accuracy"] >= 0.7


def test_login_after_training_uses_ml_model_and_respects_threshold(client):
    alice = register_user(client, "Alice", "alice@example.com", "correcthorse123")
    bob = register_user(client, "Bob", "bob@example.com", "differentpass456")

    enroll_samples(client, alice["access_token"], settings.MIN_ENROLLMENT_SAMPLES, dwell_ms=90, flight_ms=110)
    enroll_samples(client, bob["access_token"], settings.MIN_ENROLLMENT_SAMPLES, dwell_ms=200, flight_ms=260)
    client.post("/api/ml/train", headers=_headers(alice["access_token"]))

    genuine_events = make_phrase_events(dwell_ms=90, flight_ms=110, seed=999)
    response = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "correcthorse123", "events": genuine_events},
    )
    body = response.json()
    assert body["decision"] == "success"
    assert body["method_used"] == "random_forest"
    assert body["similarity_score"] >= settings.VERIFICATION_MATCH_THRESHOLD

    impostor_style_events = make_phrase_events(dwell_ms=200, flight_ms=260, seed=998)
    response = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "correcthorse123", "events": impostor_style_events},
    )
    body = response.json()
    assert body["decision"] == "failed"
    assert body["risk_level"] == "high"


def test_global_multiclass_training_requires_two_users(client):
    alice = register_user(client, "Alice", "alice@example.com", "correcthorse123")
    enroll_samples(client, alice["access_token"], settings.MIN_ENROLLMENT_SAMPLES, dwell_ms=90, flight_ms=110)

    response = client.post("/api/ml/train/global")
    body = response.json()
    assert body["status"] == "insufficient_data"

    bob = register_user(client, "Bob", "bob@example.com", "differentpass456")
    enroll_samples(client, bob["access_token"], settings.MIN_ENROLLMENT_SAMPLES, dwell_ms=200, flight_ms=260)

    response = client.post("/api/ml/train/global")
    body = response.json()
    assert body["status"] == "completed"
    assert body["dataset_users"] == 2
