import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserForm } from "@/components/user/UserForm";
import { ResetPasswordModal } from "@/components/user/ResetPasswordModal";
import { usePermission } from "@/hooks/usePermission";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useUser, useUpdateUser, useActivateUser, useDeactivateUser } from "@/hooks/queries/useUsers";
import { WifiOff } from "lucide-react";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import type { CreateUserDto, UpdateUserDto } from "@/types/user";

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value}</p>
    </div>
  );
}

export default function UserDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";

  const canEdit = usePermission("update:user");
  const { isOffline } = useOnlineStatus();

  const { data, isLoading, isError, error } = useUser(id);
  const updateUser = useUpdateUser(id);
  const activateUser = useActivateUser(id);
  const deactivateUser = useDeactivateUser(id);

  const [formError, setFormError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const user = data?.data;
  const status = getErrorStatus(error);
  const fullName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email : "";

  useEffect(() => {
    document.title = user ? `${fullName} | Joyful Trekking Admin` : "User | Joyful Trekking Admin";
  }, [user, fullName]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">User not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.USERS)}>
          ← Back to Users
        </Button>
      </PageCard>
    );
  }

  if (isError && status === 403) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">You don&apos;t have permission to view this user.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.USERS)}>
          ← Back to Users
        </Button>
      </PageCard>
    );
  }

  if (isError && isOffline && !user) {
    return (
      <PageCard className="text-center py-10">
        <WifiOff className="mx-auto mb-3 h-8 w-8 text-gray-300" aria-hidden />
        <p className="text-sm font-medium text-gray-700">Not available offline</p>
        <p className="mt-1 text-xs text-gray-400">
          Open this user&apos;s page while online to cache their details.
        </p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.USERS)}>
          ← Back to Users
        </Button>
      </PageCard>
    );
  }

  const exitEditMode = () => {
    searchParams.delete("edit");
    setSearchParams(searchParams, { replace: true });
  };

  const handleEditSubmit = (values: CreateUserDto | UpdateUserDto) => {
    setFormError(null);
    updateUser.mutate(values as UpdateUserDto, {
      onSuccess: () => exitEditMode(),
      onError: (err) => setFormError(getErrorMessage(err)),
    });
  };

  const handleToggleStatus = () => {
    setStatusError(null);
    const mutation = user?.isActive ? deactivateUser : activateUser;
    mutation.mutate(undefined, {
      onError: (err) => setStatusError(getErrorMessage(err)),
    });
  };

  if (isEdit) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit User" backHref={PATHS.USERS} />

        {formError && <Alert variant="error" message={formError} onClose={() => setFormError(null)} />}

        <PageCard>
          {isLoading || !user ? (
            <Skeleton count={4} />
          ) : (
            <UserForm
              isEdit
              defaultValues={user}
              onSubmit={handleEditSubmit}
              isLoading={updateUser.isPending}
              submitLabel="Save Changes"
            />
          )}
        </PageCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        isLoading={isLoading}
        breadcrumbs={[{ label: "Users", href: PATHS.USERS }, { label: fullName }]}
        action={
          <>
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  searchParams.set("edit", "true");
                  setSearchParams(searchParams);
                }}
              >
                Edit
              </Button>
            )}
            {canEdit && (
              <Button variant="secondary" onClick={() => setResetPasswordOpen(true)}>
                Reset Password
              </Button>
            )}
            {canEdit && (
              <Button
                variant={user?.isActive ? "danger" : "primary"}
                onClick={handleToggleStatus}
                isLoading={activateUser.isPending || deactivateUser.isPending}
              >
                {user?.isActive ? "Deactivate" : "Activate"}
              </Button>
            )}
          </>
        }
      />

      {statusError && <Alert variant="error" message={statusError} onClose={() => setStatusError(null)} />}

      <PageCard>
        {isLoading || !user ? (
          <Skeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoItem label="Email" value={user.email} />
            <InfoItem label="Role" value={user.role?.name ?? "—"} />
            <InfoItem
              label="Status"
              value={<Badge label={user.isActive ? "Active" : "Inactive"} variant={user.isActive ? "green" : "red"} />}
            />
            <InfoItem label="Created At" value={formatDate(user.createdAt)} />
          </div>
        )}
      </PageCard>

      <ResetPasswordModal
        userId={id}
        isOpen={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
      />
    </div>
  );
}
