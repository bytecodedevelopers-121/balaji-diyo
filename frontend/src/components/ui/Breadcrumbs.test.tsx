import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders linked ancestors and marks the final item as current", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Nepal" },
          { label: "About Us", href: "/about-us" },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Nepal")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("About Us")).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "About Us" })).not.toBeInTheDocument();
  });
});
