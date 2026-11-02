import type { ReactNode } from "react";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface SecureImageProps {
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}

// For PRIVATE bucket images only (rare case) — resolves a signed URL from
// the backend before rendering, since the bucket has no public reads.
export function SecureImage({ path, alt, className, fallback = null }: SecureImageProps) {
  const { data: signedUrl, isLoading, isError } = useSignedUrl(path);

  if (!path || isLoading || isError || !signedUrl) {
    return <>{fallback}</>;
  }

  return <img src={signedUrl} alt={alt} className={className} />;
}
