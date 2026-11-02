import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Tabs } from "@/components/layout/Tabs";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TypedConfirmDialog } from "@/components/ui/TypedConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { usePermission } from "@/hooks/usePermission";
import { usePackages } from "@/hooks/queries/usePackages";
import { useAllPackageMaps, useDeletePackageMap, useRestorePackageMap, useHardDeletePackageMap } from "@/hooks/queries/usePackageMaps";
import { getErrorMessage } from "@/lib/apiError";
import { stripHtml } from "@/lib/richText";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import type { PackageMap } from "@/types/package-map";

export default function TripMapsPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:travel");
  const canEdit = usePermission("update:travel");
  const canDelete = usePermission("delete:travel");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [packageId, setPackageId] = useState("");
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [deleteTarget, setDeleteTarget] = useState<PackageMap | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<PackageMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Trip Maps | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data: packagesData } = usePackages({ perPage: 200 });
  const packages = packagesData?.data.items ?? [];

  const isTrash = tab === "trash";
  const { data, isLoading, isError, isFetching, refetch } = useAllPackageMaps({
    page,
    perPage: 15,
    search: search || undefined,
    packageId: packageId || undefined,
    includeTrashed: isTrash,
  });
  const tripMaps = data?.data.items ?? [];
  const meta = data?.data.meta;

  const deleteTripMap = useDeletePackageMap();
  const restoreTripMap = useRestorePackageMap();
  const hardDeletePackageMap = useHardDeletePackageMap();

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteTripMap.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const handleRestore = (map: PackageMap) => {
    setError(null);
    restoreTripMap.mutate(map.id, { onError: (err) => setError(getErrorMessage(err)) });
  };

  const handleHardDelete = () => {
    if (!hardDeleteTarget) return;
    setError(null);
    hardDeletePackageMap.mutate(hardDeleteTarget.id, {
      onSuccess: () => setHardDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setHardDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<PackageMap>[] = [
    { key: "mapTitle", header: "Title", render: (m) => m.mapTitle },
    {
      key: "package",
      header: "Package",
      render: (m) => packages.find((p) => p.id === m.packageId)?.title ?? <span className="text-gray-400">—</span>,
    },
    {
      key: "mapAbstract",
      header: "Abstract",
      render: (m) => (
        <span className="line-clamp-2 max-w-md text-sm text-gray-600">
          {m.mapAbstract ? stripHtml(m.mapAbstract) : "—"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (m) =>
        m.deletedAt ? (
          <Badge label="Deleted" variant="red" />
        ) : (
          <Badge label={m.isActive ? "Active" : "Inactive"} variant={m.isActive ? "green" : "gray"} />
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (m) =>
        isTrash ? (
          <TableActions
            onRestore={canDelete ? () => handleRestore(m) : undefined}
            onHardDelete={canDelete ? () => setHardDeleteTarget(m) : undefined}
            canDelete={canDelete}
            isRestoring={restoreTripMap.isPending}
          />
        ) : (
          <TableActions
            onEdit={canEdit ? () => navigate(PATHS.TRIP_MAP_DETAIL(m.id)) : undefined}
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
        title="Trip Maps"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => navigate(PATHS.TRIP_MAP_CREATE)}>+ Add Trip Map</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load trip maps." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4">
          <Tabs
            tabs={[
              { value: "active", label: "Active" },
              { value: "trash", label: "Trash" },
            ]}
            value={tab}
            onChange={(v) => {
              setTab(v as "active" | "trash");
              setPage(1);
            }}
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="max-w-sm flex-1">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search by title..."
            />
          </div>
          <div className="w-64">
            <Select
              options={[{ value: "", label: "All packages" }, ...packages.map((p) => ({ value: p.id, label: p.title }))]}
              value={packageId}
              onChange={(e) => {
                setPackageId(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={tripMaps}
          isLoading={isLoading}
          emptyMessage={isTrash ? "Trash is empty." : "No trip maps yet."}
          emptyAction={
            !isTrash && canCreate ? <Button onClick={() => navigate(PATHS.TRIP_MAP_CREATE)}>+ Add Trip Map</Button> : undefined
          }
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
        title="Delete Trip Map"
        message={`Are you sure you want to delete "${deleteTarget?.mapTitle}"? It will be moved to Trash and can be restored later.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteTripMap.isPending}
      />

      <TypedConfirmDialog
        isOpen={!!hardDeleteTarget}
        onClose={() => setHardDeleteTarget(null)}
        onConfirm={handleHardDelete}
        isLoading={hardDeletePackageMap.isPending}
        title="Delete Trip Map Permanently"
        message={`"${hardDeleteTarget?.mapTitle}" and its SEO data and image links will be erased for good. This cannot be restored.`}
        confirmText="DELETE"
      />
    </div>
  );
}
