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

  it("opens the main list and locks page scroll", () => {
    render(<MobileNavPanel solid={false} />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("dialog", { name: "Menu" });
    expect(panel).toHaveAttribute("id", trigger.getAttribute("aria-controls"));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close menu" }));
    expect(document.body.style.overflow).toBe("hidden");

    const navigation = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(navigation).getByRole("button", { name: /Destinations/ })).toBeVisible();
    expect(within(navigation).getByRole("button", { name: /Trekking and Hiking/ })).toBeVisible();
    expect(within(navigation).getByRole("button", { name: /About/ })).toBeVisible();
    expect(within(navigation).getByRole("link", { name: /Become a partner/ })).toHaveAttribute(
      "href",
      "/company/partner-with-us",
    );
  });

  it("drills Destinations → country → trip type → regions, and steps back one level at a time", () => {
    render(<MobileNavPanel solid={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: /Destinations/ }));
    expect(screen.getByRole("heading", { name: "Destinations" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Nepal/ }));
    expect(screen.getByRole("heading", { name: "Nepal" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Trekking and Hiking/ }));
    const trekkingNavigation = screen.getByRole("navigation", { name: "Trekking and Hiking in Nepal" });
    expect(screen.getByRole("heading", { name: "Trekking and Hiking in Nepal" })).toBeVisible();
    expect(screen.getByRole("link", { name: /view all/i })).toHaveAttribute("href", "/trekking-routes-in-nepal");
    expect(within(trekkingNavigation).getByRole("link", { name: /everest region/i })).toHaveAttribute(
      "href",
      "/everest-region-treks",
    );
    expect(within(trekkingNavigation).getByRole("link", { name: /treks from pokhara/i })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Nepal" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  });

  it("jumps straight to the trekking regions from the main list", () => {
    render(<MobileNavPanel solid={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: /Trekking and Hiking/ }));

    expect(screen.getByRole("heading", { name: "Trekking and Hiking in Nepal" })).toBeVisible();
  });

  it("opens the About links in their own level", () => {
    render(<MobileNavPanel solid={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: /About/ }));

    expect(screen.getByRole("heading", { name: "About" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  });

  it("opens the header search from the main list and closes the menu", () => {
    const onSearch = vi.fn();
    render(<MobileNavPanel solid={false} onSearch={onSearch} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: /search trips/i }));

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

  it("shows a non-Nepal destination's real sub-categories and packages once curated (2026-09-03 bug: Tibet/Bhutan never displayed anything here regardless of real admin content)", () => {
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
    fireEvent.click(screen.getByRole("button", { name: /Destinations/ }));
    // Nepal has no trip types here, so it is a plain link; Tibet opens its own level.
    expect(screen.getByRole("link", { name: /Nepal/ })).toHaveAttribute("href", "/nepal");
    fireEvent.click(screen.getByRole("button", { name: /Tibet/ }));
    fireEvent.click(screen.getByRole("button", { name: /Tours/ }));

    expect(screen.getByRole("link", { name: "Lhasa City Tour" })).toHaveAttribute("href", "/lhasa-city-tour");
  });

  it("closes from the close button", () => {
    render(<MobileNavPanel solid={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the contact bar when a phone is given", () => {
    render(
      <MobileNavPanel
        solid={false}
        phone="+977 9800000000"
        phoneHref="+9779800000000"
        ctaLabel="Plan with us"
        ctaHref="/plan-with-us"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));

    expect(screen.getByRole("link", { name: "+977 9800000000" })).toHaveAttribute("href", "https://wa.me/9779800000000");
    expect(screen.getByRole("link", { name: "Plan with us" })).toHaveAttribute("href", "/plan-with-us");
  });
});
