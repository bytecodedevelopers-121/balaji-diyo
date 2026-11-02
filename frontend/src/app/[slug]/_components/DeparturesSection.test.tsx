import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PackageDetail } from "../data";
import { DeparturesSection } from "./DeparturesSection";

vi.mock("./booking-flow-context", () => ({
  useBookingFlow: () => ({ openBooking: vi.fn() }),
}));

describe("DeparturesSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-02T06:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("removes expired dates and the past month and year tabs they belonged to", () => {
    const trip = {
      departures: [
        { startDate: "2025-12-10", endDate: "2025-12-20", status: "Available", price: 100 },
        { startDate: "2026-08-20", endDate: "2026-08-30", status: "Available", price: 100 },
        { startDate: "2026-09-10", endDate: "2026-09-20", status: "Available", price: 100 },
        { startDate: "2026-10-10", endDate: "2026-10-20", status: "Available", price: 100 },
      ],
    } as PackageDetail;

    render(<DeparturesSection trip={trip} />);

    expect(screen.queryByRole("button", { name: "2025" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aug" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sep" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Oct" })).toBeVisible();
    expect(screen.queryByText("Aug 20, 2026 – Aug 30, 2026")).not.toBeInTheDocument();
    expect(screen.getByText("Sep 10, 2026 – Sep 20, 2026")).toBeVisible();
  });
});
