# 14 — Viva Questions

Answers are written to be understandable by a BTech CSE audience and, where relevant,
point back to exactly where in this codebase the answer is implemented.

## Basic concepts

**Q: What is keystroke dynamics?**
A behavioral biometric that analyzes the timing pattern of a person's typing —
specifically how long keys are held and the gaps between key presses — to help
recognize who is typing.

**Q: What is behavioral biometrics, and how is it different from a physiological one?**
A physiological biometric identifies a physical trait (fingerprint, face, iris) that
mostly doesn't change. A behavioral biometric identifies a pattern in *how someone does
something* (typing, gait, signature) — it can drift over time and with context, which
is why this project treats it as a supporting signal, not a standalone lock (see
[docs/12_Limitations.md](12_Limitations.md)).

**Q: Why is typing behavior useful for authentication?**
Because a password can be copied, guessed, or shared, but the exact rhythm of *typing*
that password is a habitual motor pattern that is much harder to consciously and
consistently replicate — especially under the time pressure of a live login attempt.

**Q: What is dwell time?**
How long a single key is held down: keyup time minus keydown time for the same key.

**Q: What is flight time?**
The gap between releasing one key and pressing the next: next key's keydown time minus
previous key's keyup time. It can be negative if the next key is pressed before the
previous one is released ("rollover" typing) — this project keeps that sign rather than
clamping it to zero, because the overlap itself is informative.

**Q: What is an inter-key interval, and how is it different from flight time?**
It measures gaps between consecutive key *presses* (`down(k+1) − down(k)`), while
flight time measures the gap between a release and the next press
(`down(k+1) − up(k)`). Inter-key interval is always non-negative for in-order typing;
flight time can be negative.

## Machine learning

**Q: Why did you choose Random Forest?**
It is an ensemble of decision trees that handles small, noisy, tabular data well
without much tuning, resists overfitting better than a single deep tree (especially
depth-limited, as this project does with `max_depth=6`), and gives a natural
feature-importance ranking useful for explaining results.

**Q: What is SVM?**
A Support Vector Machine finds the decision boundary that maximizes the margin between
two classes. This project uses an RBF (radial basis function) kernel, which can find
non-linear boundaries, and wraps it in `CalibratedClassifierCV` to get well-calibrated
probability estimates (scikit-learn deprecated `SVC(probability=True)` directly).

**Q: What is classification?**
Predicting a discrete label (e.g. "genuine" vs. "impostor") for an input, as opposed to
regression, which predicts a continuous number.

**Q: What is training data vs. testing data?**
Training data is what a model learns its parameters from; testing data is held out,
never seen during training, and used only to measure how well the model generalizes to
new examples. This project splits at the session level (`train_test_split(...,
stratify=y)`) so a session is never partly in both sets.

**Q: What is overfitting?**
When a model learns the training data's specific noise and quirks rather than the
general pattern, so it performs well on training data but poorly on new data. This
project mitigates it by depth-limiting Random Forest, scaling features before SVM/
Logistic Regression, and always reporting cross-validation alongside a single
train/test split (a single split on a tiny dataset can look artificially good or bad by
chance).

**Q: What is feature extraction?**
Converting raw data (here, a list of keydown/keyup timestamps) into a fixed-length
numeric vector a machine-learning model can consume — in this project, 24 statistics
describing dwell time, flight time, inter-key interval, typing speed, and duration
(see [docs/08_Feature_Extraction.md](08_Feature_Extraction.md)).

**Q: What is accuracy?**
The fraction of predictions that were correct: `(TP + TN) / total`.

**Q: What is precision?**
Of everything predicted "genuine," the fraction that actually was: `TP / (TP + FP)`.

**Q: What is recall?**
Of everything that actually was "genuine," the fraction the model caught:
`TP / (TP + FN)`.

**Q: What is F1 score?**
The harmonic mean of precision and recall — a single number that penalizes models
which sacrifice one for the other. This project selects its active model by highest
F1 score (see [docs/09_Model_Evaluation.md](09_Model_Evaluation.md)).

## Security

**Q: Why not use only a password?**
Because a correct password proves possession of a secret but nothing about who is
entering it — it carries no behavioral information and gives the system no way to
notice unusual account activity at the point of login (see
[docs/02_Problem_Statement.md](02_Problem_Statement.md)).

**Q: Can someone imitate typing behavior?**
To some extent, especially with practice and knowledge of the target's timing
statistics — this project does not claim resistance to a dedicated, informed attacker
(see [docs/12_Limitations.md](12_Limitations.md)). It targets the more common case:
someone who has the right password but doesn't type like the account owner.

**Q: What happens if the user changes keyboard, or their typing changes over time?**
Their similarity score may drop, potentially triggering a "suspicious" or "failed"
result. This is a genuine, documented weakness of the modality. The system offers
`AUTH_ENFORCEMENT_MODE=advisory` (flag without blocking) as one mitigation, and
retraining/re-enrollment as another.

**Q: What are FAR and FRR?**
False Acceptance Rate is how often an impostor is wrongly accepted; False Rejection
Rate is how often the genuine user is wrongly rejected. They trade off against each
other via the decision threshold — see
[docs/09_Model_Evaluation.md](09_Model_Evaluation.md).

**Q: What are the limitations of this system?**
See [docs/12_Limitations.md](12_Limitations.md) in full — in short: small enrolled
datasets, typing-rhythm instability over time/context, no defense against a dedicated
mimicry attacker, physical-keyboard-only modeling, and no formal security audit.

**Q: How are passwords stored?**
Hashed with Argon2 via `passlib`, never in plaintext, never logged (see
[docs/10_Security.md](10_Security.md)).

## Architecture

**Q: Why React?**
A widely-used, component-based framework well-suited to the interactive, stateful UI
this project needs (live typing capture, charts, multi-step forms), with a large
ecosystem (React Router, Recharts) and strong TypeScript support for type safety across
API boundaries.

**Q: Why FastAPI?**
A modern Python web framework with native async support, automatic request validation
and OpenAPI documentation from Pydantic type hints, and a very direct, low-ceremony way
to write typed REST endpoints — a good fit for a Python-centric backend that also needs
to run the ML pipeline in-process.

**Q: Why Python for the ML parts?**
scikit-learn, pandas, and NumPy are the de facto standard, well-documented tools for
classical machine learning, with by far the largest ecosystem and community support —
there was no reason to reach for another language for this part of the system.

**Q: Why PostgreSQL (or why SQLite)?**
The project uses plain SQLAlchemy ORM with no PostgreSQL-specific column types, so it
runs unchanged on either. SQLite is the default because it needs no separate service —
"runs on a normal student machine with nothing extra installed." PostgreSQL is
supported via `docker-compose.yml` for anyone who wants to demonstrate or use a
production-realistic relational database.

**Q: How does the frontend talk to the backend?**
Over a REST API (JSON over HTTP), via an `axios` client (`frontend/src/services/api.ts`)
that attaches the JWT bearer token to authenticated requests. CORS is explicitly
configured to allow only the frontend's origin (see
[docs/10_Security.md](10_Security.md)).

**Q: Why did you separate `services/` from `api/`?**
So the actual decision logic (e.g. "is this login successful?") is plain, testable
Python functions with no dependency on the web framework, while the `api/` layer stays
a thin translation from HTTP request/response to those function calls. This is why the
project can unit-test `evaluate_login` and `extract_features` directly, without needing
to spin up an HTTP server for most of the test suite.
