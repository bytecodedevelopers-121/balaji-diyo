import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchInput } from "@/components/table/SearchInput";
import { Pagination } from "@/components/table/Pagination";
import { MediaCard } from "@/components/media/MediaCard";
import { useMediaList, useUploadMedia } from "@/hooks/queries/useMedia";
import { getErrorMessage } from "@/lib/apiError";
import type { Media } from "@/types/media";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
// Matches the backend's `uploadMediaLibrary` multer instance (config/multer.ts)
// — one shared 60 MB cap for the whole `/media/upload` route, image or video.
// Checked here too so an oversized file fails fast with a clear message
// instead of a slow upload that multer only rejects once it's landed.
const MAX_FILE_SIZE_BYTES = 60 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "60 MB";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: Media) => void;
  /** Storage subfolder for anything uploaded from within this picker instance —
   *  e.g. "team", "global", "content". Omit to fall back to the generic "media"
   *  folder (see backend's UploadMediaDto/MediaService for the allowed format
   *  and default). Only affects new uploads, not browsing existing media. */
  folder?: string;
  /** Lets this picker instance browse/upload video too (e.g. the itinerary
   *  day gallery). Defaults to images only — the browse grid is also
   *  filtered server-side (`type: "image"`) so video never shows up,
   *  unselectable, in an image-only picker like a team photo field. */
  allowVideo?: boolean;
}

export function MediaPickerModal({ isOpen, onClose, onSelect, folder, allowVideo }: MediaPickerModalProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allowedTypes = allowVideo ? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES] : ALLOWED_IMAGE_TYPES;

  const { data, isLoading } = useMediaList({
    page,
    perPage: 18,
    search: search || undefined,
    type: allowVideo ? undefined : "image",
  });
  const items = data?.data.items ?? [];
  const meta = data?.data.meta;

  const uploadMedia = useUploadMedia();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    if (!allowedTypes.includes(file.type)) {
      setError(allowVideo ? "Only JPG, PNG, WebP, MP4, WebM or MOV files are allowed." : "Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large — max ${MAX_FILE_SIZE_LABEL}.`);
      return;
    }

    uploadMedia.mutate(
      { file, folder },
      {
        onSuccess: (res) => onSelect(res.data),
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={allowVideo ? "Select Photo or Video" : "Select Image"} size="xl">
      <div className="space-y-4">
        {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

        <div className="flex items-center gap-3">
          <div className="max-w-sm flex-1">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search by filename..."
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(",")}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isLoading={uploadMedia.isPending}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            Upload New
          </Button>
        </div>
        <p className="-mt-2 text-xs text-gray-400">Max {MAX_FILE_SIZE_LABEL} per file.</p>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No media found.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {items.map((media) => (
              <MediaCard key={media.id} media={media} onClick={() => onSelect(media)} />
            ))}
          </div>
        )}

        {meta && meta.total > 0 && (
          <Pagination
            page={meta.currentPage}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.perPage}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        )}
      </div>
    </Modal>
  );
}
