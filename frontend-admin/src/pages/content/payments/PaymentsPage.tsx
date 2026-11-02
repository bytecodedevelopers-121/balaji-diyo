import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/layout/Tabs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TypedConfirmDialog } from "@/components/ui/TypedConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Drawer } from "@/components/ui/Drawer";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { usePermission } from "@/hooks/usePermission";
import {
  usePayments,
  useCreatePayment,
  useUpdatePaymentStatus,
  useDeletePayment,
  useRestorePayment,
  useHardDeletePayment,
} from "@/hooks/queries/usePayments";
import { usePackages } from "@/hooks/queries/usePackages";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { toNumber } from "@/lib/decimal";
import { COMPANY_INFO } from "@/constants";
import type { Payment, PaymentGateway, PaymentStatus } from "@/types/payment";

const GATEWAY_OPTIONS: { value: PaymentGateway; label: string }[] = [
  { value: "PACO", label: "PACO" },
  { value: "NABIL", label: "Nabil" },
  { value: "HBL", label: "HBL" },
  { value: "NICA", label: "NICA" },
];

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const GATEWAY_VARIANT: Record<PaymentGateway, BadgeVariant> = {
  PACO: "purple",
  NABIL: "blue",
  HBL: "orange",
  NICA: "teal",
};

const STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  PENDING: "yellow",
  SUCCESS: "green",
  FAILED: "red",
  CANCELLED: "gray",
};

const createSchema = z.object({
  gateway: z.enum(["NABIL", "HBL", "NICA", "PACO"]),
  packageId: z.string().optional(),
  customTitle: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  description: z.string().optional(),
  percentage: z.number().min(0).max(100).optional(),
  totalAmount: z.number().min(0),
  status: z.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED"]).optional(),
  gatewayReference: z.string().optional(),
  gatewayTransactionId: z.string().optional(),
});
type CreateFormValues = z.infer<typeof createSchema>;

function CreatePaymentDrawer({
  isOpen,
  onClose,
  packageOptions,
}: {
  isOpen: boolean;
  onClose: () => void;
  packageOptions: { value: string; label: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const createPayment = useCreatePayment();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { gateway: "PACO", status: "PENDING", totalAmount: 0 },
  });

  const submit = (values: CreateFormValues) => {
    setError(null);
    createPayment.mutate(
      {
        gateway: values.gateway,
        packageId: values.packageId || undefined,
        customTitle: values.customTitle || undefined,
        customerName: values.customerName || undefined,
        customerEmail: values.customerEmail || undefined,
        description: values.description || undefined,
        percentage: values.percentage,
        totalAmount: values.totalAmount,
        status: values.status,
        gatewayReference: values.gatewayReference || undefined,
        gatewayTransactionId: values.gatewayTransactionId || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={createPayment.isPending}>
            Record Payment
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
        <Select label="Gateway" required options={GATEWAY_OPTIONS} {...register("gateway")} />
        <Select
          label="Package"
          placeholder="No package"
          options={packageOptions}
          {...register("packageId")}
        />
        <Input label="Customer Name" error={errors.customerName?.message} {...register("customerName")} />
        <Input
          label="Customer Email"
          type="email"
          error={errors.customerEmail?.message}
          {...register("customerEmail")}
        />
        <Input label="Custom Title" {...register("customTitle")} />
        <Textarea label="Description" rows={2} {...register("description")} />
        <Input
          type="number"
          step="0.01"
          label="Total Amount"
          required
          error={errors.totalAmount?.message}
          {...register("totalAmount", { valueAsNumber: true })}
        />
        <Input
          type="number"
          label="Percentage Paid"
          hint="0–100, optional"
          error={errors.percentage?.message}
          {...register("percentage", { setValueAs: (value) => (value === "" ? undefined : Number(value)) })}
        />
        <Select label="Status" options={STATUS_OPTIONS} {...register("status")} />
        <Input label="Gateway Reference" {...register("gatewayReference")} />
        <Input label="Gateway Transaction ID" {...register("gatewayTransactionId")} />
      </form>
    </Drawer>
  );
}

const statusUpdateSchema = z.object({
  status: z.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED"]),
  gatewayReference: z.string().optional(),
  gatewayTransactionId: z.string().optional(),
});
type StatusUpdateValues = z.infer<typeof statusUpdateSchema>;

function StatusUpdateForm({ payment, onDone }: { payment: Payment; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const updateStatus = useUpdatePaymentStatus(payment.id);
  const { register, handleSubmit } = useForm<StatusUpdateValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: payment.status,
      gatewayReference: payment.gatewayReference ?? "",
      gatewayTransactionId: payment.gatewayTransactionId ?? "",
    },
  });

  const submit = (values: StatusUpdateValues) => {
    setError(null);
    updateStatus.mutate(
      {
        status: values.status,
        gatewayReference: values.gatewayReference || undefined,
        gatewayTransactionId: values.gatewayTransactionId || undefined,
      },
      { onSuccess: onDone, onError: (err) => setError(getErrorMessage(err)) },
    );
  };

  return (
    <form className="space-y-3 rounded-lg border border-gray-100 p-3" onSubmit={handleSubmit(submit)}>
      <h3 className="text-sm font-semibold text-gray-900">Update Status</h3>
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      <Select label="Status" options={STATUS_OPTIONS} {...register("status")} />
      <Input label="Gateway Reference" {...register("gatewayReference")} />
      <Input label="Gateway Transaction ID" {...register("gatewayTransactionId")} />
      <div className="flex justify-end">
        <Button type="submit" size="sm" isLoading={updateStatus.isPending}>
          Save Status
        </Button>
      </div>
    </form>
  );
}

export default function PaymentsPage() {
  const canCreate = usePermission("create:payment");
  const canUpdate = usePermission("update:payment");
  const canDelete = usePermission("delete:payment");

  const [page, setPage] = useState(1);
  const [gateway, setGateway] = useState("");
  const [status, setStatus] = useState("");
  const [packageId, setPackageId] = useState("");
  const [viewTarget, setViewTarget] = useState<Payment | null>(null);
  const [showRawPayload, setShowRawPayload] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Payment | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const isTrash = tab === "trash";

  useEffect(() => {
    document.title = `Payments | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = usePayments({
    page,
    perPage: 15,
    gateway: (gateway || undefined) as PaymentGateway | undefined,
    status: (status || undefined) as PaymentStatus | undefined,
    packageId: packageId || undefined,
    includeTrashed: isTrash,
  });
  const deletePayment = useDeletePayment();
  const restorePayment = useRestorePayment();
  const hardDeletePayment = useHardDeletePayment();

  const handleDelete = () => {
    if (!deleteTarget) return;
    setActionError(null);
    deletePayment.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setActionError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const handleRestore = (payment: Payment) => {
    setActionError(null);
    restorePayment.mutate(payment.id, { onError: (err) => setActionError(getErrorMessage(err)) });
  };

  const handleHardDelete = () => {
    if (!hardDeleteTarget) return;
    setActionError(null);
    hardDeletePayment.mutate(hardDeleteTarget.id, {
      onSuccess: () => setHardDeleteTarget(null),
      onError: (err) => {
        setActionError(getErrorMessage(err));
        setHardDeleteTarget(null);
      },
    });
  };
  const payments = data?.data.items ?? [];
  const meta = data?.data.meta;

  const { data: packagesData } = usePackages({ perPage: 100 });
  const packageOptions = (packagesData?.data.items ?? []).map((p) => ({ value: p.id, label: p.title }));

  const columns: DataTableColumn<Payment>[] = [
    { key: "gateway", header: "Gateway", render: (p) => <Badge label={p.gateway} variant={GATEWAY_VARIANT[p.gateway]} /> },
    {
      key: "customer",
      header: "Customer",
      render: (p) => (
        <div>
          <span className="text-gray-900">{p.customerName ?? "—"}</span>
          {p.customerEmail && <div className="text-xs text-gray-500">{p.customerEmail}</div>}
        </div>
      ),
    },
    { key: "package", header: "Package", render: (p) => p.package?.title ?? p.customTitle ?? "—" },
    { key: "amount", header: "Amount", render: (p) => `$${(toNumber(p.totalAmount) ?? 0).toFixed(2)}` },
    { key: "status", header: "Status", render: (p) => <Badge label={p.status} variant={STATUS_VARIANT[p.status]} /> },
    { key: "createdAt", header: "Created", render: (p) => formatDate(p.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (p) =>
        isTrash ? (
          <TableActions
            onRestore={canUpdate ? () => handleRestore(p) : undefined}
            onHardDelete={canDelete ? () => setHardDeleteTarget(p) : undefined}
            canDelete={canDelete || canUpdate}
            isRestoring={restorePayment.isPending}
          />
        ) : (
          <TableActions
            onView={() => {
              setViewTarget(p);
              setShowRawPayload(false);
            }}
            onDelete={canDelete ? () => setDeleteTarget(p) : undefined}
            canEdit={false}
            canDelete={canDelete}
          />
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => setCreateOpen(true)}>Record Payment</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load payments." />}
      {actionError && <Alert variant="error" message={actionError} onClose={() => setActionError(null)} />}

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
          <div className="w-40">
            <Select
              options={[{ value: "", label: "All gateways" }, ...GATEWAY_OPTIONS]}
              value={gateway}
              onChange={(e) => {
                setGateway(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              options={[{ value: "", label: "All statuses" }, ...STATUS_OPTIONS]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-56">
            <Select
              options={[{ value: "", label: "All packages" }, ...packageOptions]}
              value={packageId}
              onChange={(e) => {
                setPackageId(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <DataTable columns={columns} data={payments} isLoading={isLoading} emptyMessage={isTrash ? "Trash is empty." : "No payments yet."} />

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
        title="Delete Payment"
        message="Move this payment record to Trash? It can be restored later."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deletePayment.isPending}
      />

      <TypedConfirmDialog
        isOpen={!!hardDeleteTarget}
        onClose={() => setHardDeleteTarget(null)}
        onConfirm={handleHardDelete}
        isLoading={hardDeletePayment.isPending}
        title="Delete Payment Permanently"
        message="This payment record, including its raw gateway data, will be erased for good. This cannot be restored."
        confirmText="DELETE"
      />

      <Drawer
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewTarget ? `${viewTarget.gateway} Payment` : ""}
        size="lg"
      >
        {viewTarget && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-400">Status</dt>
                <dd><Badge label={viewTarget.status} variant={STATUS_VARIANT[viewTarget.status]} /></dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Amount</dt>
                <dd className="text-gray-700">${(toNumber(viewTarget.totalAmount) ?? 0).toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Customer</dt>
                <dd className="text-gray-700">{viewTarget.customerName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Email</dt>
                <dd className="text-gray-700">{viewTarget.customerEmail ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Package</dt>
                <dd className="text-gray-700">{viewTarget.package?.title ?? viewTarget.customTitle ?? "—"}</dd>
              </div>
              {viewTarget.percentage != null && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Percentage</dt>
                  <dd className="text-gray-700">{viewTarget.percentage}%</dd>
                </div>
              )}
              {viewTarget.gatewayReference && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Gateway Reference</dt>
                  <dd className="text-gray-700">{viewTarget.gatewayReference}</dd>
                </div>
              )}
              {viewTarget.gatewayTransactionId && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Transaction ID</dt>
                  <dd className="text-gray-700">{viewTarget.gatewayTransactionId}</dd>
                </div>
              )}
              {viewTarget.description && (
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-gray-400">Description</dt>
                  <dd className="whitespace-pre-line text-gray-700">{viewTarget.description}</dd>
                </div>
              )}
            </dl>

            {(viewTarget.requestPayload != null || viewTarget.responsePayload != null) && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowRawPayload((v) => !v)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {showRawPayload ? "Hide" : "Show"} raw gateway data
                </button>
                {showRawPayload && (
                  <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                    {JSON.stringify(
                      { request: viewTarget.requestPayload, response: viewTarget.responsePayload },
                      null,
                      2,
                    )}
                  </pre>
                )}
              </div>
            )}

            {canUpdate && <StatusUpdateForm payment={viewTarget} onDone={() => setViewTarget(null)} />}
          </div>
        )}
      </Drawer>

      <CreatePaymentDrawer isOpen={createOpen} onClose={() => setCreateOpen(false)} packageOptions={packageOptions} />
    </div>
  );
}
