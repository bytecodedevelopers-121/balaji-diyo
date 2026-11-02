import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RepeaterProps<T extends { id: string }> {
  label: string;
  description?: string;
  fields: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderRow: (field: T, index: number) => ReactNode;
  addLabel?: string;
  emptyMessage?: string;
  /** Rows at/below this count hide their remove button (e.g. keep at least one row). Default 0 — always removable. */
  minRows?: number;
}

/**
 * Generic repeatable-rows form section, meant to sit on top of react-hook-form's
 * `useFieldArray` — the caller owns the field array (full type safety against
 * its own schema) and passes down `fields`/`onAdd`/`onRemove`; this component
 * only handles the add/remove chrome and row layout. Used for Package's cost
 * details, price groups, facts, add-ons, tiers, extra FAQs, and Itinerary's
 * day-by-day details.
 */
export function Repeater<T extends { id: string }>({
  label,
  description,
  fields,
  onAdd,
  onRemove,
  renderRow,
  addLabel = "+ Add row",
  emptyMessage = "No rows yet.",
  minRows = 0,
}: RepeaterProps<T>) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-xs text-gray-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="relative rounded-lg border border-gray-200 bg-gray-50/50 p-3">
              {fields.length > minRows && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label="Remove row"
                  className="absolute right-2 top-2 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="pr-7">{renderRow(field, index)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
