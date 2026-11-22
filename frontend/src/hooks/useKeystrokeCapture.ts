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
  // Physical key (e.code) -> the character emitted on keydown. A keyup can report a
  // different `key` than its keydown (release Shift before "M" and the keyup says "m"),
  // which would leave the "M" press unpaired on the server.
  const downKeysRef = useRef<Map<string, string>>(new Map());

  useEffect(() => () => window.clearTimeout(resetTimeoutRef.current), []);

  const reset = useCallback(() => {
    window.clearTimeout(resetTimeoutRef.current);
    setTyped("");
    setEvents([]);
    setIsComplete(false);
    setHasMismatch(false);
    startTimeRef.current = null;
    downKeysRef.current.clear();
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
      downKeysRef.current.set(e.code ?? e.key, e.key);
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
      const codeId = e.code ?? e.key;
      const downKey = downKeysRef.current.get(codeId);
      if (downKey === undefined) return; // keyup for a press we never recorded
      downKeysRef.current.delete(codeId);
      const t = now();
      setEvents((prev) => [...prev, { key: downKey, type: "keyup" as const, t }]);

      // Complete only once every pressed key has been released. With rollover the
      // second-to-last key can be released after the last one is pressed; finishing
      // on that keyup would drop the final keyup and the server would see a missing press.
      setTyped((prevTyped) => {
        if (prevTyped.length === phrase.length && downKeysRef.current.size === 0) {
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
