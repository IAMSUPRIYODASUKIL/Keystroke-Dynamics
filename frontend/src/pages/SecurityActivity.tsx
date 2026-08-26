import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState } from "@/components/EmptyState";
import { DecisionBadge, RiskBadge } from "@/components/Badge";
import { activityApi, friendlyErrorMessage } from "@/services/api";
import type { ActivityResponse } from "@/types";
import { MODEL_LABELS } from "@/utils/format";

export function SecurityActivity() {
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    activityApi
      .history(50)
      .then(setActivity)
      .catch((err) => setError(friendlyErrorMessage(err)));
  }, []);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!activity) return <PageLoader label="Loading activity…" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Security activity</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          A full audit trail of every login attempt against your account.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="Successful logins" value={activity.total_success} />
        <StatTile label="Failed attempts" value={activity.total_failed} />
        <StatTile
          label="Success rate"
          value={
            activity.total_success + activity.total_failed > 0
              ? `${Math.round((activity.total_success / (activity.total_success + activity.total_failed)) * 100)}%`
              : "—"
          }
        />
      </div>

      <Card title="Attempt history">
        {activity.attempts.length === 0 ? (
          <EmptyState title="No attempts recorded" description="Your login attempts will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-[var(--color-text-muted)] uppercase">
                  <th className="py-2 pr-4">Date &amp; time</th>
                  <th className="py-2 pr-4">Password</th>
                  <th className="py-2 pr-4">Typing result</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Risk</th>
                  <th className="py-2">Decision</th>
                </tr>
              </thead>
              <tbody>
                {activity.attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-t border-[var(--color-border)]">
                    <td className="py-2 pr-4 whitespace-nowrap text-[var(--color-text-muted)]">
                      {new Date(attempt.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">{attempt.password_correct ? "Correct" : "Incorrect"}</td>
                    <td className="py-2 pr-4">
                      {attempt.similarity_score !== null
                        ? `${(attempt.similarity_score * 100).toFixed(0)}% similarity`
                        : "Not evaluated"}
                    </td>
                    <td className="py-2 pr-4">{attempt.method_used ? MODEL_LABELS[attempt.method_used] : "—"}</td>
                    <td className="py-2 pr-4">
                      <RiskBadge level={attempt.risk_level} />
                    </td>
                    <td className="py-2">
                      <DecisionBadge decision={attempt.decision} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
