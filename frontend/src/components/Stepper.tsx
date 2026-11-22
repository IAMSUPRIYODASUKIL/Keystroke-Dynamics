import type { ComponentType } from "react";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import clsx from "clsx";
import { SPRING } from "@/lib/motion";

export interface StepperStep {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

/** Horizontal progress stepper with a sliding active pill. `current` is zero-based. */
export function Stepper({ steps, current, className }: { steps: StepperStep[]; current: number; className?: string }) {
  return (
    <ol className={clsx("flex items-center justify-center gap-2", className)} aria-label="Progress">
      {steps.map(({ label, icon: Icon }, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={clsx(
                "relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-300",
                active
                  ? "border-(--color-accent)/40 text-(--color-accent)"
                  : done
                    ? "border-(--color-success)/30 text-(--color-success)"
                    : "border-(--color-border) text-(--color-text-muted)",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`stepper-${steps.map((s) => s.label).join("-")}`}
                  transition={SPRING.indicator}
                  className="absolute inset-0 rounded-full bg-(--color-accent)/12"
                />
              )}
              {done ? <Check size={12} className="relative" /> : <Icon size={12} className="relative" />}
              <span className="relative">
                {i + 1}. {label}
              </span>
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={clsx(
                  "h-px w-4 transition-colors duration-500 sm:w-8",
                  done ? "bg-(--color-success)/60" : "bg-(--color-border)",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
