import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKeystrokeCapture } from "./useKeystrokeCapture";

const PHRASE = "hi";

function fakeKeyEvent(key: string, repeat = false) {
  return { key, repeat, preventDefault: vi.fn() } as unknown as React.KeyboardEvent<HTMLElement>;
}

describe("useKeystrokeCapture", () => {
  it("records paired keydown/keyup events and completes when the phrase is typed", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useKeystrokeCapture({ phrase: PHRASE, onComplete }));

    act(() => result.current.handleKeyDown(fakeKeyEvent("h")));
    act(() => result.current.handleKeyUp(fakeKeyEvent("h")));
    expect(result.current.typed).toBe("h");
    expect(result.current.isComplete).toBe(false);

    act(() => result.current.handleKeyDown(fakeKeyEvent("i")));
    act(() => result.current.handleKeyUp(fakeKeyEvent("i")));

    expect(result.current.typed).toBe("hi");
    expect(result.current.isComplete).toBe(true);
    expect(result.current.events).toHaveLength(4);
    expect(result.current.events.map((e) => e.type)).toEqual(["keydown", "keyup", "keydown", "keyup"]);
  });

  it("ignores key-repeat events", () => {
    const { result } = renderHook(() => useKeystrokeCapture({ phrase: PHRASE }));

    act(() => result.current.handleKeyDown(fakeKeyEvent("h")));
    act(() => result.current.handleKeyDown(fakeKeyEvent("h", true))); // repeat — should be ignored

    expect(result.current.typed).toBe("h");
  });

  it("flags a mismatched character and eventually resets the sample", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useKeystrokeCapture({ phrase: PHRASE }));

    act(() => result.current.handleKeyDown(fakeKeyEvent("x"))); // expected "h"
    expect(result.current.hasMismatch).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.hasMismatch).toBe(false);
    expect(result.current.typed).toBe("");
    expect(result.current.events).toHaveLength(0);

    vi.useRealTimers();
  });

  it("Backspace resets the current sample instead of correcting it", () => {
    const { result } = renderHook(() => useKeystrokeCapture({ phrase: PHRASE }));

    act(() => result.current.handleKeyDown(fakeKeyEvent("h")));
    act(() => result.current.handleKeyUp(fakeKeyEvent("h")));
    act(() => result.current.handleKeyDown(fakeKeyEvent("Backspace")));

    expect(result.current.typed).toBe("");
    expect(result.current.events).toHaveLength(0);
  });
});
