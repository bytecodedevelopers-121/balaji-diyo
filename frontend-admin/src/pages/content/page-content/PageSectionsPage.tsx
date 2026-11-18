import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { SectionEditor } from "@/components/page-content/SectionEditor";
import { getPageDef } from "@/constants/pageContent";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import { usePermission } from "@/hooks/usePermission";
import { usePageSections, useSaveSection } from "@/hooks/queries/usePageSections";
import { getErrorMessage } from "@/lib/apiError";

const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "http://localhost:3000").replace(/\/+$/, "");

/** Edits every section of one website page (`/page-content/:pageKey`). */
export default function PageSectionsPage() {
  const { pageKey = "" } = useParams();
  const def = getPageDef(pageKey);
  const canEdit = usePermission("update:settings");

  useEffect(() => {
    document.title = `${def?.title ?? "Page Content"} | ${COMPANY_INFO.name} Admin`;
  }, [def]);

  const { data, isLoading, isError, error } = usePageSections(pageKey);
  const save = useSaveSection(pageKey);

  if (!def) return <Navigate to={PATHS.PAGE_CONTENT} replace />;

  const saved = new Map((data?.data ?? []).map((section) => [section.sectionKey, section]));

  return (
    <>
      <PageHeader
        title={def.title}
        backHref={PATHS.PAGE_CONTENT}
        breadcrumbs={[{ label: "Page Content", href: PATHS.PAGE_CONTENT }, { label: def.title }]}
        action={
          <a href={`${SITE_URL}${def.path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline">
            View page <ExternalLink size={14} />
          </a>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <Alert variant="error" message={getErrorMessage(error)} />
      ) : (
        <div className="space-y-3">
          {def.sections.map((section) => {
            const row = saved.get(section.key);
            return (
              <SectionEditor
                // Remount when the saved row changes so the form reflects what the server stored.
                key={`${section.key}:${row?.updatedAt ?? "new"}`}
                def={section}
                saved={row}
                canEdit={canEdit}
                onSave={(payload) => save.mutateAsync({ sectionKey: section.key, data: payload })}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
