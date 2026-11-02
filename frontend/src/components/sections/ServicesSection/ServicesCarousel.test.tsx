import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HomepageService } from "@/features/services/types/service.types";
import { ServicesCarousel } from "./ServicesCarousel";

const services: HomepageService[] = [
  {
    id: "one",
    title: "Adventure Tourism",
    description: "Adventure description",
    secondaryDescription: "A second adventure paragraph",
    imageUrl: "/adventure.jpg",
    ctaLabel: "Explore adventures",
    ctaUrl: "/adventures",
    sortOrder: 1,
  },
  {
    id: "two",
    title: "Cultural Tours",
    description: "Culture description",
    secondaryDescription: null,
    imageUrl: "/culture.jpg",
    ctaLabel: "Explore culture",
    ctaUrl: "https://example.com/culture",
    sortOrder: 2,
  },
];

describe("ServicesCarousel", () => {
  it("renders only the first managed service, with no CTA link and no way to switch to another", () => {
    render(
      <ServicesCarousel
        section={{
          id: "homepage-services",
          eyebrow: "Managed services label",
          heading: "Managed services heading",
          introduction: "Managed services introduction",
        }}
        services={services}
      />,
    );

    expect(screen.getByRole("heading", { name: "Managed services heading" })).toBeInTheDocument();
    expect(screen.getByText("Managed services introduction")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Adventure Tourism" })).toBeInTheDocument();
    expect(screen.getByText("A second adventure paragraph")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Adventure Tourism" })).toHaveAttribute("src", "/adventure.jpg");

    expect(screen.queryByRole("heading", { name: "Cultural Tours" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing when there are no services", () => {
    const { container } = render(
      <ServicesCarousel
        section={{ id: "homepage-services", eyebrow: "Eyebrow", heading: "Heading", introduction: "Intro" }}
        services={[]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
