import { Prisma, PrismaClient } from '@prisma/client';
import { deleteOwnedRows } from '../../lib/hard-delete';

const OWNER_TYPE = 'page';

export interface PageCoreFields {
  title: string;
  content?: string | null;
  pageOrder?: number;
  isActive?: boolean;
  parentId?: string | null;
  linkedPagePath?: string | null;
  linkedPageLabel?: string | null;
}

export interface PageSeoFields {
  slug: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type PageCreateData = PageCoreFields & PageSeoFields;
export type PageUpdateData = Partial<PageCoreFields> & Partial<PageSeoFields>;

export class PageRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeo(pageId: string) {
    const [urlInfo, meta] = await Promise.all([
      this.prisma.urlInfo.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: pageId } } }),
      this.prisma.meta.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: pageId } } }),
    ]);
    return { urlInfo, meta };
  }

  private async withSeo<T extends { id: string }>(page: T) {
    const { urlInfo, meta } = await this.attachSeo(page.id);
    return { ...page, slug: urlInfo?.urlSlug ?? null, meta };
  }

  async create(data: PageCreateData) {
    const page = await this.prisma.$transaction(async (tx) => {
      const created = await tx.page.create({
        data: {
          title: data.title,
          content: data.content ?? null,
          pageOrder: data.pageOrder ?? 0,
          isActive: data.isActive ?? true,
          parentId: data.parentId ?? null,
          linkedPagePath: data.linkedPagePath ?? null,
          linkedPageLabel: data.linkedPageLabel ?? null,
        },
      });

      await tx.urlInfo.create({
        data: { ownerType: OWNER_TYPE, ownerId: created.id, urlSlug: data.slug, urlTitle: data.title },
      });

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

    return this.withSeo(page);
  }

  async update(id: string, data: PageUpdateData) {
    const page = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.page.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          pageOrder: data.pageOrder,
          isActive: data.isActive,
          parentId: data.parentId,
          linkedPagePath: data.linkedPagePath,
          linkedPageLabel: data.linkedPageLabel,
        },
      });

      if (data.slug) {
        await tx.urlInfo.update({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          data: { urlSlug: data.slug, urlTitle: data.title ?? undefined },
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

    return this.withSeo(page);
  }

  async findById(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    return page ? this.withSeo(page) : null;
  }

  async findBySlug(slug: string, extraWhere: Prisma.PageWhereInput = {}) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    if (!urlInfo) return null;
    const page = await this.prisma.page.findFirst({ where: { id: urlInfo.ownerId, ...extraWhere } });
    return page ? this.withSeo(page) : null;
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.PageWhereInput, options?: { skip?: number; take?: number }) {
    const pages = await this.prisma.page.findMany({
      where,
      orderBy: { title: 'asc' },
      ...options,
    });
    return Promise.all(pages.map((page) => this.withSeo(page)));
  }

  async count(where: Prisma.PageWhereInput) {
    return this.prisma.page.count({ where });
  }

  async softDelete(id: string) {
    return this.prisma.page.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(id: string) {
    return this.prisma.page.update({ where: { id }, data: { deletedAt: null } });
  }

  countChildrenIncludingTrashed(id: string) {
    return this.prisma.page.count({ where: { parentId: id } });
  }

  async hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await deleteOwnedRows(tx, OWNER_TYPE, [id]);
      return tx.page.delete({ where: { id } });
    });
  }
}
