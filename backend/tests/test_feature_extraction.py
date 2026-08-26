"""Unit tests for app/ml/feature_extraction.py — validation, pairing, and
the actual dwell/flight/inter-key arithmetic."""
import pytest

from app.ml.feature_extraction import (
    FEATURE_NAMES,
    KeystrokeValidationError,
    extract_features,
    validate_and_pair,
)


def test_validate_and_pair_computes_correct_dwell_and_flight():
    # "ab": a held 100-200 (dwell 100), then flight 50 to b at 250-330 (dwell 80)
    events = [
        {"key": "a", "type": "keydown", "t": 100},
        {"key": "a", "type": "keyup", "t": 200},
        {"key": "b", "type": "keydown", "t": 250},
        {"key": "b", "type": "keyup", "t": 330},
    ]
    presses = validate_and_pair(events, "ab")
    assert [p.key for p in presses] == ["a", "b"]
    assert presses[0].dwell == 100
    assert presses[1].dwell == 80
    # flight = next keydown - previous keyup = 250 - 200 = 50
    assert presses[1].down_t - presses[0].up_t == 50


def test_extract_features_returns_expected_vector_length_and_names():
    events = [
        {"key": "a", "type": "keydown", "t": 0},
        {"key": "a", "type": "keyup", "t": 90},
        {"key": "b", "type": "keydown", "t": 190},
        {"key": "b", "type": "keyup", "t": 280},
        {"key": "c", "type": "keydown", "t": 380},
        {"key": "c", "type": "keyup", "t": 470},
    ]
    result = extract_features(events, "abc")
    assert result.feature_names == FEATURE_NAMES
    assert len(result.feature_vector) == len(FEATURE_NAMES)
    assert result.summary["key_count"] == 3
    # total duration = last keyup (470) - first keydown (0)
    assert result.summary["total_duration_ms"] == 470


def test_rejects_wrong_length():
    events = [
        {"key": "a", "type": "keydown", "t": 0},
        {"key": "a", "type": "keyup", "t": 90},
    ]
    with pytest.raises(KeystrokeValidationError):
        validate_and_pair(events, "ab")


def test_rejects_mismatched_characters():
    events = [
        {"key": "x", "type": "keydown", "t": 0},
        {"key": "x", "type": "keyup", "t": 90},
    ]
    with pytest.raises(KeystrokeValidationError):
        validate_and_pair(events, "a")


def test_rejects_empty_events():
    with pytest.raises(KeystrokeValidationError):
        validate_and_pair([], "a")


def test_ignores_key_repeat_duplicate_keydowns():
    # A held key fires multiple keydowns before its keyup (OS key-repeat) —
    # the extra keydowns must be ignored rather than treated as extra presses.
    events = [
        {"key": "a", "type": "keydown", "t": 0},
        {"key": "a", "type": "keydown", "t": 20},  # repeat — ignored
        {"key": "a", "type": "keydown", "t": 40},  # repeat — ignored
        {"key": "a", "type": "keyup", "t": 90},
    ]
    presses = validate_and_pair(events, "a")
    assert len(presses) == 1
    assert presses[0].down_t == 0


def test_negative_flight_is_preserved_not_clamped():
    # Overlapping ("rollover") typing: next key pressed before previous
    # released — flight time is legitimately negative and must be kept.
    events = [
        {"key": "a", "type": "keydown", "t": 0},
        {"key": "b", "type": "keydown", "t": 50},
        {"key": "a", "type": "keyup", "t": 80},
        {"key": "b", "type": "keyup", "t": 130},
    ]
    result = extract_features(events, "ab")
    min_flight_index = FEATURE_NAMES.index("min_flight")
    assert result.feature_vector[min_flight_index] < 0
