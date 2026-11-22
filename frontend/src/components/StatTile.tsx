import type { ComponentType, ReactNode } from "react";
import clsx from "clsx";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  /** `cyan`, `violet` and `ember` are legacy names that all map to the ember accent family. */
  accent?: "ember" | "cyan" | "emerald" | "violet" | "amber" | "rose" | "neutral";
  className?: string;
}

const ACCENTS = {
  ember: {
    glow: "from-(--color-accent)/25",
    icon: "bg-(--color-accent)/12 text-(--color-accent) border-(--color-accent)/25",
    dot: "bg-(--color-accent)",
  },
  emerald: {
    glow: "from-(--color-success)/25",
    icon: "bg-(--color-success)/12 text-(--color-success) border-(--color-success)/25",
    dot: "bg-(--color-success)",
  },
  amber: {
    glow: "from-(--color-warning)/25",
    icon: "bg-(--color-warning)/12 text-(--color-warning) border-(--color-warning)/25",
    dot: "bg-(--color-warning)",
  },
  rose: {
    glow: "from-(--color-danger)/25",
    icon: "bg-(--color-danger)/12 text-(--color-danger) border-(--color-danger)/25",
    dot: "bg-(--color-danger)",
  },
  neutral: {
    glow: "from-(--color-text-muted)/15",
    icon: "bg-(--color-surface-highlight) text-(--color-text-muted) border-(--color-border)",
    dot: "bg-(--color-text-muted)",
  },
};

export function StatTile({ label, value, hint, icon: Icon, accent = "ember", className }: StatTileProps) {
  const key = accent === "cyan" || accent === "violet" ? "ember" : accent;
  const styles = ACCENTS[key];

  return (
    <div
      className={clsx(
        "glass-card spotlight group relative overflow-hidden rounded-3xl border border-(--color-border) bg-(--color-surface) p-5 sm:p-6",
        "hover:-translate-y-0.5 hover:border-(--color-border-glow)",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={clsx(
          "pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-linear-to-br to-transparent opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
          styles.glow,
        )}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={clsx("h-1.5 w-1.5 rounded-full", styles.dot)} />
          <p className="text-[11px] font-semibold tracking-[0.14em] text-(--color-text-muted) uppercase">
            {label}
          </p>
        </div>
        {Icon && (
          <div className={clsx("flex h-8 w-8 items-center justify-center rounded-xl border", styles.icon)}>
            <Icon size={15} />
          </div>
        )}
      </div>

      <p className="font-display mt-4 text-4xl font-medium tracking-tight text-(--color-text) tabular-nums sm:text-[2.75rem] sm:leading-none">
        {typeof value === "string" || typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </p>

      {hint && <p className="mt-3 text-xs leading-relaxed font-medium text-(--color-text-muted)">{hint}</p>}
    </div>
  );
}
