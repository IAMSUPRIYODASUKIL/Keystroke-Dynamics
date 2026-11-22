import clsx from "clsx";

/** Bar chart of real inter-key intervals — one bar per keystroke. */
export function RhythmBars({ intervals, className }: { intervals: number[]; className?: string }) {
  const max = Math.max(1, ...intervals);
  return (
    <div
      role="img"
      aria-label={`Typing cadence: ${intervals.length} intervals between keystrokes`}
      className={clsx("flex h-24 items-end gap-1", className)}
    >
      {intervals.map((value, i) => (
        <div
          key={i}
          title={`${Math.round(value)} ms`}
          className="min-w-0.5 flex-1 origin-bottom animate-[barIn_0.7s_var(--ease-premium)_both] rounded-full bg-linear-to-t from-(--color-accent-strong) to-(--color-spark)"
          style={{ height: `${Math.max(8, (value / max) * 100)}%`, animationDelay: `${i * 22}ms` }}
        />
      ))}
    </div>
  );
}
