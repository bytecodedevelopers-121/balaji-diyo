import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { mediaService, type MediaListParams } from "@/services/media.service";
import type { UpdateMediaDto } from "@/types/media";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useMediaList = (params?: MediaListParams) =>
  useQuery({
    queryKey: queryKeys.media.list(params),
    queryFn: () => mediaService.getAll(params),
  });

export const useUploadMedia = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: ({
      file,
      altText,
      onProgress,
      folder,
    }: {
      file: File;
      altText?: string;
      onProgress?: (percent: number) => void;
      /** Storage subfolder — e.g. "team", "global", "content". See UploadMediaDto (backend) for the allowed format. */
      folder?: string;
    }) => mediaService.upload(file, altText, onProgress, folder),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.media.all }),
  });
};

export const useUpdateMedia = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateMediaDto) => mediaService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.media.all }),
  });
};

export const useDeleteMedia = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => mediaService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.media.all }),
  });
};
