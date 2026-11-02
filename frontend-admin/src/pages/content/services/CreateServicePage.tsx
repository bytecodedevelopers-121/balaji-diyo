import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ServiceForm } from "@/components/service/ServiceForm";
import { Alert } from "@/components/ui/Alert";
import { PageCard } from "@/components/layout/PageCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { COMPANY_INFO } from "@/constants";
import { PATHS } from "@/constants/PATHS";
import { useCreateService } from "@/hooks/queries/useServices";
import { getErrorMessage } from "@/lib/apiError";

export default function CreateServicePage() {
  const navigate = useNavigate();
  const createService = useCreateService();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Create Service | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Service" backHref={PATHS.SERVICES} />
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      <PageCard>
        <ServiceForm
          onSubmit={(values) => {
            setError(null);
            createService.mutate(values, {
              onSuccess: () => navigate(PATHS.SERVICES),
              onError: (mutationError) => setError(getErrorMessage(mutationError)),
            });
          }}
          isLoading={createService.isPending}
          submitLabel="Create Service"
        />
      </PageCard>
    </div>
  );
}
