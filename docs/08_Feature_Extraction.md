# 08 — Feature Extraction

Implemented in `backend/app/ml/feature_extraction.py`.

## Step 1 — pair raw events into key presses

The raw input is a flat, time-sorted list of `{key, type: "keydown"|"keyup", t}`
events. `_pair_events` walks this list, matching each `keyup` to the earliest still-open
`keydown` for the same key (defensive against OS key-repeat, which can fire multiple
`keydown` events for one physical press — repeats are ignored). The result is an ordered
list of `KeyPress(key, down_t, up_t)` records.

## Step 2 — validate against the expected phrase

`validate_and_pair` checks that the number of presses matches the phrase length exactly
and that the typed characters, in order, equal the configured phrase exactly. Any
mismatch — wrong length, wrong character, a `keyup` before its `keydown` — raises
`KeystrokeValidationError`, surfaced to the API caller as HTTP 400. This is the
authoritative validation; the frontend's own real-time character matching exists only
to make the UX pleasant, not to substitute for this check.

## Step 3 — compute the three timing series

For `n` key presses:

- **Dwell times** (`n` values) — `up(ki) − down(ki)`
- **Inter-key intervals** (`n−1` values) — `down(ki+1) − down(ki)`
- **Flight times** (`n−1` values) — `down(ki+1) − up(ki)` (kept signed; a negative value
  reflects real "rollover" typing and is informative, not an error)

## Step 4 — session-level statistics, not a positional vector

For dwell and flight, eight statistics each are computed: **mean, median, standard
deviation, minimum, maximum, coefficient of variation** (`std ÷ |mean|`, or `0` if the
mean is ~0), and the **25th/75th percentiles** (8 + 8 = 16 values). For the inter-key
interval, the same six statistics minus the two percentiles (6 values) — percentiles
add the least incremental signal for this series in practice, so they were left out
rather than padding the vector for its own sake. Plus two whole-session values:
**typing speed** (characters/second) and **total duration**. That totals
`16 + 6 + 2 = 24` dimensions (`FEATURE_NAMES` in the source is the single source of
truth for the exact list and order).

### Why not a per-character positional vector

Because the phrase is fixed, it is technically possible to build a much larger
feature vector: one "hold time" value *per character position*, plus one "latency"
value per adjacent character pair (the classic scheme from Killourhy & Maxion's 2009
keystroke-dynamics benchmark). For this project's ~36-character phrase, that would mean
100+ dimensions.

This project deliberately does **not** do that. With a realistic college-project
enrollment size (as low as `MIN_ENROLLMENT_SAMPLES`, commonly under 20 samples per
user), 100+ dimensions relative to a handful of samples per class is a severe
overfitting risk — a model can trivially memorize the exact training samples without
learning anything that generalizes. The session-level aggregate statistics used here
are a smaller, denser, more sample-efficient feature set that is still standard in the
keystroke-dynamics literature, and is a defensible, documented bias-variance trade-off
for this dataset's realistic scale (see [12_Limitations.md](12_Limitations.md)).

Positional/digraph timings are still *computed* (`digraph_timings` in
`ExtractedFeatures`) and stored for potential display or a future, larger-dataset
iteration — they are simply not fed into the current models as raw input dimensions.

## No meaningless padding

Every one of the 24 features has a direct, explainable meaning (see
[05_Keystroke_Dynamics.md](05_Keystroke_Dynamics.md)) and a corresponding line in the
"Feature Importance" chart on the ML Analytics page — nothing was added purely to
inflate the feature count.
