import type { Editor } from "@tiptap/react";
import { ToolbarDropdown, ToolbarMenuItem } from "../toolbar-ui";
import { FORMAT_OPTIONS } from "../constants";

const HEADING_STYLES: Record<number, string> = {
  1: "text-xl font-bold",
  2: "text-lg font-bold",
  3: "text-base font-bold",
  4: "text-base font-semibold",
  5: "text-sm font-semibold",
  6: "text-sm font-semibold",
};

export function FormatMenu({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const activeLevel = [1, 2, 3, 4, 5, 6].find((level) =>
    editor.isActive("heading", { level }),
  ) as 1 | 2 | 3 | 4 | 5 | 6 | undefined;

  const currentLabel = FORMAT_OPTIONS.find((o) => o.level === (activeLevel ?? 0))?.label ?? "Paragraph";

  return (
    <ToolbarDropdown
      label="Paragraph format"
      disabled={disabled}
      trigger={<span className="min-w-[5.5rem] text-left text-xs">{currentLabel}</span>}
      panelClassName="w-40"
    >
      {(close) => (
        <div className="space-y-0.5">
          {FORMAT_OPTIONS.map((option) => (
            <ToolbarMenuItem
              key={option.label}
              active={option.level === 0 ? editor.isActive("paragraph") : editor.isActive("heading", { level: option.level })}
              onClick={() => {
                if (option.level === 0) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor.chain().focus().setHeading({ level: option.level }).run();
                }
                close();
              }}
            >
              <span className={option.level === 0 ? "text-sm" : HEADING_STYLES[option.level]}>{option.label}</span>
            </ToolbarMenuItem>
          ))}
        </div>
      )}
    </ToolbarDropdown>
  );
}
