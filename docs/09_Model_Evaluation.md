# 09 — Model Evaluation

## Standard classification metrics

For the binary user-verification task (class `1` = genuine user, class `0` = impostor):

| Metric | Formula | Question it answers |
|---|---|---|
| Accuracy | `(TP + TN) / (TP + TN + FP + FN)` | Overall, how often is the model right? |
| Precision | `TP / (TP + FP)` | Of the samples predicted genuine, how many actually were? |
| Recall | `TP / (TP + FN)` | Of the actually-genuine samples, how many were caught? |
| F1 score | `2 · Precision · Recall / (Precision + Recall)` | Single number balancing precision and recall |

## Authentication-specific metrics

Accuracy alone can be misleading for authentication (a model that always predicts
"genuine" can look accurate if impostor samples are rare in the test set). Two metrics
specific to verification systems are also computed:

- **False Acceptance Rate (FAR)** = `FP / (FP + TN)` — of all impostor attempts, the
  fraction wrongly accepted as genuine. This is the security-relevant failure: an
  attacker getting through.
- **False Rejection Rate (FRR)** = `FN / (FN + TP)` — of all genuine attempts, the
  fraction wrongly rejected. This is the usability-relevant failure: locking out the
  real user.

There is an inherent trade-off between the two — tightening the decision threshold to
reduce FAR increases FRR, and vice versa. This project reports both, every training
run, rather than optimizing one while hiding the other.

## Avoiding overfitting evaluation itself

Every candidate model is evaluated on a held-out test split it never trained on
(`train_test_split(..., stratify=y)`), and additionally cross-validated
(`StratifiedKFold`, `k` adapted to the smallest class size, skipped if a class has
fewer than 2 samples) to report a mean ± standard deviation accuracy across folds — a
single train/test split on a small dataset can be lucky or unlucky, and the
cross-validation number is reported alongside the single-split metrics specifically so
that variance is visible rather than hidden.

## Model selection rule

The active model is the candidate with the **highest F1 score**; ties are broken toward
the **lower FAR**. This is applied identically, automatically, every training run — see
`app/ml/training.py`. The rationale for the FAR tie-break: in an authentication system,
an accepted impostor is a security incident, while a rejected genuine user is an
inconvenience (they still have the password-only fallback path, or can simply retry).

## Choosing the authentication thresholds

`VERIFICATION_MATCH_THRESHOLD` (default **0.60**) and `VERIFICATION_SUSPICIOUS_THRESHOLD`
(default **0.40**) are configuration values, not numbers embedded in the decision logic:

- **Above 0.60** — similarity label "High", risk "Low", typing is treated as a match.
- **0.40–0.60** — similarity label "Medium", risk "Medium" — flagged, but (depending on
  `AUTH_ENFORCEMENT_MODE`) not necessarily blocking.
- **Below 0.40** — similarity label "Low", risk "High" — treated as a mismatch.

0.60 was chosen as a **midpoint-biased-toward-caution** default: a genuine sample from
a reasonably consistent typist, scored by a model trained on real impostor data,
should clear it comfortably (as observed in this project's own test runs — see
[11_Testing.md](11_Testing.md)), while requiring meaningfully more than a coin-flip
probability before trusting the behavioral signal. It is intentionally configurable
(`.env`) rather than hardcoded, because the "right" threshold is a genuine, data-dependent
design choice that a real deployment would tune against its own collected FAR/FRR
curve — this project's default is a reasoned starting point, not a claim of optimality.

## The statistical baseline's own robustness

Before enough impostor data exists to train an ML model, `app/ml/statistical_verifier.py`
scores samples using a per-feature z-score distance from the user's own enrolled
mean/std. Two robustness corrections are applied, both discovered and validated during
this project's own manual end-to-end testing:

1. **A relative standard-deviation floor** (`max(observed_std, 12% of |mean|)`). With
   only a handful of enrollment samples, it is common for one or two of the 24 features
   to show almost no variation *by chance*, not because that aspect of a person's
   typing is genuinely that consistent. Without a floor, that one "accidentally tight"
   dimension would flag any future natural fluctuation as an extreme outlier.
2. **Median, not mean, aggregation of per-feature z-scores.** With 24 features
   estimated from a small sample, a mean lets one or two noisy dimensions drag the
   whole score down even when the sample is genuinely typical. A median only moves
   when typing behavior differs broadly across many features at once — the actual
   signature of a different typist, rather than sampling noise in a couple of
   dimensions.

Both are standard small-sample robust-statistics techniques, not thresholds tuned to
make any specific test pass — see [11_Testing.md](11_Testing.md) for how this was
discovered.
