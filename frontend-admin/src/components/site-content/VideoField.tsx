import { useState } from "react";
import { Film, X } from "lucide-react";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { getPublicUrl } from "@/lib/storage";
import type { Media } from "@/types/media";

const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "http://localhost:3000").replace(/\/+$/, "");

/** Built-in clips are site paths (/videos/...) served by the public website, not the API. */
const previewSrc = (value: string) => (value.startsWith("/") ? `${SITE_URL}${value}` : value);

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  folder?: string;
}

/** Video slot: choose a clip from the media library or upload a new MP4 / WebM / MOV. */
export function VideoField({ label, value, onChange, folder }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>

      <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {value ? (
          <>
            <video src={previewSrc(value)} muted controls preload="metadata" className="size-full object-cover" />
            <button
              type="button"
              aria-label="Remove video"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex size-full flex-col items-center justify-center gap-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            <Film size={22} />
            Choose or upload video
          </button>
        )}
      </div>
      {value && (
        <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs font-medium text-indigo-600 hover:underline">
          Change video
        </button>
      )}

      <MediaPickerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        allowVideo
        onSelect={(media: Media) => {
          onChange(getPublicUrl(media.fullPath));
          setOpen(false);
        }}
        folder={folder}
      />
    </div>
  );
}
