# Boundless Adventure — Public Frontend

Next.js (App Router) frontend for the Boundless Adventure redesign/migration.
This is the **foundation only** — folder structure, config layer, SEO/legacy-routing
scaffolding, and minimal neutral UI so the project runs and can be verified. It does
**not** implement the final Figma design, the backend, the database, or the admin panel.

- Public frontend: this app (Next.js, App Router, TypeScript)
- Backend: separate Express + Prisma API — see `../backend`
- Admin panel: separate Vite app — see `../frontend-admin`
- Database: PostgreSQL, owned entirely by the backend

## Stack

Next.js 16 (App Router, Turbopack by default), React 19, TypeScript (strict),
Tailwind CSS v4, ESLint, Vitest + Testing Library, Playwright.

## Getting started

```bash
cp .env.example .env.local   # fill in real values — see "Environment variables" below
npm install
npm run dev
```

## Scripts

| Script                | What it does                                  |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`           | Start the dev server                           |
| `npm run build`         | Production build                               |
| `npm run start`         | Run the production build                       |
| `npm run lint`          | ESLint                                         |
| `npm run typecheck`     | `tsc --noEmit`                                 |
| `npm test`              | Vitest — unit + integration tests, single run  |
| `npm run test:watch`    | Vitest in watch mode                           |
| `npm run test:e2e`      | Playwright E2E tests (see note below)          |

**Playwright browsers**: if `npm run test:e2e` fails with a missing-browser error, run
`npx playwright install --with-deps chromium` once. This wasn't run as part of scaffolding
this foundation — do it before relying on the E2E suite.

## Architecture

```
src/
  app/            Routing, layouts, route-level metadata, loading/error/not-found.
                  page.tsx files stay thin — composition only, no business logic.
  components/
    ui/           Generic, reusable primitives (Button, Container, ...). No feature logic.
    layout/       Global layout: Header, Footer, PageContainer.
    sections/     Composed homepage/page sections (Hero, Gallery, ...). No backend rules.
  features/       Domain code: api/ (fetchers), components/, schemas/, types/, utils/.
                  Only created for a domain once it has real content (see below).
  config/         site.ts, navigation.ts, social-links.ts, legacy-routes.ts.
  lib/
    api/          Typed fetch client for the Express API (api-client.ts, api-error.ts, api-response.ts).
    seo/          canonical.ts, metadata.ts, structured-data.ts, redirects.ts.
    env.ts        Environment variable validation.
    utils.ts      Small framework-agnostic helpers.
  types/          Shared types with no single feature home (api.types.ts, common.types.ts).
tests/
  integration/    React Testing Library tests (Vitest).
  e2e/            Playwright specs.
  setup.ts        Vitest setup (jest-dom matchers).
```

Rules this structure follows (see also inline comments throughout the code):

1. Server Components by default; `"use client"` only for genuine browser interaction.
2. `components/ui` primitives never own feature/business logic.
3. `components/sections` compose UI + feature components; they don't fetch or own
   business rules themselves — that belongs in `features/*/api`.
4. Feature-specific hooks/stores live inside their feature folder. `src/hooks` and
   `src/stores` are intentionally absent right now — nothing yet needs a hook or store
   shared across *unrelated* features, and this repo avoids empty folders kept "for
   symmetry." Add them the first time something genuinely needs to be global.
5. Unit tests are colocated with their module (`*.test.ts` next to the file). Integration
   and E2E tests live under the root `tests/`.

### Why only `features/trips` has an `api/`

`features/{trips,destinations,blogs,galleries,testimonials,enquiries}` all have a
`types/` file, grounded in the backend modules that best match each domain
(`package`, `place`, `blog`, testimonial/media, `contact-message` — see the comment
at the top of each `types/*.types.ts` file for the exact backend module and mount
path). Only `trips/api/get-trips.ts` exists beyond that, as a single worked example of
the `apiFetch` + cache-tag pattern other features should follow — it is **not** called
from any page yet. `components/sections/*` all render static placeholder content
rather than wire in real data, per this task's scope (foundation only, no guessed UI).
Wire a feature's `api/` + real section rendering together once its Figma design and
confirmed API contract exist.

## Environment variables

See `.env.example` for the full list with inline documentation. Summary:

| Variable                | Exposure     | Used for                                                        |
| ------------------------ | ------------ | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`   | Public       | This deploy's own origin — canonical URLs, OG/Twitter metadata   |
| `NEXT_PUBLIC_API_URL`    | Public       | Rare direct Client Component → API calls only                    |
| `NEXT_PUBLIC_APP_ENV`    | Public       | `development \| preview \| staging \| production` — drives robots/sitemap/canonical |
| `API_URL`                | Server-only  | Preferred base URL for Server Component / Route Handler fetches  |
| `REVALIDATION_SECRET`    | Server-only  | For the future cache-revalidation webhook (`app/api/revalidate`) |

`API_URL` vs `NEXT_PUBLIC_API_URL`: prefer `API_URL` for all Server Component/Route
Handler data fetching (`src/lib/api/api-client.ts` uses it exclusively, and is guarded
by the `server-only` package so it can't accidentally end up in the client bundle).
`NEXT_PUBLIC_API_URL` exists only for the rare case a Client Component must call the
API directly from the browser — prefer fetching in a Server Component and passing data
down as props instead.

Validation happens in `src/lib/env.ts` and throws with a clear message at startup if a
required variable is missing.

## SEO & legacy URL migration

**Critical constraint carried over from the old site**: the existing site's public URL
structure must be preserved wherever practical. This foundation does **not** invent or
finalize a new URL structure, because the audit inputs needed to do that safely weren't
available in this repo:

- `flamingo-base/routes/web.php` (the old Laravel app in this monorepo) only defines the
  admin/API surface — no public-facing route table to preserve.
- No legacy `sitemap.xml`, Search Console export, or public-site router config was
  present to audit.

See `src/config/legacy-routes.ts` for the full audit checklist and the typed
`LegacyRedirect` model this feeds into (via `src/lib/seo/redirects.ts` →
`next.config.ts`'s `redirects()`). It is intentionally empty — **do not add entries by
guessing**. Notably, the backend already has a database-backed mechanism for this at
scale (`backend/src/modules/redirect-manager`, public `GET /redirects/resolve?path=...`,
called by `src/proxy.ts` before page rendering). Redirect lookup has a strict timeout
and fails open, so an unavailable backend does not make the public site unavailable.
Prefer this database-backed path over growing the static array.

Until the audit happens, `src/config/navigation.ts`'s hrefs (`/trips`, `/destinations`,
etc.) are **provisional placeholders**, not a finalized structure — see that file's
header comment.

What *is* in place:

- `src/lib/seo/canonical.ts` — absolute/canonical URL helpers. Canonical tags and
  sitemap entries are only ever emitted in `NEXT_PUBLIC_APP_ENV=production`, so a
  staging/preview deploy can never point search engines at a non-production domain.
- `src/lib/seo/metadata.ts` — builds `Metadata` (title, description, canonical, OG,
  Twitter, robots) from a small, page-agnostic input shape compatible with future
  API-fetched content.
- `src/lib/seo/structured-data.ts` — JSON-LD helpers, with `serializeJsonLd` escaping
  `<` so values can't break out of the `<script>` tag.
- `src/app/robots.ts` / `src/app/sitemap.xml/route.ts` (+ one `<group>-sitemap.xml/route.ts` per content type, see `src/lib/seo/sitemap-groups.ts`) — environment-aware; all are effectively
  empty/disallow-all outside production.
- Legacy image/document URL handling — not configured (no `images.remotePatterns` in
  `next.config.ts`) since no legacy asset host has been confirmed. Add it once one is.
- Monitoring unresolved legacy URLs — `src/app/not-found.tsx` has a `TODO` marking
  where to log 404s once an analytics/error-tracking sink is chosen.

## Testing

- **Unit**: `src/lib/seo/canonical.test.ts`, `src/lib/api/api-error.test.ts` — colocated
  with the modules they test.
- **Integration**: `tests/integration/homepage.test.tsx` — renders the homepage and
  asserts the hero + all 8 section headings are present.
- **E2E**: `tests/e2e/homepage.spec.ts`, `tests/e2e/not-found.spec.ts` — smoke tests only.

Deliberately small: this is a foundation, not a feature to cover exhaustively.

## Dependencies and why each is here

Beyond the `create-next-app` baseline (`next`, `react`, `react-dom`, `typescript`,
`tailwindcss`, `eslint` + their type packages):

- **`server-only`** — the standard Next.js mechanism to make importing a server-only
  module (env secrets, the API client) from a Client Component fail the build instead of
  silently leaking into client JS. Directly required by "avoid exposing private
  environment variables to Client Components."
- **`vitest` + `@vitejs/plugin-react` + `jsdom`** — required test runner per the task spec.
- **`@testing-library/react` + `@testing-library/jest-dom`** — required to write the
  homepage integration test in a standard, accessible-query style.
- **`@playwright/test`** — required E2E runner per the task spec.

Explicitly **not** added, per project constraints, because nothing here needed them yet:
Zustand, TanStack Query, Axios, Zod, React Hook Form, a carousel library, an icon
library, an animation library. `src/lib/env.ts`'s validation and `src/lib/utils.ts`'s
`cn()` are hand-rolled for the same reason — the surface is small enough that a library
would add a dependency without adding real safety/capability over a few lines of code.

## Remaining decisions (explicitly not made here)

- **Legacy URL audit** — see "SEO & legacy URL migration" above. Blocks finalizing any
  route beyond `/`.
- **Mobile navigation** — `components/layout/Header` has no menu toggle yet; out of
  scope until the Figma header design exists (it's genuine client interaction, deferred
  rather than guessed).
- **`features/galleries`** — no confirmed backend module for "gallery" content was found
  (`backend/src/modules/media` exists but its public contract wasn't inspected); its
  `GalleryItem` type is a guess, flagged as such in the file.
- **Analytics / error-tracking sink** — not chosen yet; `src/app/not-found.tsx` and
  `src/app/error.tsx` mark where logging should hook in once one is.
- **Fonts** — no self-hosted fonts added yet (`public/fonts/` doesn't exist). Add via
  `next/font/local` when the Figma type spec is available.
- **Playwright browser installation** — not run in this environment; run
  `npx playwright install --with-deps chromium` before relying on `npm run test:e2e`.
