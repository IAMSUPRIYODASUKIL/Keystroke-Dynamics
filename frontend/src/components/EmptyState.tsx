import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ComponentType<{ size?: number; className?: string }>;
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--color-border) bg-(--color-surface-highlight) px-6 py-14 text-center">
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-surface-raised) shadow-(--card-shadow)">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-accent)_22%,transparent)_0%,transparent_70%)]"
        />
        <Icon size={26} className="relative z-10 text-(--color-accent)" />
      </div>
      <p className="font-display text-xl font-medium tracking-tight text-(--color-text)">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-(--color-text-muted)">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
