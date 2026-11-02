import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
// Route group folder, doesn't affect the URL (still "/") — see
// src/app/(home)/layout.tsx's own comment.
import HomePage from "@/app/(home)/page";

describe("HomePage", () => {
  it("renders the hero and every section heading", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /walk into wonder/i }),
    ).toBeInTheDocument();

    // One <h2> per section (Journey, PopularTrips, About, Gallery,
    // Services, Testimonials, Blog, Features, Cta) — the hero uses <h1>.
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(9);
  });
});
