# 11 — Testing

## Backend: 38 tests across 6 files (`backend/tests/`, pytest)

| File | Tests | Covers |
|---|---|---|
| `test_feature_extraction.py` | 7 | Event pairing, dwell/flight/inter-key arithmetic (including signed "rollover" flight time), phrase-length and character-mismatch rejection, key-repeat de-duplication |
| `test_security.py` | 6 | Argon2 password hashing (never plaintext, correct/incorrect verification, malformed-hash handling), JWT round-trip and rejection of tampered/garbage tokens |
| `test_statistical_verifier.py` | 4 | Similar samples score high, dissimilar samples score low, scores stay bounded to `[0, 1]` on extreme input, the zero-variance-dimension floor prevents divide-by-zero |
| `test_auth_flow.py` | 8 | Registration (success, duplicate email, password mismatch, short password), login (wrong password, unknown email, no-typing-profile-yet path, invalid keystroke events) — all via the real HTTP API |
| `test_enrollment_and_training.py` | 7 | Enrollment progress/readiness, phrase-mismatch rejection, auth requirement, insufficient-data training path, full 3-model training + metric sanity checks, threshold-respecting login after training, global multi-class training |
| `test_dashboard_and_activity.py` | 6 | Profile reflects enrollment state, attempt history ordering/totals, dataset-stats aggregation, privacy delete resets the profile without touching the account, public config endpoint, health check |

Run with:

```bash
cd backend
pytest -v
```

Each test gets a **fresh set of database tables** (`Base.metadata.drop_all` +
`create_all` around every test function, see `tests/conftest.py`), so tests never leak
state into each other regardless of execution order — no shared fixtures, no ordering
dependencies.

### What "ML tests" means here

There is no separate "ML-only" test file, because the ML pipeline is exercised through
the same real API used by the frontend (`test_enrollment_and_training.py`): registering
two users with deliberately distinct synthetic typing rhythms, enrolling both, training,
and asserting the metrics returned are within valid ranges (`0.0–1.0` for every rate
metric), that all three model types are present and comparable, that exactly one model
is marked active, and that a login attempt matching the enrolled rhythm succeeds while
one matching the *other* user's rhythm is rejected with high risk. This tests the
pipeline as an integrated whole — preprocessing, training, evaluation, and inference —
rather than mocking pieces of it.

## Frontend: 9 tests across 3 files (`frontend/src/**/*.test.{ts,tsx}`, Vitest + Testing Library)

| File | Tests | Covers |
|---|---|---|
| `hooks/useKeystrokeCapture.test.ts` | 4 | Paired keydown/keyup recording and completion, key-repeat is ignored, a mismatched character flags then auto-resets the sample, Backspace resets rather than corrects |
| `components/Badge.test.tsx` | 3 | Risk and decision badges render the correct human-readable label for each state |
| `utils/format.test.ts` | 2 | Percentage and millisecond formatting helpers |

Run with:

```bash
cd frontend
npm test
```

The keystroke-capture hook — the single most important, most bug-prone piece of
frontend logic in this project — is tested directly via `@testing-library/react`'s
`renderHook`, dispatching synthetic key events and asserting on the hook's returned
state, independent of any rendered component.

## A real bug this test suite (and manual end-to-end testing) actually caught

While manually driving the full application through a real browser during development,
a genuine typing sample from the enrolled user was flagged as a mismatch by the
statistical baseline verifier, even though nothing about the typing was actually
unusual. Investigation traced it to exactly the small-sample brittleness described in
[09_Model_Evaluation.md](09_Model_Evaluation.md) — a couple of feature dimensions with
near-zero variance in an 8-sample enrollment were dominating a naive mean-of-z-scores
aggregate. The fix (a relative variance floor and median aggregation) is now covered by
`test_statistical_verifier.py::test_zero_variance_dimension_does_not_cause_division_errors`
and re-verified end-to-end in `test_enrollment_and_training.py`. This is left documented
deliberately, as an honest example of small-sample behavioral-biometric systems needing
active robustness work, not just a model and a formula.

## Manual verification performed

Beyond the automated suite, the complete user journey — register → enroll (8 samples,
two accounts with deliberately different typing rhythms) → auto-triggered training →
genuine login (success) → impostor-style login on the same account (failed, high risk)
→ manual retrain → dashboard, ML Analytics, Security Activity, and Demo Mode pages —
was driven end-to-end through a real, running frontend and backend in an actual browser,
confirming the pipeline works outside of test mocks as well as within them.
