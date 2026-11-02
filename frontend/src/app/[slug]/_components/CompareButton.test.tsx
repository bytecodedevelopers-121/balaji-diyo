import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetComparisonStore } from "@/features/comparison/comparison-store";
import { CompareButton } from "./CompareButton";

// CompareButton now redirects to /compare-itineraries on every click (see
// its own doc comment) via `useRouter` from `next/navigation` — same mock
// pattern as Header.test.tsx for the same reason (no real App Router
// mounted under jsdom).
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("CompareButton", () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => resetComparisonStore());
    push.mockClear();
  });

  it("adds and removes the current package, redirecting to the comparison page either way", () => {
    render(<CompareButton slug="gokyo-valley-trek" title="Gokyo Valley Trek" />);

    const addButton = screen.getByRole("button", {
      name: "Add Gokyo Valley Trek to comparison",
    });
    expect(addButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(addButton);
    const removeButton = screen.getByRole("button", {
      name: "Remove Gokyo Valley Trek from comparison",
    });
    expect(removeButton).toHaveAttribute("aria-pressed", "true");
    expect(removeButton).toHaveTextContent("Remove");
    expect(push).toHaveBeenCalledWith("/compare-itineraries");

    fireEvent.click(removeButton);
    expect(screen.getByRole("button", { name: "Add Gokyo Valley Trek to comparison" })).toHaveTextContent(
      "Compare",
    );
    expect(push).toHaveBeenCalledTimes(2);
  });
});
