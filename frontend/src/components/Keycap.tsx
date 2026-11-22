import clsx from "clsx";

export type KeycapState = "pending" | "current" | "done" | "error";

interface KeycapProps {
  char: string;
  state?: KeycapState;
  focused?: boolean;
  /** `compact` is used for long phrases so the whole sentence stays legible in a narrow card. */
  size?: "regular" | "compact";
  className?: string;
}

/** A claymorphic physical key. Purely presentational (aria-hidden). */
export function Keycap({ char, state = "pending", focused = true, size = "regular", className }: KeycapProps) {
  const isSpace = char === " ";
  const pressed = state === "done";

  return (
    <span
      aria-hidden="true"
      data-pressed={pressed}
      className={clsx(
        "keycap relative inline-flex shrink-0 items-center justify-center rounded-[10px] font-mono-key font-medium select-none",
        size === "compact"
          ? "h-9 w-6 text-sm sm:h-11 sm:w-8 sm:text-base"
          : isSpace
            ? "h-11 w-9 text-base sm:h-14 sm:w-12 sm:text-xl"
            : "h-11 w-8 text-base sm:h-14 sm:w-11 sm:text-xl",
        state === "pending" && "text-(--color-text-dim)",
        state === "current" && "text-(--color-text)",
        state === "done" && "text-(--color-accent)",
        state === "error" && "text-(--color-danger)",
        className,
      )}
    >
      {/* current key halo */}
      {state === "current" && focused && (
        <span className="pointer-events-none absolute -inset-1 rounded-[14px] ring-2 ring-(--color-accent)/70 shadow-[0_0_28px_-4px_var(--color-accent)]" />
      )}
      {state === "error" && (
        <span className="pointer-events-none absolute -inset-1 rounded-[14px] ring-2 ring-(--color-danger)/70" />
      )}
      {isSpace ? (
        <span className={clsx("h-1 rounded-full bg-current opacity-50", size === "compact" ? "w-3" : "w-5")} />
      ) : (
        <span className={clsx(state === "done" && "drop-shadow-[0_0_8px_var(--color-accent)]")}>{char}</span>
      )}
      {state === "current" && focused && (
        <span className={clsx("animate-cyber-caret absolute bottom-1.5 h-0.5 rounded-full bg-(--color-accent)", size === "compact" ? "w-3" : "w-4")} />
      )}
    </span>
  );
}
