import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowRight, Fingerprint, Cpu, Clock, Gauge, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { PhraseTypingBox } from "@/components/PhraseTypingBox";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { profileApi, typingApi, friendlyErrorMessage } from "@/services/api";
import type { EnrollResponse, KeystrokeEvent } from "@/types";

const CONFETTI_COLORS = ["#e8622c", "#ff9a62", "#ffd2a8", "#6ed3a8", "#f5efea"];

export function Enroll() {
  const navigate = useNavigate();
  const [phrase, setPhrase] = useState<string | null>(null);
  const [samplesCollected, setSamplesCollected] = useState(0);
  const [minRequired, setMinRequired] = useState(0);
  const [lastResult, setLastResult] = useState<EnrollResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boxKey, setBoxKey] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const loadProfile = useCallback(() => {
    setError(null);
    profileApi
      .get()
      .then((profile) => {
        setPhrase(profile.auth_phrase);
        setSamplesCollected(profile.samples_collected);
        setMinRequired(profile.min_required);
        const ready = profile.user.typing_profile_status === "ready";
        setIsReady(ready);
        if (ready) {
          try {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => setError(friendlyErrorMessage(err)));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleComplete = useCallback(async (events: KeystrokeEvent[]) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await typingApi.enroll(events);
      setLastResult(result);
      setSamplesCollected(result.samples_collected);
      setMinRequired(result.min_required);
      setIsReady(result.ready_for_authentication);

      if (result.ready_for_authentication) {
        try {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: CONFETTI_COLORS });
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setBoxKey((k) => k + 1);
    }
  }, []);

  if (phrase === null && !error) return <PageLoader label="Loading your calibration studio…" />;

  if (phrase === null && error) {
    return (
      <div className="mx-auto max-w-md">
        <Alert variant="error">{error}</Alert>
        <Button variant="secondary" className="mt-4 w-full" onClick={loadProfile}>
          Retry
        </Button>
      </div>
    );
  }

  const currentSampleNum = Math.min(samplesCollected + (isReady ? 0 : 1), Math.max(minRequired, 1));
  const progressPercent = Math.min(100, (samplesCollected / Math.max(minRequired, 1)) * 100);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      {/* Header */}
      <div className="text-center">
        <div className="glass-pill mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-(--color-accent)">
          <Fingerprint size={13} />
          <span className="font-mono tracking-[0.16em] uppercase">Rhythm calibration</span>
        </div>
        <h1 className="font-display text-balance text-4xl leading-[1.05] font-light tracking-tight text-(--color-text) sm:text-6xl">
          Learn your <em className="ember-text pr-1 font-normal">unique rhythm</em>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-(--color-text-muted) sm:text-base">
          Type the exact challenge phrase {minRequired} times. Only cadence timing for this phrase is extracted —
          nothing else you type is ever recorded.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card variant="glow">
        {/* Sample progress */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="keycap flex h-9 w-9 items-center justify-center rounded-xl font-mono text-sm font-bold text-(--color-accent)">
              {currentSampleNum}
            </span>
            <span className="text-sm font-semibold text-(--color-text)">
              Sample {currentSampleNum} of {minRequired}
            </span>
          </div>
          <span className="font-mono text-xs font-medium text-(--color-text-muted) tabular-nums">
            {samplesCollected} / {minRequired} captured · {Math.round(progressPercent)}%
          </span>
        </div>

        <div
          className="mb-7 flex gap-1.5"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={Math.max(minRequired, 1)}
          aria-valuenow={samplesCollected}
          aria-label="Samples captured"
        >
          {Array.from({ length: Math.max(minRequired, 5) }).map((_, idx) => {
            const isDone = idx < samplesCollected;
            const isCurrent = idx === samplesCollected && !isReady;
            return (
              <div
                key={idx}
                className="h-2 flex-1 overflow-hidden rounded-full bg-(--color-border) shadow-(--field-shadow)"
              >
                <div
                  className={`h-full w-full origin-left rounded-full transition-transform duration-500 ease-(--ease-premium) ${
                    isDone
                      ? "bg-(image:--color-ember-gradient)"
                      : isCurrent
                        ? "animate-pulse bg-(--color-accent)/50"
                        : ""
                  }`}
                  style={{ transform: `scaleX(${isDone || isCurrent ? 1 : 0})` }}
                />
              </div>
            );
          })}
        </div>

        {isReady ? (
          <div className="animate-fadeIn flex flex-col items-center justify-center gap-6 py-8 text-center">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-success)_30%,transparent),transparent)]"
              />
              <span className="keycap relative flex h-20 w-20 items-center justify-center rounded-3xl text-(--color-success)">
                <Check size={36} strokeWidth={2.5} />
              </span>
            </div>
            <div className="max-w-md">
              <p className="font-display text-3xl font-medium tracking-tight text-(--color-text)">
                Your typing profile is ready
              </p>
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
                {lastResult?.training_message ??
                  "Your 3-classifier ensemble has been trained. You can now use your typing cadence as a behavioral second factor."}
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/dashboard")}>
              <span>Continue to dashboard</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        ) : (
          phrase && (
            <PhraseTypingBox key={boxKey} phrase={phrase} onComplete={handleComplete} disabled={isSubmitting} />
          )
        )}

        {/* Latest telemetry */}
        {lastResult && !isReady && (
          <div className="animate-fadeIn mt-7 border-t border-(--color-border) pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={14} className="text-(--color-accent)" />
              <span className="text-[11px] font-semibold tracking-[0.14em] text-(--color-text-secondary) uppercase">
                Latest sample · extracted features
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              <MiniStat
                icon={Clock}
                label="Mean Dwell"
                value={`${lastResult.feature_summary.mean_dwell_ms.toFixed(0)} ms`}
              />
              <MiniStat
                icon={Activity}
                label="Mean Flight"
                value={`${lastResult.feature_summary.mean_flight_ms.toFixed(0)} ms`}
              />
              <MiniStat
                icon={Gauge}
                label="Typing Speed"
                value={`${lastResult.feature_summary.typing_speed_cps.toFixed(1)} cps`}
              />
              <MiniStat
                icon={Cpu}
                label="Total Time"
                value={`${(lastResult.feature_summary.total_duration_ms / 1000).toFixed(1)} s`}
              />
            </div>
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-(--color-text-muted)">
        You can retrain or delete this typing profile at any time from your dashboard.
      </p>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-bg-subtle) p-3.5 shadow-(--field-shadow)">
      <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-(--color-text-muted) uppercase">
        <Icon size={11} className="text-(--color-accent)" />
        <span>{label}</span>
      </div>
      <p className="font-display mt-1.5 text-2xl font-medium text-(--color-text) tabular-nums">
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}
