import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { Keyboard, CheckCircle2, AlertOctagon, Sparkles, Activity } from "lucide-react";
import { useKeystrokeCapture } from "@/hooks/useKeystrokeCapture";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import type { KeystrokeEvent } from "@/types";

interface PhraseTypingBoxProps {
  phrase: string;
  onComplete: (events: KeystrokeEvent[]) => void;
  disabled?: boolean;
  resetSignal?: number;
}

/** The world-class "type the phrase" biometric capture terminal.
 * Renders the phrase with holographic per-character feedback, live rhythm
 * waveform visualization, and audio-tactile haptic feedback. */
export function PhraseTypingBox({ phrase, onComplete, disabled = false }: PhraseTypingBoxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [waveActivity, setWaveActivity] = useState<number[]>([15, 25, 40, 60, 30, 20, 45, 70, 35, 20]);
  const containerRef = useRef<HTMLDivElement>(null);
  const descriptionId = useId();
  const { playKeyClick, playSuccessChime, playMismatchTone } = useSoundEffects();

  const { typed, isComplete, hasMismatch, progress, handleKeyDown: rawKeyDown, handleKeyUp } = useKeystrokeCapture({
    phrase,
    onComplete,
    disabled,
  });

  // Sound triggers & rhythm wave modulation on keypress
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
      playKeyClick();
      // Modulate rhythm waves randomly on keypress
      setWaveActivity(
        Array.from({ length: 12 }, () => Math.floor(Math.random() * 75) + 25),
      );
    }
    rawKeyDown(e);
  };

  useEffect(() => {
    if (hasMismatch) {
      playMismatchTone();
    }
  }, [hasMismatch, playMismatchTone]);

  useEffect(() => {
    if (isComplete) {
      playSuccessChime();
    }
  }, [isComplete, playSuccessChime]);

  // Settle waveform when idle
  useEffect(() => {
    const timer = setTimeout(() => {
      setWaveActivity([15, 20, 25, 30, 20, 15, 25, 30, 20, 15, 20, 25]);
    }, 300);
    return () => clearTimeout(timer);
  }, [typed]);

  return (
    <div className="flex flex-col gap-3">
      {/* Real-Time Cadence & Rhythm Frequency Visualizer Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-(--color-accent) animate-pulse" />
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-(--color-text-secondary) flex items-center gap-1.5">
            <Activity size={13} className="text-(--color-accent)" />
            Biometric Rhythm Stream
          </span>
        </div>

        {/* Dynamic Mini Waveform Bars */}
        <div className="flex items-center gap-1 h-4">
          {waveActivity.map((height, i) => (
            <div
              key={i}
              className={clsx(
                "w-1 rounded-full transition-all duration-150",
                hasMismatch
                  ? "bg-rose-500"
                  : isComplete
                    ? "bg-emerald-400"
                    : isFocused
                      ? "bg-(--color-accent)"
                      : "bg-(--color-border)",
              )}
              style={{
                height: isFocused ? `${Math.max(4, (height / 100) * 16)}px` : "4px",
                opacity: isFocused ? 0.9 : 0.4,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Holographic Biometric Terminal Box */}
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
          "font-mono-key relative w-full rounded-2xl border-2 px-6 py-8 text-lg leading-relaxed tracking-wider transition-all duration-200 select-none sm:text-xl md:text-2xl backdrop-blur-2xl cursor-text shadow-xl",
          "focus:outline-none",
          disabled && "cursor-not-allowed opacity-50",
          hasMismatch
            ? "border-rose-500/80 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.2)] animate-shake"
            : isComplete
              ? "border-emerald-500/80 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              : isFocused
                ? "border-(--color-accent) bg-(--color-surface-solid)/90 shadow-[0_0_35px_rgba(0,242,254,0.25)]"
                : "border-(--color-border) bg-(--color-surface) hover:border-(--color-border-glow)",
        )}
      >
        {/* Specular Terminal Top Rim */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-(--color-accent)/50 to-transparent opacity-70 rounded-t-2xl" />

        {phrase.split("").map((char, index) => {
          const state = index < typed.length ? "done" : index === typed.length ? "current" : "pending";
          return (
            <span
              key={index}
              className={clsx(
                "relative inline-block transition-colors duration-100",
                state === "done" && "text-emerald-400 font-semibold drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                state === "pending" && "text-(--color-text-dim) dark:text-slate-600",
                state === "current" && isFocused && !hasMismatch && "text-(--color-text) font-bold",
              )}
            >
              {/* Futuristic Cyber Caret */}
              {state === "current" && isFocused && !hasMismatch && (
                <span className="absolute -left-0.5 bottom-0 inline-block h-[1.25em] w-0.75 rounded-full bg-(--color-accent) animate-cyber-caret shadow-[0_0_10px_var(--color-accent)]" />
              )}
              {char === " " ? " " : char}
            </span>
          );
        })}

        {/* Unfocused Click Prompt Overlay */}
        {!isFocused && !isComplete && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-(--color-bg)/80 backdrop-blur-sm text-sm font-sans font-medium text-(--color-text-muted) cursor-pointer">
            <span className="flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-raised) px-4 py-2 text-xs font-semibold text-(--color-text) shadow-lg hover:border-(--color-accent) hover:text-(--color-accent) transition-all">
              <Keyboard size={15} className="text-(--color-accent)" />
              Click here to focus and type the phrase
            </span>
          </div>
        )}
      </div>

      <p id={descriptionId} className="sr-only">
        Type the displayed phrase exactly, without corrections. Pressing Backspace restarts the sample.
      </p>

      {/* Holographic Progress Track */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--color-border) p-0.5">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-150 shadow-sm",
              hasMismatch
                ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                : "bg-linear-to-r from-(--color-accent) via-teal-400 to-emerald-400 shadow-[0_0_10px_rgba(0,242,254,0.6)]",
            )}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs font-semibold text-(--color-text-muted)">
          {typed.length} / {phrase.length} ({Math.round(progress * 100)}%)
        </span>
      </div>

      {/* Dynamic Status Feedback Message */}
      <div className="flex items-center justify-between min-h-6 px-1 text-xs font-medium" aria-live="polite">
        {hasMismatch ? (
          <span className="flex items-center gap-1.5 text-rose-400 animate-fadeIn">
            <AlertOctagon size={14} />
            Cadence interrupted — resetting sample for pure rhythm integrity…
          </span>
        ) : isComplete ? (
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold animate-fadeIn">
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

