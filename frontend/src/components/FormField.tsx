import type { ComponentType, InputHTMLAttributes } from "react";
import { useId } from "react";
import clsx from "clsx";
import { AlertCircle } from "lucide-react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
}

export function FormField({ label, error, id, icon: Icon, className, ...rest }: FormFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold uppercase tracking-wider text-(--color-text-secondary)"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center text-(--color-text-muted)">
            <Icon size={16} />
          </div>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            "w-full rounded-xl border bg-(--color-surface-raised) py-2.5 text-sm text-(--color-text) placeholder:text-(--color-text-muted) transition-all duration-200 focus:outline-none backdrop-blur-md",
            Icon ? "pl-10 pr-4" : "px-4",
            error
              ? "border-(--color-danger) focus:border-(--color-danger) focus:shadow-[0_0_15px_rgba(244,63,94,0.3)] bg-rose-500/5"
              : "border-(--color-border) focus:border-(--color-accent) focus:shadow-[0_0_15px_rgba(0,242,254,0.25)] hover:border-(--color-border-glow)",
            className,
          )}
          {...rest}
        />
      </div>
      {error && (
        <p id={errorId} className="flex items-center gap-1 text-xs font-medium text-(--color-danger) animate-fadeIn">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

