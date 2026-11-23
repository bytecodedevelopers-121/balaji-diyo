const HOUR_MS = 3_600_000;

export interface DepartureSeats {
  departureDate: Date;
  totalSeats: number | null;
  bookedSeats: number;
  heldSeats: number;
}

export interface AllotmentSeats {
  id: string;
  partnerId: string;
  allocatedSeats: number;
  bookedSeats: number;
  heldSeats: number;
  releaseBeforeHours: number;
  isActive: boolean;
}

export interface Availability {
  source: 'ALLOTMENT' | 'POOL';
  allotmentId: string | null;
  /** null = capacity not tracked (uncapped) */
  available: number | null;
  allotmentReleaseAt: Date | null;
}

export const allotmentReleaseAt = (dep: DepartureSeats, a: AllotmentSeats): Date =>
  new Date(dep.departureDate.getTime() - a.releaseBeforeHours * HOUR_MS);

/** A dedicated block still reserves seats until its release window opens. */
const isReserving = (dep: DepartureSeats, a: AllotmentSeats, now: Date): boolean =>
  a.isActive && now.getTime() < allotmentReleaseAt(dep, a).getTime();

/**
 * Seats `partnerId` could take right now.
 *
 * Accounting model: Departure.bookedSeats/heldSeats count EVERY seat. Allotment
 * counters are a sub-ledger of the same seats. So a partner with a live
 * allotment draws only from it; everyone else (and the partner after the
 * release window) draws from `total - booked - held` minus the unused part of
 * other partners' still-reserving allotments.
 */
export const computeAvailability = (dep: DepartureSeats, allotments: AllotmentSeats[], partnerId: string, now: Date): Availability => {
  const mine = allotments.find((a) => a.partnerId === partnerId) ?? null;
  const globalFree = dep.totalSeats === null ? null : Math.max(dep.totalSeats - dep.bookedSeats - dep.heldSeats, 0);

  if (mine && isReserving(dep, mine, now)) {
    const own = Math.max(mine.allocatedSeats - mine.bookedSeats - mine.heldSeats, 0);
    return {
      source: 'ALLOTMENT',
      allotmentId: mine.id,
      available: globalFree === null ? own : Math.min(own, globalFree),
      allotmentReleaseAt: allotmentReleaseAt(dep, mine),
    };
  }

  const releaseAt = mine ? allotmentReleaseAt(dep, mine) : null;
  if (globalFree === null) return { source: 'POOL', allotmentId: null, available: null, allotmentReleaseAt: releaseAt };

  const reservedForOthers = allotments
    .filter((a) => a.partnerId !== partnerId && isReserving(dep, a, now))
    .reduce((sum, a) => sum + Math.max(a.allocatedSeats - a.bookedSeats - a.heldSeats, 0), 0);
  return { source: 'POOL', allotmentId: null, available: Math.max(globalFree - reservedForOthers, 0), allotmentReleaseAt: releaseAt };
};
