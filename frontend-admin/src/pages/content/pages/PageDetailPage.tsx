import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { PageForm } from "@/components/page/PageForm";
import { usePage, usePages, useUpdatePage } from "@/hooks/queries/usePages";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function PageDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: fetchError } = usePage(id);
  const { data: pagesData } = usePages({ perPage: 200 });
  const updatePage = useUpdatePage(id);
  const page = data?.data;
  const status = getErrorStatus(fetchError);

  useEffect(() => {
    document.title = page ? `${page.title} | ${COMPANY_INFO.name} Admin` : `Page | ${COMPANY_INFO.name} Admin`;
  }, [page]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Page not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.PAGES)}>
          ← Back to Pages
        </Button>
      </PageCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={page?.title ?? "Edit Page"} isLoading={isLoading} backHref={PATHS.PAGES} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        {isLoading || !page ? (
          <Skeleton count={6} />
        ) : (
          <PageForm
            defaultValues={page}
            pages={pagesData?.data.items ?? []}
            onSubmit={(values) => {
              setError(null);
              updatePage.mutate(values, {
                onSuccess: () => navigate(PATHS.PAGES),
                onError: (err) => setError(getErrorMessage(err)),
              });
            }}
            isLoading={updatePage.isPending}
            submitLabel="Save Changes"
          />
        )}
      </PageCard>
    </div>
  );
}
