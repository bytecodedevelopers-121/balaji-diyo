import { AttachmentRole, Prisma, PrismaClient } from '@prisma/client';
import { findAttachmentImagePaths } from '../../lib/attachment-images';
import { deleteOwnedRows } from '../../lib/hard-delete';

const OWNER_TYPE = 'package-map';

export interface PackageMapCoreFields {
  packageId: string;
  mapTitle: string;
  mapAbstract?: string | null;
  mapDetails?: string | null;
  isActive?: boolean;
}

export interface PackageMapSeoFields {
  slug?: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type PackageMapCreateData = PackageMapCoreFields & PackageMapSeoFields;
export type PackageMapUpdateData = Partial<Omit<PackageMapCoreFields, 'packageId'>> & PackageMapSeoFields;

export class PackageMapRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeo(id: string) {
    const [urlInfo, meta] = await Promise.all([
      this.prisma.urlInfo.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
      this.prisma.meta.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
    ]);
    return { urlInfo, meta };
  }

  private async withSeo<T extends { id: string }>(map: T) {
    const { urlInfo, meta } = await this.attachSeo(map.id);
    return { ...map, slug: urlInfo?.urlSlug ?? null, meta };
  }

  async create(data: PackageMapCreateData) {
    const map = await this.prisma.$transaction(async (tx) => {
      const created = await tx.packageMap.create({
        data: {
          packageId: data.packageId,
          mapTitle: data.mapTitle,
          mapAbstract: data.mapAbstract ?? null,
          mapDetails: data.mapDetails ?? null,
          isActive: data.isActive ?? true,
        },
      });

      if (data.slug) {
        await tx.urlInfo.create({
          data: { ownerType: OWNER_TYPE, ownerId: created.id, urlSlug: data.slug, urlTitle: data.mapTitle },
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

    return this.withSeo(map);
  }

  async update(id: string, data: PackageMapUpdateData) {
    const map = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.packageMap.update({
        where: { id },
        data: {
          mapTitle: data.mapTitle,
          mapAbstract: data.mapAbstract,
          mapDetails: data.mapDetails,
          isActive: data.isActive,
        },
      });

      if (data.slug) {
        await tx.urlInfo.upsert({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          create: { ownerType: OWNER_TYPE, ownerId: id, urlSlug: data.slug, urlTitle: data.mapTitle ?? updated.mapTitle },
          update: { urlSlug: data.slug, urlTitle: data.mapTitle },
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

    return this.withSeo(map);
  }

  async findById(id: string) {
    const map = await this.prisma.packageMap.findUnique({ where: { id } });
    return map ? this.withSeo(map) : null;
  }

  // Mirrors team-member's findBySlug (team-member.repository.ts) — resolves
  // the slug via UrlInfo (ownerType 'package-map') first, same as every
  // other slugged module in this codebase.
  //
  // Also joins the owning Package's `categories` — not a PackageMap
  // field itself, but the public detail page's own "Related Maps" section
  // (2026-09-03) needs a real category id to query other trip maps under
  // the same region via `findAll`'s `categoryId` filter, mirroring how
  // BlogDetailSection picks `post.categories[0]?.id` for its own related
  // posts. Sorted with parented categories first (a real region like
  // "Everest Region Treks" — a child of "Trekking Routes in Nepal" — vs.
  // a flat top-level marketing tag like "Best Selling", which every
  // package's `categories` list also carries and which Prisma's implicit
  // many-to-many otherwise returns in no reliable order) so callers that
  // take `categories[0]` get the meaningful one, not whichever tag
  // happened to sort first. Flattened onto the returned object (not left
  // nested under `.package`) so callers read it the same way as every
  // other field.
  async findBySlug(slug: string, extraWhere: Prisma.PackageMapWhereInput = {}) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    if (!urlInfo) return null;
    const map = await this.prisma.packageMap.findFirst({
      where: { id: urlInfo.ownerId, ...extraWhere },
      include: { package: { select: { categories: { select: { id: true, title: true, parentId: true } } } } },
    });
    if (!map) return null;
    const { package: pkg, ...rest } = map;
    const categories = [...pkg.categories]
      .sort((a, b) => Number(b.parentId !== null) - Number(a.parentId !== null))
      .map(({ id, title }) => ({ id, title }));
    return this.withSeo({ ...rest, categories });
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.PackageMapWhereInput, options?: { skip?: number; take?: number }) {
    const maps = await this.prisma.packageMap.findMany({ where, orderBy: { createdAt: 'desc' }, ...options });
    return Promise.all(maps.map((m) => this.withSeo(m)));
  }

  // The admin's TripMapForm manages the public map graphic as a FEATURED
  // Attachment (AttachmentField, ownerType "package-map") — never a plain
  // field on PackageMap. GET /attachments requires auth though, so the
  // public listing/detail pages have no way to read it; findAttachmentImagePaths
  // resolves the same attachment straight from the DB (bypassing that
  // authenticated endpoint, not the underlying data) for the public reads
  // to embed as `mapImageUrl`.
  //
  // Checks BANNER as well as FEATURED, preferring FEATURED when an owner
  // has both: the legacy import that seeded all 48 real trip maps tagged
  // 46 of them BANNER and only 3 FEATURED (confirmed directly against the
  // dev DB) — TripMapForm.tsx's own "Featured Image" field predates that
  // import and has only ever read FEATURED, so on its own it would come
  // up empty for almost every real record. Newly-uploaded images still go
  // in as FEATURED (that field is unchanged), which is exactly why
  // FEATURED wins on a tie.
  findFeaturedImagePaths(packageMapIds: string[]): Promise<Map<string, string>> {
    return findAttachmentImagePaths(this.prisma, OWNER_TYPE, packageMapIds, [
      AttachmentRole.FEATURED,
      AttachmentRole.BANNER,
    ]);
  }

  count(where: Prisma.PackageMapWhereInput) {
    return this.prisma.packageMap.count({ where });
  }

  softDelete(id: string) {
    return this.prisma.packageMap.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  restore(id: string) {
    return this.prisma.packageMap.update({ where: { id }, data: { deletedAt: null } });
  }

  hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await deleteOwnedRows(tx, OWNER_TYPE, [id]);
      return tx.packageMap.delete({ where: { id } });
    });
  }

  packageExists(packageId: string) {
    return this.prisma.package.findUnique({ where: { id: packageId }, select: { id: true } });
  }
}
