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
import { PageHeader } from "@/components/PageHeader";
import { Stagger, StaggerItem } from "@/components/Reveal";
import { PhraseTypingBox } from "@/components/PhraseTypingBox";
import { RiskBadge } from "@/components/Badge";
import { BiometricRadar } from "@/components/BiometricRadar";
import { profileApi, typingApi, friendlyErrorMessage } from "@/services/api";
import type { KeystrokeEvent, ProfileResponse, VerifyPreviewResponse } from "@/types";
import { MODEL_LABELS } from "@/utils/format";

const SCENARIOS = [
  {
    icon: ShieldCheck,
    tone: "text-(--color-success)",
    title: "1. Genuine owner match",
    body: "Type fluently at your regular cadence. The model should produce high similarity (above 75%) and low risk.",
  },
  {
    icon: ShieldAlert,
    tone: "text-(--color-danger)",
    title: "2. Deliberate cadence mismatch",
    body: "Hunt-and-peck each letter with deliberate 0.5s pauses. Flight times spike, flagging medium or high risk.",
  },
  {
    icon: Activity,
    tone: "text-(--color-warning)",
    title: "3. Peer impostor trial",
    body: "Have a colleague type the phrase on your keyboard. Their natural cadence should diverge from your profile.",
  },
];

/** A safe sandbox for demos: score typing samples against your enrolled profile without touching the audit log. */
export function DemoMode() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [result, setResult] = useState<VerifyPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [boxKey, setBoxKey] = useState(0);

  useEffect(() => {
    profileApi
      .get()
      .then(setProfile)
      .catch((err) => setError(friendlyErrorMessage(err)));
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
  if (!profile) return <PageLoader label="Preparing the demo sandbox…" />;

  const notReady = profile.user.typing_profile_status !== "ready";

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-(--color-warning)/30 bg-(--color-warning)/10 px-3 py-1 text-xs font-semibold text-(--color-warning)">
            <PlaySquare size={12} />
            Presentation mode
          </span>
        }
        title={
          <>
            Live <em className="ember-text pr-1 font-normal">sandbox</em>
          </>
        }
        description="Instant scoring against your enrolled profile, without modifying audit history or requiring credentials."
      />

      {error && <Alert variant="error">{error}</Alert>}

      {notReady ? (
        <Alert variant="warning">
          Please complete typing enrollment first — the sandbox needs a calibrated behavioral baseline to score against.
        </Alert>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card
            variant="glow"
            title={
              <span className="flex items-center gap-3">
                <Fingerprint size={20} className="text-(--color-accent)" />
                <span>Live sample evaluation</span>
              </span>
            }
            subtitle={!result ? "Type the phrase naturally, or test an impostor rhythm" : "Scoring complete"}
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

          <Card
            title={
              <span className="flex items-center gap-3">
                <Lightbulb size={20} className="text-(--color-warning)" />
                <span>Demonstration scenarios</span>
              </span>
            }
            subtitle="Experiments to run live for evaluators"
          >
            <div className="flex flex-col gap-3">
              {SCENARIOS.map(({ icon: Icon, tone, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-(--color-border) bg-(--color-bg-subtle) p-4 shadow-(--field-shadow)"
                >
                  <strong className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-(--color-text)">
                    <Icon size={15} className={tone} />
                    {title}
                  </strong>
                  <p className="text-xs leading-relaxed text-(--color-text-muted)">{body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Card
        title={
          <span className="flex items-center gap-3">
            <Cpu size={20} className="text-(--color-accent)" />
            <span>Target model architecture</span>
          </span>
        }
      >
        <Stagger step={0.07} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StaggerItem>
            <StatTile
              icon={Fingerprint}
              accent="emerald"
              label="Enrolled State"
              value={profile.user.typing_profile_status.replace("_", " ")}
            />
          </StaggerItem>
          <StaggerItem>
            <StatTile
              icon={Layers}
              accent="ember"
              label="Baseline Samples"
              value={`${profile.samples_collected} / ${profile.min_required}`}
            />
          </StaggerItem>
          <StaggerItem>
            <StatTile
              icon={Cpu}
              accent="ember"
              label="Active Classifier"
              value={profile.active_model ? MODEL_LABELS[profile.active_model.model_type] : "Baseline"}
            />
          </StaggerItem>
          <StaggerItem>
            <StatTile
              icon={Sparkles}
              accent="emerald"
              label="Ensemble F1 Score"
              value={profile.active_model ? `${(profile.active_model.f1_score * 100).toFixed(1)}%` : "—"}
            />
          </StaggerItem>
        </Stagger>
      </Card>
    </div>
  );
}

function ResultPanel({ result, onReset }: { result: VerifyPreviewResponse; onReset: () => void }) {
  const riskLevel = result.match ? "low" : result.similarity_score >= 0.4 ? "medium" : "high";
  return (
    <div className="animate-fadeIn flex flex-col items-center gap-5 py-4 text-center">
      <BiometricRadar
        score={result.similarity_score}
        riskLevel={riskLevel}
        size="lg"
        label={`Scored via ${MODEL_LABELS[result.method_used]}`}
      />

      <div className="flex items-center gap-3">
        <RiskBadge level={riskLevel} />
        <span className="text-sm font-semibold text-(--color-text)">{result.similarity_label}</span>
      </div>

      <p className="max-w-sm text-xs leading-relaxed text-(--color-text-muted)">
        {result.match
          ? "Cadence metrics align within authentic standard deviation thresholds."
          : "Cadence vectors exceed normal variance boundaries — flagged as an impostor anomaly."}
      </p>

      <Button variant="secondary" size="sm" onClick={onReset} className="mt-2">
        <RefreshCw size={13} />
        <span>Evaluate another sample</span>
      </Button>
    </div>
  );
}
