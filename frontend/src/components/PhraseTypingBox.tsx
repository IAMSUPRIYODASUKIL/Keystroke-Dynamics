import { useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Keyboard, CheckCircle2, AlertOctagon, Sparkles, Activity } from "lucide-react";
import { useKeystrokeCapture } from "@/hooks/useKeystrokeCapture";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Keycap, type KeycapState } from "@/components/Keycap";
import type { KeystrokeEvent } from "@/types";

interface PhraseTypingBoxProps {
  phrase: string;
  onComplete: (events: KeystrokeEvent[]) => void;
  disabled?: boolean;
  resetSignal?: number;
  /** Optional hook for visualisations that react to live typing (does not affect capture). */
  onActivity?: (typedLength: number) => void;
}

const IDLE_WAVE = [15, 20, 25, 30, 20, 15, 25, 30, 20, 15, 20, 25];

/**
 * The "type the phrase" biometric capture surface, rendered as a row of physical keycaps.
 * Visual layer only: all timing capture lives in useKeystrokeCapture.
 */
export function PhraseTypingBox({ phrase, onComplete, disabled = false, onActivity }: PhraseTypingBoxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [waveActivity, setWaveActivity] = useState<number[]>(IDLE_WAVE);
  const containerRef = useRef<HTMLDivElement>(null);
  const descriptionId = useId();
  const { playKeyClick, playSuccessChime, playMismatchTone } = useSoundEffects();

  const {
    typed,
    isComplete,
    hasMismatch,
    progress,
    handleKeyDown: rawKeyDown,
    handleKeyUp,
  } = useKeystrokeCapture({ phrase, onComplete, disabled });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
      playKeyClick();
      setWaveActivity(Array.from({ length: 12 }, () => Math.floor(Math.random() * 75) + 25));
    }
    rawKeyDown(e);
  };

  useEffect(() => {
    if (hasMismatch) playMismatchTone();
  }, [hasMismatch, playMismatchTone]);

  useEffect(() => {
    if (isComplete) playSuccessChime();
  }, [isComplete, playSuccessChime]);

  useEffect(() => {
    onActivity?.(typed.length);
  }, [typed.length, onActivity]);

  // Settle the waveform when typing pauses
  useEffect(() => {
    const timer = setTimeout(() => setWaveActivity(IDLE_WAVE), 300);
    return () => clearTimeout(timer);
  }, [typed]);

  // Group characters into words (each word keeps its trailing space) so lines wrap between words.
  const groups = useMemo(() => {
    const result: { start: number; text: string }[] = [];
    let start = 0;
    phrase.split(" ").forEach((word, i, all) => {
      const text = i < all.length - 1 ? `${word} ` : word;
      result.push({ start, text });
      start += text.length;
    });
    return result;
  }, [phrase]);

  const compact = phrase.length > 24;

  const stateAt = (index: number): KeycapState =>
    hasMismatch && index === typed.length
      ? "error"
      : index < typed.length
        ? "done"
        : index === typed.length
          ? "current"
          : "pending";

  return (
    <div className="flex flex-col gap-4">
      {/* Rhythm stream header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={clsx("flex h-2 w-2 rounded-full bg-(--color-accent)", isFocused && "animate-pulse-ring")} />
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.16em] text-(--color-text-secondary) uppercase">
            <Activity size={13} className="text-(--color-accent)" />
            Rhythm stream
          </span>
        </div>

        <div className="flex h-5 items-center gap-1" aria-hidden="true">
          {waveActivity.map((height, i) => (
            <div
              key={i}
              className={clsx(
                "w-1 origin-center rounded-full transition-transform duration-150",
                hasMismatch
                  ? "bg-(--color-danger)"
                  : isComplete
                    ? "bg-(--color-success)"
                    : isFocused
                      ? "bg-(--color-accent)"
                      : "bg-(--color-border)",
              )}
              style={{
                height: 20,
                transform: `scaleY(${isFocused ? Math.max(0.2, height / 100) : 0.2})`,
                opacity: isFocused ? 0.95 : 0.45,
              }}
            />
          ))}
        </div>
      </div>

      {/* Keycap capture surface */}
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
          "relative w-full cursor-text overflow-hidden rounded-3xl border px-4 py-9 select-none sm:px-8 sm:py-11",
          "transition-[border-color,box-shadow,background-color] duration-500 ease-(--ease-premium) focus:outline-none",
          disabled && "cursor-not-allowed opacity-50",
          hasMismatch
            ? "animate-shake border-(--color-danger)/70 bg-(--color-danger)/8 shadow-[0_0_48px_-14px_var(--color-danger)]"
            : isComplete
              ? "border-(--color-success)/60 bg-(--color-success)/8 shadow-[0_0_48px_-14px_var(--color-success)]"
              : isFocused
                ? "border-(--color-accent)/70 bg-(--color-surface-solid) shadow-[var(--field-shadow),0_0_64px_-20px_var(--color-accent)]"
                : "border-(--color-border) bg-(--color-bg-subtle) shadow-(--field-shadow) hover:border-(--color-border-glow)/60",
        )}
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-(--color-accent)/50 to-transparent" />

        <div className={compact ? "flex flex-wrap justify-center gap-x-1.5 gap-y-3 sm:gap-y-4" : "flex flex-wrap justify-center gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-5"}>
          {groups.map((group) => (
            <div key={group.start} className={compact ? "flex gap-1 sm:gap-1.5" : "flex gap-1.5 sm:gap-2"}>
              {group.text.split("").map((char, offset) => {
                const index = group.start + offset;
                return <Keycap key={index} char={char} state={stateAt(index)} focused={isFocused} size={compact ? "compact" : "regular"} />;
              })}
            </div>
          ))}
        </div>

        {!isFocused && !isComplete && (
          <div className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-3xl bg-(--color-bg)/45 backdrop-blur-[2px]">
            <span className="flex items-center gap-2.5 rounded-full border border-(--color-border) bg-(--color-surface-raised) px-5 py-2.5 text-xs font-semibold text-(--color-text) shadow-(--card-shadow) transition-colors hover:border-(--color-accent) hover:text-(--color-accent)">
              <Keyboard size={15} className="text-(--color-accent)" />
              Click here to focus and type the phrase
            </span>
          </div>
        )}
      </div>

      <p id={descriptionId} className="sr-only">
        Type the displayed phrase exactly, without corrections. Pressing Backspace restarts the sample.
      </p>

      {/* Progress */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--color-border) shadow-(--field-shadow)">
          <div
            className={clsx(
              "h-full w-full origin-left rounded-full transition-transform duration-200 ease-(--ease-premium)",
              hasMismatch ? "bg-(--color-danger)" : "bg-(image:--color-ember-gradient)",
            )}
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs font-semibold text-(--color-text-muted) tabular-nums">
          {typed.length} / {phrase.length}
        </span>
      </div>

      {/* Status */}
      <div className="flex min-h-6 items-center justify-between px-1 text-xs font-medium" aria-live="polite">
        {hasMismatch ? (
          <span className="animate-fadeIn flex items-center gap-1.5 text-(--color-danger)">
            <AlertOctagon size={14} />
            Cadence interrupted — resetting sample for pure rhythm integrity…
          </span>
        ) : isComplete ? (
          <span className="animate-fadeIn flex items-center gap-1.5 font-semibold text-(--color-success)">
            <CheckCircle2 size={14} />
            Biometric sample captured successfully.
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-(--color-text-muted)">
            <Sparkles size={13} className="text-(--color-accent)" />
            Type naturally at your normal rhythm — Backspace restarts for timing accuracy.
          </span>
        )}
      </div>
    </div>
  );
}
