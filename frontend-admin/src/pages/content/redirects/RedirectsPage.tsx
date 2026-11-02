import { useEffect, useState } from "react";
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
import { RedirectFormDrawer } from "@/components/redirect/RedirectFormDrawer";
import { usePermission } from "@/hooks/usePermission";
import { useRedirects, useCreateRedirect, useUpdateRedirect, useDeleteRedirect } from "@/hooks/queries/useRedirects";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import type { Redirect, CreateRedirectDto, UpdateRedirectDto } from "@/types/redirect";

export default function RedirectsPage() {
  const canCreate = usePermission("create:redirect");
  const canEdit = usePermission("update:redirect");
  const canDelete = usePermission("delete:redirect");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formTarget, setFormTarget] = useState<Redirect | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Redirect | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Redirects | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useRedirects({ page, perPage: 15, search: search || undefined });
  const redirects = data?.data.items ?? [];
  const meta = data?.data.meta;

  const createRedirect = useCreateRedirect();
  const updateRedirect = useUpdateRedirect(formTarget?.id ?? "");
  const deleteRedirect = useDeleteRedirect();

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: CreateRedirectDto | UpdateRedirectDto) => {
    setError(null);
    if (formTarget) {
      updateRedirect.mutate(values as UpdateRedirectDto, {
        onSuccess: closeForm,
        onError: (err) => setError(getErrorMessage(err)),
      });
    } else {
      createRedirect.mutate(values as CreateRedirectDto, {
        onSuccess: closeForm,
        onError: (err) => setError(getErrorMessage(err)),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteRedirect.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Redirect>[] = [
    { key: "source", header: "Source", render: (r) => <code className="text-xs">{r.source}</code> },
    { key: "destination", header: "Destination", render: (r) => <span className="truncate text-sm text-gray-700">{r.destination}</span> },
    {
      key: "type",
      header: "Type",
      render: (r) => <Badge label={r.isPermanent ? "301 Permanent" : "302 Temporary"} variant={r.isPermanent ? "purple" : "blue"} size="sm" />,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge label={r.redirectStatus ? "Active" : "Inactive"} variant={r.redirectStatus ? "green" : "gray"} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <TableActions
          onEdit={canEdit ? () => setFormTarget(r) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(r) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Redirects"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => setFormTarget(null)}>+ Add Redirect</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load redirects." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search source or destination..."
          />
        </div>

        <DataTable
          columns={columns}
          data={redirects}
          isLoading={isLoading}
          emptyMessage="No redirects yet."
          emptyAction={canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add Redirect</Button> : undefined}
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

      {formTarget !== undefined && (
        <RedirectFormDrawer
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          redirect={formTarget}
          onSubmit={handleFormSubmit}
          isLoading={createRedirect.isPending || updateRedirect.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Redirect"
        message={`Are you sure you want to delete the redirect from "${deleteTarget?.source}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteRedirect.isPending}
      />
    </div>
  );
}
