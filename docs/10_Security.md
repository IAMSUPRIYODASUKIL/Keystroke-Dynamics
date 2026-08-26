# 10 — Security

## Passwords

Passwords are hashed with **Argon2** (`passlib.context.CryptContext(schemes=["argon2"])`)
— the winner of the 2015 Password Hashing Competition and the current OWASP-recommended
default. Plaintext passwords are never logged, stored, or transmitted after the initial
HTTPS-protected registration/login request; `verify_password` compares hashes only and
returns `False` (never raises) on a malformed hash, so a corrupted record fails closed.

## Sessions

Authentication issues a **JWT** (`python-jose`, HS256) containing the user id as
`sub` and a server-configured expiry (`ACCESS_TOKEN_EXPIRE_MINUTES`). The token is
verified on every protected request (`security/dependencies.py::get_current_user`);
an invalid, expired, or tampered token is rejected with `401 Unauthorized` before any
route logic runs. The signing secret (`JWT_SECRET_KEY`) is read from the environment,
never hardcoded, and `.env.example` explicitly instructs generating a random value
rather than committing a real one.

## API input validation

Every request body is a Pydantic model (`app/schemas/*.py`) with explicit types and
constraints (e.g. minimum password length, email format via `EmailStr`) — FastAPI
rejects malformed requests with a structured `422` before the handler function is ever
called. Keystroke event validation happens twice: once loosely in the frontend for a
responsive UX, and once authoritatively on the backend
(`ml/feature_extraction.py::validate_and_pair`), which is the only validation that is
actually trusted for computing features or making a decision.

## Database access

All queries go through the SQLAlchemy ORM with parameter binding — there is no raw,
string-concatenated SQL anywhere in the codebase, which eliminates SQL injection as an
attack surface for this application's data access layer by construction.

## Not leaking information through error messages

- A login with a wrong password and a login with an unregistered email return the
  **same** generic message ("Incorrect email or password"), so the API cannot be used
  to enumerate which emails are registered.
- Unhandled server errors are caught by a global exception handler
  (`app/main.py::unhandled_exception_handler`) that logs the full traceback server-side
  but returns only a generic "unexpected server error" message to the client — stack
  traces are never exposed over the API.

## Secrets and configuration

All configuration that varies by deployment or is sensitive (database URL, JWT secret,
CORS origins, thresholds) is read from environment variables via `pydantic-settings`
(`app/core/config.py`), with `.env.example` documenting every variable and a real `.env`
excluded from version control by `.gitignore`. Nothing resembling a credential is
committed to the repository.

## Privacy of keystroke data

Keystroke dynamics is a **biometric-adjacent** data category, and is treated with
particular care:

- Capture is restricted, by design, to the one designated enrollment/verification field
  typing the fixed phrase — the browser hook never attaches to any other input in the
  application, so no other typed content (real passwords typed elsewhere, form fields,
  chat, etc.) is ever observed.
- Raw event timestamps stored (`TypingSample.raw_events`) are **relative** to the start
  of that one sample (`performance.now()`-based, zeroed at the first keystroke), not
  absolute wall-clock time — see `app/models/typing_sample.py`.
- A dedicated endpoint, `DELETE /api/profile/typing-data`, permanently deletes a user's
  collected typing samples, derived features, and trained models on request, without
  affecting their account or password. This is the only endpoint of its kind, and is
  exposed directly in the Dashboard UI.
- The UI's privacy notice (Landing/Enrollment pages) explains what is collected and why
  before the user is asked to type anything.

## CORS

The API restricts cross-origin requests to an explicit allow-list
(`CORS_ORIGINS`, default the local Vite dev server origin) rather than a wildcard,
configurable per deployment.

## What is explicitly out of scope

This project does not implement rate limiting, account lockout policies, anomaly-based
intrusion detection beyond the keystroke signal itself, or protection against a
sophisticated attacker who has captured detailed timing statistics about the target
user in advance. See [12_Limitations.md](12_Limitations.md).
