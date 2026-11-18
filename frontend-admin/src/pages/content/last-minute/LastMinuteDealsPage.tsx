import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { usePermission } from "@/hooks/usePermission";
import { usePackages } from "@/hooks/queries/usePackages";
import {
  useLastMinuteDepartures,
  useLastMinutePackageIds,
  useCreateLastMinuteDeparture,
  useUpdateLastMinuteDeparture,
  useDeleteLastMinuteDeparture,
} from "@/hooks/queries/useLastMinuteDepartures";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { toNumber } from "@/lib/decimal";
import { COMPANY_INFO } from "@/constants";
import type { Departure } from "@/types/departure";

const schema = z.object({
  packageId: z.string().min(1, "Select a package"),
  departureDate: z.string().min(1, "Date is required"),
  departureCost: z.number().min(0, "Cost is required"),
  departureStatus: z.string().min(1, "Status is required"),
  departureNote: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STATUS_VARIANT: Record<string, "green" | "yellow" | "red" | "gray"> = {
  guaranteed: "green",
  open: "yellow",
  full: "gray",
  cancelled: "red",
};

const STATUS_OPTIONS = [
  { value: "Open", label: "Open" },
  { value: "Guaranteed", label: "Guaranteed" },
  { value: "Full", label: "Full" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Closed", label: "Closed" },
];

interface DealModalProps {
  departure: Departure | null;
  packageOptions: { value: string; label: string }[];
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}

function DealModal({ departure, packageOptions, isLoading, onClose, onSubmit }: DealModalProps) {
  const isEdit = !!departure;
  // Keep a legacy/custom status (e.g. "available") selectable when editing.
  const current = departure?.departureStatus;
  const statusOptions = STATUS_OPTIONS.some((o) => o.value === current) || !current
    ? STATUS_OPTIONS
    : [...STATUS_OPTIONS, { value: current, label: current }];
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      packageId: departure?.packageId ?? "",
      departureDate: departure?.departureDate?.slice(0, 10) ?? "",
      departureCost: toNumber(departure?.departureCost) ?? 0,
      departureStatus: departure?.departureStatus ?? "Open",
      departureNote: departure?.departureNote ?? "",
    },
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? "Edit Last Minute Deal" : "New Last Minute Deal"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Add Deal"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Select
          label="Package"
          required
          placeholder="Select a package"
          options={packageOptions}
          disabled={isEdit}
          error={errors.packageId?.message}
          {...register("packageId")}
        />
        <Input label="Departure date" type="date" required error={errors.departureDate?.message} {...register("departureDate")} />
        <Input
          label="Cost"
          type="number"
          step="0.01"
          required
          error={errors.departureCost?.message}
          {...register("departureCost", { valueAsNumber: true })}
        />
        <Select
          label="Status"
          required
          hint="Closed deals are hidden on the website"
          options={statusOptions}
          error={errors.departureStatus?.message}
          {...register("departureStatus")}
        />
        <Textarea label="Note" rows={2} {...register("departureNote")} />
      </form>
    </Modal>
  );
}

export default function LastMinuteDealsPage() {
  const canCreate = usePermission("create:travel");
  const canEdit = usePermission("update:travel");
  const canDelete = usePermission("delete:travel");

  const [formTarget, setFormTarget] = useState<Departure | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Departure | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Last Minute Deals | ${COMPANY_INFO.name} Admin`;
  }, []);

  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useLastMinuteDepartures(page, 10);
  const deals = data?.data.items ?? [];
  const meta = data?.data.meta;
  // Deleting the last row of the final page leaves it empty — step back.
  if (meta && page > meta.totalPages && meta.totalPages > 0) setPage(meta.totalPages);

  const { data: packagesData } = usePackages({ page: 1, perPage: 100 });
  const { data: usedPackageIds } = useLastMinutePackageIds();
  // Only packages without a last minute deal yet (plus the one being edited).
  const packageOptions = useMemo(
    () =>
      (packagesData?.data.items ?? [])
        .filter((p) => !usedPackageIds?.has(p.id) || p.id === formTarget?.packageId)
        .map((p) => ({ value: p.id, label: p.title })),
    [packagesData, usedPackageIds, formTarget],
  );

  const createDeal = useCreateLastMinuteDeparture();
  const updateDeal = useUpdateLastMinuteDeparture();
  const deleteDeal = useDeleteLastMinuteDeparture();

  const closeForm = () => setFormTarget(undefined);
  const fail = (err: unknown) => setError(getErrorMessage(err));

  const handleSubmit = (values: FormValues) => {
    setError(null);
    const note = values.departureNote || undefined;
    if (formTarget) {
      updateDeal.mutate(
        {
          id: formTarget.id,
          data: {
            departureDate: values.departureDate,
            departureCost: values.departureCost,
            departureStatus: values.departureStatus,
            departureNote: note,
          },
        },
        { onSuccess: closeForm, onError: fail },
      );
    } else {
      createDeal.mutate({ ...values, departureNote: note }, { onSuccess: closeForm, onError: fail });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteDeal.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        fail(err);
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Departure>[] = [
    { key: "package", header: "Trip", render: (d) => d.package?.title ?? "—" },
    { key: "departureDate", header: "Departure date", render: (d) => formatDate(d.departureDate) },
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
    <div>
      <PageHeader
        title="Last Minute Deals"
        action={canCreate ? <Button onClick={() => setFormTarget(null)}>+ Add Deal</Button> : undefined}
      />
      <PageCard>
        {isError && <Alert variant="error" message="Failed to load last minute deals." />}
        {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
        <DataTable
          columns={columns}
          data={deals}
          isLoading={isLoading}
          emptyMessage="No last minute deals yet."
          emptyAction={canCreate ? <Button size="sm" onClick={() => setFormTarget(null)}>+ Add Deal</Button> : undefined}
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
        <DealModal
          key={formTarget?.id ?? "new"}
          departure={formTarget}
          packageOptions={packageOptions}
          isLoading={createDeal.isPending || updateDeal.isPending}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Deal"
        message="Are you sure you want to delete this last minute deal? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteDeal.isPending}
      />
    </div>
  );
}
