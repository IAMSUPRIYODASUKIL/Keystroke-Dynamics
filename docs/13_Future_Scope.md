# 13 — Future Scope

Ordered roughly by how directly each extends what already exists in this codebase.

## Continuous authentication

Rather than scoring one typing sample at login, continuously score ongoing typing
throughout a session (e.g. in a text editor or chat field) and re-prompt or step up
authentication if behavior drifts significantly. This would require free-text feature
extraction (not tied to a fixed phrase) and a different modeling approach — a
meaningful extension of `app/ml/feature_extraction.py`, not a rewrite of the
architecture around it.

## Larger, longitudinal datasets

The single highest-leverage improvement: many users, many sessions per user, spread
over weeks or months, on varied devices. This is what would let accuracy and FAR/FRR
numbers be reported with genuine statistical confidence rather than the illustrative,
small-sample numbers this prototype produces (see
[12_Limitations.md](12_Limitations.md)). The database schema already supports this at
scale without changes — `typing_samples`/`typing_features` do not assume any particular
dataset size.

## Deep learning

With a sufficiently large dataset, sequence models (e.g. an LSTM or small Transformer
over the raw keystroke event sequence) could capture temporal patterns that
fixed-length statistical features cannot — at the cost of needing far more data and
losing some of the interpretability that made Random Forest / SVM / Logistic Regression
the right choice for this project's realistic data scale (see
[06_Machine_Learning.md](06_Machine_Learning.md)).

## Mobile / touchscreen keyboard behavior

A genuinely different feature set — tap duration, swipe velocity, pressure (where
available), inter-tap distance — for touchscreen input, which the current
`keydown`/`keyup`-based approach does not model at all (see
[12_Limitations.md](12_Limitations.md), point 5).

## Adaptive profiles

Typing rhythm drifts over months and years. A production system would periodically
retrain or incrementally update a user's profile from recent successful logins (with
appropriate safeguards against an attacker "poisoning" the profile through repeated
successful-looking attempts) rather than freezing it at enrollment. The
`training_runs`/`model_versions` schema already supports storing multiple model
generations per user; the missing piece is an automated retraining trigger and a
policy for what counts as trustworthy new training data.

## Genuine multi-factor authentication

Combine this behavioral signal with an established possession factor — TOTP or
WebAuthn/passkeys — for real multi-factor guarantees. Keystroke dynamics would remain
positioned as it is now: a risk signal that can trigger a step-up challenge, not a
factor claimed to be sufficient on its own.

## Operational hardening

Rate limiting, account lockout policy, structured audit logging/alerting, and a formal
security review — all explicitly out of scope for this academic prototype (see
[10_Security.md](10_Security.md)) but necessary before any real-world use.
