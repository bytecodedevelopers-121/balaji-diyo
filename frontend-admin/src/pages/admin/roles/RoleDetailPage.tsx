import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { RoleForm } from "@/components/role/RoleForm";
import { usePermission } from "@/hooks/usePermission";
import { useRole, useUpdateRole } from "@/hooks/queries/useRoles";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import type { CreateRoleDto, Permission, UpdateRoleDto } from "@/types/role";

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value}</p>
    </div>
  );
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

export default function RoleDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";

  const canEdit = usePermission("update:role");

  const { data, isLoading, isError, error } = useRole(id);
  const updateRole = useUpdateRole(id);

  const [formError, setFormError] = useState<string | null>(null);

  const role = data?.data;
  const status = getErrorStatus(error);

  useEffect(() => {
    document.title = role ? `${role.name} | Your Company Admin` : "Role | Your Company Admin";
  }, [role]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Role not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.ROLES)}>
          ← Back to Roles
        </Button>
      </PageCard>
    );
  }

  if (isError && status === 403) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">You don&apos;t have permission to view this role.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.ROLES)}>
          ← Back to Roles
        </Button>
      </PageCard>
    );
  }

  const exitEditMode = () => {
    searchParams.delete("edit");
    setSearchParams(searchParams, { replace: true });
  };

  const handleEditSubmit = (values: CreateRoleDto | UpdateRoleDto) => {
    setFormError(null);
    updateRole.mutate(values as UpdateRoleDto, {
      onSuccess: () => exitEditMode(),
      onError: (err) => setFormError(getErrorMessage(err)),
    });
  };

  if (isEdit) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Role" backHref={PATHS.ROLES} />

        {formError && <Alert variant="error" message={formError} onClose={() => setFormError(null)} />}

        <PageCard>
          {isLoading || !role ? (
            <Skeleton count={4} />
          ) : (
            <RoleForm
              defaultValues={role}
              onSubmit={handleEditSubmit}
              isLoading={updateRole.isPending}
              submitLabel="Save Changes"
            />
          )}
        </PageCard>
      </div>
    );
  }

  const permissionGroups = role ? groupBySubject(role.permissions) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={role?.name ?? ""}
        isLoading={isLoading}
        breadcrumbs={[{ label: "Roles", href: PATHS.ROLES }, { label: role?.name ?? "" }]}
        action={
          canEdit ? (
            <Button
              variant="outline"
              onClick={() => {
                searchParams.set("edit", "true");
                setSearchParams(searchParams);
              }}
            >
              Edit
            </Button>
          ) : undefined
        }
      />

      <PageCard>
        {isLoading || !role ? (
          <Skeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoItem label="Description" value={role.description ?? "—"} />
            <InfoItem
              label="Type"
              value={<Badge label={role.isSystem ? "System" : "Custom"} variant={role.isSystem ? "blue" : "gray"} />}
            />
            <InfoItem label="Created At" value={formatDate(role.createdAt)} />
          </div>
        )}
      </PageCard>

      {role && (
        <PageCard padding="sm">
          <p className="mb-3 px-1 text-sm font-medium text-gray-700">Permissions</p>
          {permissionGroups.length === 0 ? (
            <p className="px-1 text-sm text-gray-500">No permissions assigned.</p>
          ) : (
            <div className="space-y-3">
              {permissionGroups.map(([subject, perms]) => (
                <div key={subject} className="px-1">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {subject}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((p) => (
                      <Badge key={p.id} label={p.action} variant="indigo" size="sm" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageCard>
      )}
    </div>
  );
}
