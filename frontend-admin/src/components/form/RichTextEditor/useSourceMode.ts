import { useState } from "react";
import type { Editor } from "@tiptap/react";

// Source mode swaps the WYSIWYG view for a raw-HTML textarea. Switching back
// applies the edited HTML to the document (which fires onUpdate, so it
// flows back into the form field like any other edit) rather than syncing
// on every keystroke — mirrors how CKEditor's source view behaves.
export function useSourceMode(editor: Editor | null) {
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState("");

  const toggle = () => {
    if (!editor || editor.isDestroyed) return;

    if (sourceMode) {
      editor.commands.setContent(sourceValue, { emitUpdate: true });
      setSourceMode(false);
    } else {
      setSourceValue(editor.getHTML());
      setSourceMode(true);
    }
  };

  return { sourceMode, sourceValue, setSourceValue, toggle };
}
