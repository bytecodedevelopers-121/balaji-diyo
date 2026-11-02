import { AttachmentRole, Prisma, PrismaClient } from '@prisma/client';
import { findAttachmentImagePaths } from '../../lib/attachment-images';

const OWNER_TYPE = 'place';

const placeInclude = {
  placeType: { include: { type: true } },
  regions: {
    include: { category: { include: { type: true } } },
    orderBy: { sortOrder: 'asc' as const },
  },
  facts: { orderBy: { sortOrder: 'asc' as const } },
  routeMap: { select: { id: true, mapTitle: true, isActive: true, deletedAt: true } },
} satisfies Prisma.PlaceInclude;

interface PlaceFactItem {
  label: string;
  value: string;
}

export interface PlaceCoreFields {
  placeName: string;
  placeAbstract?: string | null;
  placeDescription?: string | null;
  placeElevation?: string | null;
  placeCoordinates?: string | null;
  placeMap?: string | null;
  placeExtra?: string | null;
  attractionOrder?: number;
  regionIds?: string[];
  primaryRegionId?: string | null;
  placeTypeId?: string | null;
  routeMapId?: string | null;
  facts?: PlaceFactItem[];
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface PlaceSeoFields {
  slug?: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type PlaceCreateData = PlaceCoreFields & PlaceSeoFields;
export type PlaceUpdateData = Partial<PlaceCoreFields> & PlaceSeoFields;

const regionRows = (regionIds: string[], primaryRegionId?: string | null) =>
  regionIds.map((categoryId, index) => ({
    categoryId,
    sortOrder: index,
    isPrimary: categoryId === primaryRegionId || (!primaryRegionId && index === 0),
  }));

const factRows = (facts: PlaceFactItem[]) => facts.map((fact, index) => ({ ...fact, sortOrder: index }));

export class PlaceRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeoMany<T extends { id: string }>(places: T[]) {
    if (places.length === 0) return [];
    const ownerIds = places.map((place) => place.id);
    const [urlInfos, metas] = await Promise.all([
      this.prisma.urlInfo.findMany({ where: { ownerType: OWNER_TYPE, ownerId: { in: ownerIds } } }),
      this.prisma.meta.findMany({ where: { ownerType: OWNER_TYPE, ownerId: { in: ownerIds } } }),
    ]);
    const urlsByOwner = new Map(urlInfos.map((item) => [item.ownerId, item]));
    const metasByOwner = new Map(metas.map((item) => [item.ownerId, item]));
    return places.map((place) => ({
      ...place,
      slug: urlsByOwner.get(place.id)?.urlSlug ?? null,
      meta: metasByOwner.get(place.id) ?? null,
    }));
  }

  private async withSeo<T extends { id: string }>(place: T) {
    return (await this.attachSeoMany([place]))[0];
  }

  async create(data: PlaceCreateData) {
    const place = await this.prisma.$transaction(async (tx) => {
      const created = await tx.place.create({
        data: {
          placeName: data.placeName,
          placeAbstract: data.placeAbstract ?? null,
          placeDescription: data.placeDescription ?? null,
          placeElevation: data.placeElevation ?? null,
          placeCoordinates: data.placeCoordinates ?? null,
          placeMap: data.placeMap ?? null,
          placeExtra: data.placeExtra ?? null,
          attractionOrder: data.attractionOrder ?? 0,
          placeTypeId: data.placeTypeId ?? null,
          routeMapId: data.routeMapId ?? null,
          regions: { create: regionRows(data.regionIds ?? [], data.primaryRegionId) },
          facts: { create: factRows(data.facts ?? []) },
          isFeatured: data.isFeatured ?? false,
          isActive: data.isActive ?? true,
        },
        include: placeInclude,
      });

      if (data.slug) {
        await tx.urlInfo.create({
          data: { ownerType: OWNER_TYPE, ownerId: created.id, urlSlug: data.slug, urlTitle: data.placeName },
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

    return this.withSeo(place);
  }

  async update(id: string, data: PlaceUpdateData) {
    const place = await this.prisma.$transaction(async (tx) => {
      if (data.regionIds !== undefined) await tx.placeRegion.deleteMany({ where: { placeId: id } });
      if (data.facts !== undefined) await tx.placeFact.deleteMany({ where: { placeId: id } });

      const updated = await tx.place.update({
        where: { id },
        data: {
          placeName: data.placeName,
          placeAbstract: data.placeAbstract,
          placeDescription: data.placeDescription,
          placeElevation: data.placeElevation,
          placeCoordinates: data.placeCoordinates,
          placeMap: data.placeMap,
          placeExtra: data.placeExtra,
          attractionOrder: data.attractionOrder,
          placeTypeId: data.placeTypeId,
          routeMapId: data.routeMapId,
          regions:
            data.regionIds !== undefined
              ? { create: regionRows(data.regionIds, data.primaryRegionId) }
              : undefined,
          facts: data.facts !== undefined ? { create: factRows(data.facts) } : undefined,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
        },
        include: placeInclude,
      });

      if (data.slug) {
        await tx.urlInfo.upsert({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          create: { ownerType: OWNER_TYPE, ownerId: id, urlSlug: data.slug, urlTitle: data.placeName ?? updated.placeName },
          update: { urlSlug: data.slug, urlTitle: data.placeName },
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

    return this.withSeo(place);
  }

  async findById(id: string) {
    const place = await this.prisma.place.findUnique({ where: { id }, include: placeInclude });
    return place ? this.withSeo(place) : null;
  }

  async findBySlug(slug: string, extraWhere: Prisma.PlaceWhereInput = {}) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    if (!urlInfo) return null;
    const place = await this.prisma.place.findFirst({
      where: { id: urlInfo.ownerId, ...extraWhere },
      include: {
        ...placeInclude,
        packages: {
          where: { isActive: true, deletedAt: null },
          select: { id: true, title: true, abstract: true, price: true, duration: true, durationType: true },
        },
        blogs: {
          where: { isActive: true, deletedAt: null },
          select: { id: true, title: true, abstract: true, blogDate: true },
        },
      },
    });
    if (!place) return null;
    const [packageUrls, blogUrls] = await Promise.all([
      this.prisma.urlInfo.findMany({
        where: { ownerType: 'package', ownerId: { in: place.packages.map((item) => item.id) } },
      }),
      this.prisma.urlInfo.findMany({
        where: { ownerType: 'blog', ownerId: { in: place.blogs.map((item) => item.id) } },
      }),
    ]);
    const packageSlugs = new Map(packageUrls.map((item) => [item.ownerId, item.urlSlug]));
    const blogSlugs = new Map(blogUrls.map((item) => [item.ownerId, item.urlSlug]));

    // Only a live (active, not trashed) trekking route map is exposed
    // publicly — a trashed/hidden one silently drops the link rather than
    // sending visitors to a /map/<slug> that would 404.
    const liveRouteMap = place.routeMap?.isActive && !place.routeMap.deletedAt ? place.routeMap : null;
    const routeMapUrl = liveRouteMap
      ? await this.prisma.urlInfo.findUnique({
          where: { ownerType_ownerId: { ownerType: 'package-map', ownerId: liveRouteMap.id } },
        })
      : null;

    return this.withSeo({
      ...place,
      routeMap:
        liveRouteMap && routeMapUrl
          ? { id: liveRouteMap.id, mapTitle: liveRouteMap.mapTitle, slug: routeMapUrl.urlSlug }
          : null,
      packages: place.packages.map((item) => ({ ...item, slug: packageSlugs.get(item.id) ?? null })),
      blogs: place.blogs.map((item) => ({ ...item, slug: blogSlugs.get(item.id) ?? null })),
    });
  }

  routeMapExists(id: string) {
    return this.prisma.packageMap.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.PlaceWhereInput, options?: { skip?: number; take?: number }) {
    const places = await this.prisma.place.findMany({
      where,
      include: placeInclude,
      orderBy: [{ attractionOrder: 'asc' }, { placeName: 'asc' }],
      ...options,
    });
    return this.attachSeoMany(places);
  }

  async findAttractions() {
    const places = await this.prisma.place.findMany({
      where: { isActive: true, deletedAt: null, regions: { some: {} } },
      include: placeInclude,
      orderBy: [{ attractionOrder: 'asc' }, { placeName: 'asc' }],
    });
    return this.attachSeoMany(places);
  }

  async count(where: Prisma.PlaceWhereInput) {
    return this.prisma.place.count({ where });
  }

  async categoriesMatchType(ids: string[], typeKey: string) {
    if (ids.length === 0) return true;
    const count = await this.prisma.category.count({
      where: { id: { in: ids }, deletedAt: null, type: { key: typeKey, deletedAt: null } },
    });
    return count === new Set(ids).size;
  }

  findFeaturedImagePaths(placeIds: string[]) {
    return findAttachmentImagePaths(this.prisma, OWNER_TYPE, placeIds, [
      AttachmentRole.FEATURED,
      AttachmentRole.BANNER,
      AttachmentRole.SINGLE_BANNER,
    ]);
  }

  // Detail-page hero: the admin's dedicated Banner Image wins, falling back
  // to the Featured one only when no banner was uploaded.
  findBannerImagePaths(placeIds: string[]) {
    return findAttachmentImagePaths(this.prisma, OWNER_TYPE, placeIds, [
      AttachmentRole.BANNER,
      AttachmentRole.SINGLE_BANNER,
      AttachmentRole.FEATURED,
    ]);
  }

  async findGalleryImages(placeId: string) {
    const attachments = await this.prisma.attachment.findMany({
      where: {
        ownerType: OWNER_TYPE,
        ownerId: placeId,
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
    return this.prisma.place.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
