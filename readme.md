# User Authentication Using Keystroke Dynamics and Machine Learning

> **Something you know → your password. Something about *how* you are → your typing rhythm.**

An end-to-end academic prototype that layers a behavioral biometric — keystroke dynamics —
on top of conventional password authentication, with a real machine-learning pipeline
behind it (not simulated scores). Built as a college mini-project, engineered to a
professional standard.

---

## Table of contents

1. [Abstract](#abstract)
2. [Problem statement](#problem-statement)
3. [Proposed solution](#proposed-solution)
4. [Features](#features)
5. [Architecture](#architecture)
6. [Technologies used](#technologies-used)
7. [How keystroke dynamics works](#how-keystroke-dynamics-works)
8. [Machine learning](#machine-learning)
9. [Dataset](#dataset)
10. [Evaluation](#evaluation)
11. [Installation](#installation)
12. [Environment variables](#environment-variables)
13. [Running the application](#running-the-application)
14. [Testing](#testing)
15. [API reference](#api-reference)
16. [Screenshots](#screenshots)
17. [Limitations](#limitations)
18. [Future improvements](#future-improvements)
19. [Academic disclaimer](#academic-disclaimer)

---

## Abstract

Password authentication verifies *something you know*. It says nothing about *who is
typing it*. This project demonstrates that the rhythm of a person's typing — how long
each key is held (**dwell time**), the gap between releasing one key and pressing the
next (**flight time**), overall **typing speed**, and the statistical shape of those
timings — carries a weak but genuine behavioral signature. The system captures that
signature during enrollment, trains classical machine-learning models (Random Forest,
SVM, Logistic Regression) to recognize it, and uses it as a second, behavioral check
during login, alongside — never instead of — the password.

## Problem statement

A correct password proves possession of a secret. It does not prove the secret wasn't
shared, guessed, phished, or reused from a breach. Passwords also give zero information
once entered: an attacker with the right string authenticates identically to the
legitimate owner. Purely password-based authentication has no way to notice "this
credential is right, but the way it was entered is unusual for this account."

## Proposed solution

Layer a behavioral biometric check on top of the password:

```
Login attempt
    │
    ├─► Password check  ─── wrong ───► FAILED (typing is not even evaluated)
    │        │ correct
    │        ▼
    ├─► Capture typing sample for a fixed phrase
    ├─► Extract dwell / flight / inter-key / speed features
    ├─► Score against the user's enrolled profile (ML model, or a
    │   statistical baseline before enough data exists to train one)
    ├─► Compare the score to a configurable threshold
    ▼
Authentication decision + risk level (low / medium / high)
```

The password remains the primary, mandatory factor. Typing behavior adds a secondary
signal that can flag "the right password, entered in a way this account has never been
entered before" — clearly explained to the end user, never presented as certainty.

## Features

- Registration, login, and session handling (Argon2 password hashing, JWT sessions)
- Browser-side keystroke capture restricted to a fixed enrollment phrase
- Real feature extraction: dwell time, flight time, inter-key interval, typing speed,
  total duration, and their mean / median / std / min / max / coefficient of variation
  / 25th–75th percentile
- A statistical (z-score / diagonal Mahalanobis) baseline verifier that works from the
  very first enrolled profile, before enough users exist to train a classifier
- Per-user binary verification models (Random Forest, SVM, Logistic Regression),
  trained on the enrolled user's samples vs. an impostor pool of other enrolled users
- A separate multi-user classification model ("which enrolled user does this sample
  resemble?") for demonstration and richer analytics
- Real evaluation: accuracy, precision, recall, F1, **False Acceptance Rate (FAR)**,
  **False Rejection Rate (FRR)**, cross-validation, confusion matrices, feature
  importance — every number computed from an actual training run
- A configurable authentication threshold and enforcement mode, documented and not
  hardcoded arbitrarily
- A full audit trail of login attempts (password result, typing result, risk, decision)
- A Demo Mode for live presentations: score a genuine vs. an impostor-style sample
  against your own profile without touching the real audit log
- A privacy control to delete your collected typing samples and trained model at any time
- A responsive, accessible, keyboard-first UI with a dark, professional aesthetic

## Architecture

```
project/
├── frontend/   React + TypeScript + Vite + Tailwind CSS SPA
├── backend/    FastAPI application (API, auth, keystroke processing, ML)
├── ml/         Model/dataset artifact storage (see ml/README.md)
├── docs/       Academic documentation set (14 files) + viva prep
└── docker-compose.yml   Optional PostgreSQL container
```

**Frontend** — captures keydown/keyup timing for the fixed phrase via a small custom
hook (`useKeystrokeCapture`), never relying on a native `<input>`'s value so no
IME/undo-stack fights the raw event stream; calls the backend REST API; renders the
dashboard, ML analytics, and security activity views with real charts (Recharts).

**Backend** — a layered FastAPI app: `api/` (routers) → `services/` (business logic) →
`ml/` (feature extraction, dataset building, training, inference) → `models/` (SQLAlchemy
ORM) → `database/` (engine/session). Feature extraction and the authentication decision
logic are framework-agnostic and unit-tested in isolation.

**Database** — a relational schema (`users`, `typing_samples`, `typing_features`,
`training_runs`, `model_versions`, `authentication_attempts`) via SQLAlchemy ORM,
running on SQLite by default (zero setup) or PostgreSQL (via `docker-compose.yml`) —
no dialect-specific features are used, so the same code runs on either unchanged.

**ML** — see [Machine learning](#machine-learning) below. Trained model artifacts are
persisted as `.joblib` files under `ml/saved_models/`, referenced from the
`model_versions` database table (which model, when, on what data, with what metrics).

## Technologies used

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Recharts, Vitest |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic, python-jose (JWT), Passlib (Argon2) |
| ML | scikit-learn, pandas, NumPy, joblib |
| Database | PostgreSQL (via Docker) or SQLite (default, zero setup) |
| Testing | pytest (backend/ML), Vitest + Testing Library (frontend) |

## How keystroke dynamics works

- **Dwell time** — how long a single key is held down: `keyup(k) − keydown(k)`.
- **Flight time** — the gap between releasing one key and pressing the next:
  `keydown(k+1) − keyup(k)`. Can be negative if keys overlap ("rollover" typing) —
  that overlap is itself a meaningful part of someone's rhythm, so it is kept, not
  clamped away.
- **Inter-key interval** — the gap between consecutive key *presses*:
  `keydown(k+1) − keydown(k)`. Always non-negative for in-order typing.
- **Typing speed** — characters typed per second of total session duration.
- **Typing rhythm** — the overall statistical shape (mean, spread, consistency) of the
  above measures across one full typing of the phrase.

See [docs/05_Keystroke_Dynamics.md](docs/05_Keystroke_Dynamics.md) and
[docs/08_Feature_Extraction.md](docs/08_Feature_Extraction.md) for the full detail,
including why this project uses session-level statistics rather than a per-character
positional vector.

## Machine learning

Three interpretable classical models are trained and compared for the **user
verification** task (binary: "is this the enrolled user, or an impostor?"):

1. **Random Forest** — an ensemble of decision trees; robust to noisy, small, non-linear
   tabular data and gives a natural feature-importance ranking.
2. **Support Vector Machine (RBF kernel)** — finds a maximum-margin boundary; strong
   with well-scaled numeric features. (Probability estimates come from
   `CalibratedClassifierCV`, replacing scikit-learn's now-deprecated
   `SVC(probability=True)`.)
3. **Logistic Regression** — a simple, well-calibrated linear baseline; useful for
   sanity-checking whether the more complex models are actually adding value.

The **positive class** is the enrolled user's own samples; the **negative class** is an
"impostor pool" of other enrolled users' samples. This means a personal ML model can
only be trained once *at least one other user* has enrolled enough samples — a real
constraint, not an oversight (see [Limitations](#limitations)). Until then, authentication
falls back to a statistical baseline (a diagonal-covariance Mahalanobis / normalized
z-score distance against the user's own enrolled mean/std, with a small-sample variance
floor) — always available from the very first profile.

A separate **global multi-class model** ("which enrolled user does this sample most
resemble?") is trained across every eligible user for the ML Analytics / demo page,
answering the "multi-user classification" half of the brief.

See [docs/06_Machine_Learning.md](docs/06_Machine_Learning.md) and
[docs/09_Model_Evaluation.md](docs/09_Model_Evaluation.md) for full detail on model
selection, the FAR/FRR trade-off, and how the authentication threshold was chosen.

## Dataset

Each row is one full typing **session** — never a fragment of one — so there is no way
for part of a session to leak across a train/test split. Sessions are split with
`train_test_split(..., stratify=y)` plus stratified k-fold cross-validation (k adapted
down when a class has very few samples). See [docs/07_Dataset.md](docs/07_Dataset.md).

## Evaluation

For every training run, all three models are evaluated on the same held-out split:

- **Accuracy, Precision, Recall, F1** (standard classification metrics)
- **False Acceptance Rate (FAR)** — impostor samples wrongly accepted as genuine
- **False Rejection Rate (FRR)** — genuine samples wrongly rejected
- A confusion matrix and (model-appropriate) feature importance

The active/deployed model is the one with the highest F1, tie-broken toward the lower
FAR — because for an authentication system, letting an impostor in is the costlier
mistake. See [docs/09_Model_Evaluation.md](docs/09_Model_Evaluation.md).

## Installation

Requires **Python 3.11+** and **Node.js 20+**. PostgreSQL/Docker are optional.

```bash
git clone <this-repository-url>
cd Keystroke-Dynamics

# --- Backend ---
cd backend
python -m venv .venv
source .venv/Scripts/activate      # Windows Git Bash / macOS / Linux: source .venv/bin/activate
pip install -r requirements.txt

# --- Frontend ---
cd ../frontend
npm install
```

## Environment variables

Copy the example files and adjust as needed — see inline comments for what each value
means and why its default was chosen:

```bash
cp .env.example .env                  # repo root — read by the backend
cp frontend/.env.example frontend/.env
```

Never commit a real `.env` file. `.env.example` documents every variable; secrets
(`JWT_SECRET_KEY`, database credentials) must be generated per-deployment.

## Running the application

```bash
# Terminal 1 — backend (from backend/, with .venv active)
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend (from frontend/)
npm run dev
```

Open **http://localhost:5173**. The backend defaults to a local SQLite file
(`backend/keystroke_auth.db`) — no database setup required. To use PostgreSQL instead:

```bash
docker compose up -d
# then set DATABASE_URL in .env to the postgresql+psycopg:// URL shown in .env.example
```

## Testing

```bash
# Backend: unit + API + ML tests (pytest)
cd backend
pytest -v

# Frontend: component + hook tests (Vitest)
cd frontend
npm test
```

## API reference

All endpoints are under `/api`. Interactive OpenAPI docs are served by FastAPI itself at
`http://localhost:8000/docs` once the backend is running.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create an account, returns a session token |
| POST | `/api/auth/login` | – | Password + typing-pattern verification |
| GET | `/api/public/config` | – | Enrollment phrase + minimum sample count |
| POST | `/api/typing/enroll` | ✓ | Submit one enrollment typing sample |
| POST | `/api/typing/verify-preview` | ✓ | Score a sample against your profile (Demo Mode) |
| GET | `/api/profile` | ✓ | Account + typing-profile + active-model summary |
| DELETE | `/api/profile/typing-data` | ✓ | Privacy control: delete typing samples + models |
| GET | `/api/authentication/history` | ✓ | This account's login attempt audit trail |
| POST | `/api/ml/train` | ✓ | (Re)train your personal verification model |
| POST | `/api/ml/train/global` | – | Train the multi-user classification model |
| GET | `/api/ml/status` | ✓ | Latest training run for your account |
| GET | `/api/ml/status/global` | – | Latest global multi-class training run |
| GET | `/api/ml/dataset-stats` | – | Aggregate dataset statistics |

## Screenshots

_Add screenshots of the Landing, Enrollment, Login, Dashboard, ML Analytics, and
Security Activity pages here before submission — e.g. `docs/screenshots/*.png`
referenced as `![Dashboard](docs/screenshots/dashboard.png)`._

## Limitations

This is a **prototype**, deliberately built and documented as one:

- **Small enrolled datasets.** A handful of enrollment samples per user (as configured,
  `MIN_ENROLLMENT_SAMPLES`) is nowhere near enough for a production-grade behavioral
  biometric — real deployments use many users, many sessions, over long time spans.
  Metrics like "100% accuracy" seen with 2 clearly distinct users on tiny samples reflect
  an easy toy split, not production-grade certainty; do not read them as such.
- **Typing rhythm is not stable over time or context.** Fatigue, injury, a different
  keyboard, or emotional state can shift someone's typing enough to be flagged — this
  is a documented, expected weakness of the modality, not a bug.
  `AUTH_ENFORCEMENT_MODE=advisory` exists specifically to soften this in a live
  deployment with a still-thin profile.
- **The statistical baseline is a fallback, not a replacement for trained ML.** It
  works from very few samples and is intentionally conservative (relative variance
  floor, median z-score aggregation) but is not as discriminative as a trained
  classifier with real impostor data.
- **Physical-keyboard assumption.** The signal this project models (discrete
  keydown/keyup timing) is designed around physical keyboards; touchscreen typing has
  very different dynamics and is out of scope here (see
  [docs/12_Limitations.md](docs/12_Limitations.md)).
- **Not a CAPTCHA or anti-automation system.** A sufficiently informed attacker who
  knows the enrolled user's timing statistics could attempt to mimic them; this project
  does not claim resistance to a targeted, well-resourced adversary.

## Future improvements

- Continuous authentication (scoring typing throughout a session, not just at login)
- Substantially larger, multi-session, multi-device datasets
- Deep learning approaches (e.g. sequence models) once enough data exists to support them
- Mobile/touchscreen keyboard behavioral modeling
- Adaptive profiles that evolve with a user's typing over time
- Combining with other factors (TOTP, WebAuthn) for genuine multi-factor authentication

## Academic disclaimer

This project is an educational / research implementation built for a college
mini-project. It demonstrates the *concept and pipeline* of behavioral-biometric
authentication with real, working machine learning — it is **not** a certified,
production-ready security product, has not undergone formal security auditing or
adversarial red-teaming, and should not be used to protect real accounts or sensitive
data. See [docs/12_Limitations.md](docs/12_Limitations.md) for the complete, honest
assessment of what this system does and does not prove.
