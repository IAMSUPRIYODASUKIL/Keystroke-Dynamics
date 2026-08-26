"""A dependency-free statistical baseline verifier.

This is what authenticates a user *before* enough data exists to train a
per-user ML classifier (a brand-new user only has their own enrollment
samples — no "impostor" data yet to train a binary classifier against).
It is a legitimate, well-understood technique in its own right (a
diagonal-covariance Mahalanobis / normalized z-score distance), not a
placeholder: it is always computed and always available, and remains
visible on the dashboard alongside the ML score once one exists.
"""
import numpy as np

# A z-score at/beyond this many standard deviations is treated as "as far
# as it gets" for scoring purposes (see docs/09_Model_Evaluation.md).
MAX_Z_SCORE = 3.0



# A handful of enrollment samples (as few as MIN_ENROLLMENT_SAMPLES) badly
# under-estimate the true per-feature standard deviation — it is common for
# one or two of the 24 features to show almost no variation across 8
# samples purely by chance, not because that aspect of the user's typing is
# actually that consistent. Without a floor, that single "accidentally
# tight" dimension would make any future natural fluctuation look like an
# extreme outlier. Requiring at least 12% of the feature's own mean as
# plausible natural variability is a standard small-sample shrinkage
# correction, not a threshold tuned to any particular test.
_RELATIVE_STD_FLOOR = 0.12


def fit_statistical_profile(enrollment_vectors: list[list[float]]) -> dict:
    """Compute the per-feature mean/std profile from a user's enrollment
    samples. Requires at least 2 samples (std of a single sample is
    undefined)."""
    arr = np.asarray(enrollment_vectors, dtype=float)
    mean = arr.mean(axis=0)
    std = arr.std(axis=0, ddof=1) if arr.shape[0] > 1 else np.zeros(arr.shape[1])
    std_floor = np.maximum(std, _RELATIVE_STD_FLOOR * np.abs(mean))
    std_floor = np.maximum(std_floor, 1e-6)  # guard the (rare) zero-mean case
    return {"mean": mean.tolist(), "std": std_floor.tolist()}


def statistical_similarity(profile: dict, feature_vector: list[float]) -> float:
    """Return a similarity score in [0, 1]: 1.0 = typing pattern is
    identical (in z-score terms) to the enrolled profile's average,
    0.0 = at or beyond MAX_Z_SCORE standard deviations away, typically.

    Aggregated with the MEDIAN (not mean) per-feature z-score: with 24
    features estimated from a handful of samples, it is common for one or
    two dimensions to swing wide on an otherwise-genuine sample. A mean
    lets a couple of noisy dimensions drag the whole score down; a median
    only moves if typing behavior differs broadly across features — which
    is the actual signature of a different typist, not sampling noise.
    """
    mean = np.asarray(profile["mean"], dtype=float)
    std = np.asarray(profile["std"], dtype=float)
    vec = np.asarray(feature_vector, dtype=float)

    z_scores = np.abs((vec - mean) / std)
    typical_z = float(np.median(np.clip(z_scores, 0, MAX_Z_SCORE)))
    similarity = max(0.0, 1.0 - typical_z / MAX_Z_SCORE)
    return similarity
