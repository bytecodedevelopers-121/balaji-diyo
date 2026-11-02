import { z } from 'zod';
import { CreatePackageDto } from './create-package.dto';

export const UpdatePackageDto = CreatePackageDto.partial();

export type UpdatePackageDtoType = z.infer<typeof UpdatePackageDto>;
