import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { GuideTopic, SiteContentResource, TravelGuide } from "@/types/site-content";

/** Admin CRUD for destinations, travel guides and web stories (`/destinations`, `/travel-guides`, `/web-stories`). */
export const siteContentService = {
  list: <T>(resource: SiteContentResource) =>
    api.get<ApiResponse<T[]>>(`/${resource}/admin/all`).then((r) => r.data),

  create: <T>(resource: SiteContentResource, data: object) =>
    api.post<ApiResponse<T>>(`/${resource}`, data).then((r) => r.data),

  update: <T>(resource: SiteContentResource, id: string, data: object) =>
    api.patch<ApiResponse<T>>(`/${resource}/${id}`, data).then((r) => r.data),

  remove: (resource: SiteContentResource, id: string) =>
    api.delete<ApiResponse<null>>(`/${resource}/${id}`).then((r) => r.data),

  /**
   * Saves a guide's own fields, then syncs its topics: rows with an `id` are
   * patched, rows without are created, and topics missing from the list are deleted.
   */
  async saveGuide(guide: TravelGuide | null, data: Omit<TravelGuide, "id" | "topics">, topics: GuideTopic[]) {
    const saved = guide
      ? await api.patch<ApiResponse<TravelGuide>>(`/travel-guides/${guide.id}`, data).then((r) => r.data.data)
      : await api.post<ApiResponse<TravelGuide>>("/travel-guides", data).then((r) => r.data.data);

    const keepIds = new Set(topics.map((t) => t.id).filter(Boolean));
    for (const old of guide?.topics ?? []) {
      if (old.id && !keepIds.has(old.id)) await api.delete(`/travel-guides/${saved.id}/topics/${old.id}`);
    }
    for (const [index, topic] of topics.entries()) {
      const { id, ...body } = topic;
      const payload = { ...body, intro: body.intro ?? undefined, sortOrder: index };
      if (id) await api.patch(`/travel-guides/${saved.id}/topics/${id}`, payload);
      else await api.post(`/travel-guides/${saved.id}/topics`, payload);
    }
    return saved;
  },
};
