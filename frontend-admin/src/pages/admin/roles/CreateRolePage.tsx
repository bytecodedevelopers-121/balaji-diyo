import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { RoleForm } from "@/components/role/RoleForm";
import { useCreateRole } from "@/hooks/queries/useRoles";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import type { CreateRoleDto, UpdateRoleDto } from "@/types/role";

export default function CreateRolePage() {
  const navigate = useNavigate();
  const createRole = useCreateRole();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Create Role | Joyful Trekking Admin";
  }, []);

  const handleSubmit = (data: CreateRoleDto | UpdateRoleDto) => {
    setError(null);
    createRole.mutate(data as CreateRoleDto, {
      onSuccess: () => navigate(PATHS.ROLES),
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create Role" backHref={PATHS.ROLES} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <RoleForm onSubmit={handleSubmit} isLoading={createRole.isPending} submitLabel="Create Role" />
      </PageCard>
    </div>
  );
}
