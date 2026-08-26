"""Unit tests for the statistical baseline verifier (app/ml/statistical_verifier.py)."""
from app.ml.statistical_verifier import fit_statistical_profile, statistical_similarity


def _profile_from_similar_samples():
    # 6 samples clustered tightly around the same typing rhythm.
    samples = [
        [90, 10, 110, 12, 5.0, 7000],
        [92, 9, 112, 11, 5.1, 6900],
        [88, 11, 108, 13, 4.9, 7100],
        [91, 10, 111, 12, 5.0, 7050],
        [89, 10, 109, 11, 5.05, 6950],
        [93, 9, 113, 12, 4.95, 7000],
    ]
    return fit_statistical_profile(samples)


def test_similar_sample_scores_high():
    profile = _profile_from_similar_samples()
    similar_sample = [90.5, 10, 110.5, 12, 5.0, 7000]
    score = statistical_similarity(profile, similar_sample)
    assert score > 0.7


def test_very_different_sample_scores_low():
    profile = _profile_from_similar_samples()
    different_sample = [200, 40, 260, 45, 2.0, 14000]
    score = statistical_similarity(profile, different_sample)
    assert score < 0.4


def test_score_is_bounded_between_zero_and_one():
    profile = _profile_from_similar_samples()
    extreme_sample = [10_000, 5000, -8000, 9000, 0.001, 999_999]
    score = statistical_similarity(profile, extreme_sample)
    assert 0.0 <= score <= 1.0


def test_zero_variance_dimension_does_not_cause_division_errors():
    # Every sample has an identical value in one dimension (zero natural
    # variance) — the relative std floor must prevent a divide-by-zero /
    # infinite z-score for that dimension.
    samples = [[90, 100], [91, 100], [89, 100], [92, 100]]
    profile = fit_statistical_profile(samples)
    score = statistical_similarity(profile, [90, 100])
    assert 0.0 <= score <= 1.0
    assert score > 0.9  # identical to the profile in both dimensions
