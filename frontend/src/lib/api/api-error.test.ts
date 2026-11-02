import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error";

describe("ApiError", () => {
  it("uses the response body's message when present", () => {
    const error = new ApiError({
      status: 404,
      statusText: "Not Found",
      url: "https://api.example.com/packages/does-not-exist",
      body: { status: "error", message: "Package not found" },
    });

    expect(error.message).toBe("Package not found");
    expect(error.name).toBe("ApiError");
    expect(error.status).toBe(404);
  });

  it("falls back to a generic message when the body has none", () => {
    const error = new ApiError({
      status: 500,
      statusText: "Internal Server Error",
      url: "https://api.example.com/packages",
    });

    expect(error.message).toContain("500");
    expect(error.message).toContain("https://api.example.com/packages");
  });

  it("flags 5xx as a server error and 4xx as not", () => {
    const serverError = new ApiError({
      status: 500,
      statusText: "Internal Server Error",
      url: "https://api.example.com/x",
    });
    const clientError = new ApiError({
      status: 400,
      statusText: "Bad Request",
      url: "https://api.example.com/x",
    });

    expect(serverError.isServerError).toBe(true);
    expect(clientError.isServerError).toBe(false);
  });

  it("carries the request id through when the envelope has one", () => {
    const error = new ApiError({
      status: 409,
      statusText: "Conflict",
      url: "https://api.example.com/redirects",
      body: { status: "error", message: "Already exists" },
      requestId: "req-123",
    });

    expect(error.requestId).toBe("req-123");
  });
});
