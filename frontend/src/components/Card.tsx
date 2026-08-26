import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  variant?: "default" | "glow" | "interactive" | "flat";
}

export function Card({
  title,
  subtitle,
  actions,
  variant = "default",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        "relative rounded-2xl border transition-all duration-300 backdrop-blur-xl p-5 sm:p-6",
        variant === "default" &&
          "glass-card bg-(--color-surface) border-(--color-border) shadow-lg shadow-black/20",
        variant === "glow" &&
          "bg-(--color-surface) border-(--color-border-glow) shadow-[0_0_30px_-5px_rgba(0,242,254,0.2)]",
        variant === "interactive" &&
          "glass-card bg-(--color-surface) border-(--color-border) hover:scale-[1.01] hover:border-(--color-border-glow) cursor-pointer shadow-lg",
        variant === "flat" &&
          "bg-(--color-surface-raised) border-(--color-border-subtle) shadow-none",
        className,
      )}
      {...rest}
    >
      {/* Specular Top Rim Lighting */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-(--color-border-glow) to-transparent opacity-40 rounded-t-2xl" />

      {(title || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold tracking-tight text-(--color-text) sm:text-lg">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-(--color-text-muted) sm:text-sm leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

