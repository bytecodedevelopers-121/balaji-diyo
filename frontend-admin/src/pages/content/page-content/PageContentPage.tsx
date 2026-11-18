import { useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAGE_DEFS, PAGE_GROUPS } from "@/constants/pageContent";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import { ContentCard } from "./PageCards";

/** Lists the website pages whose sections can be edited in the CMS; related pages sit inside a folder card. */
export default function PageContentPage() {
  useEffect(() => {
    document.title = `Page Content | ${COMPANY_INFO.name} Admin`;
  }, []);

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
    </>
  );
}
