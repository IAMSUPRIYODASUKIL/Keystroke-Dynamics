"""Unit tests for password hashing and JWT token handling."""
from app.security.passwords import hash_password, verify_password
from app.security.tokens import create_access_token, decode_access_token


def test_password_is_never_stored_as_plaintext():
    hashed = hash_password("correcthorse123")
    assert hashed != "correcthorse123"
    assert hashed.startswith("$argon2")


def test_verify_password_accepts_correct_and_rejects_incorrect():
    hashed = hash_password("correcthorse123")
    assert verify_password("correcthorse123", hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_verify_password_handles_malformed_hash_without_raising():
    assert verify_password("anything", "not-a-real-hash") is False


def test_access_token_round_trips_subject():
    token = create_access_token(subject="42")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "42"


def test_decode_rejects_tampered_token():
    token = create_access_token(subject="42")
    tampered = token[:-2] + ("aa" if token[-2:] != "aa" else "bb")
    assert decode_access_token(tampered) is None


def test_decode_rejects_garbage():
    assert decode_access_token("not.a.jwt") is None
