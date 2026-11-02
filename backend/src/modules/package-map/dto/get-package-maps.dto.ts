import { z } from 'zod';
import { booleanQueryParam } from '../../../common/dto/zod-helpers';

export const GetPackageMapsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  packageId: z.string().optional(),
  // Filters by one of the owning Package's `categories` (the many-to-many
  // region/style taxonomy — "Everest Region Treks" etc, NOT the single
  // coarse `destinationId`, which is "Nepal" for nearly every package and
  // so useless as a similarity signal) — the public /map/[slug] page's
  // own "Related Maps" section (2026-09-03), same "narrow the generic
  // list endpoint by a real relation, don't invent a dedicated endpoint"
  // call as blog's own `categoryId` filter on `GET /blogs`. The current
  // route itself is dropped client-side (BlogDetailSection's own
  // `getRelatedPosts` precedent), not excluded server-side.
  categoryId: z.string().optional(),
  search: z.string().optional(),
  // Mirrors GetPlacesDto's own isActive filter — opt-in (undefined shows
  // both, same as before this field existed) so the admin listing keeps
  // seeing inactive trip maps by default; the public site passes true.
  isActive: z.coerce.boolean().optional(),
  includeTrashed: booleanQueryParam,
});

export type GetPackageMapsDtoType = z.infer<typeof GetPackageMapsDto>;
