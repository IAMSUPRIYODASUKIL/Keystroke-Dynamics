# 12 — Limitations

This document exists so that no metric or demonstration from this project is
misread as more than it is. It is a **prototype**, built to demonstrate a concept and
a working pipeline — not a validated, production-grade authentication product.

## 1. Small enrolled datasets

A realistic run of this project — one presenter, a couple of test accounts, a handful
of enrollment samples each (`MIN_ENROLLMENT_SAMPLES`, tens of samples total) — is
orders of magnitude smaller than what behavioral-biometric research or a real
deployment would use. Two clearly, deliberately distinct typists (e.g. a fast typist
vs. a slow one for a demo) are trivially separable and can legitimately show 100%
accuracy on a tiny test split — that number reflects an easy split, not a validated,
generalizable accuracy rate. Section [09_Model_Evaluation.md](09_Model_Evaluation.md)
reports cross-validation alongside single-split metrics specifically to surface, not
hide, this variance.

A production system would need many users, many sessions per user spread over time,
varied physical conditions (different keyboards, devices, times of day), and formal
statistical validation before any accuracy claim would be meaningful.

## 2. Typing rhythm is not stable

Fatigue, injury, a different keyboard, stress, or simply the natural variability of a
motor skill can shift someone's typing enough to be flagged by the system — this was
observed directly during this project's own manual testing (see
[11_Testing.md](11_Testing.md)) and motivated real robustness fixes to the statistical
baseline. `AUTH_ENFORCEMENT_MODE=advisory` exists specifically so a deployment with a
still-thin enrolled profile can log and flag anomalies without hard-blocking a
legitimate but atypical login.

## 3. The statistical baseline is a fallback, not a full solution

Before a personal ML model can be trained (which requires impostor data from other
enrolled users), authentication relies on a simple statistical distance from the user's
own enrolled mean/std. It is real and functional, but inherently less discriminative
than a trained classifier that has actually seen what "not this person" looks like.

## 4. Not resistant to a targeted, informed attacker

This project does not claim resistance to an attacker who has specifically studied the
target's typing timing (e.g. from a keylogger, a video of them typing, or repeated
observation) and deliberately practices mimicking it. Keystroke dynamics research
generally treats this as an open, hard problem, not one this mini-project attempts to
solve. Nor does the system implement rate limiting or account lockout — an attacker
with the correct password can make unlimited login attempts against the typing check.

## 5. Physical-keyboard assumption

The captured signal (discrete `keydown`/`keyup` timing) models physical keyboard
typing. Touchscreen "typing" (tap timing, swipe-based input, autocorrect) has
substantially different dynamics and would need its own feature engineering and
models — explicitly out of scope here, and called out in
[13_Future_Scope.md](13_Future_Scope.md). The application remains usable on a
touchscreen device (the keystroke capture UI is responsive), but the *behavioral
signal itself* is only meaningfully validated for physical-keyboard input.

## 6. English, fixed-phrase, Latin-alphabet assumption

The system was built and tested against one fixed English phrase. Different alphabets,
input methods (IME-based typing for languages like Japanese or Korean), or right-to-left
scripts were not evaluated and may need feature-extraction changes (e.g. composed
character handling) not implemented here.

## 7. No formal security audit

This codebase has not undergone third-party security review or adversarial penetration
testing. It should not be used to protect real accounts, real user data, or anything
of genuine value. See the [README's Academic Disclaimer](../README.md#academic-disclaimer).
