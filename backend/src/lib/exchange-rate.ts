import { ApiError } from '../common/exceptions/api-error';

// Live USD→NPR from Nepal Rastra Bank's published forex rates. The bank's
// "sell" rate is used (what a customer pays to buy USD), cached for an hour
// and kept as a fallback if a later fetch fails.
const NRB_URL = 'https://www.nrb.org.np/api/forex/v1/rates';
const CACHE_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10000;
// A cached rate older than this isn't trusted as the fallback any more.
const MAX_STALE_MS = 3 * 24 * 60 * 60 * 1000;

interface NrbResponse {
  data?: {
    payload?: Array<{ rates?: Array<{ currency?: { iso3?: string; unit?: number }; sell?: string }> }>;
  };
}

let cached: { rate: number; fetchedAt: number } | null = null;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// One day per request: NRB intermittently drops multi-day range queries,
// but single-day ones are reliable. Starts at today and steps back for a
// day with no published rates yet (early morning, holidays).
async function fetchDayRate(day: Date): Promise<number | null> {
  const date = isoDate(day);
  const res = await fetch(`${NRB_URL}?page=1&per_page=1&from=${date}&to=${date}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`NRB responded ${res.status}`);

  const body = (await res.json()) as NrbResponse;
  const usd = body.data?.payload?.[0]?.rates?.find((r) => r.currency?.iso3 === 'USD');
  const rate = Number(usd?.sell) / (usd?.currency?.unit ?? 1);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

async function fetchRate(): Promise<number> {
  for (let back = 0; back < 4; back++) {
    const rate = await fetchDayRate(new Date(Date.now() - back * 24 * 60 * 60 * 1000));
    if (rate) return rate;
  }
  throw new Error('NRB has no recent USD rate');
}

export async function getUsdToNprRate(): Promise<number> {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_MS) return cached.rate;

  try {
    const rate = await fetchRate();
    cached = { rate, fetchedAt: now };
    return rate;
  } catch (err) {
    console.error('getUsdToNprRate: NRB fetch failed', err);
    if (cached && now - cached.fetchedAt < MAX_STALE_MS) return cached.rate;
    throw new ApiError(503, 'Exchange rate is unavailable right now, please try again shortly');
  }
}
