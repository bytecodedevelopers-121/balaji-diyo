import { AttachmentRole, Prisma, PrismaClient } from '@prisma/client';
import { findAttachmentImagePaths } from '../../lib/attachment-images';

const OWNER_TYPE = 'gallery-album';

const galleryAlbumInclude = {
  destination: { include: { type: true } },
} satisfies Prisma.GalleryAlbumInclude;

export interface GalleryAlbumCoreFields {
  title: string;
  description?: string | null;
  destinationId: string;
  displayOrder?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface GalleryAlbumSeoFields {
  slug?: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type GalleryAlbumCreateData = GalleryAlbumCoreFields & GalleryAlbumSeoFields;
export type GalleryAlbumUpdateData = Partial<GalleryAlbumCoreFields> & GalleryAlbumSeoFields;

export class GalleryAlbumRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeoMany<T extends { id: string }>(albums: T[]) {
    if (albums.length === 0) return [];
    const ownerIds = albums.map((album) => album.id);
    const [urlInfos, metas] = await Promise.all([
      this.prisma.urlInfo.findMany({ where: { ownerType: OWNER_TYPE, ownerId: { in: ownerIds } } }),
      this.prisma.meta.findMany({ where: { ownerType: OWNER_TYPE, ownerId: { in: ownerIds } } }),
    ]);
    const urlsByOwner = new Map(urlInfos.map((item) => [item.ownerId, item]));
    const metasByOwner = new Map(metas.map((item) => [item.ownerId, item]));
    return albums.map((album) => ({
      ...album,
      slug: urlsByOwner.get(album.id)?.urlSlug ?? null,
      meta: metasByOwner.get(album.id) ?? null,
    }));
  }

  private async withSeo<T extends { id: string }>(album: T) {
    return (await this.attachSeoMany([album]))[0];
  }

  async create(data: GalleryAlbumCreateData) {
    const album = await this.prisma.$transaction(async (tx) => {
      const created = await tx.galleryAlbum.create({
        data: {
          title: data.title,
          description: data.description ?? null,
          destinationId: data.destinationId,
          displayOrder: data.displayOrder ?? 0,
          isFeatured: data.isFeatured ?? false,
          isActive: data.isActive ?? true,
        },
        include: galleryAlbumInclude,
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

    return this.withSeo(album);
  }

  async update(id: string, data: GalleryAlbumUpdateData) {
    const album = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.galleryAlbum.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          destinationId: data.destinationId,
          displayOrder: data.displayOrder,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
        },
        include: galleryAlbumInclude,
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

    return this.withSeo(album);
  }

  async findById(id: string) {
    const album = await this.prisma.galleryAlbum.findUnique({ where: { id }, include: galleryAlbumInclude });
    return album ? this.withSeo(album) : null;
  }

  async findBySlug(slug: string, extraWhere: Prisma.GalleryAlbumWhereInput = {}) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    if (!urlInfo) return null;
    const album = await this.prisma.galleryAlbum.findFirst({
      where: { id: urlInfo.ownerId, ...extraWhere },
      include: galleryAlbumInclude,
    });
    return album ? this.withSeo(album) : null;
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.GalleryAlbumWhereInput, options?: { skip?: number; take?: number }) {
    const albums = await this.prisma.galleryAlbum.findMany({
      where,
      include: galleryAlbumInclude,
      orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
      ...options,
    });
    return this.attachSeoMany(albums);
  }

  async findShowcase() {
    const albums = await this.prisma.galleryAlbum.findMany({
      where: { isActive: true, deletedAt: null },
      include: galleryAlbumInclude,
      orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
    });
    return this.attachSeoMany(albums);
  }

  async count(where: Prisma.GalleryAlbumWhereInput) {
    return this.prisma.galleryAlbum.count({ where });
  }

  async destinationIsValid(id: string) {
    const count = await this.prisma.category.count({
      where: { id, deletedAt: null, type: { key: 'destination', deletedAt: null } },
    });
    return count === 1;
  }

  findCoverImagePaths(albumIds: string[]) {
    return findAttachmentImagePaths(this.prisma, OWNER_TYPE, albumIds, [AttachmentRole.FEATURED]);
  }

  /**
   * Every album's own cover + gallery photos, grouped by album id — for
   * the homepage teaser's per-destination mosaic, which needs a
   * destination's actual photo set (one album can hold several photos),
   * not just one cover thumbnail per album like `findCoverImagePaths`.
   * Ordered [FEATURED, then GALLERY by sortOrder] per album — Postgres
   * orders a native enum column by its declared sequence, and FEATURED
   * comes before GALLERY in the AttachmentRole enum, so the cover
   * naturally leads each album's own slice of the result.
   */
  async findAlbumPhotoPaths(albumIds: string[]): Promise<Map<string, string[]>> {
    if (albumIds.length === 0) return new Map();
    const attachments = await this.prisma.attachment.findMany({
      where: {
        ownerType: OWNER_TYPE,
        ownerId: { in: albumIds },
        role: { in: [AttachmentRole.FEATURED, AttachmentRole.GALLERY] },
        isActive: true,
        media: { isActive: true, deletedAt: null },
      },
      include: { media: true },
      orderBy: [{ ownerId: 'asc' }, { role: 'asc' }, { sortOrder: 'asc' }],
    });
    const byAlbum = new Map<string, string[]>();
    for (const attachment of attachments) {
      const paths = byAlbum.get(attachment.ownerId) ?? [];
      paths.push(attachment.media.fullPath);
      byAlbum.set(attachment.ownerId, paths);
    }
    return byAlbum;
  }

  async findGalleryImages(albumId: string) {
    const attachments = await this.prisma.attachment.findMany({
      where: {
        ownerType: OWNER_TYPE,
        ownerId: albumId,
        role: AttachmentRole.GALLERY,
        isActive: true,
        media: { isActive: true, deletedAt: null },
      },
      include: { media: true },
      orderBy: { sortOrder: 'asc' },
    });
    return attachments.map((attachment) => ({
      id: attachment.id,
      path: attachment.media.fullPath,
      altText: attachment.media.altText,
      caption: attachment.media.caption,
      width: attachment.media.width,
      height: attachment.media.height,
    }));
  }

  async softDelete(id: string) {
    return this.prisma.galleryAlbum.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
