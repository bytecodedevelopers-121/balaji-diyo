import { NextRequest } from "next/server";
import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config, proxy } from "./proxy";

afterEach(() => {
  vi.restoreAllMocks();
});

function apiResponse(data: unknown, ok = true) {
  return Promise.resolve(
    new Response(JSON.stringify({ status: "success", data }), {
      status: ok ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("redirect proxy", () => {
  it("returns a permanent redirect and preserves unconfigured query values", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      apiResponse({ destination: "/new-page?campaign=configured", isPermanent: true }),
    );

    const response = await proxy(
      new NextRequest("https://boundless.example/old-page?campaign=incoming&ref=google"),
    );

    expect(response.status).toBe(308);
    expect(getRedirectUrl(response)).toBe(
      "https://boundless.example/new-page?campaign=configured&ref=google",
    );
    const [lookupUrl, lookupOptions] = vi.mocked(fetch).mock.calls[0];
    expect(String(lookupUrl)).toBe("http://localhost:4000/redirects/resolve?path=%2Fold-page");
    expect(lookupOptions?.headers).toEqual({ Accept: "application/json" });
  });

  it("uses 307 for a temporary redirect", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      apiResponse({ destination: "/preview", isPermanent: false }),
    );

    const response = await proxy(new NextRequest("https://boundless.example/old"));

    expect(response.status).toBe(307);
    expect(getRedirectUrl(response)).toBe("https://boundless.example/preview");
  });

  it("continues normal routing for misses, failures, and unsafe destinations", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    fetchMock.mockImplementationOnce(() => apiResponse(null));
    expect((await proxy(new NextRequest("https://boundless.example/missing"))).status).toBe(200);

    fetchMock.mockRejectedValueOnce(new Error("API unavailable"));
    expect((await proxy(new NextRequest("https://boundless.example/available"))).status).toBe(200);

    fetchMock.mockImplementationOnce(() =>
      apiResponse({ destination: "javascript:alert(1)", isPermanent: true }),
    );
    expect((await proxy(new NextRequest("https://boundless.example/unsafe"))).status).toBe(200);
  });

  it("does not look up non-navigation methods", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const response = await proxy(
      new NextRequest("https://boundless.example/contact", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("redirect proxy matcher", () => {
  it.each(["/api/contact", "/_next/static/app.js", "/logo.svg", "/robots.txt"])(
    "excludes %s",
    (url) => {
      // The installed Next.js 16.3 runtime still exports the helper under its
      // pre-Proxy name even though the bundled documentation uses the new one.
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
    },
  );

  it.each(["/old-page", "/nested/legacy-page", "/old-page.html"])("includes %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
  });
});
