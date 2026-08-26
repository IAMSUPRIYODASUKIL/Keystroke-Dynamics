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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--color-border) bg-(--color-surface)/40 px-6 py-12 text-center backdrop-blur-md">
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-(--color-border) bg-linear-to-b from-(--color-surface-raised) to-(--color-surface) text-(--color-text-muted) shadow-inner">
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,rgba(0,242,254,0.15)_0%,transparent_70%)]" />
        <Icon size={24} className="relative z-10 text-(--color-accent)/80" />
      </div>
      <p className="font-semibold text-base text-(--color-text) tracking-tight">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs text-(--color-text-muted) leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

