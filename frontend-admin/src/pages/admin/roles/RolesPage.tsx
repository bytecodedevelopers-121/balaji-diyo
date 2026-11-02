import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { usePermission } from "@/hooks/usePermission";
import { useRoles } from "@/hooks/queries/useRoles";
import { PATHS } from "@/constants/PATHS";
import type { Role } from "@/types/role";

export default function RolesPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:role");
  const canEdit = usePermission("update:role");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewTarget, setViewTarget] = useState<Role | null>(null);

  useEffect(() => {
    document.title = "Roles | Boundless Adventure Admin";
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useRoles({ page, perPage: 10, search: search || undefined });

  const roles = data?.data.items ?? [];
  const meta = data?.data.meta;

  const columns: DataTableColumn<Role>[] = [
    { key: "name", header: "Name", render: (r) => r.name },
    { key: "description", header: "Description", render: (r) => r.description ?? "—" },
    { key: "permissions", header: "Permissions", render: (r) => r.permissions.length },
    {
      key: "type",
      header: "Type",
      render: (r) => <Badge label={r.isSystem ? "System" : "Custom"} variant={r.isSystem ? "blue" : "gray"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <TableActions
          onView={() => setViewTarget(r)}
          onEdit={canEdit ? () => navigate(`${PATHS.ROLE_DETAIL(r.id)}?edit=true`) : undefined}
          canEdit={canEdit}
          canDelete={false}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.ROLE_CREATE)}>+ Add Role</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load roles." />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by role name..."
          />
        </div>

        <DataTable
          columns={columns}
          data={roles}
          isLoading={isLoading}
          emptyMessage="No roles yet."
          emptyAction={canCreate ? <Button onClick={() => navigate(PATHS.ROLE_CREATE)}>+ Add Role</Button> : undefined}
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
        title={viewTarget?.name}
        size="md"
        footer={
          viewTarget && (
            <div className="flex justify-end gap-2">
              {canEdit && (
                <Button variant="secondary" onClick={() => navigate(`${PATHS.ROLE_DETAIL(viewTarget.id)}?edit=true`)}>
                  Edit
                </Button>
              )}
              <Button onClick={() => navigate(PATHS.ROLE_DETAIL(viewTarget.id))}>View Full Details</Button>
            </div>
          )
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={viewTarget.isSystem ? "System" : "Custom"} variant={viewTarget.isSystem ? "blue" : "gray"} />
              <span className="text-sm text-gray-500">{viewTarget.permissions.length} permissions</span>
            </div>

            {viewTarget.description && <p className="text-sm text-gray-600">{viewTarget.description}</p>}

            <div>
              <p className="mb-2 text-xs font-medium text-gray-400">Permissions</p>
              {viewTarget.permissions.length === 0 ? (
                <p className="text-sm text-gray-500">No permissions assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {viewTarget.permissions.map((p) => (
                    <Badge key={p.id} label={p.name} variant="gray" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
