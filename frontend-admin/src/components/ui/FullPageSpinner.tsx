import { Loader2 } from "lucide-react";

/**
 * Full-viewport loading indicator shown while the session is being restored.
 */
export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
