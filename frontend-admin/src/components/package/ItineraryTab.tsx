import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ItineraryForm } from "./ItineraryForm";
import { usePermission } from "@/hooks/usePermission";
import { useItineraryByPackageId, useCreateItinerary, useUpdateItinerary, useDeleteItinerary } from "@/hooks/queries/useItinerary";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";

interface ItineraryTabProps {
  packageId: string;
}

export function ItineraryTab({ packageId }: ItineraryTabProps) {
  const canEdit = usePermission("update:travel");
  const canCreate = usePermission("create:travel");
  const canDelete = usePermission("delete:travel");

  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, error: fetchError } = useItineraryByPackageId(packageId);
  const itinerary = data?.data;
  const notCreatedYet = isError && getErrorStatus(fetchError) === 404;

  const createItinerary = useCreateItinerary(packageId);
  const updateItinerary = useUpdateItinerary(packageId, itinerary?.id ?? "");
  const deleteItinerary = useDeleteItinerary(packageId);

  if (isLoading) return <Skeleton count={4} />;

  if (isError && !notCreatedYet) {
    return <Alert variant="error" message="Failed to load the itinerary." />;
  }

  if (notCreatedYet || !itinerary) {
    if (!canCreate) {
      return <p className="text-sm text-gray-500">No itinerary has been created for this package yet.</p>;
    }
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">This package doesn't have an itinerary yet.</p>
        {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
        <ItineraryForm
          onSubmit={(values) => {
            setError(null);
            createItinerary.mutate(values, { onError: (err) => setError(getErrorMessage(err)) });
          }}
          isLoading={createItinerary.isPending}
          submitLabel="Create Itinerary"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <fieldset disabled={!canEdit} className="space-y-4">
        <ItineraryForm
          defaultValues={itinerary}
          onSubmit={(values) => {
            setError(null);
            updateItinerary.mutate(values, { onError: (err) => setError(getErrorMessage(err)) });
          }}
          isLoading={updateItinerary.isPending}
          submitLabel="Save Changes"
        />
      </fieldset>

      {canDelete && (
        <div className="border-t border-gray-100 pt-4">
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete Itinerary
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Delete Itinerary"
        message="Are you sure you want to delete this itinerary? This cannot be undone."
        onConfirm={() => {
          deleteItinerary.mutate(itinerary.id, {
            onSuccess: () => setDeleteOpen(false),
            onError: (err) => {
              setError(getErrorMessage(err));
              setDeleteOpen(false);
            },
          });
        }}
        onCancel={() => setDeleteOpen(false)}
        isLoading={deleteItinerary.isPending}
      />
    </div>
  );
}
