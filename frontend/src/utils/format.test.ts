import { describe, expect, it } from "vitest";
import { formatMs, formatPercent } from "./format";

describe("formatPercent", () => {
  it("formats a 0-1 ratio as a percentage string", () => {
    expect(formatPercent(0.942)).toBe("94.2%");
    expect(formatPercent(1)).toBe("100.0%");
    expect(formatPercent(0)).toBe("0.0%");
  });
});

describe("formatMs", () => {
  it("rounds to the nearest millisecond", () => {
    expect(formatMs(123.456)).toBe("123 ms");
  });
});
