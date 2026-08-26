# 06 — Machine Learning

## Framing the problem: verification, not identification

There are two different ML problems keystroke dynamics can address:

- **Identification (multi-class):** "Given a typing sample, which of N known users
  wrote it?" — useful for research and demonstration, but unrealistic for login,
  since real authentication starts from a claimed identity (the email address), not a
  blank slate.
- **Verification (binary, one-vs-rest):** "Given a typing sample and a *claimed*
  identity, does this sample belong to that specific person, or not?" — this is what an
  actual login needs, and is what this project uses for the primary authentication path.

`app/ml/dataset.py` builds a binary dataset per user: the claimed user's own enrollment
samples are the **positive class (1)**; a pool of other enrolled users' samples is the
**negative class (0)**, i.e. an "impostor" reference. This means a personal verification
model can only be trained once at least one *other* user has enrolled enough samples
(`MIN_OTHER_USERS_FOR_ML`, `MIN_IMPOSTOR_SAMPLES_PER_USER`) — a real, disclosed
cold-start constraint, not an oversight. `app/ml/training.py` also trains a
**global multi-class model** (`build_global_multiclass_dataset`) across every eligible
user, purely for the ML Analytics/demo page — it answers the identification question
for illustration, but is never used to authenticate a real login.

## The three models

| Model | Why chosen | Trade-off |
|---|---|---|
| **Random Forest** | Ensemble of decision trees; handles small, noisy, non-linear tabular data well; gives a natural, easy-to-explain feature-importance ranking | Can overfit hard on very small datasets if not depth-limited (this project caps `max_depth=6`) |
| **Support Vector Machine (RBF kernel)** | Finds a maximum-margin decision boundary; effective when features are scaled (this project always scales with `StandardScaler` inside the same pipeline) | Less directly interpretable; probability estimates require calibration |
| **Logistic Regression** | A simple, well-calibrated linear model; if it performs competitively with the more complex models, that is itself informative about how linearly separable the two typists actually are | Cannot capture non-linear interactions between features |

All three are classical, **interpretable** models — chosen deliberately over deep
learning, which would need far more data than a college-project enrollment realistically
collects (see [13_Future_Scope.md](13_Future_Scope.md) for where deep learning becomes
appropriate).

Each model is wrapped in an `sklearn.Pipeline` of `StandardScaler → classifier`, so
scaling is fit **only on the training split** — never on the test split — avoiding a
subtle form of data leakage.

### A note on SVM probability estimates

`SVC(probability=True)` is deprecated in recent scikit-learn releases. This project
instead wraps a plain `SVC` in `CalibratedClassifierCV` (`method="sigmoid"`, `cv=3` —
reduced from the default 5 to remain usable with the small per-class sample counts a
mini-project realistically enrolls), which produces the same kind of well-calibrated
`predict_proba()` output through the current, non-deprecated API.

## Comparison and model selection

All three candidates are trained on the **same** train/test split so their metrics are
directly comparable (see [09_Model_Evaluation.md](09_Model_Evaluation.md) for the exact
metrics computed). The model with the **highest F1 score** is selected as active;
ties are broken toward the **lower False Acceptance Rate**, since for an authentication
system, letting an impostor in is a more expensive mistake than occasionally asking the
genuine user to try again. This rule is applied identically and automatically every
training run — there is no manual "pick whichever looks best" step.

## From score to decision

`app/ml/inference.py` loads the active model for the claimed user and computes
`predict_proba()` — the probability the sample belongs to the genuine class. That score
is compared against `VERIFICATION_MATCH_THRESHOLD` (default `0.60`) and
`VERIFICATION_SUSPICIOUS_THRESHOLD` (default `0.40`) to produce a similarity label
(High/Medium/Low) and risk level (Low/Medium/High). `AUTH_ENFORCEMENT_MODE` controls
whether a sub-threshold score actually fails the login ("strict") or only raises the
recorded risk level without blocking it ("advisory") — see
[09_Model_Evaluation.md](09_Model_Evaluation.md) for the reasoning behind these specific
default values.

## The statistical fallback

Before a personal ML model exists (a brand-new account, or one with no impostor pool
yet), `app/ml/statistical_verifier.py` provides a real, working baseline: it fits a
per-feature mean and standard deviation from the user's own enrollment samples, then
scores a new sample by its normalized distance (a diagonal-covariance Mahalanobis / median
z-score) from that profile. This is not a placeholder — it remains visible and usable
throughout the system's life, and is the actual mechanism protecting single-user
accounts. See [09_Model_Evaluation.md](09_Model_Evaluation.md) for the small-sample
robustness corrections applied to it.
