import { AttachmentRole, PrismaClient } from '@prisma/client';

export interface AttachmentCreateData {
  mediaId: string;
  ownerType: string;
  ownerId: string;
  role: AttachmentRole;
  sortOrder: number;
  reelUrl?: string;
  shortDescription?: string;
  contentUrl?: string;
  isFeatured?: boolean;
}

// A day's photo gallery exists under two `ownerType` spellings: the legacy
// migration wrote kebab-case `'itinerary-detail'` (477 rows), while the admin's
// per-day gallery writes camelCase `'itineraryDetail'`. They are the same
// thing, so reads and appends treat both as one — otherwise the admin can't
// see (or count, or order against) the photos the public page already shows.
const ITINERARY_DETAIL_OWNER_TYPES = ['itineraryDetail', 'itinerary-detail'];
const ownerTypeMatch = (ownerType: string) =>
  ITINERARY_DETAIL_OWNER_TYPES.includes(ownerType) ? { in: ITINERARY_DETAIL_OWNER_TYPES } : ownerType;

export class AttachmentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: AttachmentCreateData) {
    return this.prisma.attachment.create({ data, include: { media: true } });
  }

  async findById(id: string) {
    return this.prisma.attachment.findUnique({ where: { id }, include: { media: true } });
  }

  async findByIds(ids: string[]) {
    return this.prisma.attachment.findMany({ where: { id: { in: ids } }, select: { ownerType: true, ownerId: true } });
  }

  async findByOwner(ownerType: string, ownerId: string, role?: AttachmentRole) {
    return this.prisma.attachment.findMany({
      where: { ownerType: ownerTypeMatch(ownerType), ownerId, ...(role ? { role } : {}) },
      include: { media: true },
      // `createdAt` breaks ties: migrated rows all sit at sortOrder 0, and
      // without it the "first" photo of a role (what single-image admin
      // fields show, and what the public page leads with) is arbitrary.
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async maxSortOrder(ownerType: string, ownerId: string, role: AttachmentRole): Promise<number> {
    const top = await this.prisma.attachment.findFirst({
      where: { ownerType: ownerTypeMatch(ownerType), ownerId, role },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return top?.sortOrder ?? -1;
  }

  async deleteByOwnerRole(ownerType: string, ownerId: string, role: AttachmentRole) {
    return this.prisma.attachment.deleteMany({ where: { ownerType, ownerId, role } });
  }

  async delete(id: string) {
    return this.prisma.attachment.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    return this.prisma.$transaction(ids.map((id, index) => this.prisma.attachment.update({ where: { id }, data: { sortOrder: index } })));
  }

  // Per-day itinerary photos are owned by an ItineraryDetail row, three
  // hops away from the Package whose public `/[slug]` page actually
  // renders them (ItineraryDetail -> Itinerary -> Package) — needed so
  // AttachmentService can revalidate that page when a day's photo
  // gallery changes (see its own `revalidateOwner`). Package itself has
  // no `slug` column — same as package.repository.ts's own
  // `findBySlug`/`slugExists`, it lives on the polymorphic `UrlInfo`
  // table (`ownerType: 'package'`) instead, so a second lookup is needed
  // once the packageId is known.
  async findPackageSlugByItineraryDetailId(itineraryDetailId: string): Promise<string | null> {
    const detail = await this.prisma.itineraryDetail.findUnique({
      where: { id: itineraryDetailId },
      select: { itinerary: { select: { packageId: true } } },
    });
    if (!detail) return null;

    const urlInfo = await this.prisma.urlInfo.findUnique({
      where: { ownerType_ownerId: { ownerType: 'package', ownerId: detail.itinerary.packageId } },
    });
    return urlInfo?.urlSlug ?? null;
  }
}
