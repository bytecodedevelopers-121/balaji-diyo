import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LayoutTemplate } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { PAGE_DEFS } from "@/constants/pageContent";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

/** Lists the website pages whose sections can be edited in the CMS. */
export default function PageContentPage() {
  useEffect(() => {
    document.title = `Page Content | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <>
      <PageHeader title="Page Content" breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Page Content" }]} />
      <p className="mb-5 max-w-2xl text-sm text-gray-600">
        Edit the text, images, links and visibility of each section on the public website. Changes appear on the site within about a minute.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PAGE_DEFS.map((page) => (
          <Link key={page.key} to={PATHS.PAGE_CONTENT_EDIT(page.key)} className="group block">
            <PageCard className="h-full transition-shadow group-hover:shadow-md">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-logo-sun/20 p-2 text-logo-navy-dark">
                  <LayoutTemplate size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{page.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{page.description}</p>
                  <p className="mt-2 text-xs font-medium text-gray-400">{page.sections.length} sections</p>
                </div>
                <ChevronRight size={18} className="mt-1 text-gray-300 group-hover:text-gray-500" />
              </div>
            </PageCard>
          </Link>
        ))}
      </div>
    </>
  );
}
