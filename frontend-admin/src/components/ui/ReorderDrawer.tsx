import { useState, type ReactNode } from "react";
import {
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils";

type MoveDirection = "up" | "down" | "top" | "bottom";

export interface ReorderItem {
  id: string;
  label: string;
  isActive?: boolean;
}

interface ReorderDrawerProps {
  title: string;
  items: ReorderItem[];
  /** Shown instead of the list while `items` is still loading. */
  isLoading?: boolean;
  description?: string;
  /** Rendered above the list, e.g. a load/save error. */
  alert?: ReactNode;
  onClose: () => void;
  onSave: (ids: string[]) => void;
  isSaving: boolean;
}

function moveTo<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

// Drag-and-drop (plus top/up/down/bottom buttons) reordering of one flat list
// — a menu item's children, a category's packages. Edits stay local until
// Save, which hands back the full id list for one bulk write: with ~30 items
// in a list, saving per click would mean dozens of requests.
export function ReorderDrawer({
  title,
  items,
  isLoading,
  description,
  alert,
  onClose,
  onSave,
  isSaving,
}: ReorderDrawerProps) {
  const [ordered, setOrdered] = useState(items);
  // `items` can arrive after mount (fetched by the caller) — re-adopt it
  // whenever the caller hands over a new list, via React's "adjust state
  // during render" idiom.
  const [syncedItems, setSyncedItems] = useState(items);
  if (items !== syncedItems) {
    setSyncedItems(items);
    setOrdered(items);
  }
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const isDirty = ordered.some((item, i) => item.id !== items[i]?.id);

  const move = (index: number, direction: MoveDirection) => {
    const target =
      direction === "up"
        ? index - 1
        : direction === "down"
          ? index + 1
          : direction === "top"
            ? 0
            : ordered.length - 1;
    if (target < 0 || target >= ordered.length || target === index) return;
    setOrdered(moveTo(ordered, index, target));
  };

  const endDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const buttonClass =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={title}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(ordered.map((item) => item.id))}
            disabled={!isDirty || isLoading}
            isLoading={isSaving}
          >
            Save Order
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-xs text-gray-500">
        {description ??
          "Drag rows by the handle, or use the arrows. The public site shows these in this order."}
      </p>
      {alert && <div className="mb-3">{alert}</div>}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Nothing to reorder.
        </p>
      ) : (
        <ol className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {ordered.map((item, index) => (
            <li
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                setDragIndex(index);
              }}
              onDragOver={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
                setOverIndex(index);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== index)
                  setOrdered(moveTo(ordered, dragIndex, index));
                endDrag();
              }}
              onDragEnd={endDrag}
              className={cn(
                "flex items-center gap-2 bg-white px-2 py-1.5",
                dragIndex === index && "opacity-40",
                overIndex === index && dragIndex !== index && "bg-indigo-50",
              )}
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-gray-400 active:cursor-grabbing" />
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-gray-400">
                {index + 1}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  item.isActive === false ? "text-gray-400" : "text-gray-900",
                )}
              >
                {item.label}
              </span>
              {item.isActive === false && (
                <Badge label="Inactive" variant="gray" size="sm" />
              )}
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  title="Move to top"
                  aria-label="Move to top"
                  disabled={index === 0}
                  onClick={() => move(index, "top")}
                  className={buttonClass}
                >
                  <ChevronsUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Move up"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => move(index, "up")}
                  className={buttonClass}
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Move down"
                  aria-label="Move down"
                  disabled={index === ordered.length - 1}
                  onClick={() => move(index, "down")}
                  className={buttonClass}
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Move to bottom"
                  aria-label="Move to bottom"
                  disabled={index === ordered.length - 1}
                  onClick={() => move(index, "bottom")}
                  className={buttonClass}
                >
                  <ChevronsDown className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}
