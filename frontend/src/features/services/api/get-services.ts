import { apiFetch } from "@/lib/api/api-client";
import type { HomepageServicesPayload } from "../types/service.types";

/** Active, ordered service cards for the homepage. */
export function getHomepageServices(): Promise<HomepageServicesPayload> {
  return apiFetch<HomepageServicesPayload>("/services/public", {
    next: { revalidate: 900, tags: ["services"] },
  });
}
