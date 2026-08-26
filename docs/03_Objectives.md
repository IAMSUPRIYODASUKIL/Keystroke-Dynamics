# 03 — Objectives

## Primary objectives

1. Build a complete, working web application implementing user registration, login,
   and a keystroke-dynamics-based secondary authentication signal — with no
   simulated or hardcoded results anywhere in the pipeline.
2. Capture real keyboard timing (keydown/keyup) in the browser, restricted to a fixed
   enrollment phrase, and turn it into a well-defined, documented numeric feature
   vector (dwell time, flight time, inter-key interval, typing speed, and their
   summary statistics).
3. Train and fairly compare three classical, interpretable machine-learning models —
   Random Forest, Support Vector Machine, and Logistic Regression — on real collected
   data, using a train/test split and cross-validation that avoid data leakage.
4. Evaluate those models with metrics appropriate to an authentication system:
   accuracy, precision, recall, F1, False Acceptance Rate, and False Rejection Rate —
   and select the deployed model by an explicit, documented rule.
5. Wire the trained model into an actual login flow: password check → typing capture →
   feature extraction → model inference → thresholded decision → risk level →
   final SUCCESS/FAILED outcome, all visible and explained to the user.
6. Persist everything that matters for a real system: user accounts (hashed
   passwords), typing samples, extracted features, training runs, trained model
   metadata, and a full authentication attempt audit trail — in a relational database.
7. Provide a genuinely usable dashboard, ML analytics page, and security activity page
   so the complete pipeline can be demonstrated and inspected, not just claimed.

## Secondary objectives

- Implement a statistical fallback verifier so the system behaves sensibly even before
  enough data exists to train a personal classifier (a brand-new, single enrolled user).
- Apply real security practice: Argon2 password hashing, JWT sessions, server-side
  input validation, ORM-parameterized queries, environment-variable-based secrets.
- Apply real privacy practice: collect keystroke data only for the designated
  enrollment phrase, avoid storing unnecessary raw timestamps, and give the user a way
  to delete their typing profile entirely.
- Make the honest limitations of a small-sample, single-institution academic prototype
  explicit in the UI and documentation, rather than overstating accuracy or security.
- Deliver a UI that is professional, responsive, and — given the subject matter —
  particularly attentive to keyboard accessibility.

## Explicit non-objectives

- This project does not attempt to replace password authentication, nor to build a
  production-grade, adversarially-hardened biometric system (see
  [12_Limitations.md](12_Limitations.md)).
- It does not attempt deep learning, continuous authentication, or mobile/touchscreen
  typing — these are deliberately deferred to [13_Future_Scope.md](13_Future_Scope.md)
  to keep the mini-project's scope achievable and well-tested.
