import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { getHeaderNavData } from "@/features/navigation/lib/build-navigation";
import { getSiteSettings } from "@/features/site-settings/api/get-site-settings";
import { toTelHref } from "@/features/site-settings/lib/to-tel-href";

/**
 * Layout for the "/" route only (route group, doesn't affect the URL —
 * see route-groups.md). Exists solely to give the homepage its own
 * `Header` variant ("dark": transparent overlay on the hero photo,
 * white nav) without forcing every other page to use it. See
 * `(pages)/layout.tsx` for the opposite ("light") variant every
 * secondary page uses instead.
 */
export default async function HomeLayout({
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
        variant="dark"
        siteName={settings.companyName}
        phone={settings.mobile}
        phoneHref={toTelHref(settings.mobile)}
        {...nav}
      />
      <PageContainer>{children}</PageContainer>
    </>
  );
}
