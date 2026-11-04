"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "joyful:comparison-slugs";
const EMPTY_SLUGS: readonly string[] = [];

let cachedSlugs: readonly string[] = EMPTY_SLUGS;
let hasReadStorage = false;
const listeners = new Set<() => void>();

function sanitizeSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (slug): slug is string =>
          typeof slug === "string" &&
          slug.length > 0 &&
          slug.length <= 200 &&
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
      ),
    ),
  ];
}

function readStorage(): readonly string[] {
  if (typeof window === "undefined") return EMPTY_SLUGS;
  try {
    return sanitizeSlugs(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return EMPTY_SLUGS;
  }
}

function getSnapshot(): readonly string[] {
  if (!hasReadStorage && typeof window !== "undefined") {
    cachedSlugs = readStorage();
    hasReadStorage = true;
  }
  return cachedSlugs;
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function setSlugs(slugs: readonly string[]): void {
  const next = sanitizeSlugs(slugs);
  cachedSlugs = next.length > 0 ? next : EMPTY_SLUGS;
  hasReadStorage = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedSlugs));
    } catch {
      // Keep comparison usable in memory when storage is disabled/full.
    }
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cachedSlugs = readStorage();
    hasReadStorage = true;
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useComparisonSlugs(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SLUGS);
}

export function toggleComparisonSlug(slug: string): void {
  const current = getSnapshot();
  setSlugs(
    current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug],
  );
}

/** Idempotent add — a no-op if `slug` is already selected, unlike `toggleComparisonSlug`. Used by the "add a trip to compare" dropdown on /compare-itineraries itself (CompareButton.tsx's own toggle is the right call for a page that's already showing one specific trip; here there's no single "current" trip to toggle). */
export function addComparisonSlug(slug: string): void {
  const current = getSnapshot();
  if (current.includes(slug)) return;
  setSlugs([...current, slug]);
}

export function removeComparisonSlug(slug: string): void {
  setSlugs(getSnapshot().filter((item) => item !== slug));
}

/** Test-only reset that also ensures the next snapshot rereads localStorage. */
export function resetComparisonStore(): void {
  cachedSlugs = EMPTY_SLUGS;
  hasReadStorage = false;
  emit();
}

export { STORAGE_KEY as COMPARISON_STORAGE_KEY };
