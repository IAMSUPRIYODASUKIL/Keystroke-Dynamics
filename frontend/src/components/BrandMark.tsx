import { useId } from "react";
import clsx from "clsx";

/** The Keystroke Dynamics mark: a keycap carrying a rhythm line. */
export function BrandMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={clsx("h-9 w-9", className)} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id={`${id}-g`} x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e8622c" />
          <stop offset="1" stopColor="#ffb98a" />
        </linearGradient>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--color-surface-raised-solid)" />
          <stop offset="1" stopColor="var(--color-surface-solid)" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="12" fill={`url(#${id}-f)`} stroke="var(--color-border)" />
      <rect x="3.5" y="3.5" width="41" height="20" rx="11.5" fill="white" opacity="0.04" />
      <path
        d="M9 25h7l4-10 6 20 5-26 4 16h4"
        stroke={`url(#${id}-g)`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
