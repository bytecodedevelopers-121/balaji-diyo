import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { UserForm } from "@/components/user/UserForm";
import { useCreateUser } from "@/hooks/queries/useUsers";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import type { CreateUserDto, UpdateUserDto } from "@/types/user";

export default function CreateUserPage() {
  const navigate = useNavigate();
  const createUser = useCreateUser();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Create User | Joyful Trekking Admin";
  }, []);

  const handleSubmit = (data: CreateUserDto | UpdateUserDto) => {
    setError(null);
    createUser.mutate(data as CreateUserDto, {
      onSuccess: () => navigate(PATHS.USERS),
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create User" backHref={PATHS.USERS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <UserForm
          onSubmit={handleSubmit}
          isLoading={createUser.isPending}
          submitLabel="Create User"
        />
      </PageCard>
    </div>
  );
}
