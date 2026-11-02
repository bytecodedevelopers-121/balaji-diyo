import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { attachmentService } from "@/services/attachment.service";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import type { AttachmentRole, CreateAttachmentDto } from "@/types/attachment";

// `ownerId` is undefined until the parent entity (package, itinerary, ...) has
// been saved once — the query stays disabled until then.
export const useAttachments = (ownerType: string, ownerId: string | undefined, role?: AttachmentRole) =>
  useQuery({
    queryKey: queryKeys.attachments.byOwner(ownerType, ownerId, role),
    queryFn: () => attachmentService.getByOwner({ ownerType, ownerId: ownerId as string, role }),
    enabled: !!ownerId,
  });

export const useAttachMedia = (ownerType: string, ownerId: string | undefined, role: AttachmentRole) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (mediaId: string) => {
      const dto: CreateAttachmentDto = { mediaId, ownerType, ownerId: ownerId as string, role };
      return attachmentService.attach(dto);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.attachments.byOwner(ownerType, ownerId, role) }),
  });
};

export const useDetachAttachment = (ownerType: string, ownerId: string | undefined, role: AttachmentRole) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => attachmentService.detach(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.attachments.byOwner(ownerType, ownerId, role) }),
  });
};

export const useReorderAttachments = (ownerType: string, ownerId: string | undefined, role: AttachmentRole) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (ids: string[]) => attachmentService.reorder(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.attachments.byOwner(ownerType, ownerId, role) }),
  });
};
