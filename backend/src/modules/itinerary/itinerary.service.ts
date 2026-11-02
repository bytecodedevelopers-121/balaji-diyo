import { Prisma } from '@prisma/client';
import { ItineraryRepository } from './itinerary.repository';
import { CreateItineraryDtoType, UpdateItineraryDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { slugify } from '../../lib/slugify';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';
import { packageTags, packagePaths } from '../package/package.service';

export class ItineraryService {
  constructor(private repository: ItineraryRepository) {}

  private async runWrite<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === 'P2025' || err.code === 'P2003')) {
        throw new ApiError(400, 'Invalid reference in itinerary details (e.g. originPlaceId/destinationPlaceId)');
      }
      throw err;
    }
  }

  private async resolveUniqueSlug(base: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(base);
    let candidate = baseSlug;
    let suffix = 1;

    for (;;) {
      const taken = await this.repository.slugExists(candidate, excludeId);
      if (!taken) return candidate;
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  // The public package page embeds the itinerary (and its linked places), so
  // any itinerary write must bust that package's cache, same as PackageService.
  private async revalidatePackage(packageId: string) {
    const slug = await this.repository.findPackageSlug(packageId);
    void revalidateFrontendTags(packageTags(slug), packagePaths(slug));
  }

  async create(dto: CreateItineraryDtoType) {
    const pkg = await this.repository.packageExists(dto.packageId);
    if (!pkg) throw new ApiError(400, 'Invalid packageId');

    const existing = await this.repository.findByPackageId(dto.packageId);
    if (existing) throw new ApiError(409, 'This package already has an itinerary — update it instead');

    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.title);
    const created = await this.runWrite(() => this.repository.create({ ...dto, slug }));
    await this.revalidatePackage(dto.packageId);
    return created;
  }

  async findById(id: string) {
    const itinerary = await this.repository.findById(id);
    if (!itinerary) throw new ApiError(404, 'Itinerary not found');
    return itinerary;
  }

  async findByPackageId(packageId: string) {
    const itinerary = await this.repository.findByPackageId(packageId);
    if (!itinerary) throw new ApiError(404, 'Itinerary not found');
    return itinerary;
  }

  async update(id: string, dto: UpdateItineraryDtoType) {
    const current = await this.findById(id);
    const slug = dto.slug || dto.title ? await this.resolveUniqueSlug(dto.slug ?? dto.title!, id) : undefined;

    const updated = await this.runWrite(() => this.repository.update(id, { ...dto, slug }));
    await this.revalidatePackage(current.packageId);
    return updated;
  }

  async remove(id: string) {
    const current = await this.findById(id);
    await this.repository.delete(id);
    await this.revalidatePackage(current.packageId);
  }
}
