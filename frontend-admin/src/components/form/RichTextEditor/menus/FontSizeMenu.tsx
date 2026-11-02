import type { Editor } from "@tiptap/react";
import { ToolbarDropdown, ToolbarMenuItem } from "../toolbar-ui";
import { FONT_SIZES } from "../constants";

export function FontSizeMenu({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const current = FONT_SIZES.find((s) => s.value && editor.isActive("textStyle", { fontSize: s.value }));

  return (
    <ToolbarDropdown
      label="Font size"
      disabled={disabled}
      trigger={<span className="min-w-[2rem] text-left text-xs">{current?.label ?? "Size"}</span>}
      panelClassName="w-28"
    >
      {(close) => (
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {FONT_SIZES.map((size) => (
            <ToolbarMenuItem
              key={size.label}
              active={size.value ? editor.isActive("textStyle", { fontSize: size.value }) : !current}
              onClick={() => {
                if (size.value) editor.chain().focus().setFontSize(size.value).run();
                else editor.chain().focus().unsetFontSize().run();
                close();
              }}
            >
              {size.label}
            </ToolbarMenuItem>
          ))}
        </div>
      )}
    </ToolbarDropdown>
  );
}
