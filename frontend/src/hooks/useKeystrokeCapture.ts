import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { KeystrokeEvent } from "@/types";

const IGNORED_KEYS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "Tab",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
]);

const MISMATCH_RESET_DELAY_MS = 450;

interface UseKeystrokeCaptureOptions {
  phrase: string;
  onComplete?: (events: KeystrokeEvent[]) => void;
  disabled?: boolean;
}

interface UseKeystrokeCaptureResult {
  typed: string;
  events: KeystrokeEvent[];
  isComplete: boolean;
  hasMismatch: boolean;
  progress: number;
  reset: () => void;
  handleKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => void;
  handleKeyUp: (e: ReactKeyboardEvent<HTMLElement>) => void;
}

/** Captures raw keydown/keyup timing for the fixed authentication phrase.
 *
 * Deliberately does NOT bind to a native <input>'s value — every
 * character key is preventDefault()-ed and tracked purely through this
 * hook's own state, so there's no native text-editing/IME/undo-stack to
 * fight with. Backspace resets the whole sample rather than allowing a
 * correction: partial edits would misalign the fixed-position phrase and
 * corrupt the timing features (see docs/06_Machine_Learning.md /
 * docs/08_Feature_Extraction.md). A mismatched character briefly flashes
 * as an error, then auto-resets — keeping the flow forgiving without
 * silently accepting bad samples the backend would reject anyway.
 */
export function useKeystrokeCapture({
  phrase,
  onComplete,
  disabled = false,
}: UseKeystrokeCaptureOptions): UseKeystrokeCaptureResult {
  const [typed, setTyped] = useState("");
  const [events, setEvents] = useState<KeystrokeEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasMismatch, setHasMismatch] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const resetTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimeoutRef.current), []);

  const reset = useCallback(() => {
    window.clearTimeout(resetTimeoutRef.current);
    setTyped("");
    setEvents([]);
    setIsComplete(false);
    setHasMismatch(false);
    startTimeRef.current = null;
  }, []);

  const now = useCallback(() => {
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }
    return performance.now() - startTimeRef.current;
  }, []);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (disabled || isComplete || hasMismatch) return;
      if (e.repeat || IGNORED_KEYS.has(e.key)) {
        if (e.key !== "Shift") e.preventDefault();
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        reset();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        return;
      }
      if (e.key.length !== 1) {
        // Function keys, Home/End, etc. — not part of the phrase.
        e.preventDefault();
        return;
      }

      e.preventDefault();
      const expected = phrase[typed.length];
      const t = now();

      if (e.key !== expected) {
        setEvents((prev) => [...prev, { key: e.key, type: "keydown", t }]);
        setHasMismatch(true);
        resetTimeoutRef.current = window.setTimeout(reset, MISMATCH_RESET_DELAY_MS);
        return;
      }

      setEvents((prev) => [...prev, { key: e.key, type: "keydown", t }]);
      setTyped((prev) => prev + e.key);
    },
    [disabled, isComplete, hasMismatch, phrase, typed.length, now, reset],
  );

  const handleKeyUp = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (disabled || hasMismatch) return;
      if (IGNORED_KEYS.has(e.key) || e.key === "Backspace" || e.key === "Delete" || e.key === "Enter") {
        return;
      }
      if (e.key.length !== 1) return;

      e.preventDefault();
      const t = now();
      setEvents((prev) => [...prev, { key: e.key, type: "keyup" as const, t }]);

      setTyped((prevTyped) => {
        if (prevTyped.length === phrase.length) {
          setIsComplete(true);
        }
        return prevTyped;
      });
    },
    [disabled, hasMismatch, now, phrase, typed.length],
  );

  // Fire onComplete exactly once, right when the final keyup lands.
  const prevCompleteRef = useRef(false);
  if (isComplete && !prevCompleteRef.current) {
    prevCompleteRef.current = true;
    queueMicrotask(() => onComplete?.(events));
  }
  if (!isComplete && prevCompleteRef.current) {
    prevCompleteRef.current = false;
  }

  return {
    typed,
    events,
    isComplete,
    hasMismatch,
    progress: phrase.length > 0 ? typed.length / phrase.length : 0,
    reset,
    handleKeyDown,
    handleKeyUp,
  };
}
