import { useState } from "react";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { getPublicUrl } from "@/lib/storage";
import { useAttachments, useAttachMedia, useDetachAttachment, useReorderAttachments } from "@/hooks/queries/useAttachments";
import { getErrorMessage } from "@/lib/apiError";
import type { AttachmentRole } from "@/types/attachment";
import type { Media } from "@/types/media";

interface AttachmentGalleryProps {
  label: string;
  hint?: string;
  ownerType: string;
  ownerId: string | undefined;
  role: AttachmentRole;
  /** Lets this gallery instance hold video too (e.g. the itinerary day
   *  gallery) — otherwise images only, unchanged from before. */
  allowVideo?: boolean;
  /** Caps the total item count — the "Add" tile hides once reached.
   *  Omit for the default, unlimited gallery. */
  maxItems?: number;
  /** Caps how many of those items may be video (only meaningful with
   *  `allowVideo`) — once reached, video is excluded from the picker
   *  even though `maxItems` may still allow more photos. */
  maxVideos?: number;
}

/** Ordered multi-image slot (Gallery / Banner carousel, ...) backed by the Attachment API.
 *  Disabled until `ownerId` exists — the owner entity must be saved once first. */
export function AttachmentGallery({ label, hint, ownerType, ownerId, role, allowVideo, maxItems, maxVideos }: AttachmentGalleryProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading } = useAttachments(ownerType, ownerId, role);
  const attachMedia = useAttachMedia(ownerType, ownerId, role);
  const detachAttachment = useDetachAttachment(ownerType, ownerId, role);
  const reorderAttachments = useReorderAttachments(ownerType, ownerId, role);

  const items = data?.data ?? [];
  const videoCount = items.filter((a) => a.media.mime?.startsWith("video/")).length;
  const atMaxItems = maxItems !== undefined && items.length >= maxItems;
  const pickerAllowsVideo = allowVideo && !(maxVideos !== undefined && videoCount >= maxVideos);

  const handleSelect = (media: Media) => {
    setError(null);
    attachMedia.mutate(media.id, {
      onSuccess: () => setPickerOpen(false),
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  const handleRemove = (id: string) => {
    setError(null);
    detachAttachment.mutate(id, { onError: (err) => setError(getErrorMessage(err)) });
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((a) => a.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setError(null);
    reorderAttachments.mutate(ids, { onError: (err) => setError(getErrorMessage(err)) });
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-gray-500">{hint}</p>}

      {!ownerId ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-500">
          Save first to add {label.toLowerCase()}
        </p>
      ) : (
        <>
          {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-lg" />)
            ) : (
              <>
                {items.map((attachment, index) => (
                  <div
                    key={attachment.id}
                    className="group relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  >
                    {attachment.media.mime?.startsWith("video/") ? (
                      <video
                        src={getPublicUrl(attachment.media.fullPath)}
                        className="h-full w-full object-contain"
                        muted
                        playsInline
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={getPublicUrl(attachment.media.fullPath)}
                        alt={attachment.media.altText ?? attachment.media.fullName}
                        className="h-full w-full object-contain"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(attachment.id)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 hover:bg-black/80 group-hover:opacity-100"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 pb-1 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="rounded bg-black/60 p-0.5 text-white disabled:opacity-30"
                        aria-label="Move earlier"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                        className="rounded bg-black/60 p-0.5 text-white disabled:opacity-30"
                        aria-label="Move later"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {atMaxItems ? null : (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-[10px]">Add</span>
                  </button>
                )}
              </>
            )}
          </div>
          {atMaxItems && <p className="mt-1.5 text-xs text-gray-400">Maximum of {maxItems} reached.</p>}
        </>
      )}

      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        allowVideo={pickerAllowsVideo}
        folder={ownerType}
      />
    </div>
  );
}
