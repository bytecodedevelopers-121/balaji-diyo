import type { Editor } from "@tiptap/react";
import { ToolbarDropdown, ToolbarMenuItem } from "../toolbar-ui";
import { FONT_FAMILIES } from "../constants";

export function FontFamilyMenu({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const current = FONT_FAMILIES.find((f) => f.value && editor.isActive("textStyle", { fontFamily: f.value }));

  return (
    <ToolbarDropdown
      label="Font family"
      disabled={disabled}
      trigger={<span className="max-w-[6rem] truncate text-left text-xs">{current?.label ?? "Font"}</span>}
      panelClassName="w-44"
    >
      {(close) => (
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {FONT_FAMILIES.map((font) => (
            <ToolbarMenuItem
              key={font.label}
              active={font.value ? editor.isActive("textStyle", { fontFamily: font.value }) : !current}
              onClick={() => {
                if (font.value) editor.chain().focus().setFontFamily(font.value).run();
                else editor.chain().focus().unsetFontFamily().run();
                close();
              }}
            >
              <span style={{ fontFamily: font.value ?? undefined }}>{font.label}</span>
            </ToolbarMenuItem>
          ))}
        </div>
      )}
    </ToolbarDropdown>
  );
}
