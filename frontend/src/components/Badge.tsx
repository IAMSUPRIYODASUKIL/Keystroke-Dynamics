import clsx from "clsx";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";
import type { AuthDecision, RiskLevel } from "@/types";

const RISK_STYLES: Record<RiskLevel, { badge: string; dot: string }> = {
  low: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    dot: "bg-emerald-400",
  },
  medium: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
    dot: "bg-amber-400",
  },
  high: {
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
    dot: "bg-rose-400",
  },
  unknown: {
    badge: "bg-[var(--color-surface-highlight)] text-[var(--color-text-muted)] border-[var(--color-border)]",
    dot: "bg-[var(--color-text-muted)]",
  },
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
  unknown: "Not evaluated",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const style = RISK_STYLES[level];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide backdrop-blur-md",
        style.badge,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full animate-pulse", style.dot)} />
      {RISK_LABELS[level]}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: AuthDecision }) {
  const success = decision === "success";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md",
        success
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
          : "border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]",
      )}
    >
      {success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
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
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md",
        tone === "success" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        tone === "warning" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
        tone === "cyan" &&
          "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
        tone === "neutral" &&
          "border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]",
      )}
    >
      <Sparkles size={11} />
      {label}
    </span>
  );
}

