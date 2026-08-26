import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { PhraseTypingBox } from "@/components/PhraseTypingBox";
import { RiskBadge } from "@/components/Badge";
import { profileApi, typingApi, friendlyErrorMessage } from "@/services/api";
import type { KeystrokeEvent, ProfileResponse, VerifyPreviewResponse } from "@/types";
import { MODEL_LABELS } from "@/utils/format";

/** A safe sandbox for the viva/presentation: score a typing sample against
 * your own enrolled profile without touching the real audit log or
 * requiring your password again. Demonstrates both a genuine match and an
 * impostor-style mismatch on demand. */
export function DemoMode() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [result, setResult] = useState<VerifyPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [boxKey, setBoxKey] = useState(0);

  useEffect(() => {
    profileApi.get().then(setProfile).catch((err) => setError(friendlyErrorMessage(err)));
  }, []);

  const handleComplete = useCallback(async (events: KeystrokeEvent[]) => {
    setIsScoring(true);
    setError(null);
    try {
      const response = await typingApi.verifyPreview(events);
      setResult(response);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setIsScoring(false);
    }
  }, []);

  function tryAgain() {
    setResult(null);
    setBoxKey((k) => k + 1);
  }

  if (error && !profile) return <Alert variant="error">{error}</Alert>;
  if (!profile) return <PageLoader label="Loading demo mode…" />;

  const notReady = profile.user.typing_profile_status !== "ready";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Demo mode</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          For live demonstrations: type the phrase to see the model score it against your enrolled
          profile — no password needed, and nothing here is written to the security activity log.
        </p>
      </div>

      {notReady ? (
        <Alert variant="warning">
          Complete typing enrollment first — this page needs a ready typing profile to score against.
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Try it yourself" subtitle="Type naturally to simulate the genuine user">
            {!result ? (
              <PhraseTypingBox
                key={boxKey}
                phrase={profile.auth_phrase}
                onComplete={handleComplete}
                disabled={isScoring}
              />
            ) : (
              <ResultPanel result={result} onReset={tryAgain} />
            )}
          </Card>

          <Card title="Suggestions for the imposter simulation">
            <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--color-text-muted)]">
              <li>Type much slower or faster than usual.</li>
              <li>Pause noticeably between words.</li>
              <li>Have a classmate — with a different typing rhythm — try it on the same account.</li>
              <li>Hunt-and-peck a phrase you'd normally type fluently.</li>
            </ul>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Run it once typing normally, then again with one of the above, and compare the similarity
              scores and risk levels side by side.
            </p>
          </Card>
        </div>
      )}

      <Card title="Live model snapshot">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Typing profile" value={profile.user.typing_profile_status.replace("_", " ")} />
          <StatTile label="Samples" value={`${profile.samples_collected} / ${profile.min_required}`} />
          <StatTile
            label="Active model"
            value={profile.active_model ? MODEL_LABELS[profile.active_model.model_type] : "Statistical baseline"}
          />
          <StatTile
            label="Model F1 score"
            value={profile.active_model ? `${(profile.active_model.f1_score * 100).toFixed(1)}%` : "—"}
          />
        </div>
      </Card>
    </div>
  );
}

function ResultPanel({ result, onReset }: { result: VerifyPreviewResponse; onReset: () => void }) {
  const riskLevel = result.match ? "low" : result.similarity_score >= 0.4 ? "medium" : "high";
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <RiskBadge level={riskLevel} />
      <p className="text-3xl font-bold text-[var(--color-text)]">
        {(result.similarity_score * 100).toFixed(0)}%
      </p>
      <p className="text-sm text-[var(--color-text-muted)]">
        Typing similarity: <strong className="text-[var(--color-text)]">{result.similarity_label}</strong>{" "}
        (via {MODEL_LABELS[result.method_used]})
      </p>
      <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
        {result.match
          ? "This sample is close enough to the enrolled profile to be treated as a match."
          : "This sample differs enough from the enrolled profile to be flagged as suspicious."}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="text-sm text-[var(--color-accent)] underline underline-offset-2"
      >
        Try another sample
      </button>
    </div>
  );
}
