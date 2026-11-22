import type { KeystrokeEvent } from "@/types";

export interface RhythmSummary {
  /** Average key hold time in ms (keydown → keyup). */
  avgDwell: number;
  /** Average gap between releasing one key and pressing the next, in ms. */
  avgFlight: number;
  /** Characters per second across the whole sample. */
  cps: number;
  totalMs: number;
  /** Time between consecutive keydowns, in ms (the "cadence"). */
  intervals: number[];
}

const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

/** Derives real timing statistics from captured keystroke events. Pure and deterministic. */
export function summarizeRhythm(events: KeystrokeEvent[]): RhythmSummary {
  const downs: number[] = [];
  const dwells: number[] = [];
  const flights: number[] = [];
  const pending = new Map<string, number>();
  let lastUp: number | null = null;

  for (const event of events) {
    if (event.type === "keydown") {
      downs.push(event.t);
      pending.set(event.key, event.t);
      if (lastUp !== null) flights.push(event.t - lastUp);
    } else {
      const start = pending.get(event.key);
      if (start !== undefined) {
        dwells.push(event.t - start);
        pending.delete(event.key);
      }
      lastUp = event.t;
    }
  }

  const intervals = downs.slice(1).map((t, i) => t - downs[i]);
  const totalMs = events.length ? events[events.length - 1].t - events[0].t : 0;

  return {
    avgDwell: mean(dwells),
    avgFlight: mean(flights),
    cps: totalMs > 0 ? downs.length / (totalMs / 1000) : 0,
    totalMs,
    intervals,
  };
}
