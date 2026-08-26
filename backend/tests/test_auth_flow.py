"""API tests for registration and login (app/api/auth.py)."""
from tests.conftest import make_phrase_events, register_user


def test_register_creates_account_and_returns_token(client):
    body = register_user(client, "Alice Genuine", "alice@example.com", "correcthorse123")
    assert body["access_token"]
    assert body["user"]["email"] == "alice@example.com"
    assert body["user"]["typing_profile_status"] == "not_started"


def test_register_rejects_duplicate_email(client):
    register_user(client, "Alice Genuine", "alice@example.com", "correcthorse123")
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Someone Else",
            "email": "alice@example.com",
            "password": "anotherpassword1",
            "confirm_password": "anotherpassword1",
        },
    )
    assert response.status_code == 409


def test_register_rejects_mismatched_passwords(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Alice",
            "email": "alice2@example.com",
            "password": "correcthorse123",
            "confirm_password": "somethingdifferent",
        },
    )
    assert response.status_code == 422


def test_register_rejects_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Alice",
            "email": "alice3@example.com",
            "password": "short",
            "confirm_password": "short",
        },
    )
    assert response.status_code == 422


def test_login_rejects_wrong_password_without_leaking_which_field_was_wrong(client):
    register_user(client, "Alice", "alice@example.com", "correcthorse123")
    response = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "wrongpassword", "events": []},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["decision"] == "failed"
    assert body["password_correct"] is False
    assert body["access_token"] is None
    assert body["user"] is None
    assert "incorrect" in body["message"].lower()


def test_login_rejects_unknown_email_with_same_generic_message(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "whatever12345", "events": []},
    )
    body = response.json()
    assert body["decision"] == "failed"
    assert body["password_correct"] is False


def test_login_with_correct_password_and_no_typing_profile_yet_succeeds(client):
    register_user(client, "Alice", "alice@example.com", "correcthorse123")
    response = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "correcthorse123", "events": []},
    )
    body = response.json()
    assert body["decision"] == "success"
    assert body["typing_evaluated"] is False


def test_login_rejects_invalid_keystroke_events(client):
    register_user(client, "Alice", "alice@example.com", "correcthorse123")
    bad_events = make_phrase_events(phrase="totally wrong text")
    response = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "correcthorse123", "events": bad_events},
    )
    body = response.json()
    assert body["decision"] == "failed"
    assert body["password_correct"] is True
    assert body["typing_evaluated"] is False
