# 01 — Project Overview

## Title

**User Authentication Using Keystroke Dynamics and Machine Learning**

## What this project is

A working, end-to-end web application that demonstrates **behavioral biometric
authentication**: alongside a normal username/password login, the system observes
*how* a user types a fixed phrase and uses a trained machine-learning model to judge
whether that typing rhythm matches the rhythm learned during enrollment.

The project is built as a college mini-project but implemented to a professional
standard: a real React/TypeScript frontend, a real FastAPI backend, a real relational
database, and a real scikit-learn training pipeline — no hardcoded predictions, no
simulated confidence scores.

## Who this is for

- A student presenting this as a mini-project / capstone deliverable
- A reviewer or examiner evaluating the system in a viva
- Anyone wanting a concrete, working reference implementation of keystroke dynamics as
  an authentication signal, built with widely-used, industry-standard tools

## What the system demonstrates

> "Your password identifies **what you know**. Your typing pattern helps identify
> **how you type**."

1. A user registers with a name, email, and password (hashed, never stored in plaintext).
2. The user types a fixed phrase several times; the browser captures keystroke timing.
3. The backend extracts numeric features (dwell time, flight time, typing speed, etc.)
   from that timing.
4. Once enough data exists, three classical ML models (Random Forest, SVM, Logistic
   Regression) are trained to distinguish the user's typing from other enrolled users'.
5. At login, after the password is verified, a fresh typing sample is scored against
   the trained model (or a statistical baseline, before enough training data exists).
6. The system reports a clear authentication decision, a risk level, and a
   human-readable explanation — never a bare, unexplained number.

## Document map

| Document | Contents |
|---|---|
| [02_Problem_Statement.md](02_Problem_Statement.md) | Why password-only authentication is insufficient |
| [03_Objectives.md](03_Objectives.md) | Concrete, scoped project objectives |
| [04_System_Architecture.md](04_System_Architecture.md) | Components, data flow, technology choices |
| [05_Keystroke_Dynamics.md](05_Keystroke_Dynamics.md) | The behavioral biometric itself |
| [06_Machine_Learning.md](06_Machine_Learning.md) | Model choice, training strategy, thresholding |
| [07_Dataset.md](07_Dataset.md) | Data collection and dataset design |
| [08_Feature_Extraction.md](08_Feature_Extraction.md) | The numeric feature vector, in detail |
| [09_Model_Evaluation.md](09_Model_Evaluation.md) | Metrics, FAR/FRR, threshold selection |
| [10_Security.md](10_Security.md) | Password/session/API/data security |
| [11_Testing.md](11_Testing.md) | Test strategy and coverage |
| [12_Limitations.md](12_Limitations.md) | Honest limitations of this prototype |
| [13_Future_Scope.md](13_Future_Scope.md) | What a production version would need |
| [14_Viva_Questions.md](14_Viva_Questions.md) | Rehearsed viva Q&A |

See the top-level [README.md](../README.md) for installation and running instructions.
