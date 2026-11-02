import { Prisma } from '@prisma/client';
import { PlaceRepository } from './place.repository';
import { CreatePlaceDtoType, UpdatePlaceDtoType, GetPlacesDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';

const REVALIDATE_TAGS = ['places', 'attractions'];

export class PlaceService {
  constructor(private repository: PlaceRepository) {}

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

  private validateRegions(dto: { regionIds?: string[]; primaryRegionId?: string }) {
    if (dto.primaryRegionId && !dto.regionIds?.includes(dto.primaryRegionId)) {
      throw new ApiError(400, 'Primary region must also be included in regionIds');
    }
  }

  private async validateTaxonomy(dto: { regionIds?: string[]; placeTypeId?: string | null }) {
    const [regionsAreDestinations, placeTypeIsValid] = await Promise.all([
      this.repository.categoriesMatchType(dto.regionIds ?? [], 'destination'),
      dto.placeTypeId ? this.repository.categoriesMatchType([dto.placeTypeId], 'place-type') : true,
    ]);
    if (!regionsAreDestinations) throw new ApiError(400, 'Regions must use destination categories');
    if (!placeTypeIsValid) throw new ApiError(400, 'Place type must use a place-type category');
  }

  private async validateRouteMap(routeMapId?: string | null) {
    if (routeMapId && !(await this.repository.routeMapExists(routeMapId))) {
      throw new ApiError(400, 'Selected trekking route map does not exist');
    }
  }

  private async runWrite<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === 'P2003' || err.code === 'P2025')
      ) {
        throw new ApiError(400, 'One or more referenced regions or place types do not exist');
      }
      throw err;
    }
  }

  async create(dto: CreatePlaceDtoType) {
    this.validateRegions(dto);
    await this.validateTaxonomy(dto);
    await this.validateRouteMap(dto.routeMapId);
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.placeName);
    const place = await this.runWrite(() => this.repository.create({ ...dto, slug }));
    void revalidateFrontendTags([...REVALIDATE_TAGS, `place:${slug}`]);
    return place;
  }

  async findAll(dto: GetPlacesDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.PlaceWhereInput = {
      deletedAt: null,
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
      ...(dto.search ? { placeName: { contains: dto.search, mode: 'insensitive' } } : {}),
      ...(dto.regionId ? { regions: { some: { categoryId: dto.regionId } } } : {}),
      ...(dto.placeTypeId ? { placeTypeId: dto.placeTypeId } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const place = await this.repository.findById(id);
    if (!place || place.deletedAt) throw new ApiError(404, 'Place not found');
    return place;
  }

  async findPublicBySlug(slug: string) {
    const place = await this.repository.findBySlug(slug, { isActive: true, deletedAt: null });
    if (!place) throw new ApiError(404, 'Place not found');
    const [imagePaths, galleryImages] = await Promise.all([
      this.repository.findBannerImagePaths([place.id]),
      this.repository.findGalleryImages(place.id),
    ]);
    return { ...place, imageUrl: imagePaths.get(place.id) ?? null, galleryImages };
  }

  async findAttractions() {
    const places = await this.repository.findAttractions();
    const imagePaths = await this.repository.findFeaturedImagePaths(places.map((place) => place.id));
    const placesWithImages = places.map((place) => ({
      ...place,
      imageUrl: imagePaths.get(place.id) ?? null,
    }));

    const regionMap = new Map<
      string,
      { id: string; title: string; categoryOrder: number; places: typeof placesWithImages }
    >();
    for (const place of placesWithImages) {
      for (const relation of place.regions) {
        const category = relation.category;
        const group = regionMap.get(category.id) ?? {
          id: category.id,
          title: category.title,
          categoryOrder: category.categoryOrder,
          places: [],
        };
        group.places.push(place);
        regionMap.set(category.id, group);
      }
    }

    return {
      featuredPlaces: placesWithImages.filter((place) => place.isFeatured),
      regions: [...regionMap.values()].sort(
        (a, b) => a.categoryOrder - b.categoryOrder || a.title.localeCompare(b.title),
      ),
    };
  }

  async update(id: string, dto: UpdatePlaceDtoType) {
    await this.findById(id);
    this.validateRegions(dto);
    await this.validateTaxonomy(dto);
    await this.validateRouteMap(dto.routeMapId);
    const slug = dto.slug || dto.placeName ? await this.resolveUniqueSlug(dto.slug ?? dto.placeName!, id) : undefined;

    const place = await this.runWrite(() => this.repository.update(id, { ...dto, slug }));
    void revalidateFrontendTags([
      ...REVALIDATE_TAGS,
      ...[place.slug].filter((value): value is string => Boolean(value)).map((value) => `place:${value}`),
    ]);
    return place;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.softDelete(id);
    void revalidateFrontendTags(REVALIDATE_TAGS);
  }
}
