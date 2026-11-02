import { z } from 'zod';
import { CreatePackageMapDto } from './create-package-map.dto';

// packageId is intentionally not updatable — same convention as Departure —
// a trip map belongs to whichever package it was created under.
export const UpdatePackageMapDto = CreatePackageMapDto.omit({ packageId: true }).partial();

export type UpdatePackageMapDtoType = z.infer<typeof UpdatePackageMapDto>;
