import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { pageSectionService } from "@/services/page-section.service";
import type { SaveSectionDto } from "@/types/page-content";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const usePageSections = (pageKey: string) =>
  useQuery({
    queryKey: queryKeys.pageSections.page(pageKey),
    queryFn: () => pageSectionService.getPage(pageKey),
  });

export const useSaveSection = (pageKey: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: ({ sectionKey, data }: { sectionKey: string; data: SaveSectionDto }) =>
      pageSectionService.save(pageKey, sectionKey, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pageSections.page(pageKey) }),
  });
};
