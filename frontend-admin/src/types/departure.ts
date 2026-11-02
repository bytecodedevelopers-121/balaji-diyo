export interface Departure {
  id: string;
  packageId: string;
  departureDate: string;
  /** Decimal — serialized as a numeric string over the API. */
  departureCost: string | number;
  departureNote: string | null;
  departureStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartureDto {
  packageId: string;
  departureDate: string;
  departureCost: number;
  departureNote?: string;
  departureStatus: string;
}

export interface DepartureRowInput {
  departureDate: string;
  departureCost: number;
  departureNote?: string;
  departureStatus: string;
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
}
