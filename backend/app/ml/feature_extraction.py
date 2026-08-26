"""Turn raw keydown/keyup events into a fixed-length numeric feature vector.

Design notes (see docs/08_Feature_Extraction.md for the full rationale):

* The phrase is FIXED, so every sample has the same number of key presses.
  That would normally let us build a per-character "positional" vector
  (hold time at position 1, 2, 3, ... — the classic Killourhy & Maxion
  keystroke-dynamics scheme). We deliberately do NOT do that here: with a
  ~36-character phrase that produces 100+ dimensions, and a college demo
  realistically collects on the order of 10-20 enrollment samples per
  user — far too few samples for that many dimensions (severe overfitting
  risk). Instead we use session-level aggregate statistics (mean, median,
  std, min, max, coefficient of variation, and interquartile percentiles)
  over the three canonical timing measures: dwell, flight and inter-key
  interval. This is a smaller, denser, less overfit-prone feature set
  that is still standard in the keystroke-dynamics literature.
* Per-digraph (positional) timings are still computed and returned
  separately (`digraph_timings`) purely for display/explainability on the
  ML Analytics page — they are not fed into the model.
"""
from dataclasses import dataclass, field

import numpy as np

FEATURE_NAMES: list[str] = [
    "mean_dwell", "median_dwell", "std_dwell", "min_dwell", "max_dwell", "cv_dwell",
    "p25_dwell", "p75_dwell",
    "mean_flight", "median_flight", "std_flight", "min_flight", "max_flight", "cv_flight",
    "p25_flight", "p75_flight",
    "mean_inter_key", "median_inter_key", "std_inter_key", "min_inter_key", "max_inter_key",
    "cv_inter_key",
    "typing_speed_cps", "total_duration_ms",
]


class KeystrokeValidationError(ValueError):
    """Raised when the captured events don't correspond to a clean,
    single, uninterrupted typing of the expected phrase."""


@dataclass
class KeyPress:
    key: str
    down_t: float
    up_t: float

    @property
    def dwell(self) -> float:
        return self.up_t - self.down_t


@dataclass
class ExtractedFeatures:
    feature_names: list[str]
    feature_vector: list[float]
    summary: dict = field(default_factory=dict)
    digraph_timings: dict = field(default_factory=dict)


def _pair_events(raw_events: list[dict]) -> list[KeyPress]:
    """Pair keydown/keyup events into KeyPress records, in chronological
    order. Defensive against duplicate keydowns from OS key-repeat (a
    keydown for a key that is already "open" is ignored)."""
    events = sorted(raw_events, key=lambda e: e["t"])
    open_downs: dict[str, list[float]] = {}
    presses: list[KeyPress] = []

    for event in events:
        key = event["key"]
        etype = event["type"]
        t = float(event["t"])
        if etype == "keydown":
            open_downs.setdefault(key, [])
            if open_downs[key]:
                # A keydown is already open for this key (key-repeat) — ignore.
                continue
            open_downs[key].append(t)
        elif etype == "keyup":
            queue = open_downs.get(key)
            if not queue:
                # Stray keyup with no matching keydown — ignore.
                continue
            down_t = queue.pop(0)
            presses.append(KeyPress(key=key, down_t=down_t, up_t=t))

    presses.sort(key=lambda p: p.down_t)
    return presses


def validate_and_pair(raw_events: list[dict], expected_phrase: str) -> list[KeyPress]:
    if not raw_events:
        raise KeystrokeValidationError("No keystroke events were captured.")

    presses = _pair_events(raw_events)

    if len(presses) != len(expected_phrase):
        raise KeystrokeValidationError(
            f"Expected {len(expected_phrase)} key presses for the phrase, "
            f"got {len(presses)}. Please retype the phrase exactly, without "
            f"corrections."
        )

    typed = "".join(p.key for p in presses)
    if typed != expected_phrase:
        raise KeystrokeValidationError(
            "The typed text does not match the expected phrase exactly."
        )

    for p in presses:
        if p.up_t < p.down_t:
            raise KeystrokeValidationError("Invalid event timing (keyup before keydown).")

    return presses


def _stats(values: list[float]) -> dict[str, float]:
    if not values:
        return {"mean": 0.0, "median": 0.0, "std": 0.0, "min": 0.0, "max": 0.0,
                "cv": 0.0, "p25": 0.0, "p75": 0.0}
    arr = np.asarray(values, dtype=float)
    mean = float(np.mean(arr))
    std = float(np.std(arr, ddof=0))
    cv = std / abs(mean) if abs(mean) > 1e-9 else 0.0
    return {
        "mean": mean,
        "median": float(np.median(arr)),
        "std": std,
        "min": float(np.min(arr)),
        "max": float(np.max(arr)),
        "cv": cv,
        "p25": float(np.percentile(arr, 25)),
        "p75": float(np.percentile(arr, 75)),
    }


def extract_features(raw_events: list[dict], expected_phrase: str) -> ExtractedFeatures:
    presses = validate_and_pair(raw_events, expected_phrase)
    n = len(presses)

    dwell_times = [p.dwell for p in presses]
    # Inter-key interval (down-down): always >= 0 for in-order typing.
    inter_key_times = [presses[i + 1].down_t - presses[i].down_t for i in range(n - 1)]
    # Flight time (up-down): can be negative if the next key is pressed
    # before the previous one is released ("rollover" typing) — that is a
    # genuine, informative signal about typing style, so it is kept as-is.
    flight_times = [presses[i + 1].down_t - presses[i].up_t for i in range(n - 1)]

    total_duration_ms = presses[-1].up_t - presses[0].down_t
    typing_speed_cps = n / (total_duration_ms / 1000.0) if total_duration_ms > 0 else 0.0

    dwell_stats = _stats(dwell_times)
    flight_stats = _stats(flight_times)
    ik_stats = _stats(inter_key_times)

    vector = [
        dwell_stats["mean"], dwell_stats["median"], dwell_stats["std"],
        dwell_stats["min"], dwell_stats["max"], dwell_stats["cv"],
        dwell_stats["p25"], dwell_stats["p75"],
        flight_stats["mean"], flight_stats["median"], flight_stats["std"],
        flight_stats["min"], flight_stats["max"], flight_stats["cv"],
        flight_stats["p25"], flight_stats["p75"],
        ik_stats["mean"], ik_stats["median"], ik_stats["std"],
        ik_stats["min"], ik_stats["max"], ik_stats["cv"],
        typing_speed_cps, total_duration_ms,
    ]

    digraph_timings = {
        f"{presses[i].key}{presses[i + 1].key}_{i}": {
            "flight_ms": flight_times[i],
            "inter_key_ms": inter_key_times[i],
        }
        for i in range(n - 1)
    }

    summary = {
        "mean_dwell": dwell_stats["mean"], "std_dwell": dwell_stats["std"],
        "cv_dwell": dwell_stats["cv"],
        "mean_flight": flight_stats["mean"], "std_flight": flight_stats["std"],
        "cv_flight": flight_stats["cv"],
        "mean_inter_key": ik_stats["mean"], "std_inter_key": ik_stats["std"],
        "typing_speed_cps": typing_speed_cps,
        "total_duration_ms": total_duration_ms,
        "key_count": n,
    }

    return ExtractedFeatures(
        feature_names=list(FEATURE_NAMES),
        feature_vector=vector,
        summary=summary,
        digraph_timings=digraph_timings,
    )
