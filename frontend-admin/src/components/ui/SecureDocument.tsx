import { useState } from "react";
import { FileText } from "lucide-react";
import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/apiError";
import { cn } from "@/utils";
import { Spinner } from "./Spinner";

interface SecureDocumentProps {
  path: string | null | undefined;
  label?: string;
  className?: string;
}

// Opens a private file in a new tab by fetching it with the JWT Bearer token,
// creating a blob object URL, and opening it in a new window.
//
// Old Supabase approach (commented out — fetched a signed URL then opened it):
// const res = await api.post("/files/signed-url", { path });
// const signedUrl: string = res.data.data.signedUrl;
// window.open(signedUrl, "_blank", "noopener,noreferrer");
export function SecureDocument({ path, label = "View", className }: SecureDocumentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleClick = async () => {
    if (!path) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/files/private/${path}`, { responseType: "blob" });
      const objectUrl = URL.createObjectURL(res.data as Blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      // Revoke after a delay — enough time for the browser to start loading the tab.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={!path || isLoading}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        {isLoading ? <Spinner size="sm" /> : <FileText className="h-4 w-4" />}
        {label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
