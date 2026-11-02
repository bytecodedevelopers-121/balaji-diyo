import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { PageForm } from "@/components/page/PageForm";
import { useCreatePage, usePages } from "@/hooks/queries/usePages";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CreatePagePage() {
  const navigate = useNavigate();
  const createPage = useCreatePage();
  const [error, setError] = useState<string | null>(null);
  const { data: pagesData } = usePages({ perPage: 200 });

  useEffect(() => {
    document.title = `Create Page | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Page" backHref={PATHS.PAGES} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <PageForm
          pages={pagesData?.data.items ?? []}
          onSubmit={(data) => {
            setError(null);
            createPage.mutate(data, {
              onSuccess: () => navigate(PATHS.PAGES),
              onError: (err) => setError(getErrorMessage(err)),
            });
          }}
          isLoading={createPage.isPending}
          submitLabel="Create Page"
        />
      </PageCard>
    </div>
  );
}
