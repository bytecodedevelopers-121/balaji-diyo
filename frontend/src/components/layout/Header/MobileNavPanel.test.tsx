import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MobileNavPanel } from "./MobileNavPanel";
import type { DestinationDropdownData } from "@/config/navigation";

describe("MobileNavPanel", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("is closed by default with its dialog relationship wired up", () => {
    render(<MobileNavPanel solid={false} />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the static design menu with Nepal expanded and locks page scroll", () => {
    render(<MobileNavPanel solid={false} />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("dialog", { name: "Menu" });
    expect(panel).toHaveAttribute("id", trigger.getAttribute("aria-controls"));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close menu" }));
    expect(document.body.style.overflow).toBe("hidden");

    const navigation = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(navigation).getByRole("button", { name: "Nepal" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(within(navigation).getByRole("button", { name: "Trekking and Hiking" })).toBeVisible();
    expect(within(navigation).getByRole("button", { name: "Climbing and Expedition" })).toBeVisible();
    expect(within(navigation).getByRole("link", { name: "Tibet" })).toHaveAttribute(
      "href",
      "/tibet-tours",
    );
    expect(within(navigation).getByRole("link", { name: "Become a partner" })).toHaveAttribute(
      "href",
      "/become-a-partner",
    );
  });

  it("opens the trekking routes drill-down and returns to the main menu", () => {
    render(<MobileNavPanel solid={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Trekking and Hiking" }));

    const trekkingNavigation = screen.getByRole("navigation", {
      name: "Trekking and Hiking in Nepal",
    });
    expect(screen.getByText("Trekking and Hiking in Nepal")).toBeVisible();
    expect(screen.getByRole("link", { name: /View All/ })).toHaveAttribute(
      "href",
      "/trekking-routes-in-nepal",
    );
    expect(within(trekkingNavigation).getByRole("link", { name: "EVEREST REGION" })).toHaveAttribute(
      "href",
      "/everest-region-treks",
    );
    expect(within(trekkingNavigation).getByRole("link", { name: "TREKS FROM POKHARA" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    expect(screen.queryByText("Trekking and Hiking in Nepal")).not.toBeInTheDocument();
  });

  it("opens the header search from the drawer and closes the menu", () => {
    const onSearch = vi.fn();
    render(<MobileNavPanel solid={false} onSearch={onSearch} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Search trips" }));

    expect(onSearch).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape, restores trigger focus, and unlocks scroll", () => {
    render(<MobileNavPanel solid={false} />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
  });

  it("expands a non-Nepal category's real sub-categories/packages once curated (2026-09-03 bug: Tibet/Bhutan never displayed anything here regardless of real admin content)", () => {
    const data: DestinationDropdownData = {
      categories: [
        { label: "Nepal", active: true, viewAllHref: "/nepal", subCategories: [] },
        {
          label: "Tibet",
          active: false,
          viewAllHref: "/tibet-tours",
          subCategories: [
            {
              label: "Tours",
              active: true,
              viewAllHref: "/tibet-tours",
              subSubCategories: [
                {
                  title: "LHASA REGION",
                  href: "/lhasa-region",
                  packages: [{ label: "Lhasa City Tour", href: "/lhasa-city-tour" }],
                },
              ],
            },
          ],
        },
      ],
    };
    render(<MobileNavPanel solid={false} destinationDropdown={data} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const navigation = screen.getByRole("navigation", { name: "Mobile navigation" });
    // Every category with real sub-categories now auto-expands (2026-09-03,
    // direct request: Nepal/Tibet/Bhutan all start open) — Tibet needs no
    // click to reveal "Tours" the way the old single-open accordion did.
    expect(within(navigation).getByRole("button", { name: "Tibet" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    fireEvent.click(within(navigation).getByRole("button", { name: "Tours" }));

    expect(screen.getByRole("link", { name: "Lhasa City Tour" })).toHaveAttribute(
      "href",
      "/lhasa-city-tour",
    );
  });

  it("closes on backdrop click", () => {
    render(<MobileNavPanel solid={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Close menu overlay" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
