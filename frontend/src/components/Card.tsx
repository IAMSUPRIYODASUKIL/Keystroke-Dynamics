import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function Card({ title, subtitle, actions, className, children, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg shadow-black/20",
        className,
      )}
      {...rest}
    >
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
