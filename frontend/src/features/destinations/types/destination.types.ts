/**
 * Destination domain type — maps to the backend's Place module
 * (backend/src/modules/place), mounted at `GET /places`.
 *
 * PROVISIONAL — see features/trips/types/trip.types.ts for the same caveat.
 */
export interface Destination {
  id: string;
  name: string;
  slug: string;
  abstract?: string;
}
