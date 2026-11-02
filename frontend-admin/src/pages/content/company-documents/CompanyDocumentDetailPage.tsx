import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { CompanyDocumentForm } from "@/components/company-document/CompanyDocumentForm";
import { useCompanyDocument, useUpdateCompanyDocument } from "@/hooks/queries/useCompanyDocuments";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CompanyDocumentDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: fetchError } = useCompanyDocument(id);
  const updateDocument = useUpdateCompanyDocument(id);
  const doc = data?.data;
  const status = getErrorStatus(fetchError);

  useEffect(() => {
    document.title = doc ? `${doc.title} | ${COMPANY_INFO.name} Admin` : `Company Document | ${COMPANY_INFO.name} Admin`;
  }, [doc]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Company document not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.COMPANY_DOCUMENTS)}>
          ← Back to Company Documents
        </Button>
      </PageCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={doc?.title ?? "Edit Company Document"} isLoading={isLoading} backHref={PATHS.COMPANY_DOCUMENTS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        {isLoading || !doc ? (
          <Skeleton count={6} />
        ) : (
          <CompanyDocumentForm
            defaultValues={doc}
            onSubmit={(values) => {
              setError(null);
              updateDocument.mutate(values, {
                onSuccess: () => navigate(PATHS.COMPANY_DOCUMENTS),
                onError: (err) => setError(getErrorMessage(err)),
              });
            }}
            isLoading={updateDocument.isPending}
            submitLabel="Save Changes"
          />
        )}
      </PageCard>
    </div>
  );
}
