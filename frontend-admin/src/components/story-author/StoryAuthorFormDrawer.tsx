import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { isRichTextEmpty } from "@/lib/richText";
import type { StoryAuthor, CreateStoryAuthorDto, UpdateStoryAuthorDto } from "@/types/story-author";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  salutation: z.string().optional(),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface StoryAuthorFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  author?: StoryAuthor | null;
  onSubmit: (data: CreateStoryAuthorDto | UpdateStoryAuthorDto) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export function StoryAuthorFormDrawer({
  isOpen,
  onClose,
  author,
  onSubmit,
  isLoading,
  error,
  onDismissError,
}: StoryAuthorFormDrawerProps) {
  const isEdit = !!author;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: author?.name ?? "",
      slug: author?.slug ?? "",
      salutation: author?.salutation ?? "",
      email: author?.email ?? "",
      description: author?.description ?? "",
      isActive: author?.isActive ?? true,
    },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      name: values.name,
      slug: values.slug || undefined,
      salutation: values.salutation || undefined,
      email: values.email,
      description: isRichTextEmpty(values.description) ? undefined : values.description,
      isActive: values.isActive,
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Story Author" : "New Story Author"}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Author"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}
        <div className="grid grid-cols-3 gap-3">
          <Input label="Salutation" hint="Mr, Ms…" error={errors.salutation?.message} {...register("salutation")} />
          <div className="col-span-2">
            <Input label="Name" required error={errors.name?.message} {...register("name")} />
          </div>
        </div>
        <Input label="Email" type="email" required error={errors.email?.message} {...register("email")} />
        <Input
          label="Slug"
          hint="Leave blank to auto-generate from the name"
          error={errors.slug?.message}
          {...register("slug")}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Short author bio…" minHeight={120} />
            )}
          />
        </div>
        <Checkbox label="Active" {...register("isActive")} />
      </form>
    </Drawer>
  );
}
