import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { getPublicUrl } from "@/lib/storage";
import type { Media } from "@/types/media";

const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "http://localhost:3000").replace(/\/+$/, "");

/** Seeded images are site paths (/images/...) served by the public website, not the API. */
const previewSrc = (value: string) => (value.startsWith("/") ? `${SITE_URL}${value}` : value);

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  folder?: string;
  /** Wording used in the buttons, e.g. "image" or "thumbnail". */
  noun?: string;
}

/** Thumbnail slot: click to choose from the media library or upload a new image. */
export function ThumbnailField({ label, value, onChange, required, folder, noun = "thumbnail" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      <div className="relative aspect-[3/2] w-full max-w-xs overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {value ? (
          <>
            <img src={previewSrc(value)} alt="" className="size-full object-cover" />
            <button
              type="button"
              aria-label={`Remove ${noun}`}
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
            <ImagePlus size={22} />
            Choose or upload {noun}
          </button>
        )}
      </div>
      {value && (
        <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs font-medium text-indigo-600 hover:underline">
          Change {noun}
        </button>
      )}

      <MediaPickerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={(media: Media) => {
          onChange(getPublicUrl(media.fullPath));
          setOpen(false);
        }}
        folder={folder}
      />
    </div>
  );
}
