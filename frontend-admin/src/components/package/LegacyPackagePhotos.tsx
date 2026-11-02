import { useState } from "react";
import { X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { getPublicUrl } from "@/lib/storage";
import { useAttachments, useDetachAttachment } from "@/hooks/queries/useAttachments";
import { getErrorMessage } from "@/lib/apiError";
import type { Attachment, AttachmentRole } from "@/types/attachment";

interface LegacyPackagePhotosProps {
  ownerType: string;
  ownerId: string | undefined;
}

/** One role's extra photos — everything the single-image Featured / Banner
 *  fields above don't already show. `skipFirst` mirrors those fields, which
 *  render only `data[0]` of their role. */
function useExtraPhotos(ownerType: string, ownerId: string | undefined, role: AttachmentRole, skipFirst: boolean) {
  const { data, isLoading } = useAttachments(ownerType, ownerId, role);
  const detach = useDetachAttachment(ownerType, ownerId, role);
  const all = data?.data ?? [];
  return { items: skipFirst ? all.slice(1) : all, isLoading, detach };
}

/**
 * The old site kept a package's photos as several BANNER rows (≈4 per
 * package) plus the odd SINGLE_BANNER, and the public package page shows all
 * of them. The Photos tab's Featured/Banner fields only surface one image
 * each, so without this list those photos were live on the site but
 * invisible (and un-removable) in the admin.
 *
 * Note the Banner Image field above *replaces* the whole BANNER role when a
 * new image is picked — that also clears the photos listed here.
 */
export function LegacyPackagePhotos({ ownerType, ownerId }: LegacyPackagePhotosProps) {
  const [error, setError] = useState<string | null>(null);
  const banner = useExtraPhotos(ownerType, ownerId, "BANNER", true);
  const singleBanner = useExtraPhotos(ownerType, ownerId, "SINGLE_BANNER", false);
  const featured = useExtraPhotos(ownerType, ownerId, "FEATURED", true);

  if (!ownerId) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-500">
        Save first to see existing photos
      </p>
    );
  }

  const groups = [
    { source: banner, label: "Banner", role: "BANNER" },
    { source: singleBanner, label: "Single banner", role: "SINGLE_BANNER" },
    { source: featured, label: "Featured", role: "FEATURED" },
  ] as const;

  const isLoading = groups.some((g) => g.source.isLoading);
  const photos = groups.flatMap((g) => g.source.items.map((attachment) => ({ attachment, group: g })));

  const handleRemove = (attachment: Attachment, detach: (typeof groups)[number]["source"]["detach"]) => {
    setError(null);
    detach.mutate(attachment.id, { onError: (err) => setError(getErrorMessage(err)) });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return <p className="text-xs text-gray-500">No other photos from the old site on this package.</p>;
  }

  return (
    <div>
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {photos.map(({ attachment, group }) => (
          <div
            key={attachment.id}
            className="group relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
          >
            <img
              src={getPublicUrl(attachment.media.fullPath)}
              alt={attachment.media.altText ?? attachment.media.fullName}
              className="h-full w-full object-cover"
            />
            <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">{group.label}</span>
            <button
              type="button"
              onClick={() => handleRemove(attachment, group.source.detach)}
              disabled={group.source.detach.isPending}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 hover:bg-black/80 group-hover:opacity-100"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
