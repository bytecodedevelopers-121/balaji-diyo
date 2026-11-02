// One-time content-curation script for the `main_menu`/`footer_menu`
// `MenuItem` trees — see frontend's `features/navigation/lib/
// build-navigation.ts` for what actually consumes this data (the public
// site's header/footer nav, via `GET /menu-items/tree/by-key/:key`).
//
// The legacy import (scripts/legacy-import/phases/01-taxonomy.ts) already
// migrated real `base_menu_items` rows into these two types, but that's
// the *old* site's own raw ~830/146-item mega-menu/sitemap — unrelated in
// shape to the new Figma-curated header (Destination/About dropdowns +
// Contact) and footer (3 clean columns). Rather than trying to prune that
// legacy tree into shape, this:
//   1. Bulk-deactivates every existing item under both types (kept, not
//      deleted — the public tree endpoint filters `isActive: true`).
//   2. Creates a small, fresh, curated tree per type that reproduces
//      `frontend/src/config/navigation.ts`'s static content 1:1, reusing
//      every href already confirmed real in that file's own doc comments.
//
// Run with:
//   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-curated-navigation.ts
//
// Each run PERMANENTLY DELETES whatever's currently active under
// `main_menu`/`footer_menu` — on any target — before creating the fresh
// curated set below. What that means in practice depends on the target
// database's own history:
//   - On this repo's dev DB (already run here before): the raw
//     legacy-imported rows are already deactivated, so the delete only
//     ever removes this same script's own previous run — re-running
//     replaces rather than accumulates, and the legacy rows stay as an
//     inactive historical archive.
//   - On a target that's never had this script run against it (e.g.
//     production, still on the raw legacy import with everything
//     active): the delete removes the ENTIRE active legacy tree
//     (~830/146 items), not just a prior curated generation — this is
//     intentional, confirmed safe by a byte-for-byte diff against this
//     dev DB's own active tree before enabling it there, and is exactly
//     how this script is meant to be pointed at a fresh target: delete
//     whatever's currently live, replace it with this exact curated set.
// Always back up `menu_items`/`menu_types` before running this against
// a database you can't just re-seed from scratch.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface SeedNode {
  label: string;
  /** No leading slash — matches `urlSegment`'s stored form; the
   *  frontend's `menuNodeHref()` adds it back. Container nodes that are
   *  never themselves clickable (e.g. "Destination", a footer column
   *  title) still get a real slug for data hygiene, even though nothing
   *  reads it. */
  urlSegment: string;
  children?: SeedNode[];
}

// Same TREKKING_REGION_HREF_BY_TITLE mapping as navigation.ts. Unlike
// the package slugs below, these 4 region-overview pages come from a
// separate, already-verified mechanism (features/trekking-regions'
// own TREKKING_REGION_SLUGS, a Category-browse route, not `Package`/
// `url_infos`) — not touched by the `slugify()` bug this file's own
// history section explains.
const REGION_SLUG: Record<string, string> = {
  'EVEREST REGION': 'everest-region-treks',
  'ANNAPURNA REGION': 'annapurna-region-treks',
  'LANGTANG REGION': 'langtang-region-treks',
  'RESTRICTED AREA TREKKING': 'restricted-area-trekking',
};

/**
 * A trekking region (Everest/Annapurna/Langtang/Restricted Area) +
 * its packages. `packages` pairs are `[label, urlSegment]` — every
 * `urlSegment` here is a real, verified `Package`/`url_infos` slug, not
 * derived by slugifying the label (see this file's own history section:
 * an earlier pass used `label.toLowerCase().replace(...)` for these,
 * which silently produced 14 broken links out of 20 — e.g. "Everest
 * Base Camp Trek" slugified to `everest-base-camp-trek`, but the real
 * page is `everest-base-camp-trekking`).
 */
function region(title: string, packages: [label: string, urlSegment: string][]): SeedNode {
  return {
    label: title,
    urlSegment: REGION_SLUG[title]!,
    children: packages.map(([label, urlSegment]) => ({ label, urlSegment })),
  };
}

/**
 * A destination category whose real content is just a flat list of tour
 * packages (Tibet, Bhutan; also used for Nepal's non-region categories
 * below) rather than region-grouped like Nepal's "Trekking Routes" —
 * still wrapped in one sub-category + one sub-sub-category so it reaches
 * the same nesting depth `DestinationDropdown.tsx` needs to show real
 * links in its content column. `packages` pairs are `[label,
 * urlSegment]`, every `urlSegment` a real, verified `Package`/
 * `url_infos` slug (see `region()`'s own comment on why that matters).
 */
function flatCategory(
  subCategoryLabel: string,
  urlSegment: string,
  subSubCategoryTitle: string,
  packages: [label: string, urlSegment: string][],
): SeedNode {
  return {
    label: subCategoryLabel,
    urlSegment,
    children: [
      {
        label: subSubCategoryTitle,
        urlSegment,
        children: packages.map(([label, slug]) => ({ label, urlSegment: slug })),
      },
    ],
  };
}

/** Same shape as `flatCategory`, one level up — a whole category
 *  (Tibet, Bhutan) whose only sub-category is "Tours". */
function tourCountry(
  country: string,
  urlSegment: string,
  packages: [label: string, urlSegment: string][],
): SeedNode {
  return {
    label: country,
    urlSegment,
    children: [flatCategory('Tours', urlSegment, `${country.toUpperCase()} TOURS`, packages)],
  };
}

const MAIN_MENU: SeedNode[] = [
  {
    label: 'Destination',
    urlSegment: 'destinations',
    children: [
      {
        label: 'Nepal',
        urlSegment: 'nepal',
        children: [
          {
            label: 'Trekking Routes',
            urlSegment: 'trekking-routes-in-nepal',
            children: [
              region('EVEREST REGION', [
                ['Everest Base Camp Trek', 'everest-base-camp-trekking'],
                ['Everest Base Camp Trek with Helicopter Return', 'everest-base-camp-trek-with-helicopter-return'],
                ['Everest Base Camp Helicopter Tour', 'everest-base-camp-helicopter-tour'],
                ['Everest Three High Passes Trekking', 'everest-three-high-passes-trekking'],
                ['Jiri to Everest Base Camp Trek', 'jiri-to-everest-base-camp-trekking'],
                ['Gokyo Valley Trekking', 'gokyo-valley-trekking'],
                ['Renjo-La Pass Trekking', 'renjo-la-pass-trekking'],
              ]),
              region('ANNAPURNA REGION', [
                ['Mardi Himal Trek', 'mardi-himal-trekking'],
                ['Annapurna Circuit Trek', 'annapurna-circuit-trekking'],
                ['Annapurna Base Camp', 'annapurna-base-camp-trek'],
                ['Mesokanto Pass Trek', 'mesokanto-pass-trekking'],
                ['Upper Mustang Trek', 'upper-mustang-trekking'],
                ['Ghorepani Poon Hill Trek', 'ghorepani-poon-hill-trekking'],
                ['Jomsom Muktinath Trek', 'jomsom-muktinath-trekking'],
              ]),
              region('LANGTANG REGION', [
                // Both labels corrected (2026-08-25) to their real
                // Package titles — "Lantang"/"Gosaikunda" were typos
                // that happened to also break the slugify()-derived
                // hrefs; see this file's own history section.
                ['Langtang Valley Trek', 'langtang-valley-trekking'],
                ['Gosainkunda Helicopter Tour', 'gosainkunda-helicopter-tour'],
                ['Ganesh Himal Trek', 'ganesh-himal-trekking'],
              ]),
              region('RESTRICTED AREA TREKKING', [
                ['Tsum Valley Trek', 'tsum-valley-trekking'],
                ['Manaslu Circuit Trek', 'manaslu-circuit-trek'],
                ['Kanchenjunga Base Camp Trek', 'kanchenjunga-base-camp-trekking'],
              ]),
            ],
          },
          // Real content (2026-08-25, direct from the user — "nepal
          // tours nepal peak climbing nepal short treks etc are there
          // but ... not completely displayed"): each of these existed
          // as its own separate top-level legacy root ("Nepal Peak
          // Climbing Packages" etc., not nested under "Nepal" at all),
          // deduplicated and re-verified against `packages`/`url_infos`
          // here rather than left removed. One item ("Koshi Tappu
          // Wildlife Reserve") was cross-filed under the legacy "Nepal
          // Peak Climbing Packages" root too — dropped from here, kept
          // only under "Wildlife Safari Tours" where it actually
          // belongs.
          flatCategory('Tours', 'nepal-tours', 'NEPAL TOUR PACKAGES', [
            ['Upper Mustang Jeep Tour', 'upper-mustang-jeep-tour'],
            ['Chitwan Jungle Safari Tour', 'chitwan-jungle-safari-tour'],
            ['Nepal Heritage Tour', 'nepal-heritage-tour'],
            ['Pokhara Tour', 'pokhara-tour'],
            ['Kathmandu Pokhara Chitwan Tour', 'kathmandu-pokhara-chitwan-tour'],
            ['Nepal Pilgrimage Tour', 'nepal-pilgrimage-tour'],
            ['Bardiya National Park', 'bardiya-national-park'],
            ['Bhaktapur Durbar Square Tour', 'bhaktapur-durbar-square-tour'],
            ['Kakani Day Tour', 'kakani-day-tour'],
            ['Kathmandu Nagarkot Pokhara Budget Tour', 'kathmandu-nagarkot-pokhara-budget-tour'],
            ['Kathmandu Pokhara Chitwan Lumbini Tour', 'kathmandu-pokhara-chitwan-lumbini-tour'],
            ['Kathmandu Pokhara Lumbini Tour', 'kathmandu-pokhara-lumbini-tour'],
            ['Kathmandu Tour', 'kathmandu-tour'],
            ['Lumbini Tour', 'lumbini-tour'],
            ['Manang Jeep Tour', 'manang-jeep-tour'],
            ['Manaslu Helicopter Tour', 'manaslu-helicopter-tour'],
            ['Mt. Kailash Tour', 'mt-kailash-tour'],
            ['Muktinath Helicopter Tour', 'muktinath-helicopter-tour'],
            ['Muktinath Temple Tour by Jeep', 'muktinath-temple-tour-by-jeep'],
            ['Nagarkot Tour', 'nagarkot-tour'],
            ['Namo Buddha Tour', 'namo-buddha-tour'],
            ['Nepal Accessible Wheelchair Tour', 'nepal-accessible-wheelchair-tour'],
            ['Nepal Bhutan Tour', 'nepal-bhutan-tour'],
            ['Nepal Buddhist Tour', 'nepal-buddhist-tour'],
            ['Nepal Hunting Reserve', 'nepal-hunting-reserve'],
            ['Nepal Mountain Everest Flight', 'nepal-mountain-flight'],
            ['Nepal Muslim Travel and Tours', 'nepal-muslim-travel-and-tours'],
            ['Nepal Paragliding and Ultralight Tour', 'nepal-paragliding-and-ultralight-tour'],
            ['Nepal Pattale Forest Day Tour', 'nepal-pattale-forest-day-tour'],
            ['Patan Durbar Square Tour', 'patan-durbar-square-tour'],
            ['Upper Mustang Helicopter Tour', 'upper-mustang-helicopter-tour'],
          ]),
          flatCategory('Peak Climbing', 'nepal-peak-climbing', 'PEAK CLIMBING PACKAGES', [
            ['Mera Peak Climbing', 'mera-peak-climbing'],
            ['Island Peak Climbing', 'island-peak-climbing'],
            ['Chulu East Peak Climbing', 'chulu-east-peak-climbing'],
            ['Chulu West Peak Climbing', 'chulu-west-peak-climbing'],
            ['Lobuche Peak Climbing', 'lobuche-peak-climbing'],
            ['Naya Kanga Peak Climbing', 'naya-kanga-peak-climbing'],
            ['Tent Peak Climbing', 'tent-peak-climbing'],
            ['Yala Peak Climbing', 'yala-peak-climbing'],
          ]),
          flatCategory('Short Trek', 'nepal-short-treks', 'SHORT TREK PACKAGES', [
            ['Everest Family Trekking', 'everest-family-trekking'],
            ['Short Everest Base Camp Trek', 'short-everest-base-camp-trek'],
            ['Short Annapurna Base Camp Trek', 'short-annapurna-base-camp-trek'],
            ['Annapurna Family Trekking', 'annapurna-family-trekking'],
            ['Annapurna Luxury Trekking', 'annapurna-luxury-trekking'],
            ['Chisapani Trekking', 'chisapani-trekking'],
            ['Short Annapurna Trekking Trails', 'short-annapurna-trekking-trails'],
            ['Tamang Heritage Trekking', 'tamang-heritage-trekking'],
          ]),
          flatCategory('Day Tours', 'nepal-day-tours', 'DAY TOUR PACKAGES', [
            ['Kakani Day Tour', 'kakani-day-tour'],
            ['Nepal Pattale Forest Day Tour', 'nepal-pattale-forest-day-tour'],
          ]),
          flatCategory('Wildlife Safari Tours', 'nepal-wildlife-safari-tours', 'WILDLIFE SAFARI PACKAGES', [
            ['Chitwan Jungle Safari Tour', 'chitwan-jungle-safari-tour'],
            ['Bardiya National Park', 'bardiya-national-park'],
            ['Koshi Tappu Wildlife Reserve', 'koshi-tappu-wildlife-reserve'],
            ['Nepal Hunting Reserve', 'nepal-hunting-reserve'],
          ]),
          flatCategory('Helicopter Tours', 'nepal-helicopter-tours', 'HELICOPTER TOUR PACKAGES', [
            ['Everest Base Camp Trek with Helicopter Return', 'everest-base-camp-trek-with-helicopter-return'],
            ['Everest Base Camp Helicopter Tour', 'everest-base-camp-helicopter-tour'],
            ['Annapurna Base Camp Helicopter Tour', 'annapurna-base-camp-helicopter-tour'],
            ['Gosainkunda Helicopter Tour', 'gosainkunda-helicopter-tour'],
            ['Langtang Helicopter Tour', 'langtang-helicopter-tour'],
            ['Manaslu Helicopter Tour', 'manaslu-helicopter-tour'],
            ['Muktinath Helicopter Tour', 'muktinath-helicopter-tour'],
            ['Upper Mustang Helicopter Tour', 'upper-mustang-helicopter-tour'],
          ]),
        ],
      },
      // Tibet/Bhutan real content (2026-08-25, direct from the user —
      // "in admin panel there is data ... but in UI it displayed as
      // coming soon"): both have real children in the legacy
      // `main_menu` tree (as flat tour packages, not region-grouped
      // like Nepal's "Trekking Routes"), confirmed against this repo's
      // own migrated `packages`/`url_infos`. Wrapped in a single
      // "Tours" sub-category + one sub-sub-category (this taxonomy's
      // minimum nesting to reach the panel's real-links tier) rather
      // than left as empty stubs.
      tourCountry('Tibet', 'tibet-tours', [
        ['Mt. Kailash Tour', 'mt-kailash-tour'],
        ['Tibet Culture Tours', 'tibet-culture-tours'],
        ['Lhasa Cultural Tour', 'lhasa-cultural-tour'],
      ]),
      tourCountry('Bhutan', 'bhutan-tours', [
        ['Nepal Bhutan Tour', 'nepal-bhutan-tour'],
        ['Bhutan Culture Tour', 'bhutan-culture-tour'],
        ['Bhutan Trekking', 'bhutan-trekking'],
      ]),
    ],
  },
  {
    label: 'About',
    urlSegment: 'about-us',
    children: [
      {
        label: 'Our Company',
        urlSegment: 'our-company',
        children: [
          { label: 'Why Boundless Adventure', urlSegment: 'why-boundless-adventure' },
          { label: 'About Us', urlSegment: 'about-us' },
          { label: 'Our Team', urlSegment: 'team' },
        ],
      },
      {
        label: 'Useful Links',
        urlSegment: 'useful-links',
        children: [
          { label: 'Company Documents', urlSegment: 'company-documents' },
          { label: 'Responsible Tourism', urlSegment: 'responsible-tourism' },
          // Label corrected 2026-08-25: was "Banking Terms & Conditions",
          // flagged ambiguous at the time (no real source confirmed which
          // of two Figma-screenshot labels was right). The real legacy
          // "Company Profile" footer root (same href) settles it —
          // "Booking Terms and Conditions", verbatim.
          { label: 'Booking Terms and Conditions', urlSegment: 'booking-terms-and-conditions' },
          { label: 'Last Minute Trip Deals', urlSegment: 'last-minute-trip-deals' },
        ],
      },
    ],
  },
  { label: 'Contact', urlSegment: 'contact' },
];

const FOOTER_MENU: SeedNode[] = [
  {
    label: 'Quick Links',
    urlSegment: 'quick-links',
    children: [
      { label: 'About Us', urlSegment: 'about-us' },
      { label: 'Why Boundless Adventure', urlSegment: 'why-boundless-adventure' },
      { label: 'Company Documents', urlSegment: 'company-documents' },
      { label: 'Banking Details', urlSegment: 'banking-details' },
      { label: 'Customize Trip', urlSegment: 'customize-trip' },
      { label: 'Contact Us', urlSegment: 'contact' },
      // Added 2026-08-25: found in the real legacy footer "Quick Links"
      // root (this column's own real source) — a genuine gap, not
      // linked from anywhere in the curated content until now. Real
      // page, confirmed against `url_infos` (ownerType "page").
      { label: 'Volunteering in Nepal', urlSegment: 'volunteering-in-nepal' },
    ],
  },
  {
    label: 'Top 7 Treks',
    urlSegment: 'top-7-treks',
    // Real slugs — was already fixed once (2026-08-25) from a
    // `/trips/<slug>` guess to the flat namespace, but the *set* of 6
    // packages itself was still a Figma-screenshot guess. Corrected
    // again the same day against the real legacy footer root this
    // column actually comes from — "🔥 Best Seller Treks" (8 real
    // packages, trimmed to the 7 the footer shows) — which doesn't include "Annapurna Circuit Trek" at
    // all (dropped) and does include 3 the guess had missed: "Annapurna
    // Base Camp Trek", "Everest Base Camp Helicopter Tour", "Langtang
    // Valley Trekking".
    children: [
      { label: 'Annapurna Base Camp Trek', urlSegment: 'annapurna-base-camp-trek' },
      { label: 'Everest Base Camp Helicopter Tour', urlSegment: 'everest-base-camp-helicopter-tour' },
      { label: 'Everest Base Camp Trek', urlSegment: 'everest-base-camp-trekking' },
      { label: 'Manaslu Circuit Trek', urlSegment: 'manaslu-circuit-trek' },
      { label: 'Upper Mustang Jeep Tour', urlSegment: 'upper-mustang-jeep-tour' },
      { label: 'Langtang Valley Trekking', urlSegment: 'langtang-valley-trekking' },
      { label: 'Upper Mustang Trek', urlSegment: 'upper-mustang-trekking' },
    ],
  },
  {
    label: 'Useful Links',
    urlSegment: 'useful-links',
    children: [
      { label: 'Travel Blog', urlSegment: 'blog' },
      { label: 'Trekking Routes Map', urlSegment: 'trekking-routes-map-of-nepal' },
      { label: 'Testimonials', urlSegment: 'reviews' },
      { label: 'Privacy Policy', urlSegment: 'privacy-policy' },
      { label: 'Terms of Conditions', urlSegment: 'booking-terms-and-conditions' },
      { label: 'Compare Itineraries', urlSegment: 'compare-itineraries' },
    ],
  },
];

async function createTree(nodes: SeedNode[], typeId: string, parentId: string | null): Promise<number> {
  let count = 0;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const created = await prisma.menuItem.create({
      data: {
        label: node.label,
        itemOrder: i + 1,
        isExternal: false,
        urlSegment: node.urlSegment,
        typeId,
        parentId,
      },
    });
    count += 1;
    if (node.children?.length) {
      count += await createTree(node.children, typeId, created.id);
    }
  }
  return count;
}

/** Deletes every currently-active item under `typeId`, leaves first
 *  (repeatedly deletes active rows with no remaining active children) so
 *  the self-referential parentId FK is never violated. This only ever
 *  touches rows this same script created and activated on a previous
 *  run — the original legacy-imported rows were deactivated (not
 *  deleted) once, up front, and never touched again, since this only
 *  looks at `isActive: true` rows. */
async function deleteActiveTree(typeId: string): Promise<number> {
  let totalDeleted = 0;
  for (;;) {
    const leaves = await prisma.menuItem.findMany({
      where: { typeId, isActive: true, children: { none: { isActive: true } } },
      select: { id: true },
    });
    if (leaves.length === 0) break;

    const { count } = await prisma.menuItem.deleteMany({
      where: { id: { in: leaves.map((l) => l.id) } },
    });
    totalDeleted += count;
  }
  return totalDeleted;
}

async function seedType(key: string, tree: SeedNode[]): Promise<void> {
  const type = await prisma.menuType.findUniqueOrThrow({ where: { key } });

  // Deletes (not deactivates) whatever's currently active — i.e. this
  // same script's own previous run, if any — so re-running never
  // accumulates orphaned generations the way plain deactivation did
  // (found and cleaned up 2026-08-25: 3 undeleted re-runs had left 139
  // dead rows cluttering the admin panel's menu tree). The very first
  // ever run instead deletes 0 here and deactivates the real
  // legacy-imported rows below.
  const deletedPrevious = await deleteActiveTree(type.id);
  if (deletedPrevious > 0) {
    console.log(`  ${key}: deleted ${deletedPrevious} item(s) from this script's own previous run`);
  }

  const { count: deactivated } = await prisma.menuItem.updateMany({
    where: { typeId: type.id, isActive: true },
    data: { isActive: false },
  });
  if (deactivated > 0) {
    console.log(`  ${key}: deactivated ${deactivated} legacy-imported item(s)`);
  }

  const created = await createTree(tree, type.id, null);
  console.log(`  ${key}: created ${created} curated item(s)`);
}

async function main(): Promise<void> {
  console.log('🌱 Seeding curated navigation...\n');
  await seedType('main_menu', MAIN_MENU);
  await seedType('footer_menu', FOOTER_MENU);
  console.log('\n✅ Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
