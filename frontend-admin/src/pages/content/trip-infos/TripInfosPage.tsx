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
import { TripInfoFormDrawer } from "@/components/trip-info/TripInfoFormDrawer";
import { usePermission } from "@/hooks/usePermission";
import { useTripInfos, useCreateTripInfo, useUpdateTripInfo, useDeleteTripInfo } from "@/hooks/queries/useTripInfos";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import type { TripInfo, CreateTripInfoDto, UpdateTripInfoDto } from "@/types/trip-info";

export default function TripInfosPage() {
  const canCreate = usePermission("create:travel");
  const canEdit = usePermission("update:travel");
  const canDelete = usePermission("delete:travel");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formTarget, setFormTarget] = useState<TripInfo | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<TripInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Trip Info | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useTripInfos({ page, perPage: 15, search: search || undefined });
  const tripInfos = data?.data.items ?? [];
  const meta = data?.data.meta;

  const createTripInfo = useCreateTripInfo();
  const updateTripInfo = useUpdateTripInfo(formTarget?.id ?? "");
  const deleteTripInfo = useDeleteTripInfo();

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: CreateTripInfoDto | UpdateTripInfoDto) => {
    setError(null);
    if (formTarget) {
      updateTripInfo.mutate(values as UpdateTripInfoDto, {
        onSuccess: closeForm,
        onError: (err) => setError(getErrorMessage(err)),
      });
    } else {
      createTripInfo.mutate(values as CreateTripInfoDto, {
        onSuccess: closeForm,
        onError: (err) => setError(getErrorMessage(err)),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteTripInfo.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<TripInfo>[] = [
    { key: "title", header: "Title", render: (t) => <span className="font-medium text-gray-900">{t.title}</span> },
    {
      key: "isActive",
      header: "Status",
      render: (t) => <Badge label={t.isActive ? "Active" : "Inactive"} variant={t.isActive ? "green" : "gray"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (t) => (
        <TableActions
          onEdit={canEdit ? () => setFormTarget(t) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(t) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip Info"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => setFormTarget(null)}>+ Add Trip Info</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load trip info." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search trip info..."
          />
        </div>

        <DataTable
          columns={columns}
          data={tripInfos}
          isLoading={isLoading}
          emptyMessage="No trip info yet."
          emptyAction={canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add Trip Info</Button> : undefined}
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
        <TripInfoFormDrawer
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          tripInfo={formTarget}
          onSubmit={handleFormSubmit}
          isLoading={createTripInfo.isPending || updateTripInfo.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Trip Info"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteTripInfo.isPending}
      />
    </div>
  );
}
