/**
 * Departure domain type — maps to the backend's Departure module
 * (backend/src/modules/departure), exposed publicly via
 * `GET /departures?upcoming=true`. `package` is the joined trip this
 * departure belongs to (title + duration only — see
 * DepartureRepository's departureInclude — not the full Package shape).
 */
export interface Departure {
  id: string;
  departureDate: string;
  departureCost: string;
  departureNote: string | null;
  departureStatus: string;
  package: {
    title: string;
    duration: string;
    durationType: string;
  };
}
