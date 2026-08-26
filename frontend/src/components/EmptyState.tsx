import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: string;
}

export function EmptyState({ title, description, action, icon = "○" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
      <span className="mb-3 text-2xl text-[var(--color-text-muted)]" aria-hidden="true">
        {icon}
      </span>
      <p className="font-medium text-[var(--color-text)]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
