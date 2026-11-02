import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { TeamMemberForm } from "@/components/team-member/TeamMemberForm";
import { useCreateTeamMember } from "@/hooks/queries/useTeamMembers";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CreateTeamMemberPage() {
  const navigate = useNavigate();
  const createMember = useCreateTeamMember();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Create Team Member | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Team Member" backHref={PATHS.TEAM_MEMBERS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <TeamMemberForm
          onSubmit={(data) => {
            setError(null);
            createMember.mutate(data, {
              onSuccess: () => navigate(PATHS.TEAM_MEMBERS),
              onError: (err) => setError(getErrorMessage(err)),
            });
          }}
          isLoading={createMember.isPending}
          submitLabel="Create Team Member"
        />
      </PageCard>
    </div>
  );
}
