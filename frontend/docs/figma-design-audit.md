# Figma Design Audit — Boundless Adventure

Source of truth for the design tokens in `src/app/theme.css` and the font
loaders in `src/lib/fonts.ts`. This is a record of what was actually
sampled in Figma, not a spec — where the source design itself is
inconsistent, that inconsistency is recorded here rather than silently
resolved.

## Approved typography foundation — 2026-08-13

The user-provided Figma typography board is the current implementation
source of truth and supersedes the earlier component-by-component font
sampling recorded below. The public frontend now uses **Raleway** for
display and body roles, with Regular (400), Medium (500), and Bold (700).

| Style | Size / line-height / tracking |
|---|---|
| Raleway 7XL | 72 / 115.2px / 0 |
| Raleway 6XL | 56 / 78px / 0 |
| Raleway 5XL | 44 / 70.4px / 0 |
| Raleway 4XL | 32 / 51.2px / 0 |
| Raleway 3XL | 26 / 41.6px / 0 |
| Raleway 2XL | 22 / 35.2px / 0 |
| Raleway XL | 18 / 28.8px / 0 |
| Body L / M / S | 16 / 25.6px; 14 / 22.4px; 12 / 19.2px |
| Input L / M / S | 16 / 25.6px; 14 / 22.4px; **14 / 22.4px** |
| Button L / M / S | 16 / 25.6px; 14 / 22.4px; 12 / 19.2px |
| Helper L / M / S | 16 / 25.6px; 14 / 22.4px; 12 / 19.2px |

The board labels Input S as 14 / 22.4px; that value is implemented
literally and retained as a documented design inconsistency. The font
findings and typography table below remain useful as historical evidence
of the older homepage layers, but no longer define the active font system.

## File and audited nodes

**Figma file:** `Boundless Adventure (Copy)` — file key `tClntpewa7VwaYU4sbo2cj`
(`https://www.figma.com/design/tClntpewa7VwaYU4sbo2cj/Boundless-Adventure--Copy-`)

At the time of the initial component audit, the inspected file page
(`💡Moodboard`, node `0:1`) exposed no dedicated typography documentation
and `search_design_system` returned zero registered local styles/variables.
The historical values below were therefore reverse-engineered from real
layers; the subsequently provided typography board above supersedes those
font findings.

| Node ID | Name | What it gave us |
|---|---|---|
| `450:1010` | Frame 37 (Homepage, first pass) | Full homepage section inventory (10 sections, hero → footer) |
| `2001:7610` | Frame 1 (Hero) | H1 typography, nav bar, brand gradient CTA |
| `2001:7616` | Frame 13 (Journeys heading) | Eyebrow + H2 heading pattern (repeats across sections) |
| `2001:7719` | Frame 27 (Origins / About) | H2, body paragraph (Raleway outlier), text link |
| `2001:7734` | Frame 16 (Gallery tag row) | Destination tag pills, active/inactive states |
| `2001:7785` | Frame 1147 (Pagination) | Pagination chip border/typography |
| `2001:7933` | Frame 1000006161 (Testimonial card) | Card shadow/border recipe #1, quote title typography |
| `2001:7636` | Frame 24 (Trip/holiday photo card) | Card radius, photo scrim gradient, badges, price/title overrides |
| `2001:6845` | Frame 1000006746 (Contact Us form) | Input/label styles, form card shadow recipe #2, submit button |
| `2001:6634` | Contact Us (frame, metadata only) | Form field inventory (not fully style-sampled) |
| `2001:13730` | Footer symbol (metadata only) | Footer layout inventory (not style-sampled) |

## ⚠️ Rate-limited — not sampled

The Figma MCP Starter-plan tool-call limit was hit mid-audit. These were
**not** style-sampled with `get_design_context` — only their existence/
layout is known from `get_metadata`:

- Footer nav link colors/typography (`2001:13931` and children)
- Footer newsletter input fields (`2001:14041`–`2001:14051`)
- Book Now button (`2001:12811`)
- Pay Now button (`2001:13151`)
- Any pricing/success/error state variants on those screens

None of these are represented in `theme.css`. Re-sample before building
those components.

## Historical font findings (superseded)

| Family | Weights found in use | Role |
|---|---|---|
| **Playfair Display** | Medium (500), Bold (700) | Display headings — every H1/H2/card/quote title. **No named Figma text style covers these** — every instance is hand-set (font, size, weight, line-height all hardcoded per layer). |
| **Poppins** | Medium (500), Bold (700) | Default body — nav, paragraphs, labels, buttons, tags, prices. Named styles (`Body text/Body L`, `Body text/Body M`, `Headings/H XL`, `Headings/H 2XL`) are all Poppins, defined at weight 500; Bold is a manual per-instance override seen on prices, card titles, and the gradient CTA button label. |
| **Raleway** | SemiBold (600) | **Exactly one sampled instance**: the Origins/About Us body paragraph (`2001:7723`). Every other paragraph in the file uses Poppins Medium. |

All three are Google Fonts under the SIL Open Font License — no local
font files or paid licensing required. Loaded via `next/font/google` in
`src/lib/fonts.ts`, self-hosted at build time.

## Historical typography table (superseded)

| Token in `theme.css` | Figma style name | Font | Size / line-height / tracking | Weight as rendered | Bound to named style? |
|---|---|---|---|---|---|
| `--text-display-hero` | — (none) | Playfair Display | 84 / 115.2px / 0 | Bold | ❌ hardcoded |
| `--text-display-section` | — (none) | Playfair Display | 54 / 70.4px / 0 | Medium | ❌ hardcoded (only the fill color is bound, to Neutral/1000) |
| `--text-display-card-title` | — (none) | Playfair Display | 18 / *normal* (no explicit LH) / 0 | Bold | ❌ hardcoded |
| `--text-heading-2xl` | Headings/H 2XL | Poppins | 22 / 35.2px / 0 | Medium in style; **rendered Bold** on card titles/prices | ✅ style exists, but weight is frequently overridden |
| `--text-heading-xl` | Headings/H XL | Poppins | 18 / 28.8px / 0 | Medium | ✅ (name says "Heading" but it's body-weight text — e.g. the hero subtitle) |
| `--text-body-l` | Body text/Body L | Poppins | 16 / 25.6px / 0 | Medium | ✅ most common paragraph/label/nav style |
| `--text-body-m` | Body text/Body M | Poppins | 14 / 22.4px / 0 | Medium | ✅ small text — buttons, testimonial body, meta text |
| *(not tokenized — Raleway outlier)* | — (none) | Raleway | 16 / 25.6px / 0 | SemiBold | ❌ hardcoded, off-family |

Every sampled style uses **0 letter-spacing**. Body-level styles hold a
clean **1.6× line-height ratio**; display headings drift 1.3–1.37×; one
Playfair title (card/quote title) has no explicit line-height at all.

## Color table

| Token in `theme.css` | Figma style name | Hex | Opacity variants seen |
|---|---|---|---|
| `--color-primary-100` | Primary/100 | `#F5FCFE` | 100% |
| `--color-primary-200` | Primary/200 | `#C4EDFD` | 100% |
| `--color-primary-300` | Primary/300 | `#75D5FA` | 100% |
| `--color-primary-400` | Primary/400 | `#09B4F6` | 100% |
| `--color-primary-500` | Primary/500 | `#078CBF` | 100% |
| `--color-primary-600` | Primary/600 | `#067BA7` | 100% |
| `--color-primary-700` | Primary/700 | `#056D94` | 100% |
| `--color-primary-800` | Primary/800 | `#045E80` | 100% |
| `--color-primary-900` | Primary/900 | `#034C68` | 100% |
| `--color-primary-1000` | Primary/1000 | `#02364A` | 100% |
| `--color-secondary-500` | Primary/secondary | `#F7841E` | 100%, 20% (badge fill), 40% (contact card border) |
| `--color-brand-neutral-000` | Neutral/000 | `#FFFFFF` | 100%, 8% (glass badge fill), 80% (glass badge border) |
| `--color-brand-neutral-white-00` | Neutral/White 00 | `#FCFCFC` | 100% — **near-duplicate of Neutral/000, kept separate** |
| `--color-brand-neutral-100` | Neutral/100 | `#FAFAFA` | 100% |
| `--color-brand-neutral-200` | Neutral/200 | `#F5F5F5` | 100% |
| `--color-brand-neutral-300` | Neutral/300 | `#E0E0E0` | 100% |
| `--color-brand-neutral-400` | Neutral/400 | `#CCCCCC` | 100% |
| `--color-brand-neutral-500` | Neutral/500 | `#B8B8B8` | 100% |
| `--color-brand-neutral-600` | Neutral/600 | `#9E9E9E` | 100% |
| `--color-brand-neutral-700` | Neutral/700 | `#8A8A8A` | 100% — **near-duplicate of Neutral/800, kept separate** |
| `--color-brand-neutral-800` | Neutral/800 | `#6B6B6B` | 100% |
| `--color-brand-neutral-900` | Neutral/900 | `#383838` | 100% |
| `--color-brand-neutral-1000` | Neutral/1000 | `#050505` | 100% |
| `--color-success-100`…`1000` | Success/100…1000 | `#F0FFF3` → `#005212` | 100% |
| `--color-error-100`…`1000` | Error/100…1000 | `#FEF6F7` → `#3E090D` | 100% |
| `--color-info-100`…`1000` | Info/100…1000 | `#F0F6FF` → `#001633` | 100% — **Info/400 (`#F19DA4`) and Info/600 (`#E02D3C`) are byte-identical to Error/400 and Error/600; flagged as a likely copy/paste artifact, kept verbatim** |
| `--color-disabled-100` | Disabled/100 | `#F0FAFE` | 100% |
| `--color-disabled-200` | Disabled/200 | `#F5F5F5` | 100% — **identical to Neutral/200, plausibly intentional reuse** |
| — | Gradient stop A (magenta) | `#E747FF` | 40% |
| — | Gradient stop B (indigo) | `#6B72FF` | 40% |
| — | Gradient stop C (cyan) | `#00A8E6` | 40% — corrected from `#00A8E5`, see Gradients table below |

**Information / Success / Error / Disabled — superseded finding.** The
original component-level sampling pass (nodes listed above) found no
such styles anywhere and confirmed their absence by both a name search
across ~14,400 layers and `search_design_system`. A later pass located
a dedicated Foundations/Colors frame (node `14:395`, not discovered in
the original sweep) containing full 100–1000 ramps for all four —
values transcribed above and now present in `theme.css`.

## Gradients, shadows, borders, radii

| Category | Value | Token | Component |
|---|---|---|---|
| Gradient | `linear-gradient(174.71deg, rgba(231,71,255,.4) -41.98%, rgba(107,114,255,.4) 34.35%, rgba(0,168,230,.4) 106.41%)` | `--gradient-brand` | "Plan with us" nav pill. Corrected/re-verified value (user-supplied, 2026-08-13), superseding the earlier Figma export — that version's stops were out of ascending order (41.982%/34.354%/106.41%, an angular-to-linear artifact); this one is in ascending order and the angle/stop-A-percent/stop-C-color also shifted slightly (178.19°→174.71°, 41.982%→-41.98%, `#00A8E5`→`#00A8E6`). |
| Gradient | `linear-gradient(to bottom, rgba(255,255,255,0) 42.3%, rgba(0,0,0,.6) 85.1%)` | `--gradient-photo-scrim` | Trip/holiday card image overlay |
| Shadow | `-4px 0 9px rgba(0,0,0,.05), 4px 4px 9px rgba(0,0,0,.05)` | `--shadow-card-soft` | Testimonial card |
| Shadow | `-4px 0 18px -6px rgba(0,0,0,.1), 4px 4px 18px -6px rgba(0,0,0,.1)` | `--shadow-card-strong` | Contact form card — **not merged with the recipe above; kept as two distinct tokens** |
| Border | `1px solid #CCCCCC` | `--border-input` | Contact form underline inputs |
| Border | `1px solid #E0E0E0` | `--border-pagination` | Pagination chip |
| Border | `1px solid #C4EDFD` | `--border-card-testimonial` | Testimonial card |
| Border | `1px solid rgba(247,132,30,.4)` | `--border-card-contact` | Contact form card |
| Border | `1px solid rgba(255,255,255,.8)` | `--border-badge-glass` | Glass photo-overlay tag |
| Border | `1px solid #078CBF` (bottom only) | `--border-tab-active` | Active gallery destination tab |
| Radius | `6px` | `--radius-chip` | Pagination number chip |
| Radius | `24px` | `--radius-card` | Trip/holiday photo cards |
| Radius | `40px` | `--radius-button-circle` | Circular icon button |
| Radius | `50px` | `--radius-pill` | Gradient CTA + badge pills — kept as sampled `50px`, **not normalized to `9999px`** |
| Radius | *none (0px)* | — no token | Contact form inputs and the Submit button both render with sharp corners — inconsistent with the pill radius used elsewhere. Not tokenized as "no radius" since Tailwind's `rounded-none` already covers that; flagged here for designer review. |

## Historical named-style vs. hardcoded summary (superseded for typography)

| Category | Bound to a named Figma style? |
|---|---|
| Neutral & Primary/Secondary colors | **Yes**, consistently — every sampled fill resolves to a named local paint style |
| Body/label typography (14–16px Poppins) | **Yes** — `Body text/Body L` and `Body text/Body M` used reliably |
| Display headings (Playfair, 18–84px) | **No** — every H1/H2/card-title instance is hand-set, no style applied |
| Font weight on "styled" text | **Partially** — the named style usually defines Medium (500), but Bold (700) is frequently applied as a manual override (prices, card titles, gradient CTA label) |
| Gradients & shadows | **No** — no gradient/shadow styles exist in the file; every instance is a one-off value |
| Radius | **No** — no radius tokens/variables in Figma; values are ad hoc per component |

## Historical inconsistencies requiring designer review

1. **Two near-identical whites** — `#FFFFFF` (Neutral/000) vs `#FCFCFC`
   (Neutral/White 00). Both kept as separate tokens for now.
2. **Two near-identical muted grays** — `#8A8A8A` (Neutral/700) vs
   `#6B6B6B` (Neutral/800), both used for "secondary body text" in
   different components. Both kept as separate tokens for now.
3. **"Headings/H XL" and "Headings/H 2XL" are misnamed** — they're
   Poppins body-weight styles, not the actual display headings (which
   are Playfair and have no named style at all).
4. **18px collision** — Poppins Medium ("Headings/H XL", body-ish) and
   Playfair Bold (hardcoded, card/quote titles) both sit at 18px with
   nothing connecting them.
5. **Weight overrides** — H XL/H 2XL/Body M are defined at weight 500,
   but Bold (700) is manually applied on top in several places, so the
   named style and the rendered weight frequently disagree.
6. **Inconsistent line-height ratio** — body styles hold 1.6×
   consistently; display headings drift 1.3–1.37×; one Playfair title
   has no explicit line-height set at all.
7. **Two shadow recipes for "a card"** — 5%-opacity (testimonial) vs
   10%-opacity/larger-blur (contact form) — no single elevation scale.
8. **Radius isn't a scale** — `6px`, `24px`, `40px`, `50px` coexist
   with no arithmetic relationship.
9. **Button shape inconsistency** — the gradient CTA and badges are
   fully pill-shaped (`50px`); the Contact form's Submit button has no
   radius at all.
10. **Off-brand font family** — Raleway SemiBold appears exactly once;
    everywhere else uses Poppins Medium. Looks like it may be
    accidental rather than an intentional third family.
11. **No semantic (info/success/error) colors exist** — not an
    inconsistency to normalize, but a genuine gap that needs new
    design input before those states can be built.

## Historical exact Figma values vs. proposed normalization

For the component-sampling pass, **nothing in `theme.css` was
normalized.** Every color, size,
line-height, radius, shadow, border, and gradient value is copied
verbatim from a sampled node, including the inconsistencies listed
above (both whites, both grays, both shadows, the ungrouped radius
values, the Raleway outlier, the missing line-height on one heading).

The **only** non-value decision made during implementation was a
**naming** one, to prevent a real technical collision:

- The Figma-sampled neutral scale is exposed as `--color-brand-neutral-*`
  rather than `--color-neutral-*`, because Tailwind v4 ships its own
  built-in `neutral-*` color scale (with different hex values) that the
  existing Header/Footer scaffold already uses via plain Tailwind
  classes (`text-neutral-900`, `border-neutral-200`, etc.). Reusing the
  bare `neutral` name in `@theme` would have silently overridden those
  defaults — including several shade numbers this palette shares with
  Tailwind's default scale (100, 300, 400, 500, 700, 800, 900) — and
  changed already-shipped UI without approval. The prefix avoids that;
  it does not change any sampled value. If a `neutral-*` (unprefixed)
  namespace is preferred going forward, that's a follow-up decision for
  whoever migrates the Header/Footer off Tailwind's defaults.

No semantic normalization proposal (e.g. "collapse these two grays
into one") has been applied — that mapping was written up in the prior
chat-based audit as a *suggestion* only, and is intentionally not
implemented here pending explicit approval.

## Addendum — Header + hero implementation pass

Implements `src/components/layout/Header` and
`src/components/sections/HeroSection` (desktop only — see below).

**Nodes newly inspected this pass:**

| Node ID | Name | What it gave us |
|---|---|---|
| `2001:7610` | Frame 1 (Hero) | Used as a stand-in for the task-named `450:1011` — see rationale below. Full hero + header JSX, gradient, typography. |
| `2001:13403`–`2001:13566` | "Frame 10" header component (Dark/Light variants), instanced inline in the hero | Logo composition (exact `inset()` layout of 3 sub-assets), nav item structure, phone/CTA markup |

**`450:1011` was never directly reached.** The Figma MCP tool-call quota
(Starter plan) was already exhausted from the prior audit session and
did not reset; `get_metadata`/`get_design_context` calls on both
`450:1011` and `580:18027` failed identically on every retry this
session. Given the user's explicit choice ("Desktop only, now"), this
pass reused `2001:7610` — a duplicate "Frame 1" hero instance elsewhere
in the same moodboard canvas, same name, same 1442×800 dimensions,
part of an earlier full-homepage duplicate already sampled in the
original design-token audit — as equivalent to `450:1011`. This is a
disclosed substitution, not a verified identical-pixel match.

**`580:18027` (mobile/responsive) was never inspected at all** — zero
data exists on it in this repo. Per the brief's own instruction not to
infer a different mobile design, nothing mobile-specific was built.
Below the desktop breakpoint, the pre-existing placeholder
header/hero markup (from the original token-foundation pass) is left
untouched.

**Hero background photo:** the sampled `get_design_context` output for
`2001:7610` contained no image-fill URL for the mountain photograph
visible in Figma's own screenshot — only the heading block and header
component were returned as code. Re-fetching to check was blocked by
the same rate limit. A CSS gradient (`brand-neutral-900` →
`brand-neutral-1000`) stands in for it; this is not sourced from Figma
and must be replaced once the real asset can be exported.

**Assets that WERE successfully downloaded:** the header/logo SVGs
returned live, temporary Figma export URLs in the `2001:7610` sampling
output from earlier in the same working session. Those URLs were
still valid (not yet past Figma's ~7-day expiry) and were fetched via
plain `curl` — which does not consume Figma MCP tool-call quota — then
moved to permanent paths under `public/images/brand/` and
`public/icons/navigation/`. See the completion report for the full
asset table.

**Breakpoint:** a custom `1120px` (not a stock Tailwind breakpoint) —
see the doc comment atop `Header.tsx` for the measured rationale (the
desktop nav's non-shrinking content has a real minimum width of
~1046px; an E2E overflow check actually failed at the originally-tried
`1024px`/`lg` breakpoint, which is what surfaced this). Not derived
from comparing both Figma frames, since only one was reachable.
