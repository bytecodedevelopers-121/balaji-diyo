import { useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { Alert } from "@/components/ui/Alert";
import { getPublicUrl } from "@/lib/storage";
import { useAttachments, useAttachMedia, useDetachAttachment } from "@/hooks/queries/useAttachments";
import { getErrorMessage } from "@/lib/apiError";
import type { AttachmentRole } from "@/types/attachment";
import type { Media } from "@/types/media";

interface AttachmentFieldProps {
  label: string;
  hint?: string;
  ownerType: string;
  ownerId: string | undefined;
  role: AttachmentRole;
  /** CSS aspect-ratio of the preview box, e.g. "16 / 10". Defaults to 16 / 9. */
  aspect?: string;
}

/** Single-image slot (Featured / Banner / Map, ...) backed by the Attachment API.
 *  Disabled until `ownerId` exists — the owner entity must be saved once first. */
export function AttachmentField({ label, hint, ownerType, ownerId, role, aspect = "16 / 9" }: AttachmentFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data, isLoading } = useAttachments(ownerType, ownerId, role);
  const attachMedia = useAttachMedia(ownerType, ownerId, role);
  const detachAttachment = useDetachAttachment(ownerType, ownerId, role);
  const [error, setError] = useState<string | null>(null);

  const current = data?.data[0];

  const handleSelect = (media: Media) => {
    setError(null);
    attachMedia.mutate(media.id, {
      onSuccess: () => setPickerOpen(false),
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  const handleRemove = () => {
    if (!current) return;
    setError(null);
    detachAttachment.mutate(current.id, { onError: (err) => setError(getErrorMessage(err)) });
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
          <div
            className="relative w-full max-w-xs overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            style={{ aspectRatio: aspect }}
          >
            {isLoading || attachMedia.isPending ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : current ? (
              <>
                <img
                  src={getPublicUrl(current.media.fullPath)}
                  alt={current.media.altText ?? current.media.fullName}
                  className="h-full w-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={detachAttachment.isPending}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  aria-label={`Remove ${label.toLowerCase()}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">Choose image</span>
              </button>
            )}
          </div>
          {current && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mt-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Replace
            </button>
          )}
        </>
      )}

      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        folder={ownerType}
      />
    </div>
  );
}
