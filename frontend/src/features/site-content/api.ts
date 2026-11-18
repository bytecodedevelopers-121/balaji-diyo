import { apiFetch } from "@/lib/api/api-client";
import type { Destination, GuideTopic, TravelGuide, WebStory } from "./types";

/**
 * Destinations, travel guides and web stories, served by the backend's
 * `/destinations`, `/travel-guides` and `/web-stories` endpoints (seeded with
 * `npm run seed:content`, edited in the admin panel). Lists degrade to `[]`
 * and single lookups to `null` when the API is unreachable or has no such row.
 */
const revalidate = 900;
/** Web stories are edited often in the admin, so they refresh much sooner. */
const revalidateFor = (tag: string) => (tag === "web-stories" ? 30 : revalidate);

async function list<T>(path: string, tag: string): Promise<T[]> {
  try {
    return await apiFetch<T[]>(path, { next: { revalidate: revalidateFor(tag), tags: [tag] } });
  } catch {
    return [];
  }
}

async function one<T>(path: string, tag: string): Promise<T | null> {
  try {
    return await apiFetch<T>(path, { next: { revalidate: revalidateFor(tag), tags: [tag] } });
  } catch {
    return null;
  }
}

export const getDestinations = () => list<Destination>("/destinations", "destinations");
export const getDestination = (slug: string) => one<Destination>(`/destinations/${encodeURIComponent(slug)}`, "destinations");

export const getTravelGuides = () => list<TravelGuide>("/travel-guides", "travel-guides");
export const getTravelGuide = (slug: string) => one<TravelGuide>(`/travel-guides/${encodeURIComponent(slug)}`, "travel-guides");
export const findGuideTopic = (guide: TravelGuide, topicSlug: string): GuideTopic | undefined =>
  guide.topics.find((topic) => topic.slug === topicSlug);

export const getWebStories = () => list<WebStory>("/web-stories", "web-stories");
export const getWebStory = (slug: string) => one<WebStory>(`/web-stories/${encodeURIComponent(slug)}`, "web-stories");
