import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./HeroSection";

vi.mock("@/features/trips/api/get-category-by-slug", () => ({
  getCategoryPackageCount: async () => null,
}));

describe("HeroSection", () => {
  it("renders the hero heading", async () => {
    render(await HeroSection());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /nepal's local trekking agency/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the real hero video with a poster fallback, both decorative", async () => {
    const { container } = render(await HeroSection());

    const video = container.querySelector("video");
    expect(video).toHaveAttribute("aria-hidden", "true");
    expect(video).toHaveAttribute("poster", "/images/hero/hero-poster.jpg");

    const sources = container.querySelectorAll("video source");
    expect(sources).toHaveLength(1);
    expect(sources[0]).toHaveAttribute("src", "/videos/hero-1.mp4");

    // prefers-reduced-motion fallback image — decorative, same asset used
    // as the video's poster.
    const fallbackImg = container.querySelector("img")!;
    expect(fallbackImg.getAttribute("src")).toContain("hero-poster.jpg");
  });
});
