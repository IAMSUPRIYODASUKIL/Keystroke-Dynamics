import clsx from "clsx";
import { CheckCircle2, XCircle, Sparkles, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { AuthDecision, RiskLevel } from "@/types";

const RISK_STYLES: Record<RiskLevel, { badge: string; icon: typeof ShieldCheck }> = {
  low: {
    badge: "bg-(--color-success)/12 text-(--color-success) border-(--color-success)/30",
    icon: ShieldCheck,
  },
  medium: {
    badge: "bg-(--color-warning)/12 text-(--color-warning) border-(--color-warning)/30",
    icon: ShieldAlert,
  },
  high: {
    badge: "bg-(--color-danger)/12 text-(--color-danger) border-(--color-danger)/30",
    icon: ShieldAlert,
  },
  unknown: {
    badge: "bg-(--color-surface-highlight) text-(--color-text-muted) border-(--color-border)",
    icon: ShieldQuestion,
  },
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
  unknown: "Not evaluated",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { badge, icon: Icon } = RISK_STYLES[level];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide",
        badge,
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {RISK_LABELS[level]}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: AuthDecision }) {
  const success = decision === "success";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
        success
          ? "border-(--color-success)/30 bg-(--color-success)/12 text-(--color-success)"
          : "border-(--color-danger)/30 bg-(--color-danger)/12 text-(--color-danger)",
      )}
    >
      {success ? <CheckCircle2 size={12} aria-hidden="true" /> : <XCircle size={12} aria-hidden="true" />}
      {success ? "Success" : "Failed"}
    </span>
  );
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "success" | "warning" | "cyan";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        tone === "success" && "border-(--color-success)/30 bg-(--color-success)/12 text-(--color-success)",
        tone === "warning" && "border-(--color-warning)/30 bg-(--color-warning)/12 text-(--color-warning)",
        tone === "cyan" && "border-(--color-accent)/30 bg-(--color-accent)/10 text-(--color-accent)",
        tone === "neutral" && "border-(--color-border) bg-(--color-surface-raised) text-(--color-text-muted)",
      )}
    >
      <Sparkles size={11} aria-hidden="true" />
      {label}
    </span>
  );
}
