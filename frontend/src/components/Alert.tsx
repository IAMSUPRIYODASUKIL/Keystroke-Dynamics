import type { ReactNode } from "react";
import clsx from "clsx";

interface AlertProps {
  variant: "error" | "success" | "warning" | "info";
  children: ReactNode;
}

const STYLES: Record<AlertProps["variant"], string> = {
  error: "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  success: "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]",
  warning: "border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  info: "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
};

export function Alert({ variant, children }: AlertProps) {
  return (
    <div role={variant === "error" ? "alert" : "status"} className={clsx("rounded-lg border px-4 py-3 text-sm", STYLES[variant])}>
      {children}
    </div>
  );
}
