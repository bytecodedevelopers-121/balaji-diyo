import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Drawer } from "@/components/ui/Drawer";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { usePermission } from "@/hooks/usePermission";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useUsers, useUserListPrefetch } from "@/hooks/queries/useUsers";
import { useRoles } from "@/hooks/queries/useRoles";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import type { User } from "@/types/user";

export default function UsersPage() {
  const navigate = useNavigate();
  const { isOffline } = useOnlineStatus();
  const canCreate = usePermission("create:user");
  const canEdit = usePermission("update:user");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [viewTarget, setViewTarget] = useState<User | null>(null);

  useEffect(() => {
    document.title = "Users | Your Company Admin";
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useUsers({
    page,
    limit: 10,
    search: search || undefined,
    roleId: roleId || undefined,
    status: status || undefined,
  });
  const { data: rolesData } = useRoles({ perPage: 100 });

  const users = data?.data.items ?? [];
  const meta = data?.data.meta;
  const roles = rolesData?.data.items ?? [];

  useUserListPrefetch(users, page, meta?.totalPages ?? 0, {
    limit: 10,
    search: search || undefined,
    roleId: roleId || undefined,
    status: status || undefined,
  });

  const columns: DataTableColumn<User>[] = [
    { key: "name", header: "Name", render: (u) => `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—" },
    { key: "email", header: "Email", render: (u) => u.email },
    { key: "role", header: "Role", render: (u) => u.role?.name ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (u) => <Badge label={u.isActive ? "Active" : "Inactive"} variant={u.isActive ? "green" : "red"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (u) => (
        <TableActions
          onView={() => setViewTarget(u)}
          onEdit={canEdit ? () => navigate(`${PATHS.USER_DETAIL(u.id)}?edit=true`) : undefined}
          canEdit={canEdit}
          canDelete={false}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.USER_CREATE)}>+ Add User</Button>}
          </>
        }
      />

      {isError && (
        <Alert
          variant={isOffline ? "warning" : "error"}
          message={
            isOffline
              ? "Users list not available offline. Open this page while online to cache it."
              : "Failed to load users."
          }
        />
      )}

      <PageCard padding="sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="max-w-sm flex-1">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search by name or email..."
            />
          </div>
          <Select
            className="w-44"
            placeholder="All roles"
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            value={roleId}
            onChange={(e) => {
              setRoleId(e.target.value);
              setPage(1);
            }}
          />
          <Select
            className="w-40"
            placeholder="All statuses"
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "active" | "inactive" | "");
              setPage(1);
            }}
          />
        </div>

        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          emptyMessage="No users yet."
          emptyAction={canCreate ? <Button onClick={() => navigate(PATHS.USER_CREATE)}>+ Add User</Button> : undefined}
        />

        {meta && meta.total > 0 && (
          <Pagination
            page={meta.currentPage}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.perPage}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        )}
      </PageCard>

      <Drawer
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="User"
        size="sm"
        footer={
          viewTarget && (
            <div className="flex justify-end gap-2">
              {canEdit && (
                <Button variant="secondary" onClick={() => navigate(`${PATHS.USER_DETAIL(viewTarget.id)}?edit=true`)}>
                  Edit
                </Button>
              )}
              <Button onClick={() => navigate(PATHS.USER_DETAIL(viewTarget.id))}>View Full Profile</Button>
            </div>
          )
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <UserAvatar
                photoPath={viewTarget.avatar}
                name={`${viewTarget.firstName ?? ""} ${viewTarget.lastName ?? ""}`.trim() || viewTarget.email}
                size="lg"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {`${viewTarget.firstName ?? ""} ${viewTarget.lastName ?? ""}`.trim() || "—"}
                </p>
                <p className="text-sm text-gray-500">{viewTarget.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge label={viewTarget.isActive ? "Active" : "Inactive"} variant={viewTarget.isActive ? "green" : "red"} />
              {viewTarget.isSuperAdmin && <Badge label="Super Admin" variant="blue" />}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                <p className="text-xs font-medium text-gray-400">Role</p>
                <p className="text-gray-900">{viewTarget.role?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Joined</p>
                <p className="text-gray-900">{formatDate(viewTarget.createdAt)}</p>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
