import { useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Code,
  Palette,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListTodo,
  IndentIncrease,
  IndentDecrease,
  Quote,
  Minus,
  Eraser,
  SearchCode,
  Code2,
} from "lucide-react";
import { ToolbarButton, ToolbarSeparator } from "./toolbar-ui";
import { ColorMenu } from "./menus/ColorMenu";
import { FormatMenu } from "./menus/FormatMenu";
import { FontFamilyMenu } from "./menus/FontFamilyMenu";
import { FontSizeMenu } from "./menus/FontSizeMenu";
import { LinkMenu } from "./menus/LinkMenu";
import { ImageMenu } from "./menus/ImageMenu";
import { TableInsertMenu, TableContextToolbar } from "./menus/TableMenu";
import { EmojiMenu } from "./menus/EmojiMenu";
import { FindReplacePanel } from "./menus/FindReplacePanel";
import { TEXT_COLORS, HIGHLIGHT_COLORS } from "./constants";

interface ToolbarProps {
  editor: Editor;
  disabled?: boolean;
  sourceMode: boolean;
  onToggleSourceMode: () => void;
}

const EMPTY_STATE = {
  canUndo: false,
  canRedo: false,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  subscript: false,
  superscript: false,
  code: false,
  textColor: undefined as string | undefined,
  highlight: undefined as string | undefined,
  alignLeft: false,
  alignCenter: false,
  alignRight: false,
  alignJustify: false,
  bulletList: false,
  orderedList: false,
  taskList: false,
  blockquote: false,
  inList: false,
};

export function Toolbar({ editor, disabled, sourceMode, onToggleSourceMode }: ToolbarProps) {
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);

  // Centralizing every `isActive`/`can` read behind useEditorState means the
  // toolbar re-renders on selection/transaction changes (so button active
  // states stay correct while just clicking around) without each button
  // separately subscribing.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      // Tiptap v3 passes `null` while the editor is being torn down / recreated
      // (Strict Mode, remounts), so every read must be guarded.
      if (!editor || editor.isDestroyed) return EMPTY_STATE;
      return {
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      subscript: editor.isActive("subscript"),
      superscript: editor.isActive("superscript"),
      code: editor.isActive("code"),
      textColor: editor.getAttributes("textStyle").color as string | undefined,
      highlight: editor.getAttributes("highlight").color as string | undefined,
      alignLeft: editor.isActive({ textAlign: "left" }),
      alignCenter: editor.isActive({ textAlign: "center" }),
      alignRight: editor.isActive({ textAlign: "right" }),
      alignJustify: editor.isActive({ textAlign: "justify" }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      taskList: editor.isActive("taskList"),
      blockquote: editor.isActive("blockquote"),
      inList: editor.isActive("listItem"),
      };
    },
  });

  const toggleAlign = (align: "left" | "center" | "right" | "justify") =>
    editor.chain().focus().setTextAlign(align).run();

  const handleIndent = () => {
    if (state.inList) editor.chain().focus().sinkListItem("listItem").run();
    else editor.chain().focus().indent().run();
  };
  const handleOutdent = () => {
    if (state.inList) editor.chain().focus().liftListItem("listItem").run();
    else editor.chain().focus().outdent().run();
  };

  return (
    <div className="sticky top-0 z-10 bg-gray-50">
      {/* Row 1 — history, structure, fonts, inline marks, color, utilities */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 px-1.5 py-1">
        <ToolbarButton label="Undo" disabled={disabled || !state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={disabled || !state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <FormatMenu editor={editor} disabled={disabled} />
        <FontFamilyMenu editor={editor} disabled={disabled} />
        <FontSizeMenu editor={editor} disabled={disabled} />

        <ToolbarSeparator />

        <ToolbarButton label="Bold" active={state.bold} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={state.italic} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={state.underline}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={state.strike}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Subscript"
          active={state.subscript}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <SubscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Superscript"
          active={state.superscript}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Inline code" active={state.code} disabled={disabled} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ColorMenu
          label="Text color"
          icon={<Palette className="h-4 w-4" style={{ color: state.textColor || undefined }} />}
          colors={TEXT_COLORS}
          activeColor={state.textColor}
          onSelect={(color) => {
            if (color) editor.chain().focus().setColor(color).run();
            else editor.chain().focus().unsetColor().run();
          }}
        />
        <ColorMenu
          label="Highlight color"
          icon={<Highlighter className="h-4 w-4" style={{ color: state.highlight || undefined }} />}
          colors={HIGHLIGHT_COLORS}
          activeColor={state.highlight}
          onSelect={(color) => {
            if (color) editor.chain().focus().setHighlight({ color }).run();
            else editor.chain().focus().unsetHighlight().run();
          }}
        />

        <ToolbarSeparator />

        <ToolbarButton
          label="Clear formatting"
          disabled={disabled}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          <Eraser className="h-4 w-4" />
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton label="Find & replace" active={findReplaceOpen} disabled={disabled} onClick={() => setFindReplaceOpen((v) => !v)}>
            <SearchCode className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Source code view" active={sourceMode} disabled={disabled} onClick={onToggleSourceMode}>
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Row 2 — alignment, lists, indent, blocks, insertions */}
      {!sourceMode && (
        <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1">
          <ToolbarButton label="Align left" active={state.alignLeft} disabled={disabled} onClick={() => toggleAlign("left")}>
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Align center" active={state.alignCenter} disabled={disabled} onClick={() => toggleAlign("center")}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Align right" active={state.alignRight} disabled={disabled} onClick={() => toggleAlign("right")}>
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Justify" active={state.alignJustify} disabled={disabled} onClick={() => toggleAlign("justify")}>
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarSeparator />

          <ToolbarButton
            label="Bullet list"
            active={state.bulletList}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={state.orderedList}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Task list"
            active={state.taskList}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <ListTodo className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarSeparator />

          <ToolbarButton label="Outdent" disabled={disabled} onClick={handleOutdent}>
            <IndentDecrease className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Indent" disabled={disabled} onClick={handleIndent}>
            <IndentIncrease className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarSeparator />

          <ToolbarButton
            label="Blockquote"
            active={state.blockquote}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Horizontal rule" disabled={disabled} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarSeparator />

          <LinkMenu editor={editor} disabled={disabled} />
          <ImageMenu editor={editor} disabled={disabled} />
          <TableInsertMenu editor={editor} disabled={disabled} />
          <EmojiMenu editor={editor} disabled={disabled} />
        </div>
      )}

      {!sourceMode && <TableContextToolbar editor={editor} />}
      {!sourceMode && findReplaceOpen && <FindReplacePanel editor={editor} onClose={() => setFindReplaceOpen(false)} />}
    </div>
  );
}
