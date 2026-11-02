import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { StoryForm } from "@/components/story/StoryForm";
import { useCreateStory } from "@/hooks/queries/useStories";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const createStory = useCreateStory();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Create Story | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Story" backHref={PATHS.STORIES} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <StoryForm
          onSubmit={(data) => {
            setError(null);
            createStory.mutate(data, {
              onSuccess: () => navigate(PATHS.STORIES),
              onError: (err) => setError(getErrorMessage(err)),
            });
          }}
          isLoading={createStory.isPending}
          submitLabel="Create Story"
        />
      </PageCard>
    </div>
  );
}
