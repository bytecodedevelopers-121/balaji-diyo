import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { PlaceForm } from "@/components/place/PlaceForm";
import { useCreatePlace } from "@/hooks/queries/usePlaces";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CreatePlacePage() {
  const navigate = useNavigate();
  const createPlace = useCreatePlace();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Create Place | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Place" backHref={PATHS.PLACES} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <PlaceForm
          onSubmit={(data) => {
            setError(null);
            createPlace.mutate(data, {
              onSuccess: () => navigate(PATHS.PLACES),
              onError: (err) => setError(getErrorMessage(err)),
            });
          }}
          isLoading={createPlace.isPending}
          submitLabel="Create Place"
        />
      </PageCard>
    </div>
  );
}
