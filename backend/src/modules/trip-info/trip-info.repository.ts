import { Prisma, PrismaClient } from '@prisma/client';

const OWNER_TYPE = 'tripInfo';

export interface TripInfoCoreFields {
  title: string;
  description: string;
  isActive?: boolean;
}

export interface TripInfoSeoFields {
  slug?: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type TripInfoCreateData = TripInfoCoreFields & TripInfoSeoFields;
export type TripInfoUpdateData = Partial<TripInfoCoreFields> & TripInfoSeoFields;

export class TripInfoRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeo(id: string) {
    const [urlInfo, meta] = await Promise.all([
      this.prisma.urlInfo.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
      this.prisma.meta.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
    ]);
    return { urlInfo, meta };
  }

  private async withSeo<T extends { id: string }>(entity: T) {
    const { urlInfo, meta } = await this.attachSeo(entity.id);
    return { ...entity, slug: urlInfo?.urlSlug ?? null, meta };
  }

  async create(data: TripInfoCreateData) {
    const tripInfo = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tripInfo.create({
        data: {
          title: data.title,
          description: data.description,
          isActive: data.isActive ?? true,
          infoOrder: (await tx.tripInfo.count()) + 1,
        },
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

    return this.withSeo(tripInfo);
  }

  async update(id: string, data: TripInfoUpdateData) {
    const tripInfo = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tripInfo.update({
        where: { id },
        data: { title: data.title, description: data.description, isActive: data.isActive },
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

    return this.withSeo(tripInfo);
  }

  async findById(id: string) {
    const tripInfo = await this.prisma.tripInfo.findUnique({ where: { id } });
    return tripInfo ? this.withSeo(tripInfo) : null;
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.TripInfoWhereInput, options?: { skip?: number; take?: number }) {
    const items = await this.prisma.tripInfo.findMany({ where, orderBy: { infoOrder: 'asc' }, ...options });
    return Promise.all(items.map((i) => this.withSeo(i)));
  }

  async count(where: Prisma.TripInfoWhereInput) {
    return this.prisma.tripInfo.count({ where });
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.urlInfo.deleteMany({ where: { ownerType: OWNER_TYPE, ownerId: id } });
      await tx.meta.deleteMany({ where: { ownerType: OWNER_TYPE, ownerId: id } });
      return tx.tripInfo.delete({ where: { id } });
    });
  }

  async countPackages(id: string) {
    return this.prisma.package.count({ where: { tripInfos: { some: { id } } } });
  }
}
