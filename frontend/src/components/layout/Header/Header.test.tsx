import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Header } from "./Header";

// Header reads the current route via `usePathname` to decide its
// transparent-vs-solid variant (see Header.tsx's own doc comment) — mock
// it to the homepage path so these tests exercise the (initial, at-top)
// transparent variant. Scroll-driven behavior — switching to solid past
// the hero, and the hide-on-scroll-down/reveal-on-scroll-up transform —
// isn't covered here; jsdom has no real layout/scroll to drive it
// meaningfully, and neither test below is variant- or scroll-specific.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const TEST_SITE_NAME = "Joyful Trekking Pvt. Ltd.";
const TEST_PHONE = "+1 555-0100";
const TEST_PHONE_HREF = "tel:+15550100";

describe("Header", () => {
  it("renders the logo link, desktop navigation and CTA", () => {
    render(
      <Header
        siteName={TEST_SITE_NAME}
        phone={TEST_PHONE}
        phoneHref={TEST_PHONE_HREF}
      />,
    );

    expect(
      screen.getByRole("link", { name: /joyful trekking pvt. ltd. — home/i }),
    ).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Primary" });
    // "Destination" and "About" are both buttons, not links — each
    // toggles its own mega-menu (DestinationDropdown.tsx,
    // AboutDropdown.tsx) rather than navigating directly (see
    // Header.tsx's own comment on that branch).
    expect(
      within(nav).getByRole("button", { name: /destination/i }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(within(nav).getByRole("button", { name: /company/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      within(nav).getByRole("button", { name: /trekking and hiking/i }),
    ).toHaveAttribute("aria-expanded", "false");

    expect(screen.getByRole("link", { name: "Plan with us" })).toHaveAttribute(
      "href",
      "/plan-with-us",
    );
  });

  it("renders the menu trigger (mobile row + desktop nav), closed by default", () => {
    render(
      <Header
        siteName={TEST_SITE_NAME}
        phone={TEST_PHONE}
        phoneHref={TEST_PHONE_HREF}
      />,
    );

    // Two independent MobileMenu instances — one in the mobile-only
    // row, one in the desktop nav (replacing its old decorative
    // hamburger) — mutually exclusive via CSS breakpoint, not React
    // conditionals, so both are present in the DOM. See MobileMenu.tsx's
    // own doc comment.
    const triggers = screen.getAllByRole("button", { name: "Menu" });
    expect(triggers).toHaveLength(2);
    triggers.forEach((trigger) => {
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
    // Each panel (and its own "Primary" nav) only mounts once its own
    // trigger is opened — asserted in MobileMenu.test.tsx.
  });
});
