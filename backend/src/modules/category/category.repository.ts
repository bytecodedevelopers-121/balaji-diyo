import { AttachmentRole, Prisma, PrismaClient } from '@prisma/client';
import { findAttachmentImagePaths } from '../../lib/attachment-images';
import { deleteOwnedRows } from '../../lib/hard-delete';

const OWNER_TYPE = 'category';

export interface CategoryCoreFields {
  title: string;
  description?: string | null;
  extraField1?: string | null;
  categoryOrder?: number;
  isActive?: boolean;
  typeId: string;
  parentId?: string | null;
}

export interface CategorySeoFields {
  slug: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type CategoryCreateData = CategoryCoreFields & CategorySeoFields;
export type CategoryUpdateData = Partial<CategoryCoreFields> & Partial<CategorySeoFields>;

export class CategoryRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeo(categoryId: string) {
    const [urlInfo, meta] = await Promise.all([
      this.prisma.urlInfo.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: categoryId } } }),
      this.prisma.meta.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: categoryId } } }),
    ]);
    return { urlInfo, meta };
  }

  private async withSeo<T extends { id: string }>(category: T) {
    const { urlInfo, meta } = await this.attachSeo(category.id);
    return { ...category, slug: urlInfo?.urlSlug ?? null, meta };
  }

  async create(data: CategoryCreateData) {
    const category = await this.prisma.$transaction(async (tx) => {
      const created = await tx.category.create({
        data: {
          title: data.title,
          description: data.description ?? null,
          extraField1: data.extraField1 ?? null,
          categoryOrder: data.categoryOrder ?? 0,
          isActive: data.isActive ?? true,
          typeId: data.typeId,
          parentId: data.parentId ?? null,
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

    return this.withSeo(category);
  }

  async update(id: string, data: CategoryUpdateData) {
    const category = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          extraField1: data.extraField1,
          categoryOrder: data.categoryOrder,
          isActive: data.isActive,
          typeId: data.typeId,
          parentId: data.parentId,
        },
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

    return this.withSeo(category);
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id }, include: { type: true } });
    return category ? this.withSeo(category) : null;
  }

  async findBySlug(slug: string, extraWhere: Prisma.CategoryWhereInput = {}) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    if (!urlInfo) return null;
    const category = await this.prisma.category.findFirst({
      where: { id: urlInfo.ownerId, ...extraWhere },
      include: { type: true },
    });
    return category ? this.withSeo(category) : null;
  }

  findFeaturedImagePaths(categoryIds: string[]): Promise<Map<string, string>> {
    return findAttachmentImagePaths(this.prisma, OWNER_TYPE, categoryIds, [
      AttachmentRole.FEATURED,
      AttachmentRole.BANNER,
      AttachmentRole.SINGLE_BANNER,
    ]);
  }

  async findActivePackageCounts(categoryIds: string[]): Promise<Map<string, number>> {
    if (categoryIds.length === 0) return new Map();
    const packages = await this.prisma.package.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        categories: { some: { id: { in: categoryIds } } },
      },
      select: { categories: { where: { id: { in: categoryIds } }, select: { id: true } } },
    });
    const counts = new Map(categoryIds.map((id) => [id, 0]));
    for (const pkg of packages) {
      for (const category of pkg.categories) counts.set(category.id, (counts.get(category.id) ?? 0) + 1);
    }
    return counts;
  }

  async findParentId(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id }, select: { parentId: true } });
    return category?.parentId ?? null;
  }

  // Walks the ancestor chain of `nodeId` looking for `ancestorId` — used to
  // block a parentId update that would turn the tree into a cycle.
  async isAncestorOf(ancestorId: string, nodeId: string): Promise<boolean> {
    const seen = new Set<string>();
    let currentParentId = await this.findParentId(nodeId);

    while (currentParentId) {
      if (currentParentId === ancestorId) return true;
      if (seen.has(currentParentId)) break; // guard against pre-existing corrupt cycles
      seen.add(currentParentId);
      currentParentId = await this.findParentId(currentParentId);
    }

    return false;
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.CategoryWhereInput, options?: { skip?: number; take?: number }) {
    const categories = await this.prisma.category.findMany({
      where,
      include: { type: true },
      orderBy: [{ categoryOrder: 'asc' }, { title: 'asc' }],
      ...options,
    });
    return Promise.all(categories.map((c) => this.withSeo(c)));
  }

  async count(where: Prisma.CategoryWhereInput) {
    return this.prisma.category.count({ where });
  }

  // Root categories with two levels of nested children — matches the depth
  // the legacy admin UI rendered (Category::with(['children.children'])).
  async findTree(typeId: string) {
    return this.prisma.category.findMany({
      where: { typeId, parentId: null, deletedAt: null },
      orderBy: { categoryOrder: 'asc' },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { categoryOrder: 'asc' },
          include: {
            children: {
              where: { deletedAt: null },
              orderBy: { categoryOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  async countChildren(id: string) {
    return this.prisma.category.count({ where: { parentId: id, deletedAt: null } });
  }

  async softDelete(id: string) {
    return this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(id: string) {
    return this.prisma.category.update({ where: { id }, data: { deletedAt: null } });
  }

  countChildrenIncludingTrashed(id: string) {
    return this.prisma.category.count({ where: { parentId: id } });
  }

  async hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await deleteOwnedRows(tx, OWNER_TYPE, [id]);
      return tx.category.delete({ where: { id } });
    });
  }

  async bulkSoftDelete(ids: string[]) {
    return this.prisma.category.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
  }
}
