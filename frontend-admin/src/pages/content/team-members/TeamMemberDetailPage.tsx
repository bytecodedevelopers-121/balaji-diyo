import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { TeamMemberForm } from "@/components/team-member/TeamMemberForm";
import { useTeamMember, useUpdateTeamMember } from "@/hooks/queries/useTeamMembers";
import { getErrorMessage, getErrorStatus } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function TeamMemberDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: fetchError } = useTeamMember(id);
  const updateMember = useUpdateTeamMember(id);
  const member = data?.data;
  const status = getErrorStatus(fetchError);

  useEffect(() => {
    document.title = member ? `${member.fullName} | ${COMPANY_INFO.name} Admin` : `Team Member | ${COMPANY_INFO.name} Admin`;
  }, [member]);

  if (isError && status === 404) {
    return (
      <PageCard className="text-center">
        <p className="text-sm text-gray-600">Team member not found.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(PATHS.TEAM_MEMBERS)}>
          ← Back to Team Members
        </Button>
      </PageCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={member?.fullName ?? "Edit Team Member"} isLoading={isLoading} backHref={PATHS.TEAM_MEMBERS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        {isLoading || !member ? (
          <Skeleton count={6} />
        ) : (
          <TeamMemberForm
            defaultValues={member}
            onSubmit={(values) => {
              setError(null);
              updateMember.mutate(values, {
                onSuccess: () => navigate(PATHS.TEAM_MEMBERS),
                onError: (err) => setError(getErrorMessage(err)),
              });
            }}
            isLoading={updateMember.isPending}
            submitLabel="Save Changes"
          />
        )}
      </PageCard>
    </div>
  );
}
