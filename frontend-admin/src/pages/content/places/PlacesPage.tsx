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
import { usePlaces, useDeletePlace } from "@/hooks/queries/usePlaces";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import type { Place } from "@/types/place";

export default function PlacesPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:place");
  const canEdit = usePermission("update:place");
  const canDelete = usePermission("delete:place");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Places | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = usePlaces({ page, perPage: 10, search: search || undefined });
  const places = data?.data.items ?? [];
  const meta = data?.data.meta;

  const deletePlace = useDeletePlace();

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deletePlace.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Place>[] = [
    { key: "placeName", header: "Name", render: (p) => <span className="font-medium text-gray-900">{p.placeName}</span> },
    { key: "placeElevation", header: "Elevation", render: (p) => p.placeElevation || "—" },
    {
      key: "isFeatured",
      header: "Featured",
      render: (p) => <Badge label={p.isFeatured ? "Featured" : "—"} variant={p.isFeatured ? "indigo" : "gray"} />,
    },
    {
      key: "isActive",
      header: "Status",
      render: (p) => <Badge label={p.isActive ? "Active" : "Inactive"} variant={p.isActive ? "green" : "gray"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <TableActions
          onEdit={canEdit ? () => navigate(PATHS.PLACE_DETAIL(p.id)) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(p) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Places"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.PLACE_CREATE)}>+ New Place</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load places." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search places..."
          />
        </div>

        <DataTable
          columns={columns}
          data={places}
          isLoading={isLoading}
          emptyMessage="No places yet."
          emptyAction={canCreate ? <Button onClick={() => navigate(PATHS.PLACE_CREATE)}>+ New Place</Button> : undefined}
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
        title="Delete Place"
        message={`Are you sure you want to delete "${deleteTarget?.placeName}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deletePlace.isPending}
      />
    </div>
  );
}
