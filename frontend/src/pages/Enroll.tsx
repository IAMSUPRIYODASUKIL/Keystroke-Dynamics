import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Activity,
  ArrowRight,
  Fingerprint,
  Cpu,
  Clock,
  Gauge,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { PhraseTypingBox } from "@/components/PhraseTypingBox";
import { BiometricRadar } from "@/components/BiometricRadar";
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
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#00f2fe", "#4facfe", "#10b981", "#8b5cf6"],
            });
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
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 },
            colors: ["#00f2fe", "#4facfe", "#10b981", "#8b5cf6", "#f59e0b"],
          });
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

  if (phrase === null && !error) return <PageLoader label="Loading your enrollment calibration cockpit…" />;

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
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-(--color-accent) backdrop-blur-md">
          <Fingerprint size={13} />
          <span>Biometric Rhythm Calibration</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-(--color-text) sm:text-3xl">
          Learn Your Unique Typing Rhythm
        </h1>
        <p className="mt-2 text-sm text-(--color-text-muted) max-w-lg mx-auto leading-relaxed">
          Type the exact challenge phrase {minRequired} times. We only extract microsecond cadence timing
          for this phrase — nothing else you type is ever recorded.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card variant="glow">
        {/* Sample Progress Tracker Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-(--color-accent)/15 font-mono text-xs font-bold text-(--color-accent)">
              {currentSampleNum}
            </span>
            <span className="font-semibold text-sm text-(--color-text)">
              Sample {currentSampleNum} of {minRequired}
            </span>
          </div>
          <span className="font-mono text-xs font-medium text-(--color-text-muted)">
            {samplesCollected} of {minRequired} Captured ({Math.round(progressPercent)}%)
          </span>
        </div>

        {/* Step Indicator Dots */}
        <div className="mb-5 flex gap-1.5">
          {Array.from({ length: Math.max(minRequired, 5) }).map((_, idx) => {
            const isDone = idx < samplesCollected;
            const isCurrent = idx === samplesCollected && !isReady;
            return (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  isDone
                    ? "bg-linear-to-r from-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : isCurrent
                      ? "bg-(--color-accent) animate-pulse shadow-[0_0_8px_rgba(0,242,254,0.5)]"
                      : "bg-(--color-border)"
                }`}
              />
            );
          })}
        </div>

        {isReady ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-5 animate-fadeIn">
            <div className="relative">
              <BiometricRadar
                score={1.0}
                riskLevel="low"
                size="lg"
                label="Biometric Baseline Established"
              />
            </div>
            <div className="max-w-md">
              <p className="text-xl font-bold text-emerald-400">
                Your Typing Profile Is Ready!
              </p>
              <p className="mt-2 text-xs text-(--color-text-muted) leading-relaxed">
                {lastResult?.training_message ??
                  "Your 3-classifier ensemble has been trained. You can now use your typing cadence as a 2FA behavioral biometric."}
              </p>
            </div>
            <Button size="lg" className="px-8 flex items-center gap-2" onClick={() => navigate("/dashboard")}>
              <Sparkles size={16} />
              <span>Continue to Command Dashboard</span>
              <ArrowRight size={16} />
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

        {/* Live Feature Engineering Telemetry Breakdown */}
        {lastResult && !isReady && (
          <div className="mt-6 pt-5 border-t border-(--color-border)">
            <div className="mb-3 flex items-center gap-2">
              <Activity size={14} className="text-(--color-accent)" />
              <span className="text-xs font-semibold uppercase tracking-wider text-(--color-text-secondary)">
                Latest Keystroke Telemetry Vectors
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
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
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface-raised)/80 p-3 backdrop-blur-md">
      <div className="flex items-center justify-center gap-1 text-[10px] font-semibold tracking-wider text-(--color-text-muted) uppercase">
        <Icon size={11} className="text-(--color-accent)" />
        <span>{label}</span>
      </div>
      <p className="mt-1 font-mono-key text-base font-bold text-(--color-text)">{value}</p>
    </div>
  );
}

