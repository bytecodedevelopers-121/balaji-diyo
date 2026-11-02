import { z } from 'zod';

// A real FK id, or the client's "nothing selected" sentinel — the admin's
// place picker (a `<select>`-style control) sends `""` rather than omitting
// the field entirely when left blank. Left as a plain `.optional()` string,
// `""` passes validation cleanly and then hits Prisma as a literal
// `originPlaceId: ""`, which violates the FK constraint against `places.id`
// (confirmed live: `PATCH /itineraries/:id` 400s with "Foreign key
// constraint violated on the constraint: itinerary_details_originPlaceId_fkey").
// This normalizes a blank value to `null` (not `undefined`) so an update
// actually *clears* a previously-set place — itinerary.repository.ts's
// `reconcileDetails` updates existing rows in place, where `undefined`
// means "leave whatever's already saved" but `null` means "set to empty";
// `undefined` would silently keep a stale place after the admin picked
// "None" in the UI. `create()`'s nested `create` accepts `null` here just
// as well as an omitted field, so this is safe for both call sites.
const optionalPlaceId = z
  .string()
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));

const ItineraryFactItemDto = z.object({
  factTitle: z.string().min(1).max(255),
  factValue: z.string().min(1).max(255),
});

const ItineraryDetailItemDto = z.object({
  // The existing row's own id, round-tripped by the admin form so an
  // update can reconcile it in place instead of replacing it (see
  // itinerary.repository.ts's `reconcileDetails`) — omitted for a stop
  // added in this same edit that hasn't been saved yet.
  id: z.string().optional(),
  itineraryDay: z.string().min(1).max(255),
  itineraryTitle: z.string().max(255).optional(),
  itineraryShortDescription: z.string().max(1500).optional(),
  itineraryDescription: z.string().optional(),
  itineraryStop: z.number().min(1).optional(),
  accommodation: z.string().max(255).optional(),
  lunchPlace: z.string().max(255).optional(),
  meals: z.string().max(255).optional(),
  origin: z.string().max(255).optional(),
  originCoordinate: z.string().max(255).optional(),
  originElevation: z.string().max(255).optional(),
  originPlaceId: optionalPlaceId,
  destination: z.string().max(255).optional(),
  destinationCoordinate: z.string().max(255).optional(),
  destinationElevation: z.string().max(255).optional(),
  destinationPlaceId: optionalPlaceId,
  travelMode: z.string().max(255).optional(),
  distance: z.string().max(255).optional(),
  duration: z.string().max(255).optional(),
  encodedPolyline: z.string().optional(),
  footnote: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
  facts: z.array(ItineraryFactItemDto).max(10).optional(),
});

export const CreateItineraryDto = z.object({
  packageId: z.string().min(1),
  title: z.string().min(5).max(255),
  slug: z.string().min(1).optional(),
  detailsText: z.string().optional(),
  mapData: z.string().optional(),
  details: z.array(ItineraryDetailItemDto).max(100).optional(),

  metaTitle: z.string().max(255).optional(),
  metaKeywords: z.string().max(2000).optional(),
  metaDescription: z.string().max(2000).optional(),
});

export type CreateItineraryDtoType = z.infer<typeof CreateItineraryDto>;
