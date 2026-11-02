import { Ban } from "lucide-react";
import { ToolbarDropdown } from "../toolbar-ui";
import { cn } from "@/utils";

interface ColorMenuProps {
  label: string;
  icon: React.ReactNode;
  colors: string[];
  activeColor?: string;
  onSelect: (color: string | null) => void;
}

export function ColorMenu({ label, icon, colors, activeColor, onSelect }: ColorMenuProps) {
  return (
    <ToolbarDropdown label={label} trigger={icon}>
      {(close) => (
        <div className="w-48 space-y-2 p-1">
          <div className="grid grid-cols-5 gap-1.5">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(color);
                  close();
                }}
                className={cn(
                  "h-6 w-6 rounded-full border border-black/10 ring-offset-1 transition-transform hover:scale-110",
                  activeColor?.toLowerCase() === color.toLowerCase() && "ring-2 ring-indigo-500",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
            <input
              type="color"
              aria-label={`Custom ${label.toLowerCase()}`}
              className="h-6 w-8 cursor-pointer rounded border border-gray-200"
              onMouseDown={(e) => e.preventDefault()}
              onChange={(e) => onSelect(e.target.value)}
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(null);
                close();
              }}
              className="flex flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              <Ban className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}
    </ToolbarDropdown>
  );
}
