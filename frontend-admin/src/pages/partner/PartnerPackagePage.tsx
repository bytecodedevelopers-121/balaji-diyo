import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { QuoteHoldPanel } from "@/components/b2b/QuoteHoldPanel";
import { formatMoney } from "@/components/b2b/b2b-helpers";
import { useCatalogPackage } from "@/hooks/queries/useB2B";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";

export default function PartnerPackagePage() {
  const { id = "" } = useParams();
  const { data, isLoading, isError, error } = useCatalogPackage(id);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (isError || !data) return <Alert variant="error" message={getErrorMessage(error)} />;
  const p = data.data;

  return (
    <div className="space-y-6">
      <PageHeader title={p.title} backHref={PATHS.PARTNER_CATALOG} breadcrumbs={[{ label: "Catalog", href: PATHS.PARTNER_CATALOG }, { label: p.title }]} />
      {p.abstract && <p className="max-w-3xl text-sm text-gray-700">{p.abstract}</p>}

      {p.contracts.length > 0 && (
        <PageCard>
          <h2 className="mb-2 font-semibold text-gray-900">Your contract</h2>
          {p.contracts.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
              <Badge label={c.rateType === "NET" ? "Net rate" : "Commissionable"} variant="purple" size="sm" />
              {c.rateType === "NET" && c.netUnitPrice && <span>Net {formatMoney(c.netUnitPrice, "USD")} / person</span>}
              {c.rateType === "COMMISSIONABLE" && <span>{Number(c.commissionPct ?? p.tier.defaultCommissionPct)}% commission</span>}
              <span>Valid {formatDate(c.validFrom)} – {formatDate(c.validTo)}</span>
              {(c.minPax || c.maxPax) && <span>{c.minPax ?? 1}–{c.maxPax ?? "∞"} travellers</span>}
              <span>Cut-off {c.cutoffHours}h before departure</span>
              {c.blackoutDates.length > 0 && <span className="text-red-600">Blackout: {c.blackoutDates.map((b) => `${b.start}→${b.end}`).join(", ")}</span>}
            </div>
          ))}
        </PageCard>
      )}

      <PageCard>
        <h2 className="mb-3 font-semibold text-gray-900">Departures</h2>
        {p.departures.length === 0 ? <p className="text-sm text-gray-500">No upcoming departures.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr className="text-xs uppercase tracking-wide text-gray-500"><th className="py-2">Date</th><th>Status</th><th>Rate / person</th><th>Seats</th><th>Cut-off</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {p.departures.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2 font-medium text-gray-900">{formatDate(d.departureDate)}</td>
                    <td><Badge label={d.bookable ? "Bookable" : "Unavailable"} variant={d.bookable ? "green" : "gray"} size="sm" /></td>
                    <td>{formatMoney(d.rate.unitPrice, d.rate.currency)} <span className="text-xs text-gray-500">{d.rate.rateType === "NET" ? "net" : `list · ${Number(d.rate.commissionPct ?? 0)}% comm.`}</span></td>
                    <td>{d.availability.available === null ? "—" : d.availability.available}{d.availability.source === "ALLOTMENT" && <span className="ml-1 text-xs text-purple-700">(your allotment)</span>}</td>
                    <td className="text-gray-600">{d.cutoffAt ? formatDate(d.cutoffAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>

      {p.departures.length > 0 && <QuoteHoldPanel packageId={p.id} departures={p.departures} />}
    </div>
  );
}
