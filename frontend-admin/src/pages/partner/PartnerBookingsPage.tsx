import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Select } from "@/components/ui/Select";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { BookingStatusBadge } from "@/components/b2b/b2b-ui";
import { formatMoney } from "@/components/b2b/b2b-helpers";
import { useMyBookings } from "@/hooks/queries/useB2B";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import type { AnyB2BBooking, BookingStatus } from "@/types/b2b";

const STATUSES: BookingStatus[] = ["PENDING_APPROVAL", "CONFIRMED", "AMENDMENT_REQUESTED", "CANCELLED"];

export default function PartnerBookingsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<"BOOKING" | "CUSTOM">("BOOKING");
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [q, setQ] = useState("");
  const { data, isLoading } = useMyBookings({ page, perPage: 15, kind, status: status || undefined, q: q || undefined });
  const meta = data?.data.meta;

  const columns: DataTableColumn<AnyB2BBooking>[] = [
    { key: "ref", header: "Reference", render: (b) => <span className="font-mono font-medium text-gray-900">{b.kind === "BOOKING" ? b.reference : `CUSTOM-${b.id.slice(-6).toUpperCase()}`}</span> },
    { key: "pkg", header: "Package", render: (b) => <div><p className="text-gray-900">{b.package?.title ?? "—"}</p>{b.kind === "BOOKING" && <p className="text-xs text-gray-500">{b.fullName}</p>}</div> },
    { key: "date", header: "Travel", render: (b) => formatDate(b.startDate) },
    { key: "pax", header: "Pax", render: (b) => b.numberOfTraveller },
    { key: "net", header: "Net payable", render: (b) => (b.netPayable ? formatMoney(b.netPayable, "USD") : "—") },
    { key: "status", header: "Status", render: (b) => <BookingStatusBadge status={b.b2bStatus} /> },
    { key: "created", header: "Created", render: (b) => <span className="text-gray-600">{formatDate(b.createdAt)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Bookings" />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_200px]">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search BA number, name, email…" />
        <Select aria-label="Type" value={kind} options={[{ value: "BOOKING", label: "Departure bookings" }, { value: "CUSTOM", label: "Custom requests" }]} onChange={(e) => { setKind(e.target.value as "BOOKING" | "CUSTOM"); setPage(1); }} />
        <Select aria-label="Status" value={status} placeholder="All statuses" options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) }))} onChange={(e) => { setStatus(e.target.value as BookingStatus | ""); setPage(1); }} />
      </div>
      <DataTable columns={columns} data={data?.data.items ?? []} isLoading={isLoading} emptyMessage="No bookings yet" onRowClick={(b) => navigate(PATHS.PARTNER_BOOKING(b.id))} />
      {meta && meta.totalPages > 1 && <Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />}
    </div>
  );
}
