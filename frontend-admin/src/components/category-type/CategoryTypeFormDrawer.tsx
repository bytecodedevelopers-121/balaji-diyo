import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { CategoryType, CreateCategoryTypeDto, UpdateCategoryTypeDto } from "@/types/category-type";

// The key format (kebab-case) is only enforced on create — it's immutable
// after that (the input is disabled below). Some legacy-migrated rows have
// underscore keys (e.g. "trip_gradings") that predate this format, inserted
// directly by the ETL import rather than through this validated form; the
// key must stay unvalidated-and-unsent on edit or saving an unrelated field
// on one of those rows would incorrectly fail this regex — confirmed live:
// PATCHing the unchanged legacy key back 400s ("key must be lowercase
// kebab-case"), omitting the key entirely succeeds.
const createSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  name: z.string().min(1, "Name is required"),
});
const editSchema = z.object({
  key: z.string(),
  name: z.string().min(1, "Name is required"),
});

type FormValues = z.infer<typeof createSchema>;

interface CategoryTypeFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categoryType?: CategoryType | null;
  onSubmit: (data: CreateCategoryTypeDto | UpdateCategoryTypeDto) => void;
  isLoading: boolean;
}

export function CategoryTypeFormDrawer({
  isOpen,
  onClose,
  categoryType,
  onSubmit,
  isLoading,
}: CategoryTypeFormDrawerProps) {
  const isEdit = !!categoryType;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      key: categoryType?.key ?? "",
      name: categoryType?.name ?? "",
    },
  });

  const submit = (values: FormValues) => {
    onSubmit(isEdit ? { name: values.name } : values);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Category Type" : "New Category Type"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Type"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input
          label="Key"
          hint='Lowercase, kebab-case (e.g. "destination", "team")'
          required
          disabled={isEdit}
          error={errors.key?.message}
          {...register("key")}
        />
        <Input label="Name" required error={errors.name?.message} {...register("name")} />
      </form>
    </Drawer>
  );
}
