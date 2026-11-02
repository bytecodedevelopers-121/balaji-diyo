import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { MenuType, CreateMenuTypeDto, UpdateMenuTypeDto } from "@/types/menu-type";

// The key format (kebab-case) is only enforced on create — it's immutable
// after that (the input is disabled below). Some legacy-migrated rows have
// underscore keys (e.g. "footer_menu") that predate this format, inserted
// directly by the ETL import rather than through this validated form; the
// key must stay unvalidated-and-unsent on edit or saving an unrelated field
// on one of those rows would incorrectly fail this regex.
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

interface MenuTypeFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuType?: MenuType | null;
  onSubmit: (data: CreateMenuTypeDto | UpdateMenuTypeDto) => void;
  isLoading: boolean;
}

export function MenuTypeFormDrawer({ isOpen, onClose, menuType, onSubmit, isLoading }: MenuTypeFormDrawerProps) {
  const isEdit = !!menuType;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      key: menuType?.key ?? "",
      name: menuType?.name ?? "",
    },
  });

  const submit = (values: FormValues) => {
    onSubmit(isEdit ? { name: values.name } : values);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Menu" : "New Menu"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Menu"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input
          label="Key"
          hint='Lowercase, kebab-case (e.g. "header-nav", "footer-nav")'
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
