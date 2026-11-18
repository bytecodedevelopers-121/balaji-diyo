/**
 * Primary site navigation.
 *
 * Plain data with no env or SEO dependencies, so it's safe to import from
 * both Server and Client Components (e.g. a future client-side mobile nav
 * toggle).
 *
 * PROVISIONAL: the hrefs below are placeholders to make the header/footer
 * renderable, not a finalized URL structure. Before building the real
 * pages, confirm each path against the legacy site per
 * src/config/legacy-routes.ts (old Laravel routes, sitemap, Search
 * Console, and existing internal links) and update this file to match
 * whatever the audit finds.
 *
 * CONFIRMED (2026-08-13, direct from the user): "/company/about-us" and
 * "/company/why-guided-travel" are the real legacy URLs
 * (https://boundlessadventure.com/about-us and .../why-boundless-adventure)
 * — both now have real pages at src/app/about-us and
 * src/app/why-boundless-adventure. Every other href below is still
 * unconfirmed.
 */
export interface NavItem {
  label: string;
  href: string;
}

export const primaryNavigation: NavItem[] = [
  { label: "Home", href: "/" },
  // "Trips" removed 2026-08-26 (explicit user direction): this app has
  // no `/trips` route at all (see this file's other notes on that).
  { label: "Destinations", href: "/destinations" },
  { label: "About", href: "/company/about-us" },
  { label: "Contact", href: "/contact" },
];

export const footerNavigation: NavItem[] = [
  { label: "Privacy Policy", href: "/company/privacy-policy" },
  // Was "/terms-and-conditions", a guessed slug with no page behind it.
  // Corrected 2026-08-19: the real migrated CMS page for this is
  // "/company/terms-and-conditions" (see url_infos, ownerType "page") —
  // there's no separate general-ToS page in the legacy content.
  { label: "Terms & Conditions", href: "/company/terms-and-conditions" },
];

/**
 * Footer's three link columns (design-references/homepage.png,
 * y≈9155–9330 at 1440px — "Quick Links" / "Top 5 Treks" (now "Top 7 Treks") / "Useful
 * Links"). PROVISIONAL like everything else in this file: routes that
 * already exist above (About, Contact, Blog, Privacy Policy, Terms)
 * reuse those exact hrefs.
 *
 * "Top 5 Treks" was originally a `/trips/[slug]` guess (assuming a
 * future `/trips` listing route that never got built) — CORRECTED
 * 2026-08-25: this app has no `/trips` route at all, only the flat
 * `/<slug>` namespace (`app/[slug]/resolve-content.ts`), and all six of
 * these are real, already-migrated `Package` rows — confirmed against
 * this repo's own `packages`/`url_infos` tables, and cross-checked
 * against the actual live boundlessadventure.com (same flat pattern
 * there too, e.g. /everest-base-camp-trekking).
 *
 * "Terms of Conditions" (this design's exact label) points at the same
 * route as `footerNavigation`'s "Terms & Conditions" (see that entry's
 * own comment on the corrected, real "/company/terms-and-conditions"
 * URL) — kept as each source's own text, same precedent as
 * headerNavigation vs. primaryNavigation above.
 */
export interface FooterColumn {
  title: string;
  links: NavItem[];
}

export const footerColumns: FooterColumn[] = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/company/about-us" },
      { label: "Joyful Trekking Team", href: "/company/team" },
      { label: "Partner with Us", href: "/company/partner-with-us" },
      // No separate affiliate page yet — shares the partner page.
      { label: "Affiliate Program", href: "/company/partner-with-us" },
      { label: "Terms and Conditions", href: "/company/terms-and-conditions" },
      { label: "Privacy Policy", href: "/company/privacy-policy" },
    ],
  },
  {
    title: "Useful Links",
    links: [
      { label: "Resources Links", href: "/company/legal-documents" },
      { label: "Travelers Video Reviews", href: "/reviews" },
      // No videos / photos pages yet — closest existing pages.
      { label: "Nepal Travel Videos", href: "/attractions" },
      { label: "Nepal Travel Photos", href: "/attractions" },
      { label: "Client Reviews", href: "/reviews" },
      { label: "Write a Review", href: "/reviews" },
    ],
  },
  {
    title: "More Links",
    links: [
      { label: "Customize Nepal Trip", href: "/customize-trip" },
      { label: "Plan Your Nepal Trip", href: "/plan-your-trip" },
      // No FAQ / sitemap pages yet — closest existing pages.
      { label: "General FAQs", href: "/contact" },
      { label: "Site Map", href: "/map" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

/**
 * Footer's three regional office blocks (same source, y≈9270–9400).
 * Real business data (transcribed verbatim from the reference, not
 * placeholders) — unlike every href above, these phone numbers,
 * emails, and the address are treated as confirmed content, not
 * provisional routing.
 */
export interface FooterOffice {
  name: string;
  flag: string;
  /** Legal entity line shown directly under the office name. */
  company: string;
  /** Overseas offices list email before phone; Nepal (which also has an
   *  address) lists phones first, email last. */
  emailFirst?: boolean;
  phones: { label: string; href: string }[];
  phoneGroups?: {
    label: string;
    phones: { label: string; href: string }[];
  }[];
  email: string;
  address?: string;
  poBox?: string;
}

export const footerOffices: FooterOffice[] = [
  {
    name: "Nepal (Head Office)",
    flag: "/images/footer/flag-nepal.png",
    company: "Joyful Trekking Pvt. Ltd.",
    phones: [
      { label: "+977 9845000000", href: "tel:+9779845000000" },
      { label: "+977 14701884", href: "tel:+97714701884" },
      { label: "+977 14701885", href: "tel:+97714701885" },
    ],
    phoneGroups: [
      {
        label: "Phone",
        phones: [
          { label: "+977 14701884", href: "tel:+97714701884" },
          { label: "+977 14701885", href: "tel:+97714701885" },
        ],
      },
      {
        label: "Mobile",
        phones: [
          { label: "+977 9845000000", href: "tel:+9779845000000" },
        ],
      },
    ],
    email: "joyfultrekking@gmail.com",
    address: "Thamel, Kathmandu, Nepal",
    poBox: "P.O. Box No. 11670",
  },
  {
    name: "Australia",
    flag: "/images/footer/flag-australia.png",
    company: "Joyful Trekking Pvt. Ltd.",
    emailFirst: true,
    phones: [
      {
        label: "+61 426 378 149 (WhatsApp)",
        href: "https://wa.me/61426378149",
      },
    ],
    email: "joyfultrekking@gmail.com",
  },
  {
    name: "Japan",
    flag: "/images/footer/flag-japan.png",
    company: "Joyful Trekking Pvt. Ltd.",
    emailFirst: true,
    phones: [
      {
        label: "+81 80 4107 0813 (WhatsApp)",
        href: "https://wa.me/818041070813",
      },
    ],
    email: "joyfultrekking@gmail.com",
  },
];

/**
 * Desktop header navigation (Figma node 2001:13403 — the "Frame 10 /
 * Property 1=Dark" header component, instanced inline in the hero at
 * node 2001:7610 and reused across the file). This is a deliberately
 * different, shorter set than `primaryNavigation`: the Figma header
 * shows exactly "Destination", "About", "Contact" plus dropdown
 * affordances (chevron icons) on the first two.
 *
 * Both dropdown-affordance items now have real, Figma-accurate content,
 * each rendered by its own dedicated mega-menu component rather than a
 * shared generic one (an earlier "About" pass — see git history —
 * used a generic hover panel sourced from a user-supplied screenshot
 * before the actual Figma node for it turned up; that 8-link
 * screenshot version is superseded by `aboutDropdown` below):
 *
 * "Destination" — see `destinationDropdown` below — sourced from Figma
 * node 18:189, a *different* node from the "Homepage - Dropdown -
 * Destination"-named frame previously sampled as 455:6099 (see
 * `menuNavigation`'s doc comment: that one turned out to be an
 * unrelated full-screen menu takeover, the frame name a leftover from
 * copy/paste). 18:189 is the one that actually contains an expanded
 * Destination mega-menu, rendered by `DestinationDropdown.tsx`.
 *
 * "About" — see `aboutDropdown` below — sourced from Figma node
 * 455:4949 (the "Homepage - Dropdown - Destination"-named frame is,
 * once again, a leftover copy/paste name — this one's real content is
 * the About panel). Rendered by `AboutDropdown.tsx`.
 *
 * Hrefs reuse `primaryNavigation`'s existing provisional routes
 * (labels differ slightly — Figma says "Destination" singular,
 * `primaryNavigation` says "Destinations" — kept as each source's own
 * exact text; same destination route either way).
 */
export const headerNavigation: NavItem[] = [
  { label: "Destination", href: "/destinations" },
  { label: "About", href: "/company/about-us" },
  { label: "Contact", href: "/contact" },
];

/**
 * "About" header dropdown content (Figma node 455:4949, same frame-name
 * leftover as `headerNavigation`'s own comment explains — its real
 * content is two link columns, "Our Company" and "Useful Links",
 * transcribed verbatim). Renders in `AboutDropdown.tsx`.
 *
 * Only 7 links total (3 + 4), not the 8 an earlier pass built from a
 * user-supplied screenshot (see `headerNavigation`'s own comment) — the
 * two sources disagree on the "banking"/"terms" item specifically:
 * this Figma node has one link literally labeled "Banking Terms &
 * Conditions", where the screenshot-sourced version had two separate
 * links ("Banking Details" and "Booking Terms and Conditions").
 * Transcribed as the Figma node's own single verbatim label, pointed at
 * `/company/terms-and-conditions` as the closer of the two existing
 * real pages by name — genuinely ambiguous, unconfirmed which (or
 * whether both) the live site actually intends; flag for product
 * confirmation before treating this as final.
 */
export interface AboutDropdownLink {
  label: string;
  href: string;
}

export interface AboutDropdownColumn {
  heading: string;
  links: AboutDropdownLink[];
}

/** Named (rather than left as an inline object type) for the same reason
 *  as `DestinationDropdownData` above — reused by `features/navigation/
 *  lib/build-navigation.ts` for its API-sourced version. */
export interface AboutDropdownData {
  columns: AboutDropdownColumn[];
}

export const aboutDropdown: AboutDropdownData = {
  columns: [
    {
      heading: "Our Company",
      links: [
        { label: "Why Guided Travel?", href: "/company/why-guided-travel" },
        { label: "About Us", href: "/company/about-us" },
        { label: "Our Team", href: "/company/team" },
      ],
    },
    {
      heading: "Useful Links",
      links: [
        { label: "Company Documents", href: "/company/legal-documents" },
        { label: "Responsible Travel", href: "/company/responsible-travel" },
        // See this const's own doc comment above on the ambiguity here.
        {
          label: "Banking Terms & Conditions",
          href: "/company/terms-and-conditions",
        },
        { label: "Last Minute Trip Deals", href: "/last-minute-trip-deals" },
      ],
    },
  ],
};

/**
 * Turns a label into the lowercase, hyphen-separated form used by both
 * `href` builders below. Matches `AttractionsSection.tsx`'s own
 * `region.title.toLowerCase().replaceAll(" ", "-")` exactly (see
 * `subSubCategoryHref`'s own comment on why that specific match
 * matters) — not a generic slugify, deliberately just the one
 * transform every title here actually needs (plain space-separated
 * words, no punctuation).
 */
function slugify(label: string): string {
  return label.toLowerCase().replaceAll(" ", "-");
}

/**
 * A sub-sub-category (e.g. "Everest Region") links to that region's
 * real, live overview page — `/<slug>` in the flat namespace, resolved
 * by `app/[slug]/resolve-content.ts` via `getTrekkingRegionDetail()`
 * (backed by the real `Category`/`Package` API, see
 * `features/trekking-regions/`). The 4 slugs below are copied verbatim
 * from that feature's own `TREKKING_REGION_SLUGS`, not re-derived by
 * `slugify()` — that module is `server-only`-gated (imports `apiFetch`),
 * so it can't be imported directly into this file, which
 * `DestinationDropdown.tsx` (a Client Component) also imports. Keep
 * this map in sync with `TREKKING_REGION_SLUGS` by hand if that list
 * ever changes.
 *
 * Falls back to the old `/attractions#<slug>` anchor (still real —
 * `AttractionsSection.tsx` renders each region as
 * `<section id={region.title.toLowerCase().replaceAll(" ", "-")}>`)
 * for any title not in this known-region map, so a future region added
 * to this dropdown without a matching entry here still lands somewhere
 * genuine rather than 404ing outright.
 */
const TREKKING_REGION_HREF_BY_TITLE: Record<string, string> = {
  "EVEREST REGION": "/everest-region-treks",
  "ANNAPURNA REGION": "/annapurna-region-treks",
  "LANGTANG REGION": "/langtang-region-treks",
  "RESTRICTED AREA TREKKING": "/restricted-area-trekking",
  // The "Manaslu Region" category lives under the restricted-area-trekking slug.
  "MANASLU REGION": "/restricted-area-trekking",
};

function subSubCategoryHref(title: string): string {
  return (
    TREKKING_REGION_HREF_BY_TITLE[title] ?? `/attractions#${slugify(title)}`
  );
}

/**
 * A package (e.g. "Everest Base Camp Trek") links to the real flat-
 * namespace package-detail route — `/<slug>`, per
 * `app/[slug]/resolve-content.ts`'s own doc comment on the legacy
 * "one flat namespace" URL scheme every package migrates into.
 * PROVISIONAL: this guesses the eventual slug by kebab-casing the
 * package's own title, which is the real slugging convention already
 * used for the one migrated package this repo has ("Ama Dablam Base
 * Camp Trek" → `/ama-dablam-base-camp-trek`, see `app/[slug]/data.ts`)
 * — but none of these specific 26 packages are migrated yet, so most
 * currently 404 to `not-found.tsx` until their real `Package` records
 * exist. Same real-shape-now/real-content-later status as every other
 * provisional href in this file.
 */
function packageHref(title: string): string {
  return `/${slugify(title)}`;
}

/**
 * "Destination" header dropdown content (Figma node 18:189, "Homepage -
 * Dropdown - Destination" — the *actual* expanded mega-menu panel,
 * transcribed verbatim; see `headerNavigation`'s own comment on how
 * this differs from the unrelated node previously sampled under the
 * same frame name). Renders in `DestinationDropdown.tsx`.
 *
 * Modeled as the 4-level taxonomy it actually is, per explicit
 * follow-up direction (2026-08-21): `categories` (Nepal/Tibet/Bhutan)
 * → `subCategories` (Tours/Trekking Routes/...) → `subSubCategories`
 * (Everest Region/...) → `packages` (Everest Base Camp Trek/...).
 * `DestinationDropdown.tsx` reveals a category's `subCategories`, and a
 * sub-category's `subSubCategories`/`packages`, on hover (and focus).
 *
 * The sampled panel only shows ONE live combination: category "Nepal"
 * → sub-category "Trekking Routes" → the region/package grid below.
 * Every other category/sub-category here is transcribed verbatim
 * (including which single entry in each tier is `active`) but has NO
 * confirmed sub-tier content anywhere in the file — no sub-categories
 * for Tibet/Bhutan, no regions/packages for Tours, Peak Climbing,
 * Short Trek, Day Tours, Wildlife Safari Tours, or Helicopter Tours.
 * Those all get an empty `subCategories`/`subSubCategories` array
 * rather than fabricated content; `DestinationDropdown.tsx` renders a
 * "Coming soon" placeholder for whichever tier comes up empty on
 * hover, so the interaction stays honest instead of silently reusing
 * Nepal/Trekking Routes' own data for an unrelated selection.
 */
export interface DestinationPackage {
  label: string;
  href: string;
}

export interface DestinationSubSubCategory {
  /** Verbatim, including its own literal capitalization (all-caps in
   *  the source, e.g. "EVEREST REGION"). */
  title: string;
  href: string;
  packages: DestinationPackage[];
  /** Shown as "- N Packages" next to the title; falls back to `packages.length` when unset. */
  packageCount?: number;
}

export interface DestinationSubCategory {
  label: string;
  active: boolean;
  subSubCategories: DestinationSubSubCategory[];
  /** Where this sub-category's own "View All" link goes — its real category-browse page when one exists (e.g. "Peak Climbing" → `/nepal-peak-climbing`), or the closest confirmed stand-in otherwise (see "Trekking Routes"' own comment below). Required, not optional: every sub-category has to make this call explicitly rather than silently inheriting a sibling's href. */
  viewAllHref: string;
}

export interface DestinationCategory {
  label: string;
  active: boolean;
  subCategories: DestinationSubCategory[];
  /** Flat package links shown directly under this country (no trip-type headings) — used by countries without curated sub-categories. */
  links?: DestinationPackage[];
  /** Same role as `DestinationSubCategory.viewAllHref`, one tier up — the fallback `DestinationDropdown.tsx` uses when the active category has no sub-categories of its own (Tibet/Bhutan today). */
  viewAllHref: string;
}

/** Explicit type for `destinationDropdown` below — pulled out (rather
 *  than left as an inferred const type) so `features/navigation/lib/
 *  build-navigation.ts` can type its own API-sourced version identically
 *  and fall back to this static one with no shape mismatch. */
export interface DestinationDropdownData {
  categories: DestinationCategory[];
}

/** One flat link in the destination menu (a single package/tour). */
function menuItem(title: string): DestinationSubSubCategory {
  return { title, href: packageHref(title), packages: [] };
}

/** A trekking region row: "Everest Region - 18 Packages". */
function regionItem(title: string, packageCount: number): DestinationSubSubCategory {
  return { title, href: subSubCategoryHref(title), packages: [], packageCount };
}

function group(
  label: string,
  viewAllHref: string,
  subSubCategories: DestinationSubSubCategory[],
): DestinationSubCategory {
  return { label, active: false, viewAllHref, subSubCategories };
}

/**
 * DUMMY CONTENT — placeholder destination menu used until the admin curates
 * a real "Destination" menu tree (see `features/navigation/lib/build-
 * navigation.ts`, which replaces this whenever the API has one). Item
 * links are slugified from their titles and may not resolve to real pages.
 */
export const destinationDropdown: DestinationDropdownData = {
  categories: [
    {
      label: "Nepal",
      active: true,
      viewAllHref: "/nepal-tour-packages",
      subCategories: [
        group("Trekking and Hiking", "/trekking-routes-in-nepal", [
          regionItem("EVEREST REGION", 18),
          regionItem("ANNAPURNA REGION", 24),
          regionItem("LANGTANG REGION", 12),
          regionItem("MANASLU REGION", 6),
          regionItem("TREKS FROM POKHARA", 10),
        ]),
        group("Climbing and Expedition", "/nepal-peak-climbing", [
          menuItem("Lobuche Peak Climbing"),
          menuItem("Mera Peak Climbing"),
          menuItem("Yala Peak Climbing"),
          menuItem("Island Peak Climbing"),
        ]),
        group("Jungle and Wildlife Safari", "/nepal-tour-packages", [
          menuItem("Spirit of Nepal Tour"),
          menuItem("Bardia Jungle Safari"),
          menuItem("Chitwan Jungle Safari"),
          menuItem("A Taste of Nepal Tour"),
        ]),
        group("Nepal Festival Tours", "/nepal-tour-packages", [
          menuItem("Tiji Festival Tour - 2027"),
          menuItem("Mani Rimdu Festival Trek - 2026"),
        ]),
        group("Nepal Tours and Holidays", "/nepal-tour-packages", [
          menuItem("Spirit of Nepal Tour"),
          menuItem("Nepal Premium Adventure"),
          menuItem("Honeymoon Tour in Nepal"),
          menuItem("Tiji Festival Tour - 2027"),
          menuItem("Everest Heli Tour with Stay at Everest View Hotel"),
          menuItem("Kathmandu Transit Tour"),
          menuItem("Pokhara Tour"),
          menuItem("Upper Mustang Jeep Tour"),
          menuItem("Upper Mustang Tour"),
          menuItem("Lumbini Tour"),
          menuItem("Nepal Luxury Tour"),
          menuItem("Nepal Winter Tour"),
          menuItem("Nepal Photography Tour"),
          menuItem("A Taste of Nepal Tour"),
          menuItem("Nepal Student Adventure"),
          menuItem("Nepal Summer Tour"),
          menuItem("Nepal Family Adventure"),
          menuItem("Glimpse of Nepal Tour"),
        ]),
        group("Day Tours and Activities", "/nepal-day-tours", [
          menuItem("Everest Base Camp Helicopter Tour with Landing"),
          menuItem("Kathmandu Day Tour - 1 Full Day"),
          menuItem("Bhaktapur and Patan Day Tour - Full Day"),
          menuItem("Champadevi Day Hike - 1 Day"),
          menuItem("Chandragiri Cable Car Tour- Half Day"),
          menuItem("Dakshinkali Pharping Day Tour - 1 Day"),
          menuItem("Kathmandu Half Day Tour"),
          menuItem("Kathmandu Shopping Tour"),
          menuItem("Annapurna Base Camp Helicopter Tour"),
          menuItem("Nagarkot Sunrise Hiking Tour - 1 Day"),
          menuItem("Trishuli River Rafting - 1 Day"),
          menuItem("Kathmandu Pokhara Flight"),
          menuItem("Kathmandu Pokhara Vehicle Rental"),
          menuItem("Everest Experience Mountain Flight Tour"),
          menuItem("Bungmati Khokana Day Tour - 1 Day"),
        ]),
      ],
    },
    { label: "Bhutan", active: false, subCategories: [], links: [{ label: "Nepal and Bhutan Highlights", href: packageHref("Nepal and Bhutan Highlights") }, { label: "Short Bhutan Tour", href: packageHref("Short Bhutan Tour") }, { label: "Nepal Tibet Bhutan Tour", href: packageHref("Nepal Tibet Bhutan Tour") }, { label: "Bhutan Highlights Tour", href: packageHref("Bhutan Highlights Tour") }, { label: "Short Nepal and Bhutan Tour", href: packageHref("Short Nepal and Bhutan Tour") }], viewAllHref: "/bhutan-tours" },
    { label: "Tibet", active: false, subCategories: [], links: [{ label: "Tibet Lhasa Tour", href: packageHref("Tibet Lhasa Tour") }, { label: "Kailash Mansarovar Tour", href: packageHref("Kailash Mansarovar Tour") }, { label: "Nepal Tibet Bhutan Tour", href: packageHref("Nepal Tibet Bhutan Tour") }, { label: "Kathmandu to Lhasa Overland Tour", href: packageHref("Kathmandu to Lhasa Overland Tour") }, { label: "Nepal Tibet Tour", href: packageHref("Nepal Tibet Tour") }], viewAllHref: "/tibet-tours" },
    { label: "Multi Country", active: false, subCategories: [], links: [{ label: "Nepal and Bhutan Highlights", href: packageHref("Nepal and Bhutan Highlights") }, { label: "Nepal Tibet Tour", href: packageHref("Nepal Tibet Tour") }, { label: "Short Nepal and Bhutan Tour", href: packageHref("Short Nepal and Bhutan Tour") }, { label: "Nepal Tibet Bhutan Tour", href: packageHref("Nepal Tibet Bhutan Tour") }], viewAllHref: "/nepal-tour-packages" },
  ] satisfies DestinationCategory[],
};

/**
 * Full-screen header menu overlay (Figma node 455:6099, "Homepage -
 * Dropdown - Destination" — the frame name is a leftover from copying
 * an earlier dropdown frame; its actual content is this unrelated
 * 8-link takeover menu, transcribed verbatim). Renders in
 * `MobileMenu.tsx` behind the header's hamburger trigger.
 *
 * Labels were originally copied verbatim from Figma's own Title Case
 * (each word capitalized) — recast to sentence case (2026-09-04,
 * explicit user direction: proper nouns like "Nepal" keep their own
 * capital, everything else gets just the one leading capital). Hrefs
 * reuse the confirmed real routes already established elsewhere in this
 * file — "Testimonials" reuses footerColumns' "/reviews" (its exact same
 * label points there), "Trekking routes map" reuses the confirmed
 * legacy slug, etc.
 *
 * One label has no route anywhere in the app: "Become a partner" has
 * no page or prior mention anywhere in the codebase — `/company/partner-with-us`
 * is a new provisional placeholder slug, same "unconfirmed until
 * audited against the legacy site" status as this file's other
 * placeholders (see file-level PROVISIONAL note above).
 */
export const menuNavigation: NavItem[] = [
  { label: "Compare itineraries", href: "/compare-itineraries" },
  { label: "Testimonials", href: "/reviews" },
  { label: "Trekking routes map", href: "/map" },
  { label: "Customize your trip", href: "/customize-trip" },
  { label: "Volunteering in Nepal", href: "/volunteering-in-nepal" },
  { label: "Become a partner", href: "/company/partner-with-us" },
];

/**
 * Desktop header CTA (Figma node 2001:13564, the gradient pill in the
 * "Frame 10" header component). Points at the real 3-step "Plan With
 * Us" wizard now that it exists (built 2026-08-20, from design-
 * references/"Plan with us - Preferences.png" + 2 more) — briefly
 * redirected at "/customize-trip" (a separate, simpler, package-based
 * enquiry form) as a stand-in while this page didn't exist; both pages
 * are real and coexist, this is just this button's own real target.
 */
export const headerCta: NavItem = {
  label: "Plan with us",
  href: "/plan-your-trip",
};
