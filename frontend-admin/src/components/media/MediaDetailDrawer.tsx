import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getPublicUrl } from "@/lib/storage";
import type { Media } from "@/types/media";

interface MediaDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  media: Media | null;
  onSave: (altText: string) => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function MediaDetailDrawer({
  isOpen,
  onClose,
  media,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  canEdit,
  canDelete,
}: MediaDetailDrawerProps) {
  const [altText, setAltText] = useState(media?.altText ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!media) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={media.fullName}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          {canDelete ? (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)} isLoading={isDeleting}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {canEdit && (
              <Button onClick={() => onSave(altText)} isLoading={isSaving}>
                Save
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img src={getPublicUrl(media.fullPath)} alt={media.altText ?? media.fullName} className="w-full object-contain" />
        </div>
        <div className="space-y-3">
          <Input
            label="Alt Text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            disabled={!canEdit}
            hint="Used for accessibility and SEO"
          />
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <div>
              <p className="text-xs font-medium text-gray-400">Dimensions</p>
              <p>{media.width && media.height ? `${media.width} × ${media.height}` : "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Type</p>
              <p>{media.mime ?? "—"}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">File Path</p>
            <p className="break-all text-xs text-gray-500">{media.fullPath}</p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmingDelete}
        title="Delete Media"
        message={`Are you sure you want to delete "${media.fullName}"? This cannot be undone.`}
        onConfirm={() => {
          setConfirmingDelete(false);
          onDelete();
        }}
        onCancel={() => setConfirmingDelete(false)}
        isLoading={isDeleting}
      />
    </Drawer>
  );
}
