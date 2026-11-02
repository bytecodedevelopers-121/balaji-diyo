import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("absoluteUrl", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("joins the site origin and a path with exactly one slash", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const { absoluteUrl } = await import("./canonical");
    expect(absoluteUrl("/trips")).toBe("https://example.com/trips");
  });

  it("adds a leading slash to a path that's missing one", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const { absoluteUrl } = await import("./canonical");
    expect(absoluteUrl("trips")).toBe("https://example.com/trips");
  });

  it("strips a trailing slash on both the origin and the path", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    const { absoluteUrl } = await import("./canonical");
    expect(absoluteUrl("/trips/")).toBe("https://example.com/trips");
  });

  it("defaults to the root path", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const { absoluteUrl } = await import("./canonical");
    expect(absoluteUrl()).toBe("https://example.com/");
  });
});

describe("canonicalUrl", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // NEXT_PUBLIC_APP_ENV is process-global; restore the suite default so
    // mutations here can't leak into other test files sharing this worker.
    process.env.NEXT_PUBLIC_APP_ENV = "development";
  });

  it("returns the absolute URL in production", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    process.env.NEXT_PUBLIC_APP_ENV = "production";
    const { canonicalUrl } = await import("./canonical");
    expect(canonicalUrl("/trips")).toBe("https://example.com/trips");
  });

  it("returns undefined outside production, e.g. on staging", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://staging.example.com";
    process.env.NEXT_PUBLIC_APP_ENV = "staging";
    const { canonicalUrl } = await import("./canonical");
    expect(canonicalUrl("/trips")).toBeUndefined();
  });
});
