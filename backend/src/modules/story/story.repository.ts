import { Prisma, PrismaClient } from '@prisma/client';
import { deleteOwnedRows } from '../../lib/hard-delete';

const OWNER_TYPE = 'story';

const storyInclude = { authors: true } satisfies Prisma.StoryInclude;

export interface StoryCoreFields {
  title: string;
  abstract?: string | null;
  content: string;
  storyDate: Date;
  isActive?: boolean;
}

export interface StoryRelationFields {
  authorIds?: string[];
}

export interface StorySeoFields {
  slug?: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type StoryCreateData = StoryCoreFields & StoryRelationFields & StorySeoFields;
export type StoryUpdateData = Partial<StoryCoreFields> & StoryRelationFields & StorySeoFields;

const toConnect = (ids?: string[]) => (ids ? { connect: ids.map((id) => ({ id })) } : undefined);
const toSet = (ids?: string[]) => (ids ? { set: ids.map((id) => ({ id })) } : undefined);

export class StoryRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeo(id: string) {
    const [urlInfo, meta] = await Promise.all([
      this.prisma.urlInfo.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
      this.prisma.meta.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
    ]);
    return { urlInfo, meta };
  }

  private async withSeo<T extends { id: string }>(story: T) {
    const { urlInfo, meta } = await this.attachSeo(story.id);
    return { ...story, slug: urlInfo?.urlSlug ?? null, meta };
  }

  async create(data: StoryCreateData) {
    const story = await this.prisma.$transaction(async (tx) => {
      const created = await tx.story.create({
        data: {
          title: data.title,
          abstract: data.abstract ?? null,
          content: data.content,
          storyDate: data.storyDate,
          isActive: data.isActive ?? true,
          authors: toConnect(data.authorIds),
        },
        include: storyInclude,
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

    return this.withSeo(story);
  }

  async update(id: string, data: StoryUpdateData) {
    const story = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.story.update({
        where: { id },
        data: {
          title: data.title,
          abstract: data.abstract,
          content: data.content,
          storyDate: data.storyDate,
          isActive: data.isActive,
          authors: toSet(data.authorIds),
        },
        include: storyInclude,
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

    return this.withSeo(story);
  }

  async findById(id: string) {
    const story = await this.prisma.story.findUnique({ where: { id }, include: storyInclude });
    return story ? this.withSeo(story) : null;
  }

  async findBySlug(slug: string, extraWhere: Prisma.StoryWhereInput = {}) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    if (!urlInfo) return null;
    const story = await this.prisma.story.findFirst({ where: { id: urlInfo.ownerId, ...extraWhere }, include: storyInclude });
    return story ? this.withSeo(story) : null;
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.StoryWhereInput, options?: { skip?: number; take?: number }) {
    const stories = await this.prisma.story.findMany({
      where,
      include: storyInclude,
      orderBy: { storyDate: 'desc' },
      ...options,
    });
    return Promise.all(stories.map((s) => this.withSeo(s)));
  }

  async count(where: Prisma.StoryWhereInput) {
    return this.prisma.story.count({ where });
  }

  async softDelete(id: string) {
    return this.prisma.story.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(id: string) {
    return this.prisma.story.update({ where: { id }, data: { deletedAt: null } });
  }

  async hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await deleteOwnedRows(tx, OWNER_TYPE, [id]);
      return tx.story.delete({ where: { id } });
    });
  }
}
