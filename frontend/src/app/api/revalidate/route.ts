import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";

/**
 * On-demand cache-invalidation webhook — the first Route Handler in this
 * repo. `src/lib/env.ts`'s `REVALIDATION_SECRET` comment ("for the
 * future cache-revalidation webhook (app/api/revalidate)") describes
 * exactly this route. Called by the backend's
 * `lib/revalidate-frontend.ts` right after a content mutation (team
 * members today — see `TeamMemberService`'s create/update/remove), so
 * `next: { revalidate }`-cached fetches (see e.g.
 * features/team/api/get-team-members.ts) refresh immediately instead of
 * waiting out their time-based `revalidate` window.
 *
 * Auth is a single shared secret in the `x-revalidate-secret` header —
 * this endpoint is unauthenticated otherwise (it has to be reachable
 * from the backend, which has no user session), so the secret is the
 * only thing standing between it and anyone who can guess the URL.
 *
 * `tags` alone was the whole story here until a real repro showed it
 * wasn't enough: deleting a blog post in admin (blog.service.ts's
 * `remove`) left the *exact same* stale 200 rendering on the public
 * `/blog/<slug>` page indefinitely — confirmed live (`x-nextjs-cache:
 * HIT`, `x-nextjs-prerender: 1` on that response, even immediately
 * after a manually-triggered revalidateTag call with an explicit
 * `{ expire: 0 }` immediate profile, and even after confirming via a
 * temporary response marker that the edited route code was really the
 * one running — ruling out stale-compiled-code as the explanation).
 * `revalidateTag` only busts the *data* fetch cache; a page pre-rendered
 * via `generateStaticParams` (as `/blog/[slug]` is) has its own,
 * separately-cached HTML output keyed by *path*, which per Next's own
 * docs (`revalidatePath`'s "Relationship with revalidateTag" section)
 * needs `revalidatePath` too — the two are described there as
 * "complementary primitives... often used together". So this route now
 * takes an optional `paths` alongside `tags`, and callers should pass
 * both: the tag(s) so every page sharing that fetched data goes stale,
 * and the real path(s) so a page that was already statically prerendered
 * gets its own cached HTML thrown away, not just the data behind it.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { REVALIDATION_SECRET } = getServerEnv();
  const providedSecret = request.headers.get("x-revalidate-secret");

  if (!providedSecret || providedSecret !== REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const tags = Array.isArray(record.tags)
    ? record.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const paths = Array.isArray(record.paths)
    ? record.paths.filter((path): path is string => typeof path === "string")
    : [];

  if (tags.length === 0 && paths.length === 0) {
    return NextResponse.json(
      { error: "Expected a { tags?: string[], paths?: string[] } body with at least one of the two non-empty" },
      { status: 400 },
    );
  }

  // Next 16 deprecated the single-argument revalidateTag(tag) (it type-
  // errors here) in favor of a required second `profile` argument.
  // `{ expire: 0 }` (immediate expiry — the next request is a blocking
  // revalidate), not `"max"` (stale-while-revalidate — serves the old
  // page once more first) — the docs call this route's exact shape out
  // by name: "For webhooks or third-party services that need immediate
  // expiration... necessary when external systems call your Route
  // Handlers", which is exactly what the backend is here. See
  // next/dist/docs/.../functions/revalidateTag.md.
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }
  // Literal paths only (no dynamic-segment `type` param) — callers pass
  // the real, resolved URL (e.g. `/blog/my-post`, not `/blog/[slug]`).
  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true, tags, paths });
}
