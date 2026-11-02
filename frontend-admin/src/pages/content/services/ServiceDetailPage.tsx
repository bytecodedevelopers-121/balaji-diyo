import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ServiceForm } from "@/components/service/ServiceForm";
import { PageCard } from "@/components/layout/PageCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { COMPANY_INFO } from "@/constants";
import { PATHS } from "@/constants/PATHS";
import { useService, useUpdateService } from "@/hooks/queries/useServices";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";

export default function ServiceDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading, isError, error: fetchError } = useService(id);
  const updateService = useUpdateService(id);
  const service = data?.data;

  useEffect(() => {
    document.title = service ? `${service.title} | ${COMPANY_INFO.name} Admin` : `Service | ${COMPANY_INFO.name} Admin`;
  }, [service]);

  if (isError && getErrorStatus(fetchError) === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Service not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.SERVICES)}>
          ← Back to Services
        </Button>
      </PageCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={service?.title ?? "Edit Service"} isLoading={isLoading} backHref={PATHS.SERVICES} />
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
      <PageCard>
        {isLoading || !service ? (
          <Skeleton count={7} />
        ) : (
          <ServiceForm
            defaultValues={service}
            onSubmit={(values) => {
              setError(null);
              updateService.mutate(values, {
                onSuccess: () => navigate(PATHS.SERVICES),
                onError: (mutationError) => setError(getErrorMessage(mutationError)),
              });
            }}
            isLoading={updateService.isPending}
            submitLabel="Save Changes"
          />
        )}
      </PageCard>
    </div>
  );
}
