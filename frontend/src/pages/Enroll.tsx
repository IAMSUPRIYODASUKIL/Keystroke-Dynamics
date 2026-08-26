import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { PhraseTypingBox } from "@/components/PhraseTypingBox";
import { profileApi, typingApi, friendlyErrorMessage } from "@/services/api";
import type { EnrollResponse, KeystrokeEvent } from "@/types";

export function Enroll() {
  const navigate = useNavigate();
  const [phrase, setPhrase] = useState<string | null>(null);
  const [samplesCollected, setSamplesCollected] = useState(0);
  const [minRequired, setMinRequired] = useState(0);
  const [lastResult, setLastResult] = useState<EnrollResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boxKey, setBoxKey] = useState(0); // remounts PhraseTypingBox for a clean next sample
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    profileApi
      .get()
      .then((profile) => {
        setPhrase(profile.auth_phrase);
        setSamplesCollected(profile.samples_collected);
        setMinRequired(profile.min_required);
        setIsReady(profile.user.typing_profile_status === "ready");
      })
      .catch((err) => setError(friendlyErrorMessage(err)));
  }, []);

  const handleComplete = useCallback(async (events: KeystrokeEvent[]) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await typingApi.enroll(events);
      setLastResult(result);
      setSamplesCollected(result.samples_collected);
      setMinRequired(result.min_required);
      setIsReady(result.ready_for_authentication);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setBoxKey((k) => k + 1);
    }
  }, []);

  if (phrase === null && !error) return <PageLoader label="Loading your enrollment status…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Let's learn your typing pattern</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Type the sentence below naturally, {minRequired} times. We only record timing for keys inside
          this phrase — nothing else you type anywhere else in the app is ever captured.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="font-medium text-[var(--color-text)]">
            Sample {Math.min(samplesCollected + (isReady ? 0 : 1), minRequired)} of {minRequired}
          </span>
          <span className="text-[var(--color-text-muted)]">{samplesCollected} collected</span>
        </div>

        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all"
            style={{ width: `${Math.min(100, (samplesCollected / Math.max(minRequired, 1)) * 100)}%` }}
          />
        </div>

        {isReady ? (
          <div className="py-6 text-center">
            <p className="text-lg font-semibold text-[var(--color-success)]">
              Your typing profile is ready.
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {lastResult?.training_message ??
                "Enough samples have been collected to evaluate your typing pattern."}
            </p>
            <Button className="mt-6" onClick={() => navigate("/dashboard")}>
              Go to dashboard
            </Button>
          </div>
        ) : (
          phrase && (
            <PhraseTypingBox
              key={boxKey}
              phrase={phrase}
              onComplete={handleComplete}
              disabled={isSubmitting}
            />
          )
        )}

        {lastResult && !isReady && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <MiniStat label="Dwell" value={`${lastResult.feature_summary.mean_dwell_ms.toFixed(0)} ms`} />
            <MiniStat label="Flight" value={`${lastResult.feature_summary.mean_flight_ms.toFixed(0)} ms`} />
            <MiniStat label="Speed" value={`${lastResult.feature_summary.typing_speed_cps.toFixed(1)} cps`} />
            <MiniStat
              label="Duration"
              value={`${(lastResult.feature_summary.total_duration_ms / 1000).toFixed(1)} s`}
            />
          </div>
        )}
      </Card>

      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        You can delete this typing profile at any time from your dashboard. See the privacy notice for
        details on what is stored and why.
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-3">
      <p className="text-[10px] font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
