import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { TripMapForm } from "@/components/package/TripMapForm";
import { usePackages } from "@/hooks/queries/usePackages";
import { usePackageMap, useUpdatePackageMap } from "@/hooks/queries/usePackageMaps";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function TripMapDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: fetchError } = usePackageMap(id);
  const updateTripMap = useUpdatePackageMap(id);
  const tripMap = data?.data;
  const status = getErrorStatus(fetchError);

  const { data: packagesData } = usePackages({ perPage: 200 });
  const packageOptions = (packagesData?.data.items ?? []).map((p) => ({ value: p.id, label: p.title }));

  useEffect(() => {
    document.title = tripMap ? `${tripMap.mapTitle} | ${COMPANY_INFO.name} Admin` : `Trip Map | ${COMPANY_INFO.name} Admin`;
  }, [tripMap]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Trip map not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.TRIP_MAPS)}>
          ← Back to Trip Maps
        </Button>
      </PageCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={tripMap?.mapTitle ?? "Edit Trip Map"} isLoading={isLoading} backHref={PATHS.TRIP_MAPS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        {isLoading || !tripMap ? (
          <Skeleton count={6} />
        ) : (
          <TripMapForm
            defaultValues={tripMap}
            packageOptions={packageOptions}
            onSubmit={(values) => {
              // `values` includes `packageId` (TripMapFormValues always does),
              // but UpdatePackageMapDto doesn't accept it — packageId is
              // immutable after creation, and the backend DTO omits/ignores
              // it anyway, so it's simplest to just pass the object through.
              setError(null);
              updateTripMap.mutate(values, {
                onSuccess: () => navigate(PATHS.TRIP_MAPS),
                onError: (err) => setError(getErrorMessage(err)),
              });
            }}
            isLoading={updateTripMap.isPending}
            submitLabel="Save Changes"
          />
        )}
      </PageCard>
    </div>
  );
}
