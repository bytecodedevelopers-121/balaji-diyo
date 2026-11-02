import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { galleryAlbumService, type GalleryAlbumListParams } from "@/services/gallery-album.service";
import type { GalleryAlbumFormValues } from "@/types/gallery-album";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useGalleryAlbums = (params?: GalleryAlbumListParams) =>
  useQuery({
    queryKey: queryKeys.galleryAlbums.list(params),
    queryFn: () => galleryAlbumService.getAll(params),
  });

export const useGalleryAlbum = (id: string) =>
  useQuery({
    queryKey: queryKeys.galleryAlbums.detail(id),
    queryFn: () => galleryAlbumService.getById(id),
    enabled: !!id,
  });

export const useCreateGalleryAlbum = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: galleryAlbumService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.galleryAlbums.all }),
  });
};

export const useUpdateGalleryAlbum = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<GalleryAlbumFormValues>) => galleryAlbumService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.galleryAlbums.all });
      qc.invalidateQueries({ queryKey: queryKeys.galleryAlbums.detail(id) });
    },
  });
};

export const useDeleteGalleryAlbum = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => galleryAlbumService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.galleryAlbums.all }),
  });
};
