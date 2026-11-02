import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useRoles } from "@/hooks/queries/useRoles";
import type { CreateUserDto, UpdateUserDto, User } from "@/types/user";

const nameRegex = /^[a-zA-Z\s'-]+$/;

function buildSchema(isEdit: boolean) {
  return z.object({
    email: isEdit
      ? z.string().optional()
      : z
          .string()
          .min(1, "Email is required")
          .email("Enter a valid email address")
          .max(100, "Email must be under 100 characters")
          .toLowerCase(),

    password: isEdit
      ? z.string().optional()
      : z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(50, "Password must be under 50 characters")
          .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
          .regex(/[a-z]/, "Password must contain at least one lowercase letter")
          .regex(/[0-9]/, "Password must contain at least one number"),

    firstName: z
      .string()
      .max(50, "First name must be under 50 characters")
      .regex(nameRegex, "First name can only contain letters, spaces, hyphens and apostrophes")
      .optional(),

    lastName: z
      .string()
      .max(50, "Last name must be under 50 characters")
      .regex(nameRegex, "Last name can only contain letters, spaces, hyphens and apostrophes")
      .optional(),

    roleId: isEdit ? z.string().optional() : z.string().min(1, "Role is required"),
  });
}

interface UserFormProps {
  defaultValues?: Partial<User>;
  onSubmit: (data: CreateUserDto | UpdateUserDto) => void;
  isLoading: boolean;
  submitLabel: string;
  isEdit?: boolean;
}

function emptyToUndefined(value?: string): string | undefined {
  return value ? value : undefined;
}

export function UserForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
  isEdit = false,
}: UserFormProps) {
  const { isOnline } = useOnlineStatus();
  const { data: rolesData } = useRoles({ perPage: 100 });
  const roles = rolesData?.data.items ?? [];

  const schema = buildSchema(isEdit);
  type UserFormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: defaultValues?.email ?? "",
      password: "",
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      roleId: defaultValues?.roleId ?? "",
    },
  });

  const submit = (values: UserFormValues) => {
    if (isEdit) {
      const data: UpdateUserDto = {
        firstName: emptyToUndefined(values.firstName),
        lastName: emptyToUndefined(values.lastName),
        roleId: values.roleId,
      };
      onSubmit(data);
      return;
    }

    const data: CreateUserDto = {
      email: values.email ?? "",
      password: values.password ?? "",
      firstName: emptyToUndefined(values.firstName),
      lastName: emptyToUndefined(values.lastName),
      roleId: values.roleId ?? "",
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {!isOnline && <Alert variant="warning" message="You are offline. Changes are disabled." />}

      <fieldset disabled={!isOnline} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First Name" error={errors.firstName?.message} {...register("firstName")} />
          <Input label="Last Name" error={errors.lastName?.message} {...register("lastName")} />
        </div>

        {!isEdit && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              required
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              required
              error={errors.password?.message}
              {...register("password")}
            />
          </div>
        )}

        <Select
          label="Role"
          required={!isEdit}
          placeholder="Select a role"
          options={roles.map((r) => ({ value: r.id, label: r.name }))}
          error={errors.roleId?.message}
          {...register("roleId")}
        />

        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading} disabled={!isOnline}>
            {submitLabel}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
