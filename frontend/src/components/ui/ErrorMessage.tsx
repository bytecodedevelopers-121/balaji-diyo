interface ErrorMessageProps {
  title?: string;
  message: string;
}

/** Inline error display for a section/data block, distinct from the route-level error.tsx boundary. */
export function ErrorMessage({
  title = "Something went wrong",
  message,
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-helper-m text-red-800"
    >
      <p className="font-medium">{title}</p>
      <p>{message}</p>
    </div>
  );
}
