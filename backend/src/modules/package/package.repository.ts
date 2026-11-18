import { AttachmentRole, Prisma, PrismaClient } from '@prisma/client';
import { findAttachmentImagePaths } from '../../lib/attachment-images';
import { deleteOwnedRows } from '../../lib/hard-delete';
import { ApiError } from '../../common/exceptions/api-error';

const OWNER_TYPE = 'package';

export interface ItineraryDetailMediaItem {
  path: string;
  type: 'image' | 'video';
}

// A package save runs dozens of queries in one transaction; against a remote database the default
// 5s limit is too short, so give it room before Prisma gives up and aborts.
const TRANSACTION_OPTIONS = { maxWait: 20_000, timeout: 120_000 };

const packageInclude = {
  destination: true,
  grade: true,
  style: true,
  transportation: true,
  meals: true,
  accommodation: true,
  categories: true,
  faqCategories: true,
  places: true,
  faqs: true,
  groupFaqs: true,
  tripInfos: true,
  customRelated: { select: { id: true, title: true } },
  costDetails: { include: { costCategory: true }, orderBy: { sortOrder: 'asc' } },
  priceGroups: true,
  facts: true,
  addOns: true,
  tiers: true,
} satisfies Prisma.PackageInclude;

// Richer include for the single-item public detail lookup only
// (`findBySlug`, called solely by `PackageService.findPublicBySlug`) —
// adds `departures`/`testimonials`/`itinerary.details` (with each day's
// origin/destination `Place`, and `groupFaqs` nested with its own
// `categories`) that the detail page's mapper
// (frontend/src/features/trips/lib/map-package-detail.ts) needs but the
// list/admin/CRUD paths above don't render, so `findMany`/`findById`
// stay on the leaner `packageInclude` rather than paying for this on
// every row of a `perPage=100` list fetch.
const packageDetailInclude = {
  ...packageInclude,
  groupFaqs: { include: { categories: true } },
  departures: true,
  testimonials: true,
  itinerary: {
    include: {
      details: {
        include: { originPlace: true, destinationPlace: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  },
} satisfies Prisma.PackageInclude;

interface CostDetailItem {
  costCategoryId?: string;
  detailKey?: string;
  detailTitle?: string;
  detailDescription?: string;
  detailExtra?: string;
}
interface PriceGroupItem {
  packageTier: string;
  minPeople: number;
  maxPeople: number;
  shortDescription?: string;
  unitPrice: number;
  offerUnitPrice?: number;
  offerLabel?: string;
  offerInformation?: string;
  isDefault?: boolean;
}
interface FactItem {
  factTitle: string;
  factValue: string;
}
interface AddOnItem {
  addonTitle: string;
  addonDescription?: string;
  addonPrice: number;
  addonUnit?: string;
  chargeBy?: 'PERSON' | 'ROOM' | 'FLAT';
  peoplePerRoom?: number;
}
interface TierItem {
  packageTier: string;
  packageTierAlias: string;
  packageTierDescription: string;
  costIncludes?: string;
  costExcludes?: string;
  wetravelUuid?: string;
}
interface ExtraFaqItem {
  question: string;
  answer: string;
}

export interface PackageCoreFields {
  title: string;
  abstract?: string | null;
  details?: string | null;
  tripInfoText?: string | null;
  highlights?: string | null;
  costIncludesText?: string | null;
  costExcludesText?: string | null;
  extraFaqs?: ExtraFaqItem[];
  packingListIntro?: string | null;
  price: number;
  duration: number;
  durationType: string;
  groupSize?: string | null;
  discount?: number | null;
  maxAltitude?: string | null;
  geoLongitude?: string | null;
  geoLatitude?: string | null;
  usefulInfo?: string | null;
  departureNote?: string | null;
  additionalField1?: string | null;
  additionalField2?: string | null;
  isFeatured?: boolean;
  isPopular?: boolean;
  isActive?: boolean;
  publishedAt?: Date;
  sortOrder?: number;
  destinationId: string;
  gradeId?: string | null;
  styleId?: string | null;
  transportationId?: string | null;
  mealsId?: string | null;
  accommodationId?: string | null;
}

export interface PackageRelationFields {
  categoryIds?: string[];
  faqCategoryIds?: string[];
  placeIds?: string[];
  faqIds?: string[];
  groupFaqIds?: string[];
  tripInfoIds?: string[];
  customRelatedIds?: string[];
}

export interface PackageChildFields {
  costIncludes?: CostDetailItem[];
  costExcludes?: CostDetailItem[];
  priceGroups?: PriceGroupItem[];
  facts?: FactItem[];
  addOns?: AddOnItem[];
  tiers?: TierItem[];
}

export interface PackageSeoFields {
  slug?: string;
  urlTitle?: string;
  canonical?: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type PackageCreateData = Partial<PackageCoreFields> &
  Pick<PackageCoreFields, 'title' | 'price' | 'duration' | 'durationType' | 'destinationId'> &
  PackageRelationFields &
  PackageChildFields &
  PackageSeoFields;

export type PackageUpdateData = Partial<PackageCoreFields> & PackageRelationFields & PackageChildFields & PackageSeoFields;

const toConnect = (ids?: string[]) => (ids ? { connect: ids.map((id) => ({ id })) } : undefined);
const toSet = (ids?: string[]) => (ids ? { set: ids.map((id) => ({ id })) } : undefined);

export class PackageRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeo(id: string) {
    const [urlInfo, meta] = await Promise.all([
      this.prisma.urlInfo.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
      this.prisma.meta.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
    ]);
    return { urlInfo, meta };
  }

  private async withSeo<T extends { id: string }>(pkg: T) {
    const { urlInfo, meta } = await this.attachSeo(pkg.id);
    return {
      ...pkg,
      slug: urlInfo?.urlSlug ?? null,
      urlTitle: urlInfo?.urlTitle ?? null,
      canonical: urlInfo?.canonical ?? null,
      meta,
    };
  }

  /**
   * One row per category: `detailDescription` holds that category's rich-text
   * list, `detailTitle` defaults to the category name. Rows with a `costCategoryId` get `detailKey` filled from that category's
   * current name (the denormalized copy older readers still use); array
   * position becomes `sortOrder` so item order survives a round trip.
   */
  private async costDetailRows(tx: Prisma.TransactionClient, data: PackageChildFields) {
    const includes = (data.costIncludes ?? []).map((d, i) => ({ ...d, sortOrder: i, detailType: 'INCLUDE' as const }));
    const excludes = (data.costExcludes ?? []).map((d, i) => ({ ...d, sortOrder: i, detailType: 'EXCLUDE' as const }));
    const rows = [...includes, ...excludes];

    const ids = [...new Set(rows.map((r) => r.costCategoryId).filter((id): id is string => !!id))];
    const categories = ids.length ? await tx.costCategory.findMany({ where: { id: { in: ids } } }) : [];
    const nameById = new Map(categories.map((c) => [c.id, c.name]));

    return rows.map(({ costCategoryId, detailKey, ...rest }) => {
      const name = costCategoryId ? nameById.get(costCategoryId) : undefined;
      if (costCategoryId && !name) throw new ApiError(400, 'Unknown cost category');
      const key = (name ?? detailKey) as string;
      return { ...rest, costCategoryId: costCategoryId ?? null, detailKey: key, detailTitle: rest.detailTitle || key };
    });
  }

  async create(data: PackageCreateData) {
    const pkg = await this.prisma.$transaction(async (tx) => {
      // New packages land at the end of the manual order, not the start —
      // `sortOrder: 0` (the column default) would otherwise tie every new
      // row with the front of the pack, given findMany()'s `sortOrder asc`
      // ordering.
      let sortOrder = data.sortOrder;
      if (sortOrder === undefined) {
        const last = await tx.package.aggregate({ _max: { sortOrder: true } });
        sortOrder = (last._max.sortOrder ?? -1) + 1;
      }

      const created = await tx.package.create({
        data: {
          title: data.title,
          abstract: data.abstract ?? null,
          details: data.details ?? null,
          tripInfoText: data.tripInfoText ?? null,
          highlights: data.highlights ?? null,
          costIncludesText: data.costIncludesText ?? null,
          costExcludesText: data.costExcludesText ?? null,
          extraFaqs: data.extraFaqs as Prisma.InputJsonValue | undefined,
          packingListIntro: data.packingListIntro ?? null,
          price: data.price,
          duration: data.duration,
          durationType: data.durationType,
          groupSize: data.groupSize ?? null,
          discount: data.discount ?? null,
          maxAltitude: data.maxAltitude ?? null,
          geoLongitude: data.geoLongitude ?? null,
          geoLatitude: data.geoLatitude ?? null,
          usefulInfo: data.usefulInfo ?? null,
          departureNote: data.departureNote ?? null,
          additionalField1: data.additionalField1 ?? null,
          additionalField2: data.additionalField2 ?? null,
          isFeatured: data.isFeatured ?? false,
          isPopular: data.isPopular ?? false,
          isActive: data.isActive ?? true,
          publishedAt: data.publishedAt,
          sortOrder,
          destinationId: data.destinationId,
          gradeId: data.gradeId ?? null,
          styleId: data.styleId ?? null,
          transportationId: data.transportationId ?? null,
          mealsId: data.mealsId ?? null,
          accommodationId: data.accommodationId ?? null,
          categories: toConnect(data.categoryIds),
          faqCategories: toConnect(data.faqCategoryIds),
          places: toConnect(data.placeIds),
          faqs: toConnect(data.faqIds),
          groupFaqs: toConnect(data.groupFaqIds),
          tripInfos: toConnect(data.tripInfoIds),
          customRelated: toConnect(data.customRelatedIds),
          costDetails: { create: await this.costDetailRows(tx, data) },
          priceGroups: { create: data.priceGroups ?? [] },
          facts: { create: data.facts ?? [] },
          addOns: { create: data.addOns ?? [] },
          tiers: { create: data.tiers ?? [] },
        },
        include: packageInclude,
      });

      if (data.slug) {
        await tx.urlInfo.create({
          data: {
            ownerType: OWNER_TYPE,
            ownerId: created.id,
            urlSlug: data.slug,
            urlTitle: data.urlTitle ?? data.title,
            canonical: data.canonical ?? null,
          },
        });
      }

      if (data.metaTitle || data.metaKeywords || data.metaDescription) {
        await tx.meta.create({
          data: {
            ownerType: OWNER_TYPE,
            ownerId: created.id,
            metaTitle: data.metaTitle ?? null,
            metaKeywords: data.metaKeywords ?? null,
            metaDescription: data.metaDescription ?? null,
          },
        });
      }

      return created;
    }, TRANSACTION_OPTIONS);

    return this.withSeo(pkg);
  }

  async update(id: string, data: PackageUpdateData) {
    const pkg = await this.prisma.$transaction(async (tx) => {
      // Replace-on-submit semantics for the nested child arrays — only
      // touched when the caller actually sent that section of the form.
      if (data.costIncludes !== undefined || data.costExcludes !== undefined) {
        await tx.costDetail.deleteMany({ where: { packageId: id } });
      }
      if (data.priceGroups !== undefined) {
        await tx.priceGroup.deleteMany({ where: { packageId: id } });
      }
      if (data.facts !== undefined) {
        await tx.packageFact.deleteMany({ where: { packageId: id } });
      }
      if (data.addOns !== undefined) {
        await tx.addOn.deleteMany({ where: { packageId: id } });
      }
      if (data.tiers !== undefined) {
        await tx.packageTier.deleteMany({ where: { packageId: id } });
      }

      const updated = await tx.package.update({
        where: { id },
        data: {
          title: data.title,
          abstract: data.abstract,
          details: data.details,
          tripInfoText: data.tripInfoText,
          highlights: data.highlights,
          costIncludesText: data.costIncludesText,
          costExcludesText: data.costExcludesText,
          extraFaqs: data.extraFaqs as Prisma.InputJsonValue | undefined,
          packingListIntro: data.packingListIntro,
          price: data.price,
          duration: data.duration,
          durationType: data.durationType,
          groupSize: data.groupSize,
          discount: data.discount,
          maxAltitude: data.maxAltitude,
          geoLongitude: data.geoLongitude,
          geoLatitude: data.geoLatitude,
          usefulInfo: data.usefulInfo,
          departureNote: data.departureNote,
          additionalField1: data.additionalField1,
          additionalField2: data.additionalField2,
          isFeatured: data.isFeatured,
          isPopular: data.isPopular,
          isActive: data.isActive,
          publishedAt: data.publishedAt,
          destinationId: data.destinationId,
          gradeId: data.gradeId,
          styleId: data.styleId,
          transportationId: data.transportationId,
          mealsId: data.mealsId,
          accommodationId: data.accommodationId,
          categories: toSet(data.categoryIds),
          faqCategories: toSet(data.faqCategoryIds),
          places: toSet(data.placeIds),
          faqs: toSet(data.faqIds),
          groupFaqs: toSet(data.groupFaqIds),
          tripInfos: toSet(data.tripInfoIds),
          customRelated: toSet(data.customRelatedIds),
          costDetails:
            data.costIncludes !== undefined || data.costExcludes !== undefined
              ? { create: await this.costDetailRows(tx, data) }
              : undefined,
          priceGroups: data.priceGroups !== undefined ? { create: data.priceGroups } : undefined,
          facts: data.facts !== undefined ? { create: data.facts } : undefined,
          addOns: data.addOns !== undefined ? { create: data.addOns } : undefined,
          tiers: data.tiers !== undefined ? { create: data.tiers } : undefined,
        },
        include: packageInclude,
      });

      if (data.slug) {
        await tx.urlInfo.upsert({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          create: {
            ownerType: OWNER_TYPE,
            ownerId: id,
            urlSlug: data.slug,
            urlTitle: data.urlTitle ?? data.title ?? updated.title,
            canonical: data.canonical ?? null,
          },
          update: { urlSlug: data.slug, urlTitle: data.urlTitle ?? data.title, canonical: data.canonical },
        });
      } else if (data.canonical !== undefined || data.urlTitle !== undefined) {
        // The urlInfo row is guaranteed to already exist here — PackageService.create
        // always resolves and persists a slug, so a plain update (no upsert) is safe.
        await tx.urlInfo.update({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          data: { canonical: data.canonical, urlTitle: data.urlTitle },
        });
      }

      if (data.metaTitle !== undefined || data.metaKeywords !== undefined || data.metaDescription !== undefined) {
        await tx.meta.upsert({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          create: {
            ownerType: OWNER_TYPE,
            ownerId: id,
            metaTitle: data.metaTitle ?? null,
            metaKeywords: data.metaKeywords ?? null,
            metaDescription: data.metaDescription ?? null,
          },
          update: {
            metaTitle: data.metaTitle,
            metaKeywords: data.metaKeywords,
            metaDescription: data.metaDescription,
          },
        });
      }

      return updated;
    }, TRANSACTION_OPTIONS);

    return this.withSeo(pkg);
  }

  async findById(id: string) {
    const pkg = await this.prisma.package.findUnique({ where: { id }, include: packageInclude });
    return pkg ? this.withSeo(pkg) : null;
  }

  async findBySlug(slug: string, extraWhere: Prisma.PackageWhereInput = {}) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    if (!urlInfo) return null;
    const pkg = await this.prisma.package.findFirst({ where: { id: urlInfo.ownerId, ...extraWhere }, include: packageDetailInclude });
    return pkg ? this.withSeo(pkg) : null;
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(
    where: Prisma.PackageWhereInput,
    options?: { skip?: number; take?: number; orderBy?: Prisma.PackageOrderByWithRelationInput[] },
  ) {
    const packages = await this.prisma.package.findMany({
      where,
      include: packageInclude,
      // Manual order first (admin drag-and-drop, see `reorder`/`reorderPopular`
      // below); `createdAt desc` only breaks ties among rows nobody has
      // repositioned yet (everything still at the default 0). Callers filtering
      // by `isPopular` pass the `popularSortOrder`-based variant instead (see
      // PackageService.list) — a separate pool needs its own manual order.
      orderBy: options?.orderBy ?? [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip: options?.skip,
      take: options?.take,
    });
    return Promise.all(packages.map((p) => this.withSeo(p)));
  }

  async count(where: Prisma.PackageWhereInput) {
    return this.prisma.package.count({ where });
  }

  // Bulk-persists a manual drag-and-drop order from the admin's Packages
  // list. `ids` is the full list of package ids in their new display
  // order (as currently loaded/filtered in the admin), so array index
  // becomes the new `sortOrder` — same "stamp position on write" idea as
  // ItineraryDetail's own reconcileDetails, but as a dedicated bulk write
  // since packages aren't already resent as one array on every save.
  async reorder(ids: string[]) {
    await this.prisma.$transaction(ids.map((id, index) => this.prisma.package.update({ where: { id }, data: { sortOrder: index } })));
  }

  findIds(where: Prisma.PackageWhereInput, orderBy: Prisma.PackageOrderByWithRelationInput[]) {
    return this.prisma.package.findMany({ where, select: { id: true }, orderBy }).then((rows) => rows.map((r) => r.id));
  }

  // Per-category manual order (CategoryPackageOrder) as packageId → sortOrder.
  async findCategoryOrder(categoryId: string) {
    const rows = await this.prisma.categoryPackageOrder.findMany({ where: { categoryId } });
    return new Map(rows.map((r) => [r.packageId, r.sortOrder]));
  }

  // The category's public page slug (e.g. "nepal-tour-packages"), for
  // revalidating its prerendered path after a reorder.
  findCategorySlug(categoryId: string) {
    return this.prisma.urlInfo
      .findUnique({ where: { ownerType_ownerId: { ownerType: 'category', ownerId: categoryId } }, select: { urlSlug: true } })
      .then((row) => row?.urlSlug ?? null);
  }

  // Replaces the category's whole order in one go — deleting first also
  // clears rows left behind by packages since removed from the category.
  async replaceCategoryOrder(categoryId: string, ids: string[]) {
    await this.prisma.$transaction([
      this.prisma.categoryPackageOrder.deleteMany({ where: { categoryId } }),
      this.prisma.categoryPackageOrder.createMany({
        data: ids.map((packageId, index) => ({ categoryId, packageId, sortOrder: index })),
      }),
    ]);
  }

  // Same bulk "stamp position on write" idea as `reorder` above, but for the
  // independent `isPopular` pool (its own field, `popularSortOrder`, so
  // reordering the homepage's "Most Popular Journeys" section never touches
  // `sortOrder`/the Featured carousel's order).
  async reorderPopular(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.package.update({ where: { id }, data: { popularSortOrder: index } })),
    );
  }

  // GET /attachments (where a package's card photo lives, as a FEATURED
  // or BANNER Attachment) requires auth — this resolves the same
  // attachment straight from the DB for public listing pages (e.g. the
  // homepage's featured trips) to embed as `imageUrl`. Same two-role
  // situation package-map.repository.ts's/blog.repository.ts's own
  // findFeaturedImagePaths already hit — PackageForm's admin UI offers
  // both a "Featured Image" (FEATURED) and "Banner Image" (BANNER)
  // field, so prefer FEATURED and fall back to BANNER when only one was
  // set. See findAttachmentImagePaths (lib/attachment-images.ts) for the
  // shared resolution logic.
  findFeaturedImagePaths(packageIds: string[]): Promise<Map<string, string>> {
    return findAttachmentImagePaths(this.prisma, OWNER_TYPE, packageIds, [
      AttachmentRole.FEATURED,
      AttachmentRole.BANNER,
    ]);
  }

  // Public detail page's hero gallery — same shape/pattern as
  // place.repository.ts's own findGalleryImages, but a *different* role
  // set: confirmed live (`SELECT "ownerType","role",count(*) ... GROUP
  // BY`) that packages have zero GALLERY-role attachments — real photos
  // beyond the single FEATURED/BANNER cover findFeaturedImagePaths
  // resolves are filed as more FEATURED/SINGLE_BANNER/BANNER rows
  // instead (a real package can have several BANNER attachments, e.g. 6
  // on "Everest Base Camp Trekking"). Ranked FEATURED first (matches the
  // single-cover priority above), then BANNER, then SINGLE_BANNER —
  // BANNER before SINGLE_BANNER so the hero's 2nd tile is the photo the
  // admin's "Banner Image" field shows (BANNER's first row); it used to be
  // the other way round, so a package with both showed a different photo
  // there than the admin. `sortOrder` alone can't do this ordering since
  // real migrated data has every row at `sortOrder: 0` (never
  // differentiated); `createdAt` breaks the ties, same as the admin's list.
  //
  // GALLERY goes last: the admin's Package → Photos tab has a "Photo
  // Gallery" (GALLERY) field, and until it was added here anything
  // uploaded through it was silently never shown on the public page.
  // Legacy data has none, so this only ever surfaces admin-added photos
  // — after Featured/Banner, i.e. the hero's 3rd/4th tiles onward.
  private static readonly GALLERY_ROLES: AttachmentRole[] = [
    AttachmentRole.FEATURED,
    AttachmentRole.BANNER,
    AttachmentRole.SINGLE_BANNER,
    AttachmentRole.GALLERY,
  ];

  async findGalleryImages(packageId: string) {
    const attachments = await this.prisma.attachment.findMany({
      where: {
        ownerType: OWNER_TYPE,
        ownerId: packageId,
        role: { in: PackageRepository.GALLERY_ROLES },
        isActive: true,
        media: { isActive: true, deletedAt: null },
      },
      include: { media: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    // Array.prototype.sort is stable — this re-ranks by role while
    // preserving each role group's own sortOrder ordering from the query.
    const ranked = [...attachments].sort(
      (a, b) => PackageRepository.GALLERY_ROLES.indexOf(a.role) - PackageRepository.GALLERY_ROLES.indexOf(b.role),
    );
    return ranked.map((attachment) => ({
      id: attachment.id,
      path: attachment.media.fullPath,
      altText: attachment.media.altText,
      caption: attachment.media.caption,
      width: attachment.media.width,
      height: attachment.media.height,
    }));
  }

  // Real per-itinerary-day photos (Figma's day cards each show up to 3, now
  // up to 3 photos+video — see AttachmentService's own cap) — confirmed
  // live: 477 real GALLERY-role Attachments filed under `ownerType:
  // 'itinerary-detail'` (kebab-case, matching this codebase's own
  // convention — see e.g. 'package-map', 'blog-author') from the legacy
  // migration. The admin's per-day stop gallery (ItineraryForm's
  // STOP_OWNER_TYPE, and itinerary.repository.ts's own DETAIL_OWNER_TYPE
  // that cleans it up) writes camelCase `'itineraryDetail'` instead — an
  // inconsistency, not two intentional sources — so both spellings are
  // matched here or anything an admin adds through the UI never surfaces
  // on the public page. Batched across every detail id in one query rather
  // than N individual ones (a package's itinerary can have 15-20+ day rows).
  async findItineraryDetailPhotos(detailIds: string[]): Promise<Map<string, ItineraryDetailMediaItem[]>> {
    if (detailIds.length === 0) return new Map();
    const attachments = await this.prisma.attachment.findMany({
      where: {
        ownerType: { in: ['itinerary-detail', 'itineraryDetail'] },
        ownerId: { in: detailIds },
        role: AttachmentRole.GALLERY,
        isActive: true,
        media: { isActive: true, deletedAt: null },
      },
      include: { media: true },
      orderBy: { sortOrder: 'asc' },
    });
    const photosByDetailId = new Map<string, ItineraryDetailMediaItem[]>();
    for (const attachment of attachments) {
      const items = photosByDetailId.get(attachment.ownerId) ?? [];
      items.push({
        path: attachment.media.fullPath,
        type: attachment.media.mime?.startsWith('video/') ? 'video' : 'image',
      });
      photosByDetailId.set(attachment.ownerId, items);
    }
    return photosByDetailId;
  }

  async softDelete(id: string) {
    return this.prisma.package.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(id: string) {
    return this.prisma.package.update({ where: { id }, data: { deletedAt: null } });
  }

  // Bookings and payments only SET NULL on their packageId, so the database
  // would happily delete the package and silently strip the link off every
  // financial record. Count them so the service can refuse instead.
  async countFinancialRecords(id: string) {
    const [bookings, customBookings, payments] = await Promise.all([
      this.prisma.booking.count({ where: { packageId: id } }),
      this.prisma.customBooking.count({ where: { packageId: id } }),
      this.prisma.payment.count({ where: { packageId: id } }),
    ]);
    return { bookings, customBookings, payments };
  }

  async hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const itineraries = await tx.itinerary.findMany({ where: { packageId: id }, select: { id: true } });
      const itineraryIds = itineraries.map((i) => i.id);
      const details = await tx.itineraryDetail.findMany({
        where: { itineraryId: { in: itineraryIds } },
        select: { id: true },
      });
      const maps = await tx.packageMap.findMany({ where: { packageId: id }, select: { id: true } });

      await deleteOwnedRows(tx, 'itineraryDetail', details.map((d) => d.id));
      await deleteOwnedRows(tx, 'itinerary', itineraryIds);
      await deleteOwnedRows(tx, 'package-map', maps.map((m) => m.id));
      await deleteOwnedRows(tx, OWNER_TYPE, [id]);

      await tx.itineraryFact.deleteMany({ where: { detail: { itineraryId: { in: itineraryIds } } } });
      await tx.itineraryDetail.deleteMany({ where: { itineraryId: { in: itineraryIds } } });
      await tx.itinerary.deleteMany({ where: { packageId: id } });
      await tx.packageMap.deleteMany({ where: { packageId: id } });
      await tx.costDetail.deleteMany({ where: { packageId: id } });
      await tx.priceGroup.deleteMany({ where: { packageId: id } });
      await tx.packageFact.deleteMany({ where: { packageId: id } });
      await tx.addOn.deleteMany({ where: { packageId: id } });
      await tx.packageTier.deleteMany({ where: { packageId: id } });
      await tx.packageGearItem.deleteMany({ where: { packageId: id } });
      await tx.departure.deleteMany({ where: { packageId: id } });
      return tx.package.delete({ where: { id } });
    });
  }
}
