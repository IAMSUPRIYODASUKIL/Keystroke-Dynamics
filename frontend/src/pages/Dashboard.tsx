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
} from "lucide-react";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState } from "@/components/EmptyState";
import { DecisionBadge, RiskBadge, StatusBadge } from "@/components/Badge";
import { BiometricRadar } from "@/components/BiometricRadar";
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
  if (!profile || !activity) return <PageLoader label="Loading security command dashboard…" />;

  const latestAttempt = activity.attempts[0];
  const profileReady = profile.user.typing_profile_status === "ready";

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Command Center
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Shield
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Welcome back, <strong className="text-[var(--color-text)] font-semibold">{profile.user.name}</strong>. Here's your live behavioral identity telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/demo">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <span>Demo Sandbox</span>
              <ArrowUpRight size={14} />
            </Button>
          </Link>
          <Link to="/enroll">
            <Button size="sm" className="flex items-center gap-1.5">
              <Fingerprint size={14} />
              <span>{profileReady ? "Recalibrate" : "Complete Enrollment"}</span>
            </Button>
          </Link>
        </div>
      </div>

      {notice && <Alert variant="info">{notice}</Alert>}

      {/* Telemetry Stat Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={Fingerprint}
          accent={profileReady ? "emerald" : "amber"}
          label="Typing Profile"
          value={
            profileReady ? "Calibrated" : profile.user.typing_profile_status === "in_progress" ? "In Progress" : "Not Started"
          }
          hint={profileReady ? "Ready for 2FA validation" : "Enrollment required"}
        />
        <StatTile
          icon={Layers}
          accent="cyan"
          label="Biometric Samples"
          value={`${profile.samples_collected} / ${profile.min_required}`}
          hint={`${Math.round((profile.samples_collected / Math.max(profile.min_required, 1)) * 100)}% minimum threshold`}
        />
        <StatTile
          icon={Cpu}
          accent="violet"
          label="Active ML Model"
          value={profile.active_model ? MODEL_LABELS[profile.active_model.model_type] : "Baseline"}
          hint={profile.active_model ? "Top F1-score selected" : "Awaiting training"}
        />
        <StatTile
          icon={Sparkles}
          accent="emerald"
          label="Model Accuracy"
          value={profile.active_model ? `${(profile.active_model.accuracy * 100).toFixed(1)}%` : "—"}
          hint={profile.active_model ? `F1: ${(profile.active_model.f1_score * 100).toFixed(1)}%` : "Unrated"}
        />
      </div>

      {!profileReady && (
        <Alert variant="warning">
          Your typing profile isn't fully calibrated yet ({profile.samples_collected}/{profile.min_required}{" "}
          samples). <Link className="underline font-semibold" to="/enroll">Continue enrollment</Link> to enable
          keystroke-based verification at login.
        </Alert>
      )}

      {/* Center Layout: Recent Activity & Live Risk Radar */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title={
            <div className="flex items-center gap-2">
              <History size={18} className="text-[var(--color-accent)]" />
              <span>Recent Verification Attempts</span>
            </div>
          }
          actions={
            <Link to="/activity" className="text-xs font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1">
              <span>View full audit log</span>
              <ArrowUpRight size={12} />
            </Link>
          }
        >
          {activity.attempts.length === 0 ? (
            <EmptyState title="No login attempts recorded" description="Authentication attempts will appear here in real time." />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {activity.attempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/90 p-3.5 backdrop-blur-md transition-all hover:border-[var(--color-border-glow)]"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="font-mono text-xs font-medium text-[var(--color-text-secondary)]">
                      {new Date(attempt.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Password: <strong className={attempt.password_correct ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                        {attempt.password_correct ? "Correct" : "Incorrect"}
                      </strong>
                      {attempt.similarity_score !== null && (
                        <span> · Biometric Similarity: <strong className="text-[var(--color-text)] font-semibold">{(attempt.similarity_score * 100).toFixed(0)}%</strong></span>
                      )}
                      {attempt.method_used && <span> ({MODEL_LABELS[attempt.method_used]})</span>}
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

        {/* Live Risk Radar Dial */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-[var(--color-accent)]" />
              <span>Telemetry Risk Gauge</span>
            </div>
          }
        >
          {latestAttempt ? (
            <div className="flex flex-col items-center justify-center gap-3 py-2 text-center">
              <BiometricRadar
                score={latestAttempt.similarity_score}
                riskLevel={latestAttempt.risk_level}
                size="md"
                label="Latest Session Score"
              />
              <p className="text-xs text-[var(--color-text-muted)] max-w-xs leading-relaxed">
                Evaluated with {latestAttempt.method_used ? MODEL_LABELS[latestAttempt.method_used] : "statistical baseline"} against enrolled profile.
              </p>
            </div>
          ) : (
            <EmptyState title="Awaiting session data" description="Log in once to view your live risk radar gauge." />
          )}
        </Card>
      </div>

      {/* Model & Profile Lifecycle Actions */}
      <Card
        title="Biometric Profile Lifecycle"
        subtitle="Retrain ensemble weights or delete captured biometric vectors from storage."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            isLoading={isTraining}
            onClick={handleRetrain}
            disabled={!profileReady}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isTraining ? "animate-spin" : ""} />
            <span>Retrain Classifier Ensemble</span>
          </Button>
          <Button
            variant="danger"
            isLoading={isDeleting}
            onClick={handleDeleteTypingData}
            className="flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span>Delete Biometric Profile</span>
          </Button>
          {!profileReady && (
            <StatusBadge label="Minimum 5 samples required to trigger training" tone="warning" />
          )}
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Deleting your profile permanently purges all raw keystroke timestamps and scikit-learn models. Your account password remains untouched.
        </p>
      </Card>
    </div>
  );
}

