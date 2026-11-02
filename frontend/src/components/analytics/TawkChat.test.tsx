import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { setTawkVisible, TawkChat } from "./TawkChat";

describe("TawkChat", () => {
  afterEach(() => {
    document.getElementById("tawk-to-script")?.remove();
    delete window.Tawk_API;
  });

  it("keeps the desktop controls split and lifts Tawk above the mobile booking bar", () => {
    render(<TawkChat />);

    fireEvent.keyDown(window);

    expect(window.Tawk_API?.customStyle).toEqual({
      visibility: {
        desktop: { position: "bl", xOffset: 20, yOffset: 20 },
        mobile: { position: "br", xOffset: 12, yOffset: 96 },
      },
    });
    expect(document.getElementById("tawk-to-script")).toHaveAttribute(
      "src",
      "https://embed.tawk.to/62653fc47b967b11798c3d8d/1g1do26d2",
    );
  });

  it("re-applies a hide requested before the widget loads, via onLoad", () => {
    // Package detail page's mobile effect can call this before the
    // lazy-loaded embed script has run — nothing to hide yet, so it
    // must be picked up once `Tawk_API.onLoad` actually fires instead
    // of being lost.
    setTawkVisible(false);

    render(<TawkChat />);
    fireEvent.keyDown(window);

    const hideWidget = vi.fn();
    window.Tawk_API!.showWidget = vi.fn();
    window.Tawk_API!.hideWidget = hideWidget;
    window.Tawk_API!.onLoad?.();

    expect(hideWidget).toHaveBeenCalledOnce();

    setTawkVisible(true); // restore module state for later tests
  });

  it("calls hideWidget/showWidget directly once the widget is already loaded", () => {
    render(<TawkChat />);
    fireEvent.keyDown(window);

    const hideWidget = vi.fn();
    const showWidget = vi.fn();
    window.Tawk_API!.hideWidget = hideWidget;
    window.Tawk_API!.showWidget = showWidget;

    setTawkVisible(false);
    expect(hideWidget).toHaveBeenCalledOnce();

    setTawkVisible(true);
    expect(showWidget).toHaveBeenCalledOnce();
  });
});
