# 05 — Keystroke Dynamics

## What it is

Keystroke dynamics is a **behavioral biometric**: it identifies characteristics of *how*
someone performs an action (typing), as opposed to a **physiological biometric**
(fingerprint, iris, face) which identifies a physical trait. It has been an active
research area since at least the 1980s, originally motivated by the observation that
telegraph operators could recognize each other by their transmission rhythm ("the
fist"), long before computers existed.

The core idea: when you type a password or phrase you've typed many times before, the
timing between your keystrokes is not random — it reflects muscle memory, finger
length and reach, typing technique, and familiarity with the specific text. That timing
pattern is measurably different between different people typing the *same* text.

## The four measurements this project captures

For a sequence of key presses `k1, k2, …, kn`, each with a `down` (keydown) and `up`
(keyup) timestamp:

| Measurement | Formula | Meaning |
|---|---|---|
| **Dwell time** | `up(ki) − down(ki)` | How long key *i* was held down |
| **Flight time** | `down(ki+1) − up(ki)` | Gap between releasing key *i* and pressing key *i+1* — can be negative if the next key is pressed before the previous is released ("rollover" typing) |
| **Inter-key interval** | `down(ki+1) − down(ki)` | Gap between consecutive key *presses*; always non-negative for in-order typing |
| **Typing speed** | `n ÷ (total_duration_ms ÷ 1000)` | Characters typed per second, for the whole sample |

`total_duration` is `up(kn) − down(k1)` — the time from the very first keydown to the
very last keyup.

## Why a fixed phrase

This project asks every user to type the **same configured phrase**
(`AUTH_PHRASE`, default: *"My secure typing pattern is unique."*) for both enrollment
and login verification. This is a deliberate, standard choice in fixed-text keystroke
dynamics research (as opposed to *free-text* dynamics, which analyzes arbitrary typing
and needs far more data and different techniques):

- **Comparable samples.** Every sample has the same number of key presses in the same
  order, so features can be compared directly across sessions and across users.
  Free-text typing would require aligning very different key sequences before any
  comparison is meaningful.
- **Privacy by construction.** Because the phrase is fixed and known in advance, the
  system never needs to capture or store what a user types anywhere else in the
  application — keystroke capture is deliberately scoped to this one designated field
  (see [10_Security.md](10_Security.md)).
- **A realistic proxy for password entry.** The phrase stands in for "the rhythm of
  entering a memorized secret," which is the actual scenario this project targets.

## Typing rhythm, in aggregate

No single dwell or flight measurement is reliable on its own — human timing is noisy
from one keystroke to the next. What is stable (within limits) is the **statistical
shape** of many such measurements across one typing of the phrase: the average, the
spread (standard deviation), the consistency (coefficient of variation), and the
overall pace. That statistical shape is exactly what this project's feature vector
encodes — see [08_Feature_Extraction.md](08_Feature_Extraction.md) for the full,
precise feature list and the reasoning behind using session-level statistics rather
than per-character positional timing.

## Known real-world variability

Typing rhythm is influenced by (non-exhaustively): fatigue, time of day, injury or
temporary hand condition, the specific physical keyboard, sitting vs. standing, and
emotional state. A single, careful reading of the phrase during enrollment cannot
capture all of that variability — which is precisely why this project treats keystroke
dynamics as an *additional signal with a configurable, tunable threshold*, not an
infallible lock. See [12_Limitations.md](12_Limitations.md).
