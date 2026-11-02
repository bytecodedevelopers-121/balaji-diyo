import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { COST_CATEGORY_ICONS, type CostCategory, type CostCategoryFormValues, type CostCategoryType } from "@/types/cost-category";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["INCLUDE", "EXCLUDE"]),
  icon: z.string(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface CostCategoryFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CostCategory | null;
  /** Pre-selects and locks the type — used when creating from a package's Includes/Excludes list. */
  fixedType?: CostCategoryType;
  onSubmit: (data: CostCategoryFormValues) => void;
  isLoading: boolean;
}

export function CostCategoryFormDrawer({ isOpen, onClose, category, fixedType, onSubmit, isLoading }: CostCategoryFormDrawerProps) {
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? fixedType ?? "INCLUDE",
      icon: category?.icon ?? "",
      sortOrder: category?.sortOrder ?? 0,
      isActive: category?.isActive ?? true,
    },
  });

  const submit = (values: FormValues) => onSubmit({ ...values, icon: values.icon || null });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Category" : "New Include / Exclude Category"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input label="Name" required error={errors.name?.message} {...register("name")} />
        <Select
          label="Type"
          required
          disabled={isEdit || !!fixedType}
          hint={isEdit ? "Type can't be changed after creation." : "Include categories show on a package's Includes tab, Exclude on its Excludes tab."}
          options={[
            { value: "INCLUDE", label: "Include" },
            { value: "EXCLUDE", label: "Exclude" },
          ]}
          {...register("type")}
        />
        <Select label="Icon" placeholder="Default icon" options={COST_CATEGORY_ICONS} {...register("icon")} />
        <Input
          label="Display order"
          type="number"
          min={0}
          hint="Lower numbers show first on the package page."
          error={errors.sortOrder?.message}
          {...register("sortOrder", { valueAsNumber: true })}
        />
        <Checkbox label="Active" {...register("isActive")} />
      </form>
    </Drawer>
  );
}
