import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type ScopedCategoryFormValues = z.infer<typeof schema>;

interface ScopedCategoryCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** e.g. "Team", "FAQ Group", "Blog" — the CategoryType this picker is scoped to. Drives the drawer title only; the caller attaches the actual typeId when submitting. */
  typeLabel: string;
  onSubmit: (data: ScopedCategoryFormValues) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

// A trimmed-down category create panel for inline use from a scoped picker
// (Blog/GroupFAQ/TeamMember/Package's category-based fields) — no type or
// parent picker, since the scope is already fixed by where it was opened
// from. The full type+parent-capable form lives in CategoryFormDrawer, used
// on the dedicated Categories page.
export function ScopedCategoryCreateDrawer({
  isOpen,
  onClose,
  typeLabel,
  onSubmit,
  isLoading,
  error,
  onDismissError,
}: ScopedCategoryCreateDrawerProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScopedCategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", isActive: true },
  });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`New ${typeLabel} Category`}
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
        <Input label="Title" required error={errors.title?.message} {...register("title")} />
        <Textarea label="Description" rows={2} error={errors.description?.message} {...register("description")} />
        <Checkbox label="Active" {...register("isActive")} />
      </form>
    </Drawer>
  );
}
