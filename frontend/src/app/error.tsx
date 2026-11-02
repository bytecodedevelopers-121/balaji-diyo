"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Replace with the project's error-tracking sink once one is chosen.
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Something went wrong
      </h1>
      <p className="max-w-md text-neutral-600">
        An unexpected error occurred while rendering this page.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </Container>
  );
}
