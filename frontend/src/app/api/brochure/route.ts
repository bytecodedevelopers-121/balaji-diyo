import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import sharp from "sharp";
import type { PackageDetail } from "@/app/[slug]/data";
import { getPackageBySlug } from "@/features/trips/api/get-package-by-slug";
import { BrochureDocument } from "./BrochureDocument";

/**
 * Trip brochure PDF, generated on request — the frontend counterpart to
 * TripHeader's "Download PDF" button (`DownloadPdfButton.tsx`).
 *
 * Reverse-engineered from the live production site's own `/api/brochure`
 * (see `BrochureDocument.tsx`'s doc comment): same request shape
 * (`POST { slug }`), same response contract (`application/pdf`,
 * `Content-Disposition: attachment`), same underlying library
 * (`@react-pdf/renderer`, confirmed by that PDF's own `/Producer`
 * metadata). Runs in the Node.js runtime (not Edge) because
 * `@react-pdf/renderer` needs Node's `Buffer`/stream APIs.
 *
 * Deliberately reuses `getPackageBySlug` — the same fetch the `/<slug>`
 * page itself calls — so the brochure always reflects the same data
 * (and the same 15-minute `next: revalidate` cache) as the page a
 * visitor is looking at when they click the button, with no separate
 * "brochure data" to fall out of sync.
 */
export const runtime = "nodejs";

/**
 * @react-pdf/renderer's <Image> only decodes JPG/PNG, but new admin uploads
 * are stored as WebP (see backend/src/lib/imageProcessor.ts). Any .webp URL
 * is fetched and re-encoded to a JPEG data URI so it embeds; other URLs
 * (legacy .jpg, static assets) pass through untouched. A failed fetch/convert
 * returns the original URL — same behaviour as before for that image.
 */
async function toPdfSafeUrl(url: string): Promise<string> {
  if (!/\.webp(\?|$)/i.test(url)) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .jpeg({ quality: 85 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return url;
  }
}

async function withPdfSafeImages(trip: PackageDetail): Promise<PackageDetail> {
  return {
    ...trip,
    heroImages: await Promise.all(trip.heroImages.map(toPdfSafeUrl)),
    detailedItinerary: await Promise.all(
      trip.detailedItinerary.map(async (leg) => ({
        ...leg,
        days: await Promise.all(
          leg.days.map(async (day) => ({
            ...day,
            photos: day.photos
              ? await Promise.all(day.photos.map(async (p) => ({ ...p, url: await toPdfSafeUrl(p.url) })))
              : day.photos,
          })),
        ),
      })),
    ),
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug =
    body && typeof body === "object" && "slug" in body && typeof (body as { slug: unknown }).slug === "string"
      ? (body as { slug: string }).slug
      : null;

  if (!slug) {
    return NextResponse.json({ error: "Expected a { slug: string } body" }, { status: 400 });
  }

  const trip = await getPackageBySlug(slug);
  if (!trip) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const pdfBuffer = await renderToBuffer(BrochureDocument({ trip: await withPdfSafeImages(trip) }));

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}-brochure.pdf"`,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
