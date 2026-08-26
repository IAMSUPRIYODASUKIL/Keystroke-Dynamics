import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState } from "@/components/EmptyState";
import { DecisionBadge, RiskBadge, StatusBadge } from "@/components/Badge";
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
  if (!profile || !activity) return <PageLoader label="Loading your dashboard…" />;

  const latestAttempt = activity.attempts[0];
  const profileReady = profile.user.typing_profile_status === "ready";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Welcome back, {profile.user.name}</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Here's the current state of your account and typing profile.
        </p>
      </div>

      {notice && <Alert variant="info">{notice}</Alert>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Typing profile"
          value={
            profileReady ? "Ready" : profile.user.typing_profile_status === "in_progress" ? "In progress" : "Not started"
          }
        />
        <StatTile
          label="Samples collected"
          value={`${profile.samples_collected} / ${profile.min_required}`}
        />
        <StatTile
          label="Active model"
          value={profile.active_model ? MODEL_LABELS[profile.active_model.model_type] : "Statistical baseline"}
        />
        <StatTile
          label="Model accuracy"
          value={profile.active_model ? `${(profile.active_model.accuracy * 100).toFixed(1)}%` : "—"}
        />
      </div>

      {!profileReady && (
        <Alert variant="warning">
          Your typing profile isn't fully enrolled yet ({profile.samples_collected}/{profile.min_required}{" "}
          samples). <Link className="underline" to="/enroll">Continue enrollment</Link> to enable
          typing-based verification at login.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Recent authentication attempts"
          actions={
            <Link to="/activity" className="text-xs text-[var(--color-accent)] hover:underline">
              View all
            </Link>
          }
        >
          {activity.attempts.length === 0 ? (
            <EmptyState title="No login attempts yet" description="Attempts will appear here once you log in." />
          ) : (
            <ul className="flex flex-col gap-2">
              {activity.attempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm"
                >
                  <div>
                    <p className="text-[var(--color-text-muted)]">
                      {new Date(attempt.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Password {attempt.password_correct ? "correct" : "incorrect"}
                      {attempt.similarity_score !== null &&
                        ` · similarity ${(attempt.similarity_score * 100).toFixed(0)}%`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={attempt.risk_level} />
                    <DecisionBadge decision={attempt.decision} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Current risk indicator">
          {latestAttempt ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <RiskBadge level={latestAttempt.risk_level} />
              <p className="text-sm text-[var(--color-text-muted)]">
                Based on your most recent login attempt, evaluated with{" "}
                {latestAttempt.method_used ? MODEL_LABELS[latestAttempt.method_used] : "no model"}.
              </p>
            </div>
          ) : (
            <EmptyState title="No data yet" description="Log in once to see your risk indicator here." />
          )}
        </Card>
      </div>

      <Card title="Manage your typing profile">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" isLoading={isTraining} onClick={handleRetrain} disabled={!profileReady}>
            Retrain my model
          </Button>
          <Button variant="danger" isLoading={isDeleting} onClick={handleDeleteTypingData}>
            Delete typing profile
          </Button>
          {!profileReady && (
            <StatusBadge label="Enroll more samples before training" tone="neutral" />
          )}
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Deleting your typing profile removes all captured keystroke samples and trained models. Your
          account and password are not affected.
        </p>
      </Card>
    </div>
  );
}
