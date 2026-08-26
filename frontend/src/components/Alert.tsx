import type { ReactNode } from "react";
import clsx from "clsx";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface AlertProps {
  variant: "error" | "success" | "warning" | "info";
  children: ReactNode;
  className?: string;
}

const CONFIG = {
  error: {
    style: "border-rose-500/30 bg-rose-500/10 text-rose-300 dark:text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    icon: AlertCircle,
    iconColor: "text-rose-400",
  },
  success: {
    style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 dark:text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
  },
  warning: {
    style: "border-amber-500/30 bg-amber-500/10 text-amber-300 dark:text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
  },
  info: {
    style: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 dark:text-cyan-200 shadow-[0_0_15px_rgba(0,242,254,0.1)]",
    icon: Info,
    iconColor: "text-[var(--color-accent)]",
  },
};

export function Alert({ variant, children, className }: AlertProps) {
  const { style, icon: Icon, iconColor } = CONFIG[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={clsx(
        "relative flex items-start gap-3 rounded-xl border p-4 text-sm font-medium backdrop-blur-xl transition-all duration-200",
        style,
        className,
      )}
    >
      <Icon size={18} className={clsx("shrink-0 mt-0.5", iconColor)} />
      <div className="flex-1 leading-relaxed text-left">{children}</div>
    </div>
  );
}

