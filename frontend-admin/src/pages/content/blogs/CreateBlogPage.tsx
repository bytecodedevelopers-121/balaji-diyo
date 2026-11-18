import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { BlogForm } from "@/components/blog/BlogForm";
import { useCreateBlog } from "@/hooks/queries/useBlogs";
import { getErrorMessage } from "@/lib/apiError";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";

export default function CreateBlogPage() {
  const navigate = useNavigate();
  const createBlog = useCreateBlog();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Create Blog | ${COMPANY_INFO.name} Admin`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Create Blog" backHref={PATHS.BLOGS} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <BlogForm
          onSubmit={(data) => {
            setError(null);
            createBlog.mutate(data, {
              // Photos can only be attached to a saved blog, so open it for editing straight away.
              onSuccess: (res) => navigate(res?.data?.id ? PATHS.BLOG_DETAIL(res.data.id) : PATHS.BLOGS),
              onError: (err) => setError(getErrorMessage(err)),
            });
          }}
          isLoading={createBlog.isPending}
          submitLabel="Create Blog"
        />
      </PageCard>
    </div>
  );
}
