import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";
import { cn } from "@/utils";
import { Toolbar } from "./Toolbar";
import { SourceView } from "./SourceView";
import { useSourceMode } from "./useSourceMode";
import { FontSize } from "./extensions/font-size";
import { Indent } from "./extensions/indent";
import { ResizableImage } from "./extensions/resizable-image";
import { SearchAndReplace } from "./extensions/search-and-replace";
import "./content.css";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, disabled, placeholder, minHeight = 220 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Subscript.extend({ excludes: "superscript" }),
      Superscript.extend({ excludes: "subscript" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Indent,
      TaskList,
      TaskItem.configure({ nested: true }),
      ResizableImage.configure({ inline: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      SearchAndReplace,
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn("rte-content", "outline-none px-3 py-2 text-sm text-gray-900"),
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  const { sourceMode, sourceValue, setSourceValue, toggle: toggleSourceMode } = useSourceMode(editor);

  // Sync external value changes (e.g. defaultValues loading after an async fetch).
  // The `isDestroyed` guard matters: Tiptap's useEditor tears down and rebuilds the
  // underlying editor around Strict Mode / Suspense remounts, and a stale reference
  // to the torn-down instance throws deep inside ProseMirror when touched here.
  useEffect(() => {
    if (!editor || editor.isDestroyed || value === undefined) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  const words = editor.storage.characterCount.words();
  const characters = editor.storage.characterCount.characters();

  return (
    <div className="overflow-clip rounded-lg border border-gray-300 bg-white focus-within:border-indigo-500">
      <Toolbar editor={editor} disabled={disabled} sourceMode={sourceMode} onToggleSourceMode={toggleSourceMode} />

      {sourceMode ? (
        <SourceView value={sourceValue} onChange={setSourceValue} disabled={disabled} minHeight={minHeight} />
      ) : (
        <EditorContent editor={editor} className="border-t border-gray-200" />
      )}

      <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-400">
        {words} words · {characters} characters
      </div>
    </div>
  );
}
