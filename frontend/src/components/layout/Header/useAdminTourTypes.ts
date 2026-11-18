"use client";

import { useEffect, useState } from "react";

export interface AdminTourType {
  label: string;
  /** Public browse page of the tour type. */
  href: string;
  slug: string;
}

/** Tour types an admin created (Admin → Travel → Tour Types), loaded once per page view. */
export function useAdminTourTypes(): AdminTourType[] {
  const [items, setItems] = useState<AdminTourType[]>([]);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return;
    const controller = new AbortController();
    fetch(`${base}/categories?extraField1=tour-type&isActive=true&perPage=50`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { data?: { items?: { title: string; slug: string | null }[] } } | null) => {
        setItems(
          (json?.data?.items ?? [])
            .filter((c): c is { title: string; slug: string } => !!c.slug)
            .map((c) => ({ label: c.title, href: `/${c.slug}`, slug: c.slug })),
        );
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return items;
}

export interface AdminRegion {
  title: string;
  slug: string;
  href: string;
}

/**
 * Regions an admin created under a tour type (Admin → Travel → Regions): the active child
 * categories of the tour type's category. Loaded when `slug` is first requested, then cached.
 */
export function useTourTypeRegions(slug: string | null): AdminRegion[] {
  const [bySlug, setBySlug] = useState<Record<string, AdminRegion[]>>({});
  const requested = slug !== null && bySlug[slug] !== undefined;
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base || !slug || requested) return;
    const controller = new AbortController();
    const done = (regions: AdminRegion[]) => setBySlug((prev) => ({ ...prev, [slug]: regions }));
    fetch(`${base}/categories/slug/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { data?: { id?: string } } | null) => {
        const id = json?.data?.id;
        if (!id) return done([]);
        return fetch(`${base}/categories?parentId=${id}&isActive=true&perPage=50`, { signal: controller.signal })
          .then((r) => (r.ok ? r.json() : null))
          .then((list: { data?: { items?: { title: string; slug: string | null }[] } } | null) =>
            done(
              (list?.data?.items ?? [])
                .filter((c): c is { title: string; slug: string } => !!c.slug)
                .map((c) => ({ title: c.title, slug: c.slug, href: `/${c.slug}` })),
            ),
          );
      })
      .catch(() => {});
    return () => controller.abort();
  }, [slug, requested]);
  return slug ? (bySlug[slug] ?? []) : [];
}
