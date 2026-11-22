import { describe, expect, it } from "vitest";
import { summarizeRhythm } from "@/utils/rhythm";
import type { KeystrokeEvent } from "@/types";

const ev = (key: string, type: "keydown" | "keyup", t: number): KeystrokeEvent => ({ key, type, t });

describe("summarizeRhythm", () => {
  it("returns zeros for an empty sample", () => {
    expect(summarizeRhythm([])).toEqual({ avgDwell: 0, avgFlight: 0, cps: 0, totalMs: 0, intervals: [] });
  });

  it("computes dwell, flight, cadence and speed from real events", () => {
    const summary = summarizeRhythm([
      ev("a", "keydown", 0),
      ev("a", "keyup", 80),
      ev("b", "keydown", 120),
      ev("b", "keyup", 220),
      ev("c", "keydown", 260),
      ev("c", "keyup", 340),
    ]);
    expect(summary.avgDwell).toBeCloseTo(86.67, 1);
    expect(summary.avgFlight).toBe(40);
    expect(summary.intervals).toEqual([120, 140]);
    expect(summary.totalMs).toBe(340);
    expect(summary.cps).toBeCloseTo(3 / 0.34, 3);
  });
});
