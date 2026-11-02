"use client"; // Error boundaries must be Client Components

// global-error replaces the root layout entirely when active, so it must
// bring its own <html>/<body> and its own globals.css import — it does
// not inherit anything from layout.tsx. Kept free of other component
// imports on purpose: if the app's own code is what's failing, this page
// should still have the best chance of rendering.
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-8 text-center text-neutral-900">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-neutral-600">
          A critical error occurred. Please try again.
        </p>
        <button
          onClick={() => retry()}
          className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-button-m font-medium text-white hover:bg-neutral-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
