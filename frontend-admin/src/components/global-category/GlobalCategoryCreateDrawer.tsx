import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { CreateGlobalCategoryDto } from "@/types/global-category";

const schema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  name: z.string().min(1, "Name is required"),
});

type FormValues = z.infer<typeof schema>;

interface GlobalCategoryCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGlobalCategoryDto) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

// Trimmed inline-create panel for GlobalSettingFormDrawer's category picker —
// a global category is just a key+name grouping, so there's no "full" form
// to trim down from (unlike ScopedCategoryCreateDrawer/Category).
export function GlobalCategoryCreateDrawer({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  onDismissError,
}: GlobalCategoryCreateDrawerProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { key: "", name: "" },
  });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="New Settings Category"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
            Create Category
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}
        <Input
          label="Key"
          hint='Lowercase, kebab-case (e.g. "site-info")'
          required
          error={errors.key?.message}
          {...register("key")}
        />
        <Input label="Name" required error={errors.name?.message} {...register("name")} />
      </form>
    </Drawer>
  );
}
