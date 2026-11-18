import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { getPageDef, getPageGroup } from "@/constants/pageContent";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import { ContentCard } from "./PageCards";

/** The pages inside one Page Content folder (e.g. Company). */
export default function PageGroupPage() {
  const { groupKey = "" } = useParams();
  const group = getPageGroup(groupKey);

  useEffect(() => {
    document.title = `${group?.title ?? "Page Content"} | ${COMPANY_INFO.name} Admin`;
  }, [group]);

  if (!group) return <Navigate to={PATHS.PAGE_CONTENT} replace />;

  const pages = group.pages.flatMap((key) => getPageDef(key) ?? []);

  return (
    <>
      <PageHeader
        title={group.title}
        backHref={PATHS.PAGE_CONTENT}
        breadcrumbs={[{ label: "Page Content", href: PATHS.PAGE_CONTENT }, { label: group.title }]}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {pages.map((page) => (
          <ContentCard key={page.key} to={PATHS.PAGE_CONTENT_EDIT(page.key)} title={page.title} description={page.description} meta={`${page.sections.length} sections`} />
        ))}
      </div>
    </>
  );
}
