import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { Tag, CreateTagDto, UpdateTagDto } from "@/types/tag";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TagFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tag?: Tag | null;
  onSubmit: (data: CreateTagDto | UpdateTagDto) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export function TagFormDrawer({ isOpen, onClose, tag, onSubmit, isLoading, error, onDismissError }: TagFormDrawerProps) {
  const isEdit = !!tag;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: tag?.name ?? "",
      slug: tag?.slug ?? "",
    },
  });

  const submit = (values: FormValues) => {
    onSubmit({ name: values.name, slug: values.slug || undefined });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Tag" : "New Tag"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Tag"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}
        <Input label="Name" required error={errors.name?.message} {...register("name")} />
        <Input
          label="Slug"
          hint="Leave blank to auto-generate from the name"
          error={errors.slug?.message}
          {...register("slug")}
        />
      </form>
    </Drawer>
  );
}
