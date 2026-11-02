/**
 * Typed error thrown by the API client for any non-2xx response, so
 * callers can `catch (e) { if (e instanceof ApiError) ... }` instead of
 * inspecting a generic Error's message string.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  /** Parsed JSON body when the response was JSON, raw text otherwise, or undefined if the body was empty/unreadable. */
  readonly body: unknown;
  readonly requestId?: string;

  constructor(params: {
    status: number;
    statusText: string;
    url: string;
    body?: unknown;
    requestId?: string;
  }) {
    const bodyMessage =
      params.body &&
      typeof params.body === "object" &&
      "message" in params.body &&
      typeof (params.body as { message?: unknown }).message === "string"
        ? (params.body as { message: string }).message
        : undefined;

    super(
      bodyMessage ??
        `API request failed: ${params.status} ${params.statusText} (${params.url})`,
    );
    this.name = "ApiError";
    this.status = params.status;
    this.statusText = params.statusText;
    this.url = params.url;
    this.body = params.body;
    this.requestId = params.requestId;
  }

  /** True for network-adjacent 5xx responses, as opposed to 4xx client errors. */
  get isServerError(): boolean {
    return this.status >= 500;
  }
}
