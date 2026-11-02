import { useState } from "react";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { Button } from "@/components/ui/Button";
import { getPublicUrl } from "@/lib/storage";
import type { Media } from "@/types/media";

interface MediaUrlFieldProps {
  label: string;
  hint?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  /** Storage subfolder for a new upload from this field — e.g. "team",
   *  "package". See MediaPickerModal's own prop comment. */
  folder?: string;
}

/**
 * Single-image field backed by a plain string URL (not the polymorphic
 * Attachment API — see AttachmentField for that). For entities that just
 * store one resolved image URL directly on their own record (e.g.
 * TeamMember.photoUrl), rather than a related Attachment row that needs
 * an already-saved owner id to attach to.
 *
 * Extracted from the inline image-picker block GlobalSettingFormDrawer
 * had (IMAGE-type settings) — same MediaPickerModal (browse existing +
 * upload new, both already wired to POST /media/upload), same preview +
 * clear affordance. Stores the fully resolved public URL
 * (`getPublicUrl(media.fullPath)`), not the raw storage path —
 * GlobalSettingFormDrawer's own field stores the raw path instead (kept
 * as-is, not migrated here, to avoid touching working code); this
 * component's fully-resolved-URL convention is what a field meant to be
 * read directly by a separate frontend (the public Next.js site, in
 * TeamMemberForm's case) actually needs.
 */
export function MediaUrlField({
  label,
  hint,
  value,
  onChange,
  error,
  folder,
}: MediaUrlFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-gray-500">{hint}</p>}

      {value ? (
        <div className="mb-2 flex items-center gap-3 rounded-lg border border-gray-200 p-2">
          <img src={value} alt="" className="h-12 w-12 rounded object-cover" />
          <span className="truncate text-xs text-gray-600">{value}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => onChange("")}
          >
            Clear
          </Button>
        </div>
      ) : (
        <p className="mb-2 text-xs text-gray-400">No image selected.</p>
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
        {value ? "Change Image" : "Choose or Upload Image"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media: Media) => {
          onChange(getPublicUrl(media.fullPath));
          setPickerOpen(false);
        }}
        folder={folder}
      />
    </div>
  );
}
