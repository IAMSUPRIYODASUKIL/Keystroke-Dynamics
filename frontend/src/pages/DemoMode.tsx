import { useCallback, useEffect, useState } from "react";
import {
  PlaySquare,
  Sparkles,
  Fingerprint,
  Layers,
  Cpu,
  RefreshCw,
  Lightbulb,
  ShieldCheck,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { PhraseTypingBox } from "@/components/PhraseTypingBox";
import { RiskBadge } from "@/components/Badge";
import { BiometricRadar } from "@/components/BiometricRadar";
import { profileApi, typingApi, friendlyErrorMessage } from "@/services/api";
import type { KeystrokeEvent, ProfileResponse, VerifyPreviewResponse } from "@/types";
import { MODEL_LABELS } from "@/utils/format";

/** A world-class safe sandbox for viva/presentations: score typing samples against
 * your enrolled profile in real time with instant radar visualizer and simulation modes. */
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
  if (!profile) return <PageLoader label="Initializing live demonstration sandbox…" />;

  const notReady = profile.user.typing_profile_status !== "ready";

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-(--color-text) sm:text-3xl">
              Live Viva Sandbox
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
              <PlaySquare size={12} />
              Presentation Mode
            </span>
          </div>
          <p className="mt-1 text-sm text-(--color-text-muted)">
            Instant sandboxed scoring against your enrolled profile without modifying audit histories or requiring credentials.
          </p>
        </div>
      </div>

      {notReady ? (
        <Alert variant="warning">
          Please complete typing enrollment first — the sandbox requires a calibrated behavioral baseline to score against.
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Sandbox Terminal */}
          <Card
            variant="glow"
            title={
              <div className="flex items-center gap-2">
                <Fingerprint size={18} className="text-(--color-accent)" />
                <span>Live Sample Evaluation</span>
              </div>
            }
            subtitle={!result ? "Type the phrase naturally or test an impostor rhythm" : "Scoring complete"}
          >
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

          {/* Imposter vs Authentic Simulation Guide */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-400" />
                <span>Viva Demonstration Scenarios</span>
              </div>
            }
            subtitle="Experiments to showcase live to professors or evaluators"
          >
            <div className="flex flex-col gap-3 text-xs text-(--color-text-secondary)">
              <div className="rounded-xl border border-(--color-border) bg-(--color-surface-raised)/70 p-3">
                <strong className="text-(--color-text) font-semibold flex items-center gap-1.5 mb-1">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  1. Genuine Owner Match
                </strong>
                <p className="text-(--color-text-muted) leading-relaxed">
                  Type fluently at your regular typing cadence. The model will produce high similarity (&gt;75%) and low risk.
                </p>
              </div>

              <div className="rounded-xl border border-(--color-border) bg-(--color-surface-raised)/70 p-3">
                <strong className="text-(--color-text) font-semibold flex items-center gap-1.5 mb-1">
                  <ShieldAlert size={14} className="text-rose-400" />
                  2. Deliberate Cadence Mismatch (Slow / Hesitant)
                </strong>
                <p className="text-(--color-text-muted) leading-relaxed">
                  Hunt-and-peck each letter with deliberate 0.5s pauses. Flight times will spike, flagging Medium/High Risk.
                </p>
              </div>

              <div className="rounded-xl border border-(--color-border) bg-(--color-surface-raised)/70 p-3">
                <strong className="text-(--color-text) font-semibold flex items-center gap-1.5 mb-1">
                  <Activity size={14} className="text-amber-400" />
                  3. Peer Impostor Trial
                </strong>
                <p className="text-(--color-text-muted) leading-relaxed">
                  Have a colleague type the phrase on your keyboard. Their natural cadence will diverge from your vector weights.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Model Telemetry Snapshot */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-(--color-accent)" />
            <span>Target Model Architecture</span>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            icon={Fingerprint}
            accent="emerald"
            label="Enrolled State"
            value={profile.user.typing_profile_status.replace("_", " ")}
          />
          <StatTile
            icon={Layers}
            accent="cyan"
            label="Baseline Samples"
            value={`${profile.samples_collected} / ${profile.min_required}`}
          />
          <StatTile
            icon={Cpu}
            accent="violet"
            label="Active Classifier"
            value={profile.active_model ? MODEL_LABELS[profile.active_model.model_type] : "Baseline"}
          />
          <StatTile
            icon={Sparkles}
            accent="emerald"
            label="Ensemble F1 Score"
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
    <div className="flex flex-col items-center gap-4 py-4 text-center animate-fadeIn">
      <BiometricRadar
        score={result.similarity_score}
        riskLevel={riskLevel}
        size="lg"
        label={`Scored via ${MODEL_LABELS[result.method_used]}`}
      />

      <div className="flex items-center gap-2">
        <RiskBadge level={riskLevel} />
        <span className="font-semibold text-sm text-(--color-text)">
          {result.similarity_label}
        </span>
      </div>

      <p className="max-w-sm text-xs leading-relaxed text-(--color-text-muted)">
        {result.match
          ? "Cadence metrics align within authentic standard deviation thresholds."
          : "Cadence vectors exceed normal variance boundaries — flagged as an impostor anomaly."}
      </p>

      <Button variant="secondary" size="sm" onClick={onReset} className="flex items-center gap-1.5 mt-2">
        <RefreshCw size={13} />
        <span>Evaluate Another Sample</span>
      </Button>
    </div>
  );
}

