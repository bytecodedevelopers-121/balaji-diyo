import { Drawer } from "@/components/ui/Drawer";
import { Alert } from "@/components/ui/Alert";
import { TeamMemberForm } from "./TeamMemberForm";
import type { TeamMemberFormValues } from "@/types/team-member";

interface TeamMemberCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeamMemberFormValues) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

// Wraps the existing standalone TeamMemberForm (same one CreateTeamMemberPage
// uses) in a Drawer for inline use from a Team Members picker.
export function TeamMemberCreateDrawer({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  onDismissError,
}: TeamMemberCreateDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="New Team Member" size="lg">
      <div className="space-y-4">
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}
        <TeamMemberForm onSubmit={onSubmit} isLoading={isLoading} submitLabel="Create Team Member" />
      </div>
    </Drawer>
  );
}
