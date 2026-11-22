import type { ReactNode } from "react";

interface PageHeaderProps {
  badge?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Consistent editorial page title: pill, serif headline with an ember italic, optional actions. */
export function PageHeader({ badge, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {badge && <div className="mb-4">{badge}</div>}
        <h1 className="font-display text-balance text-4xl leading-[1.05] font-light tracking-tight text-(--color-text) sm:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-(--color-text-muted) sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
