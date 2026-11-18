import { Prisma, PrismaClient } from '@prisma/client';

const OWNER_TYPE = 'itinerary';
// Per-day photo gallery (Attachment rows) is scoped to ItineraryDetail ids —
// ownerId there isn't a real FK, so it must be cleaned up by hand whenever a
// day row is deleted, or it's left orphaned. The legacy migration filed the
// same galleries under kebab-case `'itinerary-detail'` (see
// attachment.repository.ts), so both spellings are cleaned up.
const DETAIL_OWNER_TYPES = ['itineraryDetail', 'itinerary-detail'];

const itineraryInclude = {
  details: {
    include: { facts: true, originPlace: true, destinationPlace: true },
    // Explicit — without it Postgres returns rows in arbitrary order and the
    // admin's Day -> Stops grouping renders days out of sequence.
    orderBy: [{ sortOrder: 'asc' }, { itineraryStop: 'asc' }] as const,
  },
} satisfies Prisma.ItineraryInclude;

interface FactItem {
  factTitle: string;
  factValue: string;
}

interface DetailItem {
  // The row's own existing id, when it has one — see `reconcileDetails`.
  id?: string;
  itineraryDay: string;
  itineraryTitle?: string;
  itineraryShortDescription?: string;
  itineraryDescription?: string;
  itineraryStop?: number;
  accommodation?: string;
  lunchPlace?: string;
  meals?: string;
  origin?: string;
  originCoordinate?: string;
  originElevation?: string;
  // `null` (not just omitted) clears a previously-set place on update —
  // see create-itinerary.dto.ts's `optionalPlaceId`.
  originPlaceId?: string | null;
  destination?: string;
  destinationCoordinate?: string;
  destinationElevation?: string;
  destinationPlaceId?: string | null;
  travelMode?: string;
  distance?: string;
  duration?: string;
  encodedPolyline?: string;
  footnote?: string;
  isActive?: boolean;
  facts?: FactItem[];
}

export interface ItineraryCreateData {
  packageId: string;
  title: string;
  detailsText?: string | null;
  mapData?: string | null;
  details?: DetailItem[];
  slug?: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type ItineraryUpdateData = Partial<Omit<ItineraryCreateData, 'packageId'>>;

// Callers send `details` already in display order; the array index becomes the
// persisted sortOrder so that order survives the round trip. Used for brand-new
// itineraries only (create()) — `id` is stripped defensively even though the
// create flow never actually sends one, so a stray id can never be forwarded
// into a nested `create`.
const detailRows = (details: DetailItem[]) =>
  details.map(({ facts, id: _id, ...detail }, index) => ({
    ...detail,
    sortOrder: index,
    facts: { create: facts ?? [] },
  }));

export class ItineraryRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeo(id: string) {
    const [urlInfo, meta] = await Promise.all([
      this.prisma.urlInfo.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
      this.prisma.meta.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
    ]);
    return { urlInfo, meta };
  }

  private async withSeo<T extends { id: string }>(itinerary: T) {
    const { urlInfo, meta } = await this.attachSeo(itinerary.id);
    return { ...itinerary, slug: urlInfo?.urlSlug ?? null, meta };
  }

  async create(data: ItineraryCreateData) {
    const itinerary = await this.prisma.$transaction(async (tx) => {
      const created = await tx.itinerary.create({
        data: {
          packageId: data.packageId,
          title: data.title,
          detailsText: data.detailsText ?? null,
          mapData: data.mapData ?? null,
          details: { create: detailRows(data.details ?? []) },
        },
        include: itineraryInclude,
      });

      if (data.slug) {
        await tx.urlInfo.create({
          data: { ownerType: OWNER_TYPE, ownerId: created.id, urlSlug: data.slug, urlTitle: data.title },
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
    });

    return this.withSeo(itinerary);
  }

  // Reconciles the incoming day/stop list against what's already saved,
  // instead of the delete-everything-then-recreate this used to do. That
  // used to hand every row a fresh id on every single save — harmless for
  // the row's own scalar fields, but Attachment.ownerId (the per-day photo/
  // video gallery) is a plain string pointing at a row id, not a real FK
  // (DETAIL_OWNER_TYPES's own comment), so recreating the row silently
  // orphaned its gallery even when nothing about that day actually
  // changed. Reported live: adding a photo+video to a day, then saving
  // unrelated edits elsewhere on the same form, wiped that day's gallery.
  // Now: a row whose `id` is still present in the incoming list is
  // updated in place (same id survives, gallery stays attached); a row
  // dropped from the incoming list (the admin deleted that stop) is
  // deleted along with its own facts/attachments; a row with no `id` (a
  // stop added in this edit) is created fresh.
  private async reconcileDetails(tx: Prisma.TransactionClient, itineraryId: string, details: DetailItem[]) {
    const existingIds = new Set(
      (await tx.itineraryDetail.findMany({ where: { itineraryId }, select: { id: true } })).map((d) => d.id),
    );
    const keptIds = new Set(details.filter((d) => d.id && existingIds.has(d.id)).map((d) => d.id!));
    const staleIds = [...existingIds].filter((existingId) => !keptIds.has(existingId));

    if (staleIds.length > 0) {
      await tx.attachment.deleteMany({ where: { ownerType: { in: DETAIL_OWNER_TYPES }, ownerId: { in: staleIds } } });
      await tx.itineraryFact.deleteMany({ where: { detailId: { in: staleIds } } });
      await tx.itineraryDetail.deleteMany({ where: { id: { in: staleIds } } });
    }

    // Facts have no dependents of their own (unlike the detail row itself), so a plain
    // delete-then-recreate carries none of the orphaning risk above. One delete for every kept
    // row (instead of one per row) saves a network round trip per day on a remote database.
    if (keptIds.size > 0) {
      await tx.itineraryFact.deleteMany({ where: { detailId: { in: [...keptIds] } } });
    }

    for (const [index, { id: detailId, facts, ...rest }] of details.entries()) {
      if (detailId && keptIds.has(detailId)) {
        await tx.itineraryDetail.update({
          where: { id: detailId },
          data: { ...rest, sortOrder: index, facts: { create: facts ?? [] } },
        });
      } else {
        await tx.itineraryDetail.create({
          data: { ...rest, itineraryId, sortOrder: index, facts: { create: facts ?? [] } },
        });
      }
    }
  }

  async update(id: string, data: ItineraryUpdateData) {
    const itinerary = await this.prisma.$transaction(async (tx) => {
      if (data.details !== undefined) {
        await this.reconcileDetails(tx, id, data.details);
      }

      const updated = await tx.itinerary.update({
        where: { id },
        data: {
          title: data.title,
          detailsText: data.detailsText,
          mapData: data.mapData,
        },
        include: itineraryInclude,
      });

      if (data.slug) {
        await tx.urlInfo.upsert({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          create: { ownerType: OWNER_TYPE, ownerId: id, urlSlug: data.slug, urlTitle: data.title ?? updated.title },
          update: { urlSlug: data.slug, urlTitle: data.title },
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
    });

    return this.withSeo(itinerary);
  }

  async findById(id: string) {
    const itinerary = await this.prisma.itinerary.findUnique({ where: { id }, include: itineraryInclude });
    return itinerary ? this.withSeo(itinerary) : null;
  }

  async findByPackageId(packageId: string) {
    const itinerary = await this.prisma.itinerary.findUnique({ where: { packageId }, include: itineraryInclude });
    return itinerary ? this.withSeo(itinerary) : null;
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findPackageSlug(packageId: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: 'package', ownerId: packageId } });
    return urlInfo?.urlSlug ?? null;
  }

  async packageExists(packageId: string) {
    return this.prisma.package.findUnique({ where: { id: packageId }, select: { id: true } });
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const details = await tx.itineraryDetail.findMany({ where: { itineraryId: id }, select: { id: true } });

      await tx.urlInfo.deleteMany({ where: { ownerType: OWNER_TYPE, ownerId: id } });
      await tx.meta.deleteMany({ where: { ownerType: OWNER_TYPE, ownerId: id } });
      await tx.attachment.deleteMany({ where: { ownerType: OWNER_TYPE, ownerId: id } });
      await tx.attachment.deleteMany({
        where: { ownerType: { in: DETAIL_OWNER_TYPES }, ownerId: { in: details.map((d) => d.id) } },
      });
      await tx.itineraryFact.deleteMany({ where: { detail: { itineraryId: id } } });
      await tx.itineraryDetail.deleteMany({ where: { itineraryId: id } });
      return tx.itinerary.delete({ where: { id } });
    });
  }
}
