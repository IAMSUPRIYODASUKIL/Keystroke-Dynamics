"""Shared pytest fixtures.

Sets up an isolated, file-based SQLite database for the whole test
session (fast, no external services required) and gives every test a
clean set of tables via drop_all/create_all — so tests never leak state
into each other regardless of execution order.
"""
import os
from pathlib import Path

_TEST_DB_PATH = Path(__file__).parent / "test_backend.db"

# Environment variables must be set BEFORE `app.core.config.settings` (and
# therefore `app.database.session.engine`) are first imported anywhere.
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"
os.environ["JWT_SECRET_KEY"] = "test-only-secret-do-not-use-in-production"
os.environ["AUTH_PHRASE"] = "My secure typing pattern is unique."
os.environ["MIN_ENROLLMENT_SAMPLES"] = "5"
os.environ["MIN_OTHER_USERS_FOR_ML"] = "1"
os.environ["MIN_IMPOSTOR_SAMPLES_PER_USER"] = "5"
os.environ["VERIFICATION_MATCH_THRESHOLD"] = "0.60"
os.environ["VERIFICATION_SUSPICIOUS_THRESHOLD"] = "0.40"
os.environ["AUTH_ENFORCEMENT_MODE"] = "strict"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.database.session import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True, scope="session")
def _cleanup_db_file():
    yield
    engine.dispose()  # release the sqlite file handle (required on Windows)
    if _TEST_DB_PATH.exists():
        try:
            _TEST_DB_PATH.unlink()
        except OSError:
            pass  # best-effort cleanup; a stray test db file is harmless


def make_phrase_events(
    phrase: str = settings.AUTH_PHRASE,
    dwell_ms: float = 90.0,
    flight_ms: float = 110.0,
    jitter: float = 0.0,
    seed: int = 0,
) -> list[dict]:
    """Build a synthetic-but-realistic list of keydown/keyup events for the
    given phrase, evenly spaced by the given dwell/flight timing."""
    import random

    rng = random.Random(seed)
    events = []
    t = 0.0
    for ch in phrase:
        down = t
        dwell = max(10.0, dwell_ms + (rng.uniform(-jitter, jitter) if jitter else 0.0))
        up = down + dwell
        events.append({"key": ch, "type": "keydown", "t": down})
        events.append({"key": ch, "type": "keyup", "t": up})
        flight = max(5.0, flight_ms + (rng.uniform(-jitter, jitter) if jitter else 0.0))
        t = up + flight
    return events


def register_user(client, name: str, email: str, password: str) -> dict:
    response = client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password, "confirm_password": password},
    )
    assert response.status_code == 201, response.text
    return response.json()


def enroll_samples(client, token: str, count: int, **timing_kwargs) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    last = None
    for i in range(count):
        events = make_phrase_events(seed=i, **timing_kwargs)
        response = client.post("/api/typing/enroll", json={"events": events}, headers=headers)
        assert response.status_code == 200, response.text
        last = response.json()
    return last
