import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { formatMoney } from "@/components/b2b/b2b-helpers";
import { useCatalog } from "@/hooks/queries/useB2B";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import type { RateSummary } from "@/types/b2b";

function RateLine({ rate }: { rate: RateSummary }) {
  const net = rate.rateType === "NET";
  return (
    <div className="text-sm">
      <p className="text-gray-900">
        <span className="text-xs uppercase tracking-wide text-gray-500">{net ? "Net from" : "List from"}</span>{" "}
        <span className="text-lg font-semibold">{formatMoney(rate.unitPrice, rate.currency)}</span>
        <span className="text-gray-500"> / person</span>
      </p>
      {!net && rate.commissionPct && <p className="text-xs text-green-700">Earn {Number(rate.commissionPct)}% commission</p>}
    </div>
  );
}

export default function PartnerCatalogPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const { data, isLoading, isError, error } = useCatalog({ page, perPage: 12, q: q || undefined });
  const items = data?.data.items ?? [];
  const meta = data?.data.meta;

  return (
    <div>
      <PageHeader title="Package catalog" />
      <div className="mb-4 max-w-md">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search packages…" />
      </div>
      {isError && <Alert variant="error" message={getErrorMessage(error)} />}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Link key={p.id} to={PATHS.PARTNER_PACKAGE(p.id)} className="block">
              <PageCard className="h-full transition-shadow hover:shadow-lg">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900">{p.title}</h2>
                  {p.hasContract && <Badge label="Contract rate" variant="purple" size="sm" />}
                </div>
                <p className="mb-3 text-xs text-gray-500">{Number(p.duration)} {p.durationType}{p.groupSize ? ` · group ${p.groupSize}` : ""}</p>
                <RateLine rate={p.rate} />
                <div className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-600">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {p.nextDeparture ? (
                    <span>
                      Next {formatDate(p.nextDeparture.departureDate)} · {p.upcomingDepartures} upcoming
                      {p.nextDeparture.availability.available !== null && ` · ${p.nextDeparture.availability.available} seats`}
                    </span>
                  ) : (
                    <span>No upcoming departures</span>
                  )}
                </div>
              </PageCard>
            </Link>
          ))}
          {items.length === 0 && <p className="text-sm text-gray-500">No packages found.</p>}
        </div>
      )}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4"><Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} /></div>
      )}
    </div>
  );
}
