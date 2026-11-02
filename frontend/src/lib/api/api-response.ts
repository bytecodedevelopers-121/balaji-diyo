import type { ApiEnvelope } from "@/types/api.types";

/**
 * Runtime check that a parsed JSON body actually looks like the backend's
 * envelope (see backend/src/common/dto/api-response.dto.ts) before the API
 * client trusts its `data`/`message` fields. Guards against the API (or a
 * proxy/CDN in front of it) returning something else on error paths.
 */
export function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "statusCode" in value &&
    "data" in value
  );
}
