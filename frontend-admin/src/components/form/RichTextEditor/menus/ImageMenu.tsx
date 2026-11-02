import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImageIcon, FolderOpen, Link2 } from "lucide-react";
import { ToolbarDropdown, ToolbarMenuItem } from "../toolbar-ui";
import { Button } from "@/components/ui/Button";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { getPublicUrl } from "@/lib/storage";
import type { Media } from "@/types/media";

export function ImageMenu({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [urlFormOpen, setUrlFormOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  const insertImage = (src: string, altText: string) => {
    editor.chain().focus().setImage({ src, alt: altText || undefined }).run();
  };

  const handleSelectMedia = (media: Media) => {
    insertImage(getPublicUrl(media.fullPath), media.altText ?? "");
    setPickerOpen(false);
  };

  return (
    <>
      <ToolbarDropdown label="Insert image" disabled={disabled} trigger={<ImageIcon className="h-4 w-4" />} panelClassName="w-64">
        {(close) => (
          <div className="space-y-1">
            <ToolbarMenuItem
              onClick={() => {
                setPickerOpen(true);
                close();
              }}
            >
              <span className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Upload or choose from library
              </span>
            </ToolbarMenuItem>

            {!urlFormOpen ? (
              <ToolbarMenuItem onClick={() => setUrlFormOpen(true)}>
                <span className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Insert from URL
                </span>
              </ToolbarMenuItem>
            ) : (
              <form
                className="space-y-2 border-t border-gray-100 p-2 pt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!url.trim()) return;
                  insertImage(url.trim(), alt.trim());
                  setUrl("");
                  setAlt("");
                  setUrlFormOpen(false);
                  close();
                }}
              >
                <input
                  autoFocus
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Alt text (optional)"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    Insert
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </ToolbarDropdown>

      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectMedia}
        folder="content"
      />
    </>
  );
}
