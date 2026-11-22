import { useEffect, useState, useMemo } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Download, Activity, History, Check, X } from "lucide-react";
import { motion } from "motion/react";
import clsx from "clsx";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Stagger, StaggerItem } from "@/components/Reveal";
import { SPRING } from "@/lib/motion";
import { DecisionBadge, RiskBadge } from "@/components/Badge";
import { activityApi, friendlyErrorMessage } from "@/services/api";
import type { ActivityResponse } from "@/types";
import { MODEL_LABELS } from "@/utils/format";

type FilterMode = "all" | "success" | "failed" | "high_risk";

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "high_risk", label: "Anomalies" },
];

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
  if (!activity) return <PageLoader label="Loading your security audit feed…" />;

  const totalAttempts = activity.total_success + activity.total_failed;
  const successRate = totalAttempts > 0 ? Math.round((activity.total_success / totalAttempts) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-(--color-accent)/30 bg-(--color-accent)/10 px-3 py-1 text-xs font-semibold text-(--color-accent)">
            <History size={12} />
            Tamper-evident log
          </span>
        }
        title={
          <>
            Security <em className="ember-text pr-1 font-normal">audit</em> feed
          </>
        }
        description="A verification log for every authentication attempt against your identity."
        actions={
          <Button variant="secondary" size="sm" onClick={handleExportCSV} disabled={activity.attempts.length === 0}>
            <Download size={14} />
            <span>Export audit CSV</span>
          </Button>
        }
      />

      <Stagger step={0.07} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <StatTile icon={CheckCircle2} accent="emerald" label="Successful Logins" value={activity.total_success} hint="Consensus verified" />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon={XCircle} accent="rose" label="Failed Challenges" value={activity.total_failed} hint="Intercepted / rejected" />
        </StaggerItem>
        <StaggerItem className="col-span-2 sm:col-span-1">
          <StatTile
            icon={ShieldCheck}
            accent="ember"
            label="Verification Rate"
            value={totalAttempts > 0 ? `${successRate}%` : "—"}
            hint={`${totalAttempts} total attempts`}
          />
        </StaggerItem>
      </Stagger>

      {/* Audit Log Card */}
      <Card
        variant="glow"
        title={
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-(--color-accent)" />
            <span>Attempt Telemetry History</span>
          </div>
        }
        subtitle="Chronological audit records with millisecond timestamps and multi-factor decision vectors"
        actions={
          <div
            role="tablist"
            aria-label="Filter attempts"
            className="flex items-center gap-0.5 rounded-full border border-(--color-border) bg-(--color-bg-subtle) p-0.5 text-xs shadow-(--field-shadow)"
          >
            {FILTERS.map(({ value, label }) => {
              const count =
                value === "all"
                  ? activity.attempts.length
                  : value === "success"
                    ? activity.total_success
                    : value === "failed"
                      ? activity.total_failed
                      : null;
              const active = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(value)}
                  className={clsx(
                    "relative cursor-pointer rounded-full px-3 py-1.5 font-medium transition-colors duration-300",
                    active ? "text-(--color-on-accent)" : "text-(--color-text-muted) hover:text-(--color-text)",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="activity-filter-pill"
                      transition={SPRING.indicator}
                      className="absolute inset-0 rounded-full bg-(image:--color-accent-gradient)"
                    />
                  )}
                  <span className="relative">
                    {label}
                    {count !== null && ` (${count})`}
                  </span>
                </button>
              );
            })}
          </div>
        }
      >
        {filteredAttempts.length === 0 ? (
          <EmptyState
            title="No records matching filter"
            description="Clear filter or authenticate to generate fresh audit entries."
          />
        ) : (
          <div className="overflow-x-auto max-h-[34rem] overflow-y-auto rounded-2xl border border-(--color-border) bg-(--color-bg-subtle) shadow-(--field-shadow)">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-(--color-border) bg-(--color-surface-solid) text-[11px] font-semibold tracking-[0.12em] text-(--color-text-muted) uppercase">
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Password State</th>
                  <th className="px-4 py-3.5">Biometric Cadence</th>
                  <th className="px-4 py-3.5">Ensemble Model</th>
                  <th className="px-4 py-3.5">Risk Vector</th>
                  <th className="px-4 py-3.5 text-center">Consensus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border-subtle) font-mono text-xs">
                {filteredAttempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="transition-colors duration-200 hover:bg-(--color-surface-highlight)"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap text-(--color-text-secondary)">
                      {new Date(attempt.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-sans">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1.5 font-semibold",
                          attempt.password_correct ? "text-(--color-success)" : "text-(--color-danger)",
                        )}
                      >
                        {attempt.password_correct ? <Check size={13} /> : <X size={13} />}
                        {attempt.password_correct ? "Correct" : "Incorrect"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-sans">
                      {attempt.similarity_score !== null ? (
                        <span className="font-semibold text-(--color-text)">
                          {(attempt.similarity_score * 100).toFixed(0)}% Match
                        </span>
                      ) : (
                        <span className="text-(--color-text-muted)">Unscored</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-sans text-(--color-text-muted)">
                      {attempt.method_used ? MODEL_LABELS[attempt.method_used] : "—"}
                    </td>
                    <td className="px-4 py-3.5 font-sans">
                      <RiskBadge level={attempt.risk_level} />
                    </td>
                    <td className="px-4 py-3.5 font-sans text-center">
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

