import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { CompanyDocumentForm } from "@/components/company-document/CompanyDocumentForm";
import { useCreateCompanyDocument } from "@/hooks/queries/useCompanyDocuments";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CreateCompanyDocumentPage() {
  const navigate = useNavigate();
  const createDocument = useCreateCompanyDocument();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Create Company Document | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Company Document" backHref={PATHS.COMPANY_DOCUMENTS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <CompanyDocumentForm
          onSubmit={(data) => {
            setError(null);
            createDocument.mutate(data, {
              onSuccess: () => navigate(PATHS.COMPANY_DOCUMENTS),
              onError: (err) => setError(getErrorMessage(err)),
            });
          }}
          isLoading={createDocument.isPending}
          submitLabel="Create Document"
        />
      </PageCard>
    </div>
  );
}
