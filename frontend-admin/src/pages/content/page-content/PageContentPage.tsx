import { useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAGE_DEFS, PAGE_GROUPS } from "@/constants/pageContent";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import { ContentCard } from "./PageCards";
import { usePages } from "@/hooks/queries/usePages";
import { publicPageUrl } from "@/lib/publicUrl";

/** Lists the website pages whose sections can be edited in the CMS; related pages sit inside a folder card. */
export default function PageContentPage() {
  useEffect(() => {
    document.title = `Page Content | ${COMPANY_INFO.name} Admin`;
  }, []);

  // Pages created under Admin → Pages show up here automatically.
  const { data: created } = usePages({ page: 1, perPage: 100 });
  const createdPages = created?.data.items ?? [];

  const grouped = new Set(PAGE_GROUPS.flatMap((g) => g.pages));
  const loose = PAGE_DEFS.filter((page) => !grouped.has(page.key));

  return (
    <>
      <PageHeader title="Page Content" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Page Content" }]} />
      <p className="mb-5 max-w-2xl text-sm text-gray-600">
        Edit the text, images, links and visibility of each section on the public website. Changes appear on the site within about a minute.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {PAGE_GROUPS.map((group) => (
          <ContentCard
            key={group.key}
            folder
            to={PATHS.PAGE_CONTENT_GROUP(group.key)}
            title={group.title}
            description={group.description}
            meta={`${group.pages.length} pages`}
          />
        ))}
        {loose.map((page) => (
          <ContentCard key={page.key} to={PATHS.PAGE_CONTENT_EDIT(page.key)} title={page.title} description={page.description} meta={`${page.sections.length} sections`} />
        ))}
      </div>

      {createdPages.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-1 text-base font-semibold text-gray-900">Pages you created</h2>
          <p className="mb-3 max-w-2xl text-sm text-gray-600">
            Pages added under Pages appear here automatically and are shown on the website at their address. Click one to edit its text.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {createdPages.map((page) => (
              <ContentCard
                key={page.id}
                to={PATHS.PAGE_DETAIL(page.id)}
                title={page.title}
                description={publicPageUrl(page.slug) ?? "No address yet"}
                meta={page.isActive ? "Published" : "Hidden"}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
