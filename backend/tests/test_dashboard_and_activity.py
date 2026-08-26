"""API tests for profile, authentication history, dataset stats, and the
privacy (delete typing data) control."""
from app.core.config import settings
from tests.conftest import enroll_samples, make_phrase_events, register_user


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_profile_reflects_enrollment_progress(client):
    user = register_user(client, "Alice", "alice@example.com", "correcthorse123")
    token = user["access_token"]

    response = client.get("/api/profile", headers=_headers(token))
    body = response.json()
    assert body["samples_collected"] == 0
    assert body["active_model"] is None
    assert body["auth_phrase"] == settings.AUTH_PHRASE

    enroll_samples(client, token, settings.MIN_ENROLLMENT_SAMPLES)
    response = client.get("/api/profile", headers=_headers(token))
    body = response.json()
    assert body["samples_collected"] == settings.MIN_ENROLLMENT_SAMPLES
    assert body["user"]["typing_profile_status"] == "ready"


def test_authentication_history_records_attempts_in_order(client):
    user = register_user(client, "Alice", "alice@example.com", "correcthorse123")
    token = user["access_token"]

    client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "wrongpassword", "events": []},
    )
    client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "correcthorse123", "events": []},
    )

    response = client.get("/api/authentication/history", headers=_headers(token))
    body = response.json()
    assert len(body["attempts"]) == 2
    assert body["total_success"] == 1
    assert body["total_failed"] == 1
    # Most recent attempt first.
    assert body["attempts"][0]["password_correct"] is True
    assert body["attempts"][1]["password_correct"] is False


def test_dataset_stats_aggregate_across_users(client):
    alice = register_user(client, "Alice", "alice@example.com", "correcthorse123")
    bob = register_user(client, "Bob", "bob@example.com", "differentpass456")
    enroll_samples(client, alice["access_token"], settings.MIN_ENROLLMENT_SAMPLES)
    enroll_samples(client, bob["access_token"], 2)

    response = client.get("/api/ml/dataset-stats")
    body = response.json()
    assert body["total_users"] == 2
    assert body["users_ready"] == 1
    assert body["total_samples"] == settings.MIN_ENROLLMENT_SAMPLES + 2
    assert body["samples_per_user"]["Alice"] == settings.MIN_ENROLLMENT_SAMPLES
    assert body["samples_per_user"]["Bob"] == 2


def test_delete_typing_data_resets_profile_but_keeps_account(client):
    user = register_user(client, "Alice", "alice@example.com", "correcthorse123")
    token = user["access_token"]
    enroll_samples(client, token, settings.MIN_ENROLLMENT_SAMPLES)

    response = client.delete("/api/profile/typing-data", headers=_headers(token))
    assert response.status_code == 204

    profile = client.get("/api/profile", headers=_headers(token)).json()
    assert profile["samples_collected"] == 0
    assert profile["user"]["typing_profile_status"] == "not_started"

    # Password/account still work.
    login = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "correcthorse123", "events": []},
    ).json()
    assert login["decision"] == "success"


def test_public_config_exposes_phrase_without_authentication(client):
    response = client.get("/api/public/config")
    assert response.status_code == 200
    body = response.json()
    assert body["auth_phrase"] == settings.AUTH_PHRASE
    assert body["min_enrollment_samples"] == settings.MIN_ENROLLMENT_SAMPLES


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
