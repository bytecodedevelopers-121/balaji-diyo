import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePermissions } from "@/hooks/queries/useRoles";
import type { CreateRoleDto, Permission, Role, UpdateRoleDto } from "@/types/role";

const schema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});

type RoleFormValues = z.infer<typeof schema>;

interface RoleFormProps {
  defaultValues?: Partial<Role>;
  onSubmit: (data: CreateRoleDto | UpdateRoleDto) => void;
  isLoading: boolean;
  submitLabel: string;
}

function groupBySubject(permissions: Permission[]): [string, Permission[]][] {
  const groups = new Map<string, Permission[]>();
  for (const p of permissions) {
    const list = groups.get(p.subject) ?? [];
    list.push(p);
    groups.set(p.subject, list);
  }
  return Array.from(groups.entries());
}

export function RoleForm({ defaultValues, onSubmit, isLoading, submitLabel }: RoleFormProps) {
  const { isOnline } = useOnlineStatus();
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();
  const permissions = permissionsData?.data ?? [];
  const groups = groupBySubject(permissions);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(defaultValues?.permissions?.map((p) => p.id) ?? []),
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
    },
  });

  const togglePermission = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (perms: Permission[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = perms.every((p) => next.has(p.id));
      perms.forEach((p) => (allSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  };

  const submit = (values: RoleFormValues) => {
    onSubmit({
      name: values.name,
      description: values.description ? values.description : undefined,
      permissionIds: Array.from(selectedIds),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {!isOnline && <Alert variant="warning" message="You are offline. Changes are disabled." />}

      <fieldset disabled={!isOnline} className="space-y-5">
        <Input label="Name" required error={errors.name?.message} {...register("name")} />
        <Textarea label="Description" error={errors.description?.message} {...register("description")} />

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Permissions</p>
          {isLoadingPermissions ? (
            <Skeleton count={3} />
          ) : (
            <div className="space-y-4 rounded-lg border border-gray-200 p-4">
              {groups.map(([subject, perms]) => (
                <div key={subject}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{subject}</p>
                    <Checkbox
                      label="Select All"
                      checked={perms.every((p) => selectedIds.has(p.id))}
                      onChange={() => toggleGroup(perms)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {perms.map((p) => (
                      <Checkbox
                        key={p.id}
                        label={p.action}
                        checked={selectedIds.has(p.id)}
                        onChange={() => togglePermission(p.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading} disabled={!isOnline}>
            {submitLabel}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
