import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { Attachment, AttachmentRole, CreateAttachmentDto } from "@/types/attachment";

export interface AttachmentOwnerParams {
  ownerType: string;
  ownerId: string;
  role?: AttachmentRole;
}

export const attachmentService = {
  getByOwner: (params: AttachmentOwnerParams) =>
    api.get<ApiResponse<Attachment[]>>("/attachments", { params }).then((r) => r.data),

  attach: (data: CreateAttachmentDto) => api.post<ApiResponse<Attachment>>("/attachments", data).then((r) => r.data),

  reorder: (ids: string[]) => api.patch<ApiResponse<null>>("/attachments/reorder", { ids }).then((r) => r.data),

  detach: (id: string) => api.delete<ApiResponse<null>>(`/attachments/${id}`).then((r) => r.data),
};
