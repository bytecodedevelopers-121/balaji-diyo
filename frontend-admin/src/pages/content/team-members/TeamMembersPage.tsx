import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { usePermission } from "@/hooks/usePermission";
import { useTeamMembers, useDeleteTeamMember } from "@/hooks/queries/useTeamMembers";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import type { TeamMember } from "@/types/team-member";

export default function TeamMembersPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:team");
  const canEdit = usePermission("update:team");
  const canDelete = usePermission("delete:team");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Team Members | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useTeamMembers({ page, perPage: 10, search: search || undefined });
  const members = data?.data.items ?? [];
  const meta = data?.data.meta;

  const deleteMember = useDeleteTeamMember();

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteMember.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<TeamMember>[] = [
    { key: "fullName", header: "Name", render: (m) => <span className="font-medium text-gray-900">{m.fullName}</span> },
    { key: "position", header: "Position", render: (m) => m.position },
    {
      key: "categories",
      header: "Categories",
      render: (m) => m.categories.map((c) => c.title).join(", ") || "—",
    },
    {
      key: "isFeatured",
      header: "Featured",
      render: (m) => <Badge label={m.isFeatured ? "Featured" : "—"} variant={m.isFeatured ? "indigo" : "gray"} />,
    },
    {
      key: "isActive",
      header: "Status",
      render: (m) => <Badge label={m.isActive ? "Active" : "Inactive"} variant={m.isActive ? "green" : "gray"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (m) => (
        <TableActions
          onEdit={canEdit ? () => navigate(PATHS.TEAM_MEMBER_DETAIL(m.id)) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(m) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Members"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.TEAM_MEMBER_CREATE)}>+ New Team Member</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load team members." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search team members..."
          />
        </div>

        <DataTable
          columns={columns}
          data={members}
          isLoading={isLoading}
          emptyMessage="No team members yet."
          emptyAction={canCreate ? <Button onClick={() => navigate(PATHS.TEAM_MEMBER_CREATE)}>+ New Team Member</Button> : undefined}
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Team Member"
        message={`Are you sure you want to delete "${deleteTarget?.fullName}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMember.isPending}
      />
    </div>
  );
}
