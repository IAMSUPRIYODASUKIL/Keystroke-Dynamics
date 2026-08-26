import clsx from "clsx";
import type { AuthDecision, RiskLevel } from "@/types";

const RISK_STYLES: Record<RiskLevel, string> = {
  low: "bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/30",
  medium: "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-[var(--color-warning)]/30",
  high: "bg-[var(--color-danger)]/15 text-[var(--color-danger)] border-[var(--color-danger)]/30",
  unknown: "bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)] border-[var(--color-border)]",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
  unknown: "Not evaluated",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        RISK_STYLES[level],
      )}
    >
      {RISK_LABELS[level]}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: AuthDecision }) {
  const success = decision === "success";
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        success
          ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/15 text-[var(--color-success)]"
          : "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
      )}
    >
      {success ? "Success" : "Failed"}
    </span>
  );
}

export function StatusBadge({ label, tone }: { label: string; tone: "neutral" | "success" | "warning" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "success" &&
          "border-[var(--color-success)]/30 bg-[var(--color-success)]/15 text-[var(--color-success)]",
        tone === "warning" &&
          "border-[var(--color-warning)]/30 bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
        tone === "neutral" &&
          "border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]",
      )}
    >
      {label}
    </span>
  );
}
