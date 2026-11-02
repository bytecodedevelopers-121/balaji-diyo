import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Drawer } from "@/components/ui/Drawer";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { useCustomBookings } from "@/hooks/queries/useCustomBookings";
import { usePackages } from "@/hooks/queries/usePackages";
import { formatDate } from "@/lib/formatDate";
import { COMPANY_INFO } from "@/constants";
import type { CustomBooking } from "@/types/customBooking";

// Fully read-only from the admin side — custom bookings (and their
// travellers) are only ever created by the public site's custom-trip form.
// See booking.routes.ts/custom-booking.routes.ts: no admin create/edit/delete
// route exists for either.
export default function CustomBookingsPage() {
  const [page, setPage] = useState(1);
  const [packageId, setPackageId] = useState("");
  const [viewTarget, setViewTarget] = useState<CustomBooking | null>(null);

  useEffect(() => {
    document.title = `Custom Bookings | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useCustomBookings({
    page,
    perPage: 15,
    packageId: packageId || undefined,
  });
  const bookings = data?.data.items ?? [];
  const meta = data?.data.meta;

  const { data: packagesData } = usePackages({ perPage: 100 });
  const packageOptions = (packagesData?.data.items ?? []).map((p) => ({ value: p.id, label: p.title }));

  const columns: DataTableColumn<CustomBooking>[] = [
    { key: "package", header: "Package", render: (b) => b.package.title },
    {
      key: "dates",
      header: "Start Date",
      render: (b) => formatDate(b.startDate),
    },
    { key: "travellers", header: "Travellers", render: (b) => b.numberOfTraveller },
    {
      key: "extras",
      header: "Extras",
      render: (b) => (
        <div className="flex flex-wrap gap-1">
          {b.airportPickup && <Badge label="Pickup" variant="blue" size="sm" />}
          {b.airportDropoff && <Badge label="Dropoff" variant="blue" size="sm" />}
          {b.travelInsurance && <Badge label="Insurance" variant="purple" size="sm" />}
        </div>
      ),
    },
    { key: "createdAt", header: "Submitted", render: (b) => formatDate(b.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (b) => <TableActions onView={() => setViewTarget(b)} canEdit={false} canDelete={false} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Custom Bookings" action={<RefreshButton isFetching={isFetching} onRefresh={refetch} />} />

      {isError && <Alert variant="error" message="Failed to load custom bookings." />}

      <PageCard padding="sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
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

        <DataTable columns={columns} data={bookings} isLoading={isLoading} emptyMessage="No custom bookings yet." />

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

      <Drawer isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.package.title} size="lg">
        {viewTarget && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-400">Start Date</dt>
                <dd className="text-gray-700">{formatDate(viewTarget.startDate)}</dd>
              </div>
              {viewTarget.endDate && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">End Date</dt>
                  <dd className="text-gray-700">{formatDate(viewTarget.endDate)}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-gray-400">Travellers</dt>
                <dd className="text-gray-700">{viewTarget.numberOfTraveller}</dd>
              </div>
              {viewTarget.arrivalDate && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Arrival</dt>
                  <dd className="text-gray-700">
                    {formatDate(viewTarget.arrivalDate)}
                    {viewTarget.arrivalFlightNo && ` · ${viewTarget.arrivalFlightNo}`}
                  </dd>
                </div>
              )}
              {viewTarget.departureDate && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Departure</dt>
                  <dd className="text-gray-700">
                    {formatDate(viewTarget.departureDate)}
                    {viewTarget.departureFlightNo && ` · ${viewTarget.departureFlightNo}`}
                  </dd>
                </div>
              )}
              {viewTarget.findingUs && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Heard About Us</dt>
                  <dd className="text-gray-700">{viewTarget.findingUs}</dd>
                </div>
              )}
              {viewTarget.specialRequirement && (
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-gray-400">Special Requirement</dt>
                  <dd className="whitespace-pre-line text-gray-700">{viewTarget.specialRequirement}</dd>
                </div>
              )}
            </dl>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">
                Travellers ({viewTarget.travellers.length})
              </h3>
              {viewTarget.travellers.length === 0 ? (
                <p className="text-sm text-gray-500">No traveller details submitted.</p>
              ) : (
                <ul className="space-y-2">
                  {viewTarget.travellers.map((t) => (
                    <li key={t.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{t.fullName}</span>
                        {t.isLead && <Badge label="Lead" variant="blue" size="sm" />}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {t.email} · {t.gender} · {t.nationality} ({t.countryCode})
                        {t.passportNo && ` · Passport ${t.passportNo}`}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
