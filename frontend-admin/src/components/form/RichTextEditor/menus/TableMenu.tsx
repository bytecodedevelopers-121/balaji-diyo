import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  TableIcon,
  Rows3,
  Columns3,
  Trash2,
  ArrowDownToLine,
  ArrowUpToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  Combine,
  Split,
} from "lucide-react";
import { ToolbarButton, ToolbarDropdown } from "../toolbar-ui";
import { cn } from "@/utils";

const GRID_SIZE = 8;

export function TableInsertMenu({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const [hover, setHover] = useState({ rows: 0, cols: 0 });

  return (
    <ToolbarDropdown label="Insert table" disabled={disabled} trigger={<TableIcon className="h-4 w-4" />} panelClassName="w-auto">
      {(close) => (
        <div className="p-1">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1.1rem)` }}
            onMouseLeave={() => setHover({ rows: 0, cols: 0 })}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const row = Math.floor(i / GRID_SIZE) + 1;
              const col = (i % GRID_SIZE) + 1;
              const filled = row <= hover.rows && col <= hover.cols;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHover({ rows: row, cols: col })}
                  onClick={() => {
                    editor.chain().focus().insertTable({ rows: row, cols: col, withHeaderRow: true }).run();
                    close();
                  }}
                  className={cn("h-4 w-4 rounded-sm border border-gray-300", filled && "border-indigo-500 bg-indigo-200")}
                />
              );
            })}
          </div>
          <p className="mt-1.5 text-center text-xs text-gray-500">
            {hover.rows > 0 ? `${hover.rows} × ${hover.cols}` : "Select table size"}
          </p>
        </div>
      )}
    </ToolbarDropdown>
  );
}

// Contextual row shown under the main toolbar only while the cursor is
// inside a table — mirrors how Word/CKEditor surface table-specific tools.
export function TableContextToolbar({ editor }: { editor: Editor }) {
  if (!editor.isActive("table")) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-t border-gray-200 bg-indigo-50/60 px-2 py-1">
      <span className="mr-1 text-xs font-medium text-indigo-700">Table:</span>

      <ToolbarButton label="Add row above" onClick={() => editor.chain().focus().addRowBefore().run()}>
        <ArrowUpToLine className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}>
        <ArrowDownToLine className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
        <Rows3 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="mx-0.5 h-5 w-px bg-indigo-200" />

      <ToolbarButton label="Add column before" onClick={() => editor.chain().focus().addColumnBefore().run()}>
        <ArrowLeftToLine className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Add column after" onClick={() => editor.chain().focus().addColumnAfter().run()}>
        <ArrowRightToLine className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
        <Columns3 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="mx-0.5 h-5 w-px bg-indigo-200" />

      <ToolbarButton
        label="Merge cells"
        disabled={!editor.can().mergeCells()}
        onClick={() => editor.chain().focus().mergeCells().run()}
      >
        <Combine className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Split cell"
        disabled={!editor.can().splitCell()}
        onClick={() => editor.chain().focus().splitCell().run()}
      >
        <Split className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Toggle header row" onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
        <span className="text-xs font-semibold">H</span>
      </ToolbarButton>

      <div className="mx-0.5 h-5 w-px bg-indigo-200" />

      <ToolbarButton label="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
        <Trash2 className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}
