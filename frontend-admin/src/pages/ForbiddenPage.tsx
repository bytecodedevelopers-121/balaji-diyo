import { Link } from "react-router-dom";
import { PATHS } from "@/constants/PATHS";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <h1 className="text-5xl font-bold text-on-surface">403</h1>
      <p className="text-sm text-on-surface-variant">
        You don&apos;t have permission to view this page.
      </p>
      <Link
        to={PATHS.DASHBOARD}
        className="mt-2 text-sm font-semibold text-primary hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
