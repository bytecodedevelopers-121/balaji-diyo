import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RedirectRecord = {
  destination: string;
  isPermanent: boolean;
};

type ApiEnvelope = {
  status?: unknown;
  data?: unknown;
};

const LOOKUP_TIMEOUT_MS = 250;

function parseRedirectRecord(value: unknown): RedirectRecord | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<RedirectRecord>;
  if (
    typeof candidate.destination !== "string" ||
    typeof candidate.isPermanent !== "boolean"
  ) {
    return null;
  }

  return {
    destination: candidate.destination,
    isPermanent: candidate.isPermanent,
  };
}

function buildDestination(request: NextRequest, destination: string): URL | null {
  try {
    // Protocol-relative targets are deliberately forbidden: treating `//host`
    // as an internal path would create an admin-controlled open redirect.
    if (destination.startsWith("//")) return null;

    const url = new URL(destination, request.nextUrl.origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;

    // Preserve inbound query values unless the configured destination has
    // explicitly overridden that key.
    for (const [key, value] of request.nextUrl.searchParams) {
      if (!url.searchParams.has(key)) url.searchParams.append(key, value);
    }

    if (url.href === request.nextUrl.href) return null;
    return url;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const apiUrl = process.env.API_URL?.replace(/\/+$/, "");
  if (!apiUrl) return NextResponse.next();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const lookupUrl = new URL(`${apiUrl}/redirects/resolve`);
    lookupUrl.searchParams.set("path", request.nextUrl.pathname);

    const response = await fetch(lookupUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) return NextResponse.next();

    const envelope = (await response.json()) as ApiEnvelope;
    if (envelope.status !== "success") return NextResponse.next();

    const redirect = parseRedirectRecord(envelope.data);
    if (!redirect) return NextResponse.next();

    const destination = buildDestination(request, redirect.destination);
    if (!destination) return NextResponse.next();

    return NextResponse.redirect(destination, redirect.isPermanent ? 308 : 307);
  } catch {
    // Redirect lookup is an enhancement. An API timeout or outage must never
    // make the public website unavailable.
    return NextResponse.next();
  } finally {
    clearTimeout(timeout);
  }
}

export const config = {
  matcher: [
    // Keep API calls, Next internals, uploaded/static assets, and metadata off
    // the redirect lookup path. `.html` is intentionally not excluded because
    // it is a common legacy URL suffix that may need redirecting.
    "/((?!api|_next/static|_next/image|files|favicon\\.ico|robots\\.txt|sitemap\\.xml|site\\.webmanifest|.*\\.(?:avif|css|gif|ico|jpe?g|js|json|map|mp4|pdf|png|svg|webm|webp|woff2?|xml)$).*)",
  ],
};
