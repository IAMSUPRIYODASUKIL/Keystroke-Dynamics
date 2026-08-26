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
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        "relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 select-none cursor-pointer focus-visible:outline-2 active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        
        // Sizes
        size === "sm" && "rounded-lg px-3 py-1.5 text-xs",
        size === "md" && "rounded-xl px-4 py-2.5 text-sm",
        size === "lg" && "rounded-xl px-6 py-3.5 text-base font-semibold",

        // Primary: Cyber-Luxe Cyan Gradient
        variant === "primary" &&
          "shimmer-button bg-gradient-to-r from-[var(--color-accent)] to-[#00c6ff] text-[#04141a] font-semibold shadow-[0_0_20px_-3px_rgba(0,242,254,0.4)] hover:shadow-[0_0_25px_-2px_rgba(0,242,254,0.6)] hover:brightness-105",

        // Secondary: Specular Glass Panel
        variant === "secondary" &&
          "border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] hover:bg-[var(--color-surface-highlight)] hover:border-[var(--color-border-glow)] hover:shadow-md",

        // Danger: Ruby Rose Glow
        variant === "danger" &&
          "border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/15 text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white hover:shadow-[0_0_20px_-3px_rgba(244,63,94,0.5)]",

        // Ghost: Minimalist Glass
        variant === "ghost" &&
          "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-highlight)]",

        // Neon: Bioluminescent Emerald / Violet
        variant === "neon" &&
          "shimmer-button bg-gradient-to-r from-[var(--color-accent-secondary)] to-[#d946ef] text-white font-semibold shadow-[0_0_20px_-3px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_-2px_rgba(139,92,246,0.6)] hover:brightness-105",

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

