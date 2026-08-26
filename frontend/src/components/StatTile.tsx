import type { ComponentType, ReactNode } from "react";
import clsx from "clsx";

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  accent?: "cyan" | "emerald" | "violet" | "amber" | "rose" | "neutral";
  className?: string;
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent = "cyan",
  className,
}: StatTileProps) {
  const accentStyles = {
    cyan: {
      border: "hover:border-[var(--color-accent)]/50",
      glow: "from-[var(--color-accent)]/10 to-transparent",
      iconBg: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20",
      dot: "bg-[var(--color-accent)]",
    },
    emerald: {
      border: "hover:border-emerald-500/50",
      glow: "from-emerald-500/10 to-transparent",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400",
    },
    violet: {
      border: "hover:border-purple-500/50",
      glow: "from-purple-500/10 to-transparent",
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      dot: "bg-purple-400",
    },
    amber: {
      border: "hover:border-amber-500/50",
      glow: "from-amber-500/10 to-transparent",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "bg-amber-400",
    },
    rose: {
      border: "hover:border-rose-500/50",
      glow: "from-rose-500/10 to-transparent",
      iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      dot: "bg-rose-400",
    },
    neutral: {
      border: "hover:border-[var(--color-border-glow)]",
      glow: "from-[var(--color-surface-highlight)] to-transparent",
      iconBg: "bg-[var(--color-surface-highlight)] text-[var(--color-text-muted)] border-[var(--color-border)]",
      dot: "bg-[var(--color-text-muted)]",
    },
  }[accent];

  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 backdrop-blur-xl transition-all duration-300 hover:shadow-lg",
        accentStyles.border,
        className,
      )}
    >
      {/* Background Gradient Mesh */}
      <div
        className={clsx(
          "pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
          accentStyles.glow,
        )}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={clsx("h-1.5 w-1.5 rounded-full", accentStyles.dot)} />
          <p className="text-[11px] font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
            {label}
          </p>
        </div>
        {Icon && (
          <div
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded-lg border",
              accentStyles.iconBg,
            )}
          >
            <Icon size={14} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <p className="font-mono-key text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
          {value}
        </p>
      </div>

      {hint && (
        <p className="mt-2 text-xs font-medium text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

