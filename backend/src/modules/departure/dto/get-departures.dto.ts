import { z } from 'zod';

export const GetDeparturesDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  packageId: z.string().optional(),
  departureStatus: z.string().optional(),
  // Public "last-minute deals" consumption: departureDate >= now AND
  // departureStatus != 'closed'. Opt-in and additive only — omitted,
  // behavior is identical to before, so the admin's existing
  // DeparturesTab (which lists every departure for a package regardless
  // of date/status) is unaffected.
  upcoming: z.coerce.boolean().optional(),
  // Only departures an admin flagged as "last minute". Send `lastMinute=true`
  // to filter; omit it for no filtering.
  lastMinute: z.enum(['true']).optional(),
});

export type GetDeparturesDtoType = z.infer<typeof GetDeparturesDto>;
