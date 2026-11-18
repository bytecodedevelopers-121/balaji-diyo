import { isAxiosError } from "axios";

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export function getErrorMessage(error: unknown, fallback = DEFAULT_MESSAGE): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

/** The message plus, for validation failures, each field and why it was rejected ("title: too short"). */
export function getDetailedErrorMessage(error: unknown, fallback = DEFAULT_MESSAGE): string {
  const base = getErrorMessage(error, fallback);
  const fields = getFieldErrors(error);
  if (!fields || fields.length === 0) return base;
  return `${base}: ${fields.map((f) => `${f.field || "form"} (${f.message})`).join("; ")}`;
}

export function getErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export interface FieldError {
  field: string;
  message: string;
}

// Populated by the backend's error middleware for Zod validation failures
// (statusCode 400) — lets forms highlight exactly which field failed instead
// of just showing the generic "Validation failed" message.
export function getFieldErrors(error: unknown): FieldError[] | undefined {
  return isAxiosError<{ errors?: FieldError[] }>(error) ? error.response?.data?.errors : undefined;
}
