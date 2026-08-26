import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ComponentType<{ size?: number; className?: string }>;
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-12 text-center backdrop-blur-md">
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-surface-raised)] to-[var(--color-surface)] text-[var(--color-text-muted)] shadow-inner">
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,rgba(0,242,254,0.15)_0%,transparent_70%)]" />
        <Icon size={24} className="relative z-10 text-[var(--color-accent)]/80" />
      </div>
      <p className="font-semibold text-base text-[var(--color-text)] tracking-tight">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs text-[var(--color-text-muted)] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

