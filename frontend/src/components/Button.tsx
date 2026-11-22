import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "neon";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={clsx(
        "relative inline-flex items-center justify-center gap-2 font-medium select-none cursor-pointer whitespace-nowrap",
        "transition-[transform,box-shadow,background-color,border-color,color,filter] duration-300 ease-(--ease-premium)",
        "hover:-translate-y-px active:translate-y-0 active:scale-[0.985]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100",

        size === "sm" && "rounded-lg px-3 py-1.5 text-xs",
        size === "md" && "rounded-xl px-4 py-2.5 text-sm",
        size === "lg" && "rounded-2xl px-7 py-3.5 text-[15px] font-semibold",

        // Primary — molten ember
        variant === "primary" &&
          "shimmer-button bg-(image:--color-accent-gradient) text-(--color-on-accent) font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_24px_-10px_color-mix(in_oklab,var(--color-accent-strong)_70%,transparent)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_16px_32px_-10px_color-mix(in_oklab,var(--color-accent-strong)_85%,transparent)] hover:brightness-[1.06]",

        // Secondary — raised smoke
        variant === "secondary" &&
          "border border-(--color-border) bg-(--color-surface-raised) text-(--color-text) shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-(--color-border-glow) hover:bg-(--color-surface-highlight)",

        // Danger
        variant === "danger" &&
          "border border-(--color-danger)/40 bg-(--color-danger)/12 text-(--color-danger) hover:border-(--color-danger) hover:bg-(--color-danger) hover:text-(--on-danger)",

        // Ghost
        variant === "ghost" &&
          "text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface-highlight)",

        // Neon (legacy name) — coral accent
        variant === "neon" &&
          "shimmer-button bg-(image:--color-coral-gradient) text-(--on-danger) font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-10px_color-mix(in_oklab,var(--color-danger)_60%,transparent)] hover:brightness-[1.06]",

        className,
      )}
      {...rest}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
