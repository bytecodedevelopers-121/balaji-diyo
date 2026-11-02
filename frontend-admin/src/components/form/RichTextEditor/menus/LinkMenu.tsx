import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Link2, Link2Off } from "lucide-react";
import { ToolbarButton, ToolbarDropdown } from "../toolbar-ui";
import { Button } from "@/components/ui/Button";

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^(https?:|mailto:|tel:|\/)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// The dropdown panel unmounts on close and remounts fresh on open (see
// ToolbarDropdown), so seeding state from the current link href here — via
// useState's initializer, not an effect — always reflects the link under
// the cursor at the moment the popover is opened.
function LinkForm({ editor, initialUrl, isActive, onDone }: { editor: Editor; initialUrl: string; isActive: boolean; onDone: () => void }) {
  const [url, setUrl] = useState(initialUrl);

  return (
    <form
      className="space-y-2 p-1"
      onSubmit={(e) => {
        e.preventDefault();
        const href = normalizeUrl(url);
        if (!href) {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
          editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        }
        onDone();
      }}
    >
      <label className="block text-xs font-medium text-gray-600" htmlFor="rte-link-url">
        URL
      </label>
      <input
        id="rte-link-url"
        type="text"
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
      />
      <div className="flex justify-end gap-2 pt-1">
        {isActive && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              onDone();
            }}
          >
            Remove
          </Button>
        )}
        <Button type="submit" size="sm">
          {isActive ? "Update" : "Insert"}
        </Button>
      </div>
    </form>
  );
}

export function LinkMenu({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const isActive = editor.isActive("link");
  const currentHref = (editor.getAttributes("link").href as string | undefined) ?? "";

  return (
    <div className="flex">
      <ToolbarDropdown
        label="Insert link"
        disabled={disabled}
        trigger={<Link2 className="h-4 w-4" />}
        triggerClassName={isActive ? "bg-indigo-100 text-indigo-700" : undefined}
        panelClassName="w-72"
      >
        {(close) => <LinkForm editor={editor} initialUrl={currentHref} isActive={isActive} onDone={close} />}
      </ToolbarDropdown>

      {isActive && (
        <ToolbarButton
          label="Remove link"
          disabled={disabled}
          onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
        >
          <Link2Off className="h-4 w-4" />
        </ToolbarButton>
      )}
    </div>
  );
}
