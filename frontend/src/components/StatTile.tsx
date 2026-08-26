import type { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
}

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <p className="text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}
