import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MobileMenu } from "./MobileMenu";

// The panel now animates open/closed with GSAP (see MobileMenu.tsx's own
// doc comment on the `isOpen`/`mounted` split this requires): jsdom has
// no `requestAnimationFrame` at all, but GSAP falls back to `setTimeout`
// internally, so tweens still progress in real wall-clock time during a
// test — just not synchronously with the triggering `fireEvent`. Every
// assertion that depends on the panel's post-animation state (its
// content becoming accessible on open, or the panel actually leaving the
// DOM on close) goes through `waitFor` rather than a plain `expect`.
// A generous timeout gives slower CI machines room over the ~250–550ms
// real-time tweens involved.
const ANIMATION_TIMEOUT = 3000;

describe("MobileMenu", () => {
  afterEach(() => {
    // DOM cleanup itself is handled globally (tests/setup.ts) — this
    // only guards against a failed assertion leaving the scroll lock
    // applied and bleeding into the next test.
    document.body.style.overflow = "";
  });

  it("is closed by default with aria-expanded/aria-controls wired up", () => {
    render(<MobileMenu solid={false} />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the panel, moves focus into it, and locks background scroll", async () => {
    render(<MobileMenu solid={false} />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(trigger);

    // Synchronous — React state, not animation-gated.
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(document.body.style.overflow).toBe("hidden");

    // `hidden: true` bypasses Testing Library's accessibility-tree
    // visibility filter — needed since the panel is still
    // `visibility: hidden` (an inline style GSAP's entrance tween
    // hasn't animated away yet) even though it's already fully
    // committed to the DOM. Queried by role alone, not `name`: the
    // underlying name-computation library doesn't reliably resolve
    // `aria-label` on a `visibility: hidden` node even with that flag,
    // so the label is asserted directly afterward instead.
    const panel = screen.getByRole("dialog", { hidden: true });
    expect(panel).toHaveAttribute("aria-label", "Menu");
    expect(panel).toHaveAttribute(
      "id",
      trigger.getAttribute("aria-controls"),
    );
    // Focus itself is synchronous too — it moves in the same effect
    // that locks scroll, well before the entrance tween finishes (an
    // element can be focused while `visibility: hidden`, mid-fade-in).
    // No dedicated close button exists in the sampled design (see
    // MobileMenu.tsx's own doc comment), so it's the first nav link.
    const firstLink = screen.getAllByRole("link", { hidden: true })[0];
    expect(firstLink).toHaveAttribute("href", "/compare-itineraries");
    expect(document.activeElement).toBe(firstLink);

    // The links stagger in on their own trailing tween, separate from
    // (and slower than) the panel container's — wait for one of the
    // last ones to become accessible as proof the whole stagger, not
    // just the panel shell, has actually finished.
    await waitFor(
      () => screen.getByRole("link", { name: /become a partner/i }),
      { timeout: ANIMATION_TIMEOUT },
    );

    // Confirmed real menu content (Figma node 455:6099) — no invented
    // links.
    expect(
      screen.getByRole("link", { name: /compare itineraries/i }),
    ).toHaveAttribute("href", "/compare-itineraries");
    expect(screen.getByRole("link", { name: /testimonials/i })).toHaveAttribute(
      "href",
      "/reviews",
    );
    expect(
      screen.getByRole("link", { name: /become a partner/i }),
    ).toHaveAttribute("href", "/become-a-partner");
  });

  it("closes on Escape, restores focus to the trigger, and unlocks scroll", async () => {
    render(<MobileMenu solid={false} />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    fireEvent.keyDown(document, { key: "Escape" });

    // Synchronous — React state, not animation-gated.
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");

    // The panel stays mounted through its exit tween — actual removal
    // is the tween's `onComplete`, not this click.
    await waitFor(
      () => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      { timeout: ANIMATION_TIMEOUT },
    );
  });

  it("closes when a nav link is activated", async () => {
    render(<MobileMenu solid={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    // The link exists (and is clickable) as soon as React commits,
    // same tick as the click that opened the panel — well before its
    // own entrance tween finishes. `hidden: true` bypasses Testing
    // Library's accessibility-tree visibility filter, which would
    // otherwise reject it as `visibility: hidden` mid-fade-in; queried
    // by index rather than `name` since name-computation on a hidden
    // node isn't reliable (see the "opens the panel" test's own
    // comment on this same quirk) — "Volunteering in Nepal" is
    // `menuNavigation`'s 6th (index 5) entry.
    const navLink = screen.getAllByRole("link", { hidden: true })[5];
    expect(navLink).toHaveAttribute("href", "/volunteering-in-nepal");
    fireEvent.click(navLink);

    await waitFor(
      () => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      { timeout: ANIMATION_TIMEOUT },
    );
  });

  it("toggles closed when the trigger is clicked again", async () => {
    render(<MobileMenu solid={false} />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(
      () => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      { timeout: ANIMATION_TIMEOUT },
    );
  });
});
