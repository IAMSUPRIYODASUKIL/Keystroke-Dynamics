import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import clsx from "clsx";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { SPRING } from "@/lib/motion";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "system", label: "System theme", icon: Monitor },
  { value: "dark", label: "Dark theme", icon: Moon },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={clsx(
        "relative inline-flex items-center rounded-full border border-(--color-border) bg-(--color-bg-subtle) p-0.5 shadow-(--field-shadow)",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={clsx(
              "relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors duration-300",
              active ? "text-(--color-on-accent)" : "text-(--color-text-muted) hover:text-(--color-text)",
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-toggle-pill"
                transition={SPRING.indicator}
                className="absolute inset-0 rounded-full bg-(image:--color-accent-gradient) shadow-[0_4px_12px_-4px_var(--color-accent-strong)]"
              />
            )}
            <Icon size={13} className="relative" />
          </button>
        );
      })}
    </div>
  );
}
