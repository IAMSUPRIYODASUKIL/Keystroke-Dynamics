import type { InputHTMLAttributes } from "react";
import { useId } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, id, className, ...rest }: FormFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text)]">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`rounded-lg border bg-[var(--color-surface-raised)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none ${
          error ? "border-[var(--color-danger)]" : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
        } ${className ?? ""}`}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
