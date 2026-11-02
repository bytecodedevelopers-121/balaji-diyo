import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  addComparisonSlug,
  COMPARISON_STORAGE_KEY,
  removeComparisonSlug,
  resetComparisonStore,
  toggleComparisonSlug,
  useComparisonSlugs,
} from "./comparison-store";

describe("comparison store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetComparisonStore();
  });

  it("adds, persists, prevents duplicates, and removes package slugs", () => {
    const { result } = renderHook(() => useComparisonSlugs());

    act(() => toggleComparisonSlug("everest-base-camp-trek"));
    expect(result.current).toEqual(["everest-base-camp-trek"]);
    expect(JSON.parse(window.localStorage.getItem(COMPARISON_STORAGE_KEY) ?? "[]")).toEqual([
      "everest-base-camp-trek",
    ]);

    act(() => toggleComparisonSlug("everest-base-camp-trek"));
    expect(result.current).toEqual([]);

    act(() => {
      toggleComparisonSlug("everest-base-camp-trek");
      toggleComparisonSlug("gokyo-valley-trek");
      removeComparisonSlug("everest-base-camp-trek");
    });
    expect(result.current).toEqual(["gokyo-valley-trek"]);
  });

  it("adds a slug idempotently, unlike toggle", () => {
    const { result } = renderHook(() => useComparisonSlugs());

    act(() => addComparisonSlug("everest-base-camp-trek"));
    expect(result.current).toEqual(["everest-base-camp-trek"]);

    // A second add of the same slug is a no-op, not a remove (toggle's
    // own behavior) — PackageSelectDropdown.tsx relies on this so
    // re-selecting an already-added trip never silently drops it.
    act(() => addComparisonSlug("everest-base-camp-trek"));
    expect(result.current).toEqual(["everest-base-camp-trek"]);

    act(() => addComparisonSlug("gokyo-valley-trek"));
    expect(result.current).toEqual(["everest-base-camp-trek", "gokyo-valley-trek"]);
  });

  it("recovers safely from malformed stored data", () => {
    window.localStorage.setItem(COMPARISON_STORAGE_KEY, "not-json");
    resetComparisonStore();

    const { result } = renderHook(() => useComparisonSlugs());
    expect(result.current).toEqual([]);
  });

  it("filters invalid values and duplicate slugs from storage", () => {
    window.localStorage.setItem(
      COMPARISON_STORAGE_KEY,
      JSON.stringify(["valid-trip", "valid-trip", "Not Valid", 12, null]),
    );
    resetComparisonStore();

    const { result } = renderHook(() => useComparisonSlugs());
    expect(result.current).toEqual(["valid-trip"]);
  });
});
