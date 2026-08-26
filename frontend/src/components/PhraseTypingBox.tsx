import { useId, useRef, useState } from "react";
import clsx from "clsx";
import { useKeystrokeCapture } from "@/hooks/useKeystrokeCapture";
import type { KeystrokeEvent } from "@/types";

interface PhraseTypingBoxProps {
  phrase: string;
  onComplete: (events: KeystrokeEvent[]) => void;
  disabled?: boolean;
  resetSignal?: number;
}

/** The reusable "type the phrase" capture surface used on Enrollment,
 * Login, and Demo Mode. Renders the phrase with per-character progress
 * feedback but reveals no raw timestamps to the end user — see
 * docs/13_Security.md (Privacy). */
export function PhraseTypingBox({ phrase, onComplete, disabled = false }: PhraseTypingBoxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const descriptionId = useId();

  const { typed, isComplete, hasMismatch, progress, handleKeyDown, handleKeyUp } = useKeystrokeCapture({
    phrase,
    onComplete,
    disabled,
  });

  return (
    <div>
      <div
        ref={containerRef}
        role="textbox"
        aria-multiline="false"
        aria-label={`Type the phrase: ${phrase}`}
        aria-describedby={descriptionId}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={clsx(
          "font-mono-key relative w-full rounded-xl border-2 px-5 py-6 text-lg leading-relaxed tracking-wide transition-colors select-none sm:text-xl",
          "focus:outline-none",
          disabled && "cursor-not-allowed opacity-50",
          hasMismatch
            ? "border-[var(--color-danger)] bg-[var(--color-danger)]/10"
            : isComplete
              ? "border-[var(--color-success)] bg-[var(--color-success)]/10"
              : isFocused
                ? "border-[var(--color-accent)] bg-[var(--color-surface-raised)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)]",
        )}
      >
        {phrase.split("").map((char, index) => {
          const state = index < typed.length ? "done" : index === typed.length ? "current" : "pending";
          return (
            <span
              key={index}
              className={clsx(
                "relative",
                state === "done" && "text-[var(--color-success)]",
                state === "pending" && "text-[var(--color-text-muted)]",
                state === "current" && isFocused && !hasMismatch && "text-[var(--color-text)]",
              )}
            >
              {state === "current" && !hasMismatch && (
                <span className="absolute -left-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-[var(--color-accent)]" />
              )}
              {char === " " ? " " : char}
            </span>
          );
        })}

        {!isFocused && !isComplete && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--color-bg)]/70 text-sm font-sans text-[var(--color-text-muted)]">
            Click here, then type the phrase above
          </div>
        )}
      </div>

      <p id={descriptionId} className="sr-only">
        Type the displayed phrase exactly, without corrections. Pressing Backspace restarts the sample.
      </p>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-150",
              hasMismatch ? "bg-[var(--color-danger)]" : "bg-[var(--color-accent)]",
            )}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <span className="w-10 shrink-0 text-right text-xs text-[var(--color-text-muted)]">
          {Math.round(progress * 100)}%
        </span>
      </div>

      <p className="mt-2 min-h-[1.25rem] text-sm" aria-live="polite">
        {hasMismatch && (
          <span className="text-[var(--color-danger)]">That didn't match — restarting this sample…</span>
        )}
        {!hasMismatch && isComplete && (
          <span className="text-[var(--color-success)]">Sample captured.</span>
        )}
        {!hasMismatch && !isComplete && (
          <span className="text-[var(--color-text-muted)]">
            No corrections allowed — Backspace restarts the sample so timing stays clean.
          </span>
        )}
      </p>
    </div>
  );
}
