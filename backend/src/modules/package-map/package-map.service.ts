import { Prisma } from '@prisma/client';
import { PackageMapRepository } from './package-map.repository';
import { CreatePackageMapDtoType, UpdatePackageMapDtoType, GetPackageMapsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';
import { assertInTrash, runHardDelete } from '../../lib/hard-delete';

// The public frontend calls this module's data "trekking routes", not
// "package maps" — matches its own tags exactly (frontend/src/features/
// trekking-routes/api/get-trekking-routes.ts, get-trekking-route-by-slug.ts).
function tripMapTags(slug: string | null | undefined) {
  return ['trekking-routes', ...(slug ? [`trekking-route:${slug}`] : [])];
}

export class PackageMapService {
  constructor(private repository: PackageMapRepository) {}

  private async assertPackageExists(packageId: string) {
    const pkg = await this.repository.packageExists(packageId);
    if (!pkg) throw new ApiError(400, 'Invalid packageId');
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

  async create(dto: CreatePackageMapDtoType) {
    await this.assertPackageExists(dto.packageId);
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.mapTitle);
    const map = await this.repository.create({ ...dto, slug });
    void revalidateFrontendTags(tripMapTags(slug));
    return map;
  }

  async findAll(dto: GetPackageMapsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.PackageMapWhereInput = {
      deletedAt: dto.includeTrashed ? { not: null } : null,
      ...(dto.packageId ? { packageId: dto.packageId } : {}),
      ...(dto.categoryId ? { package: { categories: { some: { id: dto.categoryId } } } } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.search ? { mapTitle: { contains: dto.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    // NOTE: `mapImageUrl` here is still the raw Media.fullPath, not a URL
    // yet — findFeaturedImagePaths() deliberately stops short of building
    // one (see its own comment). The controller turns every item's value
    // into an absolute URL (or null) before the response goes out; nothing
    // else reads this service's return value directly.
    const imagePaths = await this.repository.findFeaturedImagePaths(items.map((item) => item.id));
    const itemsWithImage = items.map((item) => ({ ...item, mapImageUrl: imagePaths.get(item.id) ?? null }));

    return PaginationDto.create({ items: itemsWithImage, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const map = await this.repository.findById(id);
    if (!map || map.deletedAt) throw new ApiError(404, 'Trip map not found');
    const imagePaths = await this.repository.findFeaturedImagePaths([map.id]);
    return { ...map, mapImageUrl: imagePaths.get(map.id) ?? null };
  }

  // Public /map/[slug] page — mirrors team-member's findPublicBySlug
  // (team-member.service.ts) exactly: resolve by slug, require isActive +
  // not deleted, 404 otherwise.
  async findPublicBySlug(slug: string) {
    const map = await this.repository.findBySlug(slug, { isActive: true, deletedAt: null });
    if (!map) throw new ApiError(404, 'Trip map not found');
    const imagePaths = await this.repository.findFeaturedImagePaths([map.id]);
    return { ...map, mapImageUrl: imagePaths.get(map.id) ?? null };
  }

  async update(id: string, dto: UpdatePackageMapDtoType) {
    const existing = await this.findById(id);
    const slug = dto.slug || dto.mapTitle ? await this.resolveUniqueSlug(dto.slug ?? dto.mapTitle!, id) : undefined;

    const updated = await this.repository.update(id, { ...dto, slug });
    const slugs = [...new Set([existing.slug, updated.slug].filter(Boolean))] as string[];
    void revalidateFrontendTags(['trekking-routes', ...slugs.map((s) => `trekking-route:${s}`)]);
    return updated;
  }

  async remove(id: string) {
    const existing = await this.findById(id);
    await this.repository.softDelete(id);
    void revalidateFrontendTags(tripMapTags(existing.slug));
  }

  async restore(id: string) {
    const map = await this.repository.findById(id);
    if (!map) throw new ApiError(404, 'Trip map not found');
    await this.repository.restore(id);
    void revalidateFrontendTags(tripMapTags(map.slug));
  }

  async hardDelete(id: string) {
    assertInTrash(await this.repository.findById(id), 'Trip map');
    await runHardDelete(() => this.repository.hardDelete(id));
  }
}
