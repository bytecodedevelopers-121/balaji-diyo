import { Drawer } from "@/components/ui/Drawer";
import { Alert } from "@/components/ui/Alert";
import { PlaceForm } from "./PlaceForm";
import type { PlaceFormValues } from "@/types/place";

interface PlaceCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlaceFormValues) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

// Wraps the existing standalone PlaceForm (same one CreatePlacePage uses) in
// a Drawer for inline use from a Places picker — same fields, same
// validation, no trimmed-down duplicate.
export function PlaceCreateDrawer({ isOpen, onClose, onSubmit, isLoading, error, onDismissError }: PlaceCreateDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="New Place" size="lg">
      <div className="space-y-4">
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}
        <PlaceForm onSubmit={onSubmit} isLoading={isLoading} submitLabel="Create Place" />
      </div>
    </Drawer>
  );
}
