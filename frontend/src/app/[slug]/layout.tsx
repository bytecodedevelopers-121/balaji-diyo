import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { getHeaderNavData } from "@/features/navigation/lib/build-navigation";
import { getSiteSettings } from "@/features/site-settings/api/get-site-settings";
import { toTelHref } from "@/features/site-settings/lib/to-tel-href";

/**
 * Layout for the flat `/<slug>` route (package detail today; later
 * blog/page/place/story content types — see `./resolve-content.ts`).
 *
 * Header/Footer used to come from the root layout, which rendered a
 * single un-variant-ed Header for every route. Now that Header is
 * `variant`-scoped and moved out into the `(home)`/`(pages)` route-group
 * layouts (see their own doc comments), this route needs its own copy —
 * it isn't a member of either group. Uses the "light" variant: like
 * every secondary page, it's an opaque white header in normal document
 * flow, not the homepage's transparent hero overlay.
 */
export default async function SlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = await getHeaderNavData();
  const settings = await getSiteSettings();

  return (
    <>
      <Header
        variant="light"
        siteName={settings.companyName}
        phone={settings.mobile}
        phoneHref={toTelHref(settings.mobile)}
        {...nav}
      />
      <PageContainer>{children}</PageContainer>
    </>
  );
}
