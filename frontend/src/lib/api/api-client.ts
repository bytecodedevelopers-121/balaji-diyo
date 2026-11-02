import "server-only";
import { getServerEnv } from "@/lib/env";
import { ApiError } from "./api-error";
import { isApiEnvelope } from "./api-response";

/**
 * Options for `apiFetch`. Extends the native `RequestInit` with Next.js's
 * fetch extensions so callers get full control over caching per request.
 */
export type ApiRequestOptions = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    // Not JSON — hand back the raw text instead of throwing, so callers of
    // non-JSON endpoints (if any exist) still get the response body.
    return text;
  }
}

/**
 * Typed fetch wrapper for calling the Express API from Server Components
 * and Route Handlers.
 *
 * Not for Client Components: this module reads the private `API_URL` via
 * `getServerEnv()`, which is guarded by the `server-only` package and will
 * fail the build if pulled into client code. A Client Component that
 * genuinely needs to call the API directly should use
 * `NEXT_PUBLIC_API_URL` with a plain `fetch` instead of importing this
 * module.
 *
 * Unwraps the backend's `{ status, statusCode, message, data }` envelope
 * (see backend/src/common/dto/api-response.dto.ts) and resolves with
 * `data`, typed as `T`. Throws `ApiError` for any non-2xx response and for
 * an envelope with `status: "error"`.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { API_URL } = getServerEnv();
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const { headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...headers,
      },
    });
  } catch (cause) {
    // Network failure / DNS error / timeout — surface a typed error
    // instead of letting an opaque "fetch failed" bubble up.
    throw new ApiError({
      status: 0,
      statusText: "Network Error",
      url,
      body: cause instanceof Error ? cause.message : cause,
    });
  }

  const body = await parseBody(response);

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      statusText: response.statusText,
      url,
      body,
      requestId: isApiEnvelope(body) ? body.requestId : undefined,
    });
  }

  if (body === undefined) {
    // 2xx with an empty body (e.g. 204 No Content) — nothing to unwrap.
    return undefined as T;
  }

  if (isApiEnvelope(body)) {
    if (body.status === "error") {
      throw new ApiError({
        status: body.statusCode,
        statusText: body.message,
        url,
        body,
        requestId: body.requestId,
      });
    }
    return body.data as T;
  }

  // 2xx but not wrapped in the expected envelope — return as-is rather
  // than silently discarding a response callers might rely on.
  return body as T;
}
