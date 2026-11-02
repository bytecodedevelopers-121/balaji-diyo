import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { getHeaderNavData } from "@/features/navigation/lib/build-navigation";
import { getSiteSettings } from "@/features/site-settings/api/get-site-settings";
import { toTelHref } from "@/features/site-settings/lib/to-tel-href";

/**
 * Shared layout for every secondary page (about-us,
 * why-boundless-adventure, ...) — a route group, doesn't affect the
 * URL. Gives all of them the "light" `Header` variant (opaque white,
 * in normal document flow, dark nav) that design-references/
 * "about-us.png" and "Why Boundless Adventure.png" both show, as
 * opposed to the homepage's transparent hero-overlay header (see
 * `(home)/layout.tsx`).
 */
export default async function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Independent requests — run in parallel rather than serially.
  const [nav, settings] = await Promise.all([
    getHeaderNavData(),
    getSiteSettings(),
  ]);

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
