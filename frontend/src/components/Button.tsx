import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--color-accent)] text-[#04141a] hover:bg-[var(--color-accent-strong)]",
        variant === "secondary" &&
          "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:border-[var(--color-accent)]",
        variant === "danger" && "bg-[var(--color-danger)] text-[#2a0a0a] hover:brightness-110",
        variant === "ghost" && "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
        className,
      )}
      {...rest}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
