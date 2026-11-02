import { z } from 'zod';

const PlaceFactDto = z.object({
  label: z.string().min(1).max(255),
  value: z.string().min(1).max(1000),
});

export const CreatePlaceDto = z.object({
  placeName: z.string().min(5).max(255),
  slug: z.string().min(1).optional(),
  placeAbstract: z.string().optional(),
  placeDescription: z.string().optional(),
  placeElevation: z.string().optional(),
  placeCoordinates: z.string().optional(),
  placeMap: z.string().optional(),
  placeExtra: z.string().optional(),
  attractionOrder: z.number().int().min(0).optional(),
  regionIds: z.array(z.string()).max(10).optional(),
  primaryRegionId: z.string().optional(),
  placeTypeId: z.string().nullable().optional(),
  routeMapId: z.string().nullable().optional(),
  facts: z.array(PlaceFactDto).max(30).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  metaTitle: z.string().max(255).optional(),
  metaKeywords: z.string().max(2000).optional(),
  metaDescription: z.string().max(2000).optional(),
});

export type CreatePlaceDtoType = z.infer<typeof CreatePlaceDto>;
