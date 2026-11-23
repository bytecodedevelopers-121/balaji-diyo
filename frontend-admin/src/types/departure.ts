export interface Departure {
  id: string;
  packageId: string;
  departureDate: string;
  /** Decimal — serialized as a numeric string over the API. */
  departureCost: string | number;
  departureNote: string | null;
  departureStatus: string;
  isLastMinute: boolean;
  /** Seat inventory (B2B). totalSeats null = capacity not tracked. */
  totalSeats?: number | null;
  bookedSeats?: number;
  heldSeats?: number;
  cutoffHours?: number;
  /** Joined trip (title only) — included by the backend's departureInclude. */
  package?: { title: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartureDto {
  packageId: string;
  departureDate: string;
  departureCost: number;
  departureNote?: string;
  departureStatus: string;
  isLastMinute?: boolean;
}

export interface DepartureRowInput {
  departureDate: string;
  departureCost: number;
  departureNote?: string;
  departureStatus: string;
  isLastMinute?: boolean;
}

export interface CreateDeparturesBulkDto {
  packageId: string;
  departures: DepartureRowInput[];
}

export interface UpdateDepartureDto {
  departureDate?: string;
  departureCost?: number;
  departureNote?: string;
  departureStatus?: string;
  isLastMinute?: boolean;
}
