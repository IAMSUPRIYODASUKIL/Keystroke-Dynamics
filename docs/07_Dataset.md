# 07 — Dataset

## Unit of data: one typing session

Every row of raw data is one **typing session** — one complete, uninterrupted typing of
the fixed phrase, captured as an ordered list of keydown/keyup events (`TypingSample`)
and its derived 24-value numeric feature vector (`TypingFeature`, one-to-one with the
sample). A session is never split into pieces and recombined, which is what makes the
train/test split trivially leakage-free at the session level: a given session is either
entirely in the training set or entirely in the test set, never both.

## Schema (see `backend/app/models/`)

```
users                 id, name, email, hashed_password, typing_profile_status
typing_samples        id, user_id, phrase, purpose (enrollment | verification),
                       raw_events (JSON), used_for_training
typing_features       id, sample_id, user_id, feature_names, feature_vector,
                       + queryable summary columns (mean_dwell, mean_flight, …)
training_runs         id, scope (user_verification | global_multiclass), user_id,
                       status, dataset_samples, dataset_users, best_model_type
model_versions        id, training_run_id, user_id, model_type, file_path,
                       is_active, accuracy, precision, recall, f1_score, far, frr,
                       cv_accuracy_mean/std, metrics_json (confusion matrix, importances)
authentication_attempts  id, user_id, attempted_email, password_correct,
                       typing_sample_id, method_used, similarity_score, risk_level,
                       decision, details (JSON), created_at
```

## Two supported query shapes

The schema is deliberately shaped to support both framings described in
[06_Machine_Learning.md](06_Machine_Learning.md):

- **"Does this sample belong to user X?"** — `build_user_verification_dataset` selects
  user X's own `typing_features` rows as the positive class and a capped, evenly-sampled
  pool from other users as the negative class.
- **"Which enrolled user does this sample resemble?"** — `build_global_multiclass_dataset`
  uses every eligible user's `typing_features` rows, one integer class label per user.

Both read from the exact same `typing_features` table — no separate dataset needs to be
collected or maintained for the two use cases.

## Collecting the data

During enrollment, the frontend's `useKeystrokeCapture` hook records every keydown/keyup
event for the fixed phrase, resets the sample (rather than allowing corrections) if
Backspace is pressed or a mismatched character is typed, and submits the raw event list
to `POST /api/typing/enroll` once the phrase is typed correctly in full. The backend
independently re-validates the event sequence against the configured phrase
(`app/ml/feature_extraction.py::validate_and_pair`) before ever computing features from
it — the frontend's validation is a UX convenience, not the security boundary.

## Splitting without leakage

`app/ml/training.py` uses `train_test_split(..., stratify=y, random_state=42)` on the
session-level feature vectors, plus `StratifiedKFold` cross-validation (with `k` adapted
down — to a minimum of 2 — when a class has very few samples, and skipped entirely if a
class has fewer than 2 samples, since cross-validation is undefined at that point). Because
each row is already one complete, independent session, this split cannot put "part of"
one sample into both the training and test sets — the leakage risk called out in the
project brief structurally cannot occur at this granularity.

## Honest scale

A realistic run of this project — one student, a handful of registered test accounts —
collects on the order of tens of samples total. That is intentionally transparent in
the UI (sample counts are always shown) and in this documentation: see
[12_Limitations.md](12_Limitations.md) for what that scale does and does not prove.
