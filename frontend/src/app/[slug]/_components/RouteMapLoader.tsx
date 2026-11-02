"use client";

import dynamic from "next/dynamic";
import type { RouteMapStop } from "./RouteMap";

/**
 * Thin `"use client"` wrapper around the actual `next/dynamic(..., {ssr:
 * false})` call — Next's App Router forbids `ssr: false` directly inside
 * a Server Component (`MapSection.tsx`), it has to originate from a
 * Client Component boundary. This file's only job is being that
 * boundary; `RouteMap.tsx` itself has the real Leaflet logic.
 */
const RouteMap = dynamic(() => import("./RouteMap").then((mod) => mod.RouteMap), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-primary-100" aria-hidden="true" />,
});

export function RouteMapLoader(props: { path: [number, number][]; stops: RouteMapStop[] }) {
  return (
    <RouteMap
      path={props.path}
      stops={props.stops}
    />
  );
}
