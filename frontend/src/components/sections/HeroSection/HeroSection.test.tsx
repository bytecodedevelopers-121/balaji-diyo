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
        name: /nepal's local trekking agency.*live the nepal/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the category cards as links", async () => {
    render(await HeroSection());

    expect(screen.getByRole("link", { name: /trekking and hiking/i })).toHaveAttribute(
      "href",
      "/trekking-routes-in-nepal",
    );
    expect(screen.getByRole("link", { name: /deals and discounts/i })).toBeInTheDocument();
  });
});
