import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { usePermission } from "@/hooks/usePermission";
import { useAllPackageMaps, useDeletePackageMap } from "@/hooks/queries/usePackageMaps";
import { getErrorMessage } from "@/lib/apiError";
import { stripHtml } from "@/lib/richText";
import { PATHS } from "@/constants/PATHS";
import type { PackageMap } from "@/types/package-map";

interface TripMapTabProps {
  packageId: string;
}

// Trip maps now carry SEO (slug/meta) and a featured image alongside title/
// abstract/details, so create/edit happens on the full Trip Map page rather
// than an inline drawer — this tab is just a package-scoped list + link out.
export function TripMapTab({ packageId }: TripMapTabProps) {
  const navigate = useNavigate();
  const canEdit = usePermission("update:travel");
  const canDelete = usePermission("delete:travel");
  const canCreate = usePermission("create:travel");

  const [deleteTarget, setDeleteTarget] = useState<PackageMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useAllPackageMaps({ packageId, perPage: 100 });
  const tripMaps = data?.data.items ?? [];

  const deleteTripMap = useDeletePackageMap();

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

  const columns: DataTableColumn<PackageMap>[] = [
    { key: "mapTitle", header: "Title", render: (m) => m.mapTitle },
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
      render: (m) => <Badge label={m.isActive ? "Active" : "Inactive"} variant={m.isActive ? "green" : "gray"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (m) => (
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Route/trek maps shown on this package's public page.</p>
        {canCreate && (
          <Button size="sm" onClick={() => navigate(`${PATHS.TRIP_MAP_CREATE}?packageId=${packageId}`)}>
            + Add Trip Map
          </Button>
        )}
      </div>

      {isError && <Alert variant="error" message="Failed to load trip maps." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <DataTable
        columns={columns}
        data={tripMaps}
        isLoading={isLoading}
        emptyMessage="No trip maps yet."
        emptyAction={
          canCreate ? (
            <Button size="sm" onClick={() => navigate(`${PATHS.TRIP_MAP_CREATE}?packageId=${packageId}`)}>
              + Add Trip Map
            </Button>
          ) : undefined
        }
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Trip Map"
        message={`Are you sure you want to delete "${deleteTarget?.mapTitle}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteTripMap.isPending}
      />
    </div>
  );
}
