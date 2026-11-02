import { Prisma } from '@prisma/client';
import { PackageRepository } from './package.repository';
import { CreatePackageDtoType, UpdatePackageDtoType, GetPackagesDtoType, GetPackagesAdminDtoType, ReorderPackagesDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';
import { assertInTrash, runHardDelete } from '../../lib/hard-delete';

// Matches the frontend's own tags exactly (see frontend/src/features/trips/
// api/get-trips.ts, get-package-by-slug.ts, get-package-slugs.ts) — "trips"
// covers every package-listing view (homepage, category-filtered, the
// customize-trip selector), including ones also tagged `category:<id>`:
// Next revalidates a cache entry if *any* of its tags match, so
// invalidating "trips" alone covers those too without needing to know
// which categories a package belongs to.
export function packageTags(slug: string | null | undefined) {
  return ['packages', 'trips', ...(slug ? [`package:${slug}`] : [])];
}

// FIXED (same class of bug as blog.service.ts's own `blogPaths` — see
// its doc comment for the full story): every call below used to pass
// `revalidateFrontendTags` tags only, never `paths`. Tags alone bust the
// tagged `fetch` data cache, but `/[slug]/page.tsx` (this package's own
// public detail page) is prerendered via `generateStaticParams` and has
// its own separately-cached HTML shell, keyed by path — that shell keeps
// serving the pre-edit page (a stale 200, not an error) until its own
// time-based `revalidate` window elapses regardless of how many tags get
// busted. User-reported: added a gear item in admin, the public page
// didn't show it. Package detail is a flat `/<slug>` route (no `/packages`
// index page the way blog has `/blog`), so there's only ever the one path.
export function packagePaths(slug: string | null | undefined) {
  return slug ? [`/${slug}`] : [];
}

export class PackageService {
  constructor(private repository: PackageRepository) {}

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

  private async runWrite<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === 'P2025' || err.code === 'P2003')) {
        throw new ApiError(
          400,
          'Invalid reference: destination/grade/style/transportation/meals/accommodation, or one of the linked categories, places, FAQs, group FAQs, trip infos, or related packages does not exist',
        );
      }
      throw err;
    }
  }

  async create(dto: CreatePackageDtoType) {
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.title);
    const pkg = await this.runWrite(() => this.repository.create({ ...dto, slug }));
    void revalidateFrontendTags(packageTags(slug), packagePaths(slug));
    return pkg;
  }

  async findAllPublic(dto: GetPackagesDtoType) {
    return this.list(dto, { isActive: true, deletedAt: null });
  }

  async findAllAdmin(dto: GetPackagesAdminDtoType) {
    const where: Prisma.PackageWhereInput = { deletedAt: dto.includeTrashed ? { not: null } : null };
    if (dto.isActive !== undefined) where.isActive = dto.isActive;
    return this.list(dto, where);
  }

  private async list(dto: GetPackagesDtoType, extraWhere: Prisma.PackageWhereInput) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.PackageWhereInput = {
      ...extraWhere,
      ...(dto.search ? { title: { contains: dto.search, mode: 'insensitive' } } : {}),
      ...(dto.destinationId ? { destinationId: dto.destinationId } : {}),
      ...(dto.gradeId ? { gradeId: dto.gradeId } : {}),
      ...(dto.styleId ? { styleId: dto.styleId } : {}),
      ...(dto.categoryId ? { categories: { some: { id: dto.categoryId } } } : {}),
      ...(dto.placeId ? { places: { some: { id: dto.placeId } } } : {}),
      ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
      ...(dto.isPopular !== undefined ? { isPopular: dto.isPopular } : {}),
    };

    // The "Most Popular Journeys" pool orders by its own `popularSortOrder`
    // field, independent of the Featured carousel's `sortOrder` — see
    // PackageRepository.reorderPopular's own comment. Only switches when a
    // caller explicitly filters `isPopular`, so every other listing (the
    // admin's general list, the public catalog, the Featured carousel) keeps
    // ordering by `sortOrder` exactly as before.
    const orderBy: Prisma.PackageOrderByWithRelationInput[] =
      dto.isPopular === true ? [{ popularSortOrder: 'asc' }, { createdAt: 'desc' }] : [{ sortOrder: 'asc' }, { createdAt: 'desc' }];

    const [items, total] =
      dto.categoryId && dto.isPopular !== true
        ? await this.listInCategoryOrder(dto.categoryId, where, orderBy, pagination)
        : await Promise.all([
            this.repository.findMany(where, { skip: pagination.skip, take: pagination.take, orderBy }),
            this.repository.count(where),
          ]);

    // NOTE: `imageUrl` here is still the raw Media.fullPath, not a URL yet
    // — same deliberate half-step as blog.service.ts's/package-map's own
    // list(), which the controller finishes (turns into an absolute URL,
    // or null) right before the response goes out.
    const imagePaths = await this.repository.findFeaturedImagePaths(items.map((item) => item.id));
    const itemsWithImage = items.map((item) => ({ ...item, imageUrl: imagePaths.get(item.id) ?? null }));

    return PaginationDto.create({ items: itemsWithImage, page: pagination.page, perPage: pagination.perPage, total });
  }

  // Category-browse pages (/nepal-tour-packages, /everest-region-treks, ...)
  // follow the admin's per-category order (CategoryPackageOrder). Packages
  // without a saved position — never reordered, or added to the category
  // after the last reorder — keep the default order, after the ordered ones.
  // Sorted in JS before paginating: Prisma can't orderBy a row of a separate
  // table, and a category holds at most a few dozen packages.
  private async listInCategoryOrder(
    categoryId: string,
    where: Prisma.PackageWhereInput,
    orderBy: Prisma.PackageOrderByWithRelationInput[],
    pagination: PaginationQueryDto,
  ) {
    const [ids, positions] = await Promise.all([
      this.repository.findIds(where, orderBy),
      this.repository.findCategoryOrder(categoryId),
    ]);
    const orderedIds = ids
      .map((id, fallback) => ({ id, fallback, position: positions.get(id) ?? Number.MAX_SAFE_INTEGER }))
      .sort((a, b) => a.position - b.position || a.fallback - b.fallback)
      .map((entry) => entry.id);

    const pageIds = orderedIds.slice(pagination.skip, pagination.skip + pagination.take);
    const rows = await this.repository.findMany({ id: { in: pageIds } });
    const byId = new Map(rows.map((row) => [row.id, row]));
    const items = pageIds.map((id) => byId.get(id)).filter((row) => row !== undefined);
    return [items, orderedIds.length] as const;
  }

  // Admin drag-and-drop for one category's page. `ids` must be exactly the
  // category's current (non-trashed) packages, active or not — the same set
  // the admin's reorder list shows.
  async reorderInCategory(categoryId: string, dto: ReorderPackagesDtoType) {
    const memberIds = await this.repository.findIds({ deletedAt: null, categories: { some: { id: categoryId } } }, []);
    const requested = new Set(dto.ids);
    const isExactSet =
      requested.size === dto.ids.length && requested.size === memberIds.length && memberIds.every((id) => requested.has(id));
    if (!isExactSet) {
      throw new ApiError(400, 'ids must list every package in this category exactly once — reload and try again');
    }

    await this.repository.replaceCategoryOrder(categoryId, dto.ids);
    // Region pages are tagged `trekking-region-<slug>` and plain category
    // pages `category:<id>`, but both also carry "trips" — see packageTags.
    // The page itself is prerendered (/[slug] generateStaticParams), so its
    // path needs busting too — see packagePaths's comment.
    const slug = await this.repository.findCategorySlug(categoryId);
    void revalidateFrontendTags(['packages', 'trips', `category:${categoryId}`], slug ? [`/${slug}`] : []);
  }

  async findPublicBySlug(slug: string) {
    const pkg = await this.repository.findBySlug(slug, { isActive: true, deletedAt: null });
    if (!pkg) throw new ApiError(404, 'Package not found');
    const detailIds = pkg.itinerary?.details.map((detail) => detail.id) ?? [];
    const [imagePaths, galleryImages, itineraryPhotos] = await Promise.all([
      this.repository.findFeaturedImagePaths([pkg.id]),
      this.repository.findGalleryImages(pkg.id),
      this.repository.findItineraryDetailPhotos(detailIds),
    ]);
    const itinerary = pkg.itinerary
      ? { ...pkg.itinerary, details: pkg.itinerary.details.map((detail) => ({ ...detail, photos: itineraryPhotos.get(detail.id) ?? [] })) }
      : pkg.itinerary;
    return { ...pkg, imageUrl: imagePaths.get(pkg.id) ?? null, galleryImages, itinerary };
  }

  async findById(id: string) {
    const pkg = await this.repository.findById(id);
    if (!pkg || pkg.deletedAt) throw new ApiError(404, 'Package not found');
    return pkg;
  }

  async update(id: string, dto: UpdatePackageDtoType) {
    const existing = await this.findById(id);
    const slug = dto.slug || dto.title ? await this.resolveUniqueSlug(dto.slug ?? dto.title!, id) : undefined;

    const updated = await this.runWrite(() => this.repository.update(id, { ...dto, slug }));
    // Revalidate both the old and new slug: renaming a package leaves the
    // previous slug's cached entry behind otherwise (see page.service.ts's
    // own update() for the same reasoning).
    const slugs = [...new Set([existing.slug, updated.slug].filter(Boolean))] as string[];
    void revalidateFrontendTags(
      ['packages', 'trips', ...slugs.map((s) => `package:${s}`)],
      slugs.map((s) => `/${s}`),
    );
    return updated;
  }

  async reorder(dto: ReorderPackagesDtoType) {
    await this.repository.reorder(dto.ids);
    // No single slug/path here — this touches the whole catalog's order,
    // not one package, so just bust the tag every package-listing view
    // shares (see packageTags's own comment above).
    void revalidateFrontendTags(['packages', 'trips'], []);
  }

  async reorderPopular(dto: ReorderPackagesDtoType) {
    await this.repository.reorderPopular(dto.ids);
    void revalidateFrontendTags(['packages', 'trips'], []);
  }

  async remove(id: string) {
    const existing = await this.findById(id);
    await this.repository.softDelete(id);
    void revalidateFrontendTags(packageTags(existing.slug), packagePaths(existing.slug));
  }

  async restore(id: string) {
    const pkg = await this.repository.findById(id);
    if (!pkg) throw new ApiError(404, 'Package not found');
    await this.repository.restore(id);
    void revalidateFrontendTags(packageTags(pkg.slug), packagePaths(pkg.slug));
  }

  async hardDelete(id: string) {
    assertInTrash(await this.repository.findById(id), 'Package');
    const { bookings, customBookings, payments } = await this.repository.countFinancialRecords(id);
    const total = bookings + customBookings + payments;
    if (total > 0) {
      throw new ApiError(
        409,
        `Cannot delete permanently: ${bookings} bookings, ${customBookings} custom bookings and ${payments} payments still reference this package`,
      );
    }
    await runHardDelete(() => this.repository.hardDelete(id));
  }
}
