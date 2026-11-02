import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { ItineraryPhotoGallery } from "./ItineraryPhotoGallery";

describe("ItineraryPhotoGallery", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLElement.prototype.scrollIntoView = () => undefined;
  });

  it("opens the shared full-screen viewer at the selected photo", () => {
    render(
      <ItineraryPhotoGallery
        dayTitle="Walk to Namche"
        photos={[
          { url: "/images/day-one.jpg", type: "image" },
          { url: "/images/day-two.jpg", type: "image" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "View Walk to Namche — photo 2 full screen" }));

    expect(screen.getByRole("dialog", { name: "Walk to Namche — photo 2 — photo 2 of 2" })).toBeVisible();
    expect(screen.getByText("2 / 2")).toBeVisible();
    expect(screen.getByRole("button", { name: "Previous photo" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeVisible();
  });
});
