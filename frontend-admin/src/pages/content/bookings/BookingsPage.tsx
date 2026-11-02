import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { SecureDocument } from "@/components/ui/SecureDocument";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { usePermission } from "@/hooks/usePermission";
import { useBookings, useCreateInvoice, useDeleteBooking, useBulkDeleteBookings } from "@/hooks/queries/useBookings";
import { usePackages } from "@/hooks/queries/usePackages";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { toNumber } from "@/lib/decimal";
import { COMPANY_INFO } from "@/constants";
import type { Booking, BookingPayment } from "@/types/booking";

const invoiceSchema = z.object({
  invoiceAmount: z.number().min(0),
  invoicePayType: z.string().min(1, "Required"),
  invoiceStatus: z.enum(["0", "1"]),
  transactionCode: z.string().min(1, "Required"),
  invoiceNote: z.string().optional(),
});
type InvoiceFormValues = z.infer<typeof invoiceSchema>;

/** "BA-<package title>-<number>" — mirrors the backend's own `bookingCode()`
 *  in `booking.mail.ts`. Built from the package title live off `booking.package`
 *  each render (not stored), so a later package rename shows up automatically. */
function bookingCode(booking: Booking): string {
  return `BA-${booking.package?.title ?? "Custom Booking"}-${booking.bookingNumber}`;
}

const PAYMENT_STATUS_VARIANT: Record<BookingPayment["status"], "yellow" | "green" | "red" | "gray"> = {
  PENDING: "yellow",
  SUCCESS: "green",
  FAILED: "red",
  CANCELLED: "gray",
};

/** Two-column label/value table; rows with an empty value are skipped. */
function DetailTable({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          {rows
            .filter(([, v]) => v !== null && v !== undefined && v !== "")
            .map(([label, value]) => (
              <tr key={label}>
                <th className="w-40 bg-gray-50 px-3 py-2 text-left align-top text-xs font-medium text-gray-500">
                  {label}
                </th>
                <td className="px-3 py-2 whitespace-pre-line text-gray-700">{value}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceForm({ booking, onCancel }: { booking: Booking; onCancel: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const createInvoice = useCreateInvoice(booking.id);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceAmount: toNumber(booking.totalPrice) ?? 0,
      invoicePayType: booking.paymentOptions || "full",
      invoiceStatus: "0",
      transactionCode: "",
      invoiceNote: "",
    },
  });

  const submit = (values: InvoiceFormValues) => {
    setError(null);
    createInvoice.mutate(
      {
        invoiceAmount: values.invoiceAmount,
        invoicePayType: values.invoicePayType,
        invoiceStatus: Number(values.invoiceStatus),
        transactionCode: values.transactionCode,
        invoiceNote: values.invoiceNote || undefined,
      },
      { onError: (err) => setError(getErrorMessage(err)) },
    );
  };

  return (
    <form className="space-y-4 border-t border-gray-100 pt-4" onSubmit={handleSubmit(submit)}>
      <h3 className="text-sm font-semibold text-gray-900">Generate Invoice</h3>
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      <Input
        type="number"
        step="0.01"
        label="Invoice Amount"
        required
        error={errors.invoiceAmount?.message}
        {...register("invoiceAmount", { valueAsNumber: true })}
      />
      <Input
        label="Pay Type"
        hint='e.g. "full" or "partial"'
        required
        error={errors.invoicePayType?.message}
        {...register("invoicePayType")}
      />
      <Select
        label="Status"
        required
        options={[
          { value: "0", label: "Pending" },
          { value: "1", label: "Paid" },
        ]}
        {...register("invoiceStatus")}
      />
      <Input
        label="Transaction Code"
        required
        error={errors.transactionCode?.message}
        {...register("transactionCode")}
      />
      <Textarea label="Note" rows={2} {...register("invoiceNote")} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={createInvoice.isPending}>
          Generate Invoice
        </Button>
      </div>
    </form>
  );
}

export default function BookingsPage() {
  const canCreateInvoice = usePermission("create:booking");
  const canDelete = usePermission("delete:booking");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [packageId, setPackageId] = useState("");
  const [viewTarget, setViewTarget] = useState<Booking | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Bookings | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useBookings({
    page,
    perPage: 15,
    search: search || undefined,
    packageId: packageId || undefined,
  });
  const bookings = data?.data.items ?? [];
  const meta = data?.data.meta;

  const { data: packagesData } = usePackages({ perPage: 100 });
  const packageOptions = (packagesData?.data.items ?? []).map((p) => ({ value: p.id, label: p.title }));

  const deleteBooking = useDeleteBooking();
  const bulkDeleteBookings = useBulkDeleteBookings();

  const handleView = (booking: Booking) => {
    setViewTarget(booking);
    setShowInvoiceForm(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteBooking.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageSelected = bookings.length > 0 && bookings.every((b) => selectedIds.has(b.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) bookings.forEach((b) => next.delete(b.id));
      else bookings.forEach((b) => next.add(b.id));
      return next;
    });
  };

  const handleBulkDelete = () => {
    setError(null);
    bulkDeleteBookings.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        setSelectedIds(new Set());
        setShowBulkDelete(false);
      },
      onError: (err) => {
        setError(getErrorMessage(err));
        setShowBulkDelete(false);
      },
    });
  };

  const columns: DataTableColumn<Booking>[] = [
    ...(canDelete
      ? [
          {
            key: "select",
            header: (
              <Checkbox checked={allOnPageSelected} onChange={toggleSelectAll} aria-label="Select all on page" />
            ),
            render: (b: Booking) => (
              <Checkbox
                checked={selectedIds.has(b.id)}
                onChange={() => toggleSelected(b.id)}
                aria-label={`Select ${b.fullName}`}
              />
            ),
          } satisfies DataTableColumn<Booking>,
        ]
      : []),
    {
      key: "bookingNumber",
      header: "Code",
      render: (b) => <span className="font-medium text-gray-900">{bookingCode(b)}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      render: (b) => (
        <div>
          <span className="font-medium text-gray-900">{b.fullName}</span>
          <div className="text-xs text-gray-500">{b.email}</div>
        </div>
      ),
    },
    { key: "package", header: "Package", render: (b) => b.package?.title ?? "—" },
    {
      key: "dates",
      header: "Dates",
      render: (b) => (
        <span className="text-sm text-gray-700">
          {formatDate(b.startDate)} – {formatDate(b.endDate)}
        </span>
      ),
    },
    { key: "travellers", header: "Travellers", render: (b) => b.numberOfTraveller },
    {
      key: "totalPrice",
      header: "Total Price",
      render: (b) => `$${(toNumber(b.totalPrice) ?? 0).toFixed(2)}`,
    },
    {
      key: "payment",
      header: "Payment",
      render: (b) => {
        const latest = b.payments[0];
        return latest ? (
          <Badge label={latest.status} variant={PAYMENT_STATUS_VARIANT[latest.status]} />
        ) : (
          <Badge label="None" variant="gray" />
        );
      },
    },
    {
      key: "invoice",
      header: "Invoice",
      render: (b) => <Badge label={b.invoice ? "Generated" : "None"} variant={b.invoice ? "green" : "gray"} />,
    },
    { key: "createdAt", header: "Submitted", render: (b) => formatDate(b.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (b) => (
        <TableActions
          onView={() => handleView(b)}
          onDelete={canDelete ? () => setDeleteTarget(b) : undefined}
          canEdit={false}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" action={<RefreshButton isFetching={isFetching} onRefresh={refetch} />} />

      {isError && <Alert variant="error" message="Failed to load bookings." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="max-w-sm flex-1">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search by booking code, name or email..."
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
          {canDelete && selectedIds.size > 0 && (
            <Button variant="danger" onClick={() => setShowBulkDelete(true)}>
              Delete Selected ({selectedIds.size})
            </Button>
          )}
        </div>

        <DataTable columns={columns} data={bookings} isLoading={isLoading} emptyMessage="No bookings yet." />

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

      <Drawer isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.fullName} size="xl">
        {viewTarget && (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Booking</h3>
              <DetailTable
                rows={[
                  ["Booking Code", <span className="font-semibold text-gray-900">{bookingCode(viewTarget)}</span>],
                  ["Package", viewTarget.package?.title],
                  ["Trip Dates", `${formatDate(viewTarget.startDate)} – ${formatDate(viewTarget.endDate)}`],
                  ["Travellers", viewTarget.numberOfTraveller],
                  ["Payment Option", viewTarget.paymentOptions],
                  ["Total Price", `$${(toNumber(viewTarget.totalPrice) ?? 0).toFixed(2)}`],
                  ["Payable %", viewTarget.payablePercentage != null ? `${viewTarget.payablePercentage}%` : null],
                  ["Pickup Details", viewTarget.pickupDetails],
                  ["Submitted", formatDate(viewTarget.createdAt)],
                  ["IP Address", viewTarget.ipAddress],
                ]}
              />
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Lead Contact</h3>
              <DetailTable
                rows={[
                  ["Full Name", viewTarget.fullName],
                  ["Email", viewTarget.email],
                  ["Mobile", viewTarget.mobileNumber ? `${viewTarget.countryCode} ${viewTarget.mobileNumber}` : null],
                  ["Date of Birth", viewTarget.dateOfBirth ? formatDate(viewTarget.dateOfBirth) : null],
                  ["Nationality", `${viewTarget.nationality} (${viewTarget.countryCode})`],
                ]}
              />
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Payment</h3>
              {viewTarget.payments.length === 0 ? (
                <p className="text-sm text-gray-500">No online payment attempt recorded for this booking.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-medium text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Gateway</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Paid %</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewTarget.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-3 py-2 text-gray-700">{formatDate(p.createdAt)}</td>
                          <td className="px-3 py-2 text-gray-700">{p.gateway}</td>
                          <td className="px-3 py-2 text-gray-700">${(toNumber(p.totalAmount) ?? 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-gray-700">{p.percentage != null ? `${p.percentage}%` : "—"}</td>
                          <td className="px-3 py-2">
                            <Badge label={p.status} variant={PAYMENT_STATUS_VARIANT[p.status]} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">
                Travellers ({viewTarget.travellers.length})
              </h3>
              {viewTarget.travellers.length === 0 ? (
                <p className="text-sm text-gray-500">No traveller details submitted for this booking.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-medium text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Gender / DOB</th>
                        <th className="px-3 py-2">Nationality</th>
                        <th className="px-3 py-2">Passport No.</th>
                        <th className="px-3 py-2">Contact</th>
                        <th className="px-3 py-2">Documents</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewTarget.travellers.map((t) => (
                        <tr key={t.id} className="align-top">
                          <td className="px-3 py-2 font-medium text-gray-900">
                            <div>{t.fullName}</div>
                            {t.isLead && <Badge label="Lead" variant="blue" size="sm" />}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                            <div>{t.gender ?? "—"}</div>
                            <div className="text-xs text-gray-500">{t.dateOfBirth ? formatDate(t.dateOfBirth) : "—"}</div>
                          </td>
                          <td className="px-3 py-2 text-gray-700">{t.nationality}</td>
                          <td className="px-3 py-2 font-mono text-gray-900">{t.passportNo ?? "—"}</td>
                          <td className="px-3 py-2 text-gray-700">
                            <div>{t.email}</div>
                            {t.mobileNumber && (
                              <div className="text-xs text-gray-500">
                                {t.countryCode} {t.mobileNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-1">
                              {t.photo && <SecureDocument path={t.photo} label="View photo" />}
                              {t.passportImage && <SecureDocument path={t.passportImage} label="View passport" />}
                              {!t.photo && !t.passportImage && <span className="text-gray-400">—</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {viewTarget.invoice ? (
              <div className="rounded-lg border border-gray-100 p-3">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Invoice</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-400">Amount</dt>
                    <dd className="text-gray-700">${(toNumber(viewTarget.invoice.invoiceAmount) ?? 0).toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-400">Pay Type</dt>
                    <dd className="text-gray-700">{viewTarget.invoice.invoicePayType}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-400">Transaction Code</dt>
                    <dd className="text-gray-700">{viewTarget.invoice.transactionCode}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-400">Status</dt>
                    <dd className="text-gray-700">{viewTarget.invoice.invoiceStatus === 1 ? "Paid" : "Pending"}</dd>
                  </div>
                </dl>
              </div>
            ) : canCreateInvoice ? (
              showInvoiceForm ? (
                <InvoiceForm booking={viewTarget} onCancel={() => setShowInvoiceForm(false)} />
              ) : (
                <Button variant="outline" onClick={() => setShowInvoiceForm(true)}>
                  Generate Invoice
                </Button>
              )
            ) : (
              <p className="text-sm text-gray-500">No invoice generated yet.</p>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Booking"
        message={`Are you sure you want to delete the booking for "${deleteTarget?.fullName}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteBooking.isPending}
      />

      <ConfirmDialog
        isOpen={showBulkDelete}
        title="Delete Bookings"
        message={`Are you sure you want to delete ${selectedIds.size} selected booking${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDelete(false)}
        isLoading={bulkDeleteBookings.isPending}
      />
    </div>
  );
}
