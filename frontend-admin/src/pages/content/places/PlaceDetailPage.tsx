import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { PlaceForm } from "@/components/place/PlaceForm";
import { usePlace, useUpdatePlace } from "@/hooks/queries/usePlaces";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function PlaceDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: fetchError } = usePlace(id);
  const updatePlace = useUpdatePlace(id);
  const place = data?.data;
  const status = getErrorStatus(fetchError);

  useEffect(() => {
    document.title = place ? `${place.placeName} | ${COMPANY_INFO.name} Admin` : `Place | ${COMPANY_INFO.name} Admin`;
  }, [place]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Place not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.PLACES)}>
          ← Back to Places
        </Button>
      </PageCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={place?.placeName ?? "Edit Place"} isLoading={isLoading} backHref={PATHS.PLACES} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        {isLoading || !place ? (
          <Skeleton count={6} />
        ) : (
          <PlaceForm
            defaultValues={place}
            onSubmit={(values) => {
              setError(null);
              updatePlace.mutate(values, {
                onSuccess: () => navigate(PATHS.PLACES),
                onError: (err) => setError(getErrorMessage(err)),
              });
            }}
            isLoading={updatePlace.isPending}
            submitLabel="Save Changes"
          />
        )}
      </PageCard>
    </div>
  );
}
