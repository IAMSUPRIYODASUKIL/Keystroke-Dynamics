import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePublicConfig } from "./usePublicConfig";
import { publicApi } from "@/services/api";

describe("usePublicConfig", () => {
  it("fetches public config successfully on mount", async () => {
    vi.spyOn(publicApi, "config").mockResolvedValueOnce({
      auth_phrase: "Test secret phrase.",
      min_enrollment_samples: 5,
    });

    const { result } = renderHook(() => usePublicConfig());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.config).toEqual({
      auth_phrase: "Test secret phrase.",
      min_enrollment_samples: 5,
    });
    expect(result.current.error).toBeNull();
  });

  it("handles error and allows refetching", async () => {
    const spy = vi
      .spyOn(publicApi, "config")
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce({
        auth_phrase: "Recovered phrase.",
        min_enrollment_samples: 8,
      });

    const { result } = renderHook(() => usePublicConfig());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.config).toBeNull();
    expect(result.current.error).toBeTruthy();

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.config).toEqual({
      auth_phrase: "Recovered phrase.",
      min_enrollment_samples: 8,
    });
    expect(result.current.error).toBeNull();
    spy.mockRestore();
  });
});

