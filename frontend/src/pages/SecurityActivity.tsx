import { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Download,
  Activity,
  History,
} from "lucide-react";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState } from "@/components/EmptyState";
import { DecisionBadge, RiskBadge } from "@/components/Badge";
import { activityApi, friendlyErrorMessage } from "@/services/api";
import type { ActivityResponse } from "@/types";
import { MODEL_LABELS } from "@/utils/format";

type FilterMode = "all" | "success" | "failed" | "high_risk";

export function SecurityActivity() {
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    activityApi
      .history(50)
      .then(setActivity)
      .catch((err) => setError(friendlyErrorMessage(err)));
  }, []);

  const filteredAttempts = useMemo(() => {
    if (!activity) return [];
    if (filter === "success") {
      return activity.attempts.filter((a) => a.decision === "success");
    }
    if (filter === "failed") {
      return activity.attempts.filter((a) => a.decision === "failed");
    }
    if (filter === "high_risk") {
      return activity.attempts.filter((a) => a.risk_level === "high" || a.risk_level === "medium");
    }
    return activity.attempts;
  }, [activity, filter]);

  const handleExportCSV = () => {
    if (!activity || activity.attempts.length === 0) return;

    const headers = ["Timestamp", "Decision", "Risk Level", "Password Correct", "Similarity Score", "Method Used"];
    const rows = activity.attempts.map((a) => [
      new Date(a.created_at).toISOString(),
      a.decision,
      a.risk_level,
      a.password_correct ? "true" : "false",
      a.similarity_score !== null ? (a.similarity_score * 100).toFixed(1) + "%" : "N/A",
      a.method_used ? MODEL_LABELS[a.method_used] : "None",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `keystroke_security_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!activity) return <PageLoader label="Loading tamper-evident security audit feed…" />;

  const totalAttempts = activity.total_success + activity.total_failed;
  const successRate = totalAttempts > 0 ? Math.round((activity.total_success / totalAttempts) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Security Audit Feed
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
              <History size={12} />
              Tamper-Evident Log
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Cryptographic and behavioral verification log for every authentication attempt against your identity.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          disabled={activity.attempts.length === 0}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download size={14} />
          <span>Export Audit CSV</span>
        </Button>
      </div>

      {/* Telemetry Stat Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile
          icon={CheckCircle2}
          accent="emerald"
          label="Successful Logins"
          value={activity.total_success}
          hint="Consensus verified"
        />
        <StatTile
          icon={XCircle}
          accent="rose"
          label="Failed Challenges"
          value={activity.total_failed}
          hint="Intercepted / rejected"
        />
        <StatTile
          icon={ShieldCheck}
          accent="cyan"
          label="Verification Rate"
          value={totalAttempts > 0 ? `${successRate}%` : "—"}
          hint={`${totalAttempts} total attempts`}
        />
      </div>

      {/* Audit Log Card */}
      <Card
        variant="glow"
        title={
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[var(--color-accent)]" />
            <span>Attempt Telemetry History</span>
          </div>
        }
        subtitle="Chronological audit records with millisecond timestamps and multi-factor decision vectors"
        actions={
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-1 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                filter === "all"
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-semibold shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              All ({activity.attempts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("success")}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                filter === "success"
                  ? "bg-emerald-500/15 text-emerald-400 font-semibold shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Success ({activity.total_success})
            </button>
            <button
              type="button"
              onClick={() => setFilter("high_risk")}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                filter === "high_risk"
                  ? "bg-amber-500/15 text-amber-400 font-semibold shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Anomalies
            </button>
          </div>
        }
      >
        {filteredAttempts.length === 0 ? (
          <EmptyState
            title="No records matching filter"
            description="Clear filter or authenticate to generate fresh audit entries."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/60 backdrop-blur-md">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Password State</th>
                  <th className="py-3 px-4">Biometric Cadence</th>
                  <th className="py-3 px-4">Ensemble Model</th>
                  <th className="py-3 px-4">Risk Vector</th>
                  <th className="py-3 px-4 text-center">Consensus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-xs font-mono">
                {filteredAttempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="hover:bg-[var(--color-surface-highlight)] transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-[var(--color-text-secondary)]">
                      {new Date(attempt.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={attempt.password_correct ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                        {attempt.password_correct ? "✓ Correct" : "✗ Incorrect"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {attempt.similarity_score !== null ? (
                        <span className="font-semibold text-[var(--color-text)]">
                          {(attempt.similarity_score * 100).toFixed(0)}% Match
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">Unscored</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-[var(--color-text-muted)]">
                      {attempt.method_used ? MODEL_LABELS[attempt.method_used] : "—"}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <RiskBadge level={attempt.risk_level} />
                    </td>
                    <td className="py-3 px-4 font-sans text-center">
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

