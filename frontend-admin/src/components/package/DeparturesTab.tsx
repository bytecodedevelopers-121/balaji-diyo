import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { DepartureFormModal, type DepartureFormSubmitValues } from "./DepartureFormModal";
import { DeparturesBulkModal } from "./DeparturesBulkModal";
import { usePermission } from "@/hooks/usePermission";
import {
  useDepartures,
  useCreateDeparture,
  useCreateDeparturesBulk,
  useUpdateDeparture,
  useDeleteDeparture,
} from "@/hooks/queries/useDepartures";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { toNumber } from "@/lib/decimal";
import type { Departure } from "@/types/departure";

const STATUS_VARIANT: Record<string, "green" | "yellow" | "red" | "gray"> = {
  guaranteed: "green",
  open: "yellow",
  full: "gray",
  cancelled: "red",
};

interface DeparturesTabProps {
  packageId: string;
}

export function DeparturesTab({ packageId }: DeparturesTabProps) {
  const canEdit = usePermission("update:travel");
  const canDelete = usePermission("delete:travel");
  const canCreate = usePermission("create:travel");

  const [formTarget, setFormTarget] = useState<Departure | null | undefined>(undefined);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Departure | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useDepartures(packageId);
  const departures = data?.data.items ?? [];

  const createDeparture = useCreateDeparture(packageId);
  const createBulk = useCreateDeparturesBulk(packageId);
  const updateDeparture = useUpdateDeparture(packageId);
  const deleteDeparture = useDeleteDeparture(packageId);

  const closeForm = () => setFormTarget(undefined);

  const handleFormSubmit = (values: DepartureFormSubmitValues) => {
    setError(null);
    if (formTarget) {
      updateDeparture.mutate(
        { id: formTarget.id, data: values },
        { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) },
      );
    } else {
      createDeparture.mutate(values, {
        onSuccess: closeForm,
        onError: (err) => setError(getErrorMessage(err)),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteDeparture.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Departure>[] = [
    { key: "departureDate", header: "Date", render: (d) => formatDate(d.departureDate) },
    { key: "departureCost", header: "Cost", render: (d) => `$${toNumber(d.departureCost) ?? 0}` },
    {
      key: "departureStatus",
      header: "Status",
      render: (d) => <Badge label={d.departureStatus} variant={STATUS_VARIANT[d.departureStatus.toLowerCase()] ?? "gray"} />,
    },
    { key: "departureNote", header: "Note", render: (d) => d.departureNote || "—" },
    {
      key: "actions",
      header: "Actions",
      render: (d) => (
        <TableActions
          onEdit={canEdit ? () => setFormTarget(d) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(d) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Scheduled departure dates for this package.</p>
        {canCreate && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setBulkOpen(true)}>
              Bulk Add
            </Button>
            <Button size="sm" onClick={() => setFormTarget(null)}>
              + Add Departure
            </Button>
          </div>
        )}
      </div>

      {isError && <Alert variant="error" message="Failed to load departures." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <DataTable
        columns={columns}
        data={departures}
        isLoading={isLoading}
        emptyMessage="No departures scheduled yet."
        emptyAction={canCreate ? <Button size="sm" onClick={() => setFormTarget(null)}>+ Add Departure</Button> : undefined}
      />

      {formTarget !== undefined && (
        <DepartureFormModal
          key={formTarget?.id ?? "new"}
          isOpen
          onClose={closeForm}
          departure={formTarget}
          onSubmit={handleFormSubmit}
          isLoading={createDeparture.isPending || updateDeparture.isPending}
        />
      )}

      <DeparturesBulkModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSubmit={(data) => {
          setError(null);
          createBulk.mutate(data, {
            onSuccess: () => setBulkOpen(false),
            onError: (err) => setError(getErrorMessage(err)),
          });
        }}
        isLoading={createBulk.isPending}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Departure"
        message={`Are you sure you want to delete the departure on ${deleteTarget ? formatDate(deleteTarget.departureDate) : ""}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteDeparture.isPending}
      />
    </div>
  );
}
