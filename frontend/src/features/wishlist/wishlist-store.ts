"use client";

import { useSyncExternalStore } from "react";
import type { CardTrip } from "@/components/ui/PackageCard";

/** What a saved trip keeps — just enough to draw its card on /wishlist without refetching. */
export type WishlistItem = Pick<CardTrip, "id" | "slug" | "title" | "imageUrl" | "duration" | "durationType" | "priceFrom" | "rating" | "reviewCount">;

const STORAGE_KEY = "joyful-wishlist-v2";
const EMPTY: readonly WishlistItem[] = [];

let cache: readonly WishlistItem[] = EMPTY;
let hasRead = false;
const listeners = new Set<() => void>();

function parse(raw: string | null): readonly WishlistItem[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return EMPTY;
    const items = value.filter(
      (item): item is WishlistItem =>
        typeof item === "object" && item !== null && typeof item.slug === "string" && typeof item.title === "string",
    );
    return items.length > 0 ? items : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): readonly WishlistItem[] {
  if (!hasRead && typeof window !== "undefined") {
    try {
      cache = parse(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      cache = EMPTY;
    }
    hasRead = true;
  }
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = parse(event.newValue);
    hasRead = true;
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useWishlist(): readonly WishlistItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function toggleWishlist(item: WishlistItem): void {
  const current = getSnapshot();
  const next = current.some((i) => i.slug === item.slug) ? current.filter((i) => i.slug !== item.slug) : [...current, item];
  cache = next.length > 0 ? next : EMPTY;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage blocked — the wishlist still works for this page view.
  }
  listeners.forEach((l) => l());
}
