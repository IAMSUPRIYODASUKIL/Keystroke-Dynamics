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
    style: "border-(--color-danger)/35 bg-(--color-danger)/10",
    icon: AlertCircle,
    iconColor: "text-(--color-danger)",
    rail: "bg-(--color-danger)",
  },
  success: {
    style: "border-(--color-success)/35 bg-(--color-success)/10",
    icon: CheckCircle2,
    iconColor: "text-(--color-success)",
    rail: "bg-(--color-success)",
  },
  warning: {
    style: "border-(--color-warning)/35 bg-(--color-warning)/10",
    icon: AlertTriangle,
    iconColor: "text-(--color-warning)",
    rail: "bg-(--color-warning)",
  },
  info: {
    style: "border-(--color-accent)/30 bg-(--color-accent)/8",
    icon: Info,
    iconColor: "text-(--color-accent)",
    rail: "bg-(--color-accent)",
  },
};

export function Alert({ variant, children, className }: AlertProps) {
  const { style, icon: Icon, iconColor, rail } = CONFIG[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={clsx(
        "animate-fadeIn relative flex items-start gap-3 overflow-hidden rounded-2xl border py-3.5 pr-4 pl-5 text-sm text-(--color-text)",
        style,
        className,
      )}
    >
      <span aria-hidden="true" className={clsx("absolute inset-y-0 left-0 w-1", rail)} />
      <Icon size={18} className={clsx("mt-0.5 shrink-0", iconColor)} />
      <div className="flex-1 text-left leading-relaxed">{children}</div>
    </div>
  );
}
