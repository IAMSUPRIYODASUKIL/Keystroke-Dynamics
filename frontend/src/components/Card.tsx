import { useRef, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
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
  onPointerMove,
  ...rest
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  // Pointer-follow spotlight: writes two CSS variables, never triggers a React render.
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (event.pointerType === "touch" || frame.current) return;
    const { clientX, clientY } = event;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${clientX - rect.left}px`);
      el.style.setProperty("--my", `${clientY - rect.top}px`);
    });
  };

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className={clsx(
        "spotlight relative rounded-3xl border p-5 sm:p-7",
        "transition-[transform,box-shadow,border-color] duration-500 ease-(--ease-premium)",
        variant === "default" &&
          "glass-card border-(--color-border) bg-(--color-surface) hover:border-(--color-border-glow)",
        variant === "glow" &&
          "border-(--color-border-glow) bg-(--color-surface) shadow-[var(--card-shadow),0_0_60px_-24px_var(--color-accent)]",
        variant === "interactive" &&
          "glass-card cursor-pointer border-(--color-border) bg-(--color-surface) hover:-translate-y-1 hover:border-(--color-border-glow)",
        variant === "flat" &&
          "border-(--color-border-subtle) bg-(--color-surface-raised) shadow-none",
        className,
      )}
      {...rest}
    >
      {/* Specular top rim */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-(--color-accent)/45 to-transparent" />

      {(title || actions) && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h3 className="font-display text-xl font-medium tracking-tight text-(--color-text) sm:text-2xl">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-muted)">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
