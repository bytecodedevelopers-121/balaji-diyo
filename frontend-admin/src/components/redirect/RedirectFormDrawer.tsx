import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { Redirect, CreateRedirectDto, UpdateRedirectDto } from "@/types/redirect";

const schema = z.object({
  source: z.string().min(1, "Source path is required").max(255),
  destination: z.string().min(1, "Destination is required").max(255),
  isPermanent: z.enum(["true", "false"]),
  redirectCode: z.string().optional(),
  redirectStatus: z.boolean(),
  redirectMessage: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface RedirectFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  redirect?: Redirect | null;
  onSubmit: (data: CreateRedirectDto | UpdateRedirectDto) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export function RedirectFormDrawer({
  isOpen,
  onClose,
  redirect,
  onSubmit,
  isLoading,
  error,
  onDismissError,
}: RedirectFormDrawerProps) {
  const isEdit = !!redirect;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      source: redirect?.source ?? "",
      destination: redirect?.destination ?? "",
      isPermanent: (redirect?.isPermanent ?? true) ? "true" : "false",
      redirectCode: redirect?.redirectCode ?? "",
      redirectStatus: redirect?.redirectStatus ?? true,
      redirectMessage: redirect?.redirectMessage ?? "",
    },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      source: values.source,
      destination: values.destination,
      isPermanent: values.isPermanent === "true",
      redirectCode: values.redirectCode || undefined,
      redirectStatus: values.redirectStatus,
      redirectMessage: values.redirectMessage || undefined,
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Redirect" : "New Redirect"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Redirect"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}
        <Input
          label="Source Path"
          hint="Path to redirect from, e.g. /old-page"
          required
          error={errors.source?.message}
          {...register("source")}
        />
        <Input
          label="Destination"
          hint="Path or full URL to redirect to"
          required
          error={errors.destination?.message}
          {...register("destination")}
        />
        <Select
          label="Redirect Type"
          options={[
            { value: "true", label: "Permanent (301)" },
            { value: "false", label: "Temporary (302)" },
          ]}
          error={errors.isPermanent?.message}
          {...register("isPermanent")}
        />
        <Input
          label="Custom Status Code"
          hint="Optional override, e.g. 308"
          error={errors.redirectCode?.message}
          {...register("redirectCode")}
        />
        <Checkbox label="Active" {...register("redirectStatus")} />
        <Textarea
          label="Note"
          hint="Internal note — not shown to visitors"
          rows={2}
          error={errors.redirectMessage?.message}
          {...register("redirectMessage")}
        />
      </form>
    </Drawer>
  );
}
