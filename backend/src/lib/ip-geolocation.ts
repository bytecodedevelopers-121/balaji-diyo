export interface IpGeolocation {
  country: string;
  countryCode: string;
}

const IPWHOIS_ENDPOINT = 'https://ipwho.is';

/**
 * Best-effort "which country did this request come from" lookup, backed
 * by ipwho.is (free, HTTPS, no API key/rate-limit config needed). Used
 * for the contact-message admin alert email (direct client request
 * 2026-09-07) — distinct from the visitor-picked "Your Country" field
 * on the form itself, which is already free text.
 *
 * Returns `null` — never throws — for anything that isn't a clean
 * lookup: no IP (e.g. behind a proxy that stripped it), a private/local
 * one (every local-dev submission is `::1`/`127.0.0.1`, which ipwho.is
 * can't resolve), a timeout, or the service being down. Same
 * "enrichment must never fail the write it's attached to" shape as
 * `sendMail`/`revalidateFrontendTags` — callers can treat a `null`
 * exactly like "we don't know", not an error to handle.
 */
export async function lookupIpGeolocation(ip: string | undefined | null): Promise<IpGeolocation | null> {
  if (!ip) return null;

  try {
    const response = await fetch(`${IPWHOIS_ENDPOINT}/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { success?: boolean; country?: string; country_code?: string };
    if (!data.success || !data.country || !data.country_code) return null;

    return { country: data.country, countryCode: data.country_code };
  } catch (err) {
    console.error('lookupIpGeolocation: request failed', { ip, err });
    return null;
  }
}
