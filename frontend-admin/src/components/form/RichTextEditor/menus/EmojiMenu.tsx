import type { Editor } from "@tiptap/react";
import { Smile } from "lucide-react";
import { ToolbarDropdown } from "../toolbar-ui";
import { EMOJI_LIST } from "../constants";

export function EmojiMenu({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  return (
    <ToolbarDropdown label="Insert emoji" disabled={disabled} trigger={<Smile className="h-4 w-4" />} panelClassName="w-64">
      {(close) => (
        <div className="grid max-h-56 grid-cols-8 gap-0.5 overflow-y-auto">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              title={emoji}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().insertContent(emoji).run();
                close();
              }}
              className="flex h-7 w-7 items-center justify-center rounded text-base hover:bg-gray-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </ToolbarDropdown>
  );
}
