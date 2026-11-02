import { useState } from "react";
import { Controller, useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { CostCategoryFormDrawer } from "@/components/cost-category/CostCategoryFormDrawer";
import { useCostCategories, useCreateCostCategory } from "@/hooks/queries/useCostCategories";
import { getErrorMessage } from "@/lib/apiError";
import { Alert } from "@/components/ui/Alert";
import type { CostCategoryFormValues, CostCategoryType } from "@/types/cost-category";
import type { CostFormShape } from "./costCategoryGroups";

type FieldName = keyof CostFormShape;

interface EditorProps {
  control: Control<CostFormShape>;
  register: UseFormRegister<CostFormShape>;
  name: FieldName;
  type: CostCategoryType;
}

/** A stack of category blocks — each a category picker with a rich-text editor beneath it. */
export function CostCategoriesEditor({ control, register, name, type }: EditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const { data } = useCostCategories({ type, perPage: 200, isActive: true });
  const categories = data?.data.items ?? [];

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const createCategory = useCreateCostCategory();

  const handleCreate = (values: CostCategoryFormValues) => {
    setCreateError(null);
    createCategory.mutate(values, {
      // Drops the new category straight into the list as a fresh, empty block.
      onSuccess: (res) => {
        append({ costCategoryId: res.data.id, detailKey: "", html: "" });
        setCreating(false);
      },
      onError: (err) => setCreateError(getErrorMessage(err)),
    });
  };

  const usedIds = new Set(fields.map((f) => f.costCategoryId).filter(Boolean));
  const canAdd = categories.some((c) => !usedIds.has(c.id));

  return (
    // `sm:col-span-2`: FormSection lays children out in a 2-column grid; this needs the full width.
    <div className="space-y-3 sm:col-span-2">
      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-xs text-gray-500">
          No {type === "INCLUDE" ? "inclusions" : "exclusions"} yet.
        </p>
      )}

      {fields.map((field, index) => {
        const options = categories
          .filter((c) => c.id === field.costCategoryId || !usedIds.has(c.id))
          .map((c) => ({ value: c.id, label: c.name }));

        return (
          <div key={field.id} className="relative rounded-lg border border-gray-200 bg-gray-50/50 p-3">
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove category"
              className="absolute right-2 top-2 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-3 pr-7">
              {field.costCategoryId || !field.detailKey ? (
                <Select
                  // Options arrive async; a native <select> registered before they exist can't apply its saved value, so remount once they do.
                  key={options.length}
                  label="Category"
                  required
                  placeholder="Select a category…"
                  options={options}
                  {...register(`${name}.${index}.costCategoryId`)}
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">{field.detailKey}</p>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Content</label>
                <Controller
                  name={`${name}.${index}.html`}
                  control={control}
                  render={({ field: htmlField }) => <RichTextEditor value={htmlField.value ?? ""} onChange={htmlField.onChange} minHeight={150} />}
                />
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={!canAdd} onClick={() => append({ costCategoryId: "", detailKey: "", html: "" })}>
          <Plus className="mr-1 h-4 w-4" /> Add category
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> New {type === "INCLUDE" ? "include" : "exclude"} category
        </Button>
      </div>
      {!canAdd && categories.length > 0 && (
        <p className="text-xs text-gray-500">Every existing {type === "INCLUDE" ? "Include" : "Exclude"} category is already on this package — create a new one to add another block.</p>
      )}

      {creating && (
        <CostCategoryFormDrawer
          isOpen
          onClose={() => {
            setCreating(false);
            setCreateError(null);
          }}
          fixedType={type}
          onSubmit={handleCreate}
          isLoading={createCategory.isPending}
        />
      )}
      {createError && <Alert variant="error" message={createError} onClose={() => setCreateError(null)} />}
    </div>
  );
}
