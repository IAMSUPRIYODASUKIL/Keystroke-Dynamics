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
    <div className="group flex flex-col gap-2 text-left">
      <label
        htmlFor={inputId}
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted) transition-colors group-focus-within:text-(--color-accent)"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <div className="pointer-events-none absolute left-4 flex items-center text-(--color-text-dim) transition-colors group-focus-within:text-(--color-accent)">
            <Icon size={16} />
          </div>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            "w-full rounded-2xl border bg-(--color-bg-subtle) py-3 text-sm text-(--color-text) shadow-(--field-shadow) placeholder:text-(--color-text-dim)",
            "transition-[border-color,box-shadow,background-color] duration-300 ease-(--ease-premium) focus:outline-none",
            Icon ? "pl-11 pr-4" : "px-4",
            error
              ? "border-(--color-danger)/70 focus:border-(--color-danger) focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_0_0_4px_var(--color-danger-glow)]"
              : "border-(--color-border) hover:border-(--color-border-glow)/60 focus:border-(--color-accent) focus:shadow-(--field-shadow-focus)",
            className,
          )}
          {...rest}
        />
      </div>
      {error && (
        <p
          id={errorId}
          className="animate-fadeIn flex items-center gap-1.5 text-xs font-medium text-(--color-danger)"
        >
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
