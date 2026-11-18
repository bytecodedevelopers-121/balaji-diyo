import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { PageSection, SaveSectionDto } from "@/types/page-content";

/** Admin access to the page-content CMS (`/page-sections`). */
export const pageSectionService = {
  getPage: (pageKey: string) =>
    api.get<ApiResponse<PageSection[]>>(`/page-sections/${pageKey}`).then((r) => r.data),

  save: (pageKey: string, sectionKey: string, data: SaveSectionDto) =>
    api.put<ApiResponse<PageSection>>(`/page-sections/${pageKey}/${sectionKey}`, data).then((r) => r.data),
};
