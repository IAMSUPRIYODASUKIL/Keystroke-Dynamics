import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Fingerprint,
  Cpu,
  Sparkles,
  RefreshCw,
  Trash2,
  ArrowUpRight,
  ShieldAlert,
  Layers,
  History,
  Check,
  X,
} from "lucide-react";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState } from "@/components/EmptyState";
import { DecisionBadge, RiskBadge, StatusBadge } from "@/components/Badge";
import { BiometricRadar } from "@/components/BiometricRadar";
import { Stagger, StaggerItem } from "@/components/Reveal";
import { activityApi, mlApi, profileApi, friendlyErrorMessage } from "@/services/api";
import type { ActivityResponse, ProfileResponse } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { MODEL_LABELS } from "@/utils/format";

export function Dashboard() {
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [profileData, activityData] = await Promise.all([profileApi.get(), activityApi.history(5)]);
      setProfile(profileData);
      setActivity(activityData);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRetrain() {
    setIsTraining(true);
    setNotice(null);
    try {
      const run = await mlApi.trainMine();
      setNotice(run.message ?? `Training ${run.status}.`);
      await load();
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setIsTraining(false);
    }
  }

  async function handleDeleteTypingData() {
    if (!window.confirm("This permanently deletes your typing samples and trained model. Continue?")) {
      return;
    }
    setIsDeleting(true);
    try {
      await profileApi.deleteTypingData();
      await load();
      await refreshProfile();
      setNotice("Your typing profile has been deleted.");
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!profile || !activity) return <PageLoader label="Loading your command center…" />;

  const latestAttempt = activity.attempts[0];
  const profileReady = profile.user.typing_profile_status === "ready";

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-(--color-success)/30 bg-(--color-success)/10 px-3 py-1 text-xs font-semibold text-(--color-success)">
            <span className="h-1.5 w-1.5 rounded-full bg-(--color-success)" />
            Active shield
          </span>
          <h1 className="font-display text-balance mt-4 text-4xl leading-[1.05] font-light tracking-tight text-(--color-text) sm:text-6xl">
            Command <em className="ember-text pr-1 font-normal">center</em>
          </h1>
          <p className="mt-4 text-sm text-(--color-text-muted) sm:text-base">
            Welcome back, <strong className="font-semibold text-(--color-text)">{profile.user.name}</strong>. Here is
            your live behavioral identity telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/demo" tabIndex={-1}>
            <Button variant="secondary" size="sm">
              <span>Demo Sandbox</span>
              <ArrowUpRight size={14} />
            </Button>
          </Link>
          <Link to="/enroll" tabIndex={-1}>
            <Button size="sm">
              <Fingerprint size={14} />
              <span>{profileReady ? "Recalibrate" : "Complete Enrollment"}</span>
            </Button>
          </Link>
        </div>
      </div>

      {notice && <Alert variant="info">{notice}</Alert>}

      {/* Telemetry tiles */}
      <Stagger step={0.07} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatTile
            icon={Fingerprint}
            accent={profileReady ? "emerald" : "amber"}
            label="Typing Profile"
            value={
              profileReady
                ? "Calibrated"
                : profile.user.typing_profile_status === "in_progress"
                  ? "In Progress"
                  : "Not Started"
            }
            hint={profileReady ? "Ready for 2FA validation" : "Enrollment required"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={Layers}
            accent="ember"
            label="Biometric Samples"
            value={`${profile.samples_collected} / ${profile.min_required}`}
            hint={`${Math.round((profile.samples_collected / Math.max(profile.min_required, 1)) * 100)}% minimum threshold`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={Cpu}
            accent="ember"
            label="Active ML Model"
            value={profile.active_model ? MODEL_LABELS[profile.active_model.model_type] : "Baseline"}
            hint={profile.active_model ? "Top F1-score selected" : "Awaiting training"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={Sparkles}
            accent="emerald"
            label="Model Accuracy"
            value={profile.active_model ? `${(profile.active_model.accuracy * 100).toFixed(1)}%` : "—"}
            hint={profile.active_model ? `F1: ${(profile.active_model.f1_score * 100).toFixed(1)}%` : "Unrated"}
          />
        </StaggerItem>
      </Stagger>

      {!profileReady && (
        <Alert variant="warning">
          Your typing profile isn&apos;t fully calibrated yet ({profile.samples_collected}/{profile.min_required}{" "}
          samples).{" "}
          <Link className="font-semibold underline underline-offset-4" to="/enroll">
            Continue enrollment
          </Link>{" "}
          to enable keystroke-based verification at login.
        </Alert>
      )}

      {/* Activity + gauge */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title={
            <span className="flex items-center gap-3">
              <History size={20} className="text-(--color-accent)" />
              <span>Recent verification attempts</span>
            </span>
          }
          actions={
            <Link
              to="/activity"
              className="flex items-center gap-1 text-xs font-semibold text-(--color-accent) hover:underline hover:underline-offset-4"
            >
              <span>Full audit log</span>
              <ArrowUpRight size={12} />
            </Link>
          }
        >
          {activity.attempts.length === 0 ? (
            <EmptyState
              title="No login attempts recorded"
              description="Authentication attempts will appear here in real time."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {activity.attempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-bg-subtle) py-3.5 pr-4 pl-5 transition-colors duration-300 hover:border-(--color-border-glow) sm:flex-row sm:items-center"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-0 left-0 w-1 ${
                      attempt.decision === "success" ? "bg-(--color-success)" : "bg-(--color-danger)"
                    }`}
                  />
                  <div className="flex flex-col gap-1">
                    <p className="font-mono text-xs font-medium text-(--color-text-secondary)">
                      {new Date(attempt.created_at).toLocaleString()}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-(--color-text-muted)">
                      <span>Password</span>
                      <strong
                        className={`inline-flex items-center gap-1 font-semibold ${
                          attempt.password_correct ? "text-(--color-success)" : "text-(--color-danger)"
                        }`}
                      >
                        {attempt.password_correct ? <Check size={12} /> : <X size={12} />}
                        {attempt.password_correct ? "Correct" : "Incorrect"}
                      </strong>
                      {attempt.similarity_score !== null && (
                        <span>
                          · Similarity{" "}
                          <strong className="font-semibold text-(--color-text)">
                            {(attempt.similarity_score * 100).toFixed(0)}%
                          </strong>
                        </span>
                      )}
                      {attempt.method_used && <span>({MODEL_LABELS[attempt.method_used]})</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <RiskBadge level={attempt.risk_level} />
                    <DecisionBadge decision={attempt.decision} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title={
            <span className="flex items-center gap-3">
              <ShieldAlert size={20} className="text-(--color-accent)" />
              <span>Risk gauge</span>
            </span>
          }
        >
          {latestAttempt ? (
            <div className="flex flex-col items-center justify-center gap-4 py-2 text-center">
              <BiometricRadar
                score={latestAttempt.similarity_score}
                riskLevel={latestAttempt.risk_level}
                size="md"
                label="Latest session score"
              />
              <p className="max-w-xs text-xs leading-relaxed text-(--color-text-muted)">
                Evaluated with{" "}
                {latestAttempt.method_used ? MODEL_LABELS[latestAttempt.method_used] : "statistical baseline"} against
                your enrolled profile.
              </p>
            </div>
          ) : (
            <EmptyState title="Awaiting session data" description="Log in once to view your live risk gauge." />
          )}
        </Card>
      </div>

      {/* Lifecycle */}
      <Card
        title="Biometric profile lifecycle"
        subtitle="Retrain ensemble weights or delete captured biometric vectors from storage."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" isLoading={isTraining} onClick={handleRetrain} disabled={!profileReady}>
            <RefreshCw size={14} className={isTraining ? "animate-spin" : ""} />
            <span>Retrain classifier ensemble</span>
          </Button>
          <Button variant="danger" isLoading={isDeleting} onClick={handleDeleteTypingData}>
            <Trash2 size={14} />
            <span>Delete biometric profile</span>
          </Button>
          {!profileReady && <StatusBadge label="Minimum 5 samples required to trigger training" tone="warning" />}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-(--color-text-muted)">
          Deleting your profile permanently purges all raw keystroke timestamps and scikit-learn models. Your account
          password remains untouched.
        </p>
      </Card>
    </div>
  );
}
