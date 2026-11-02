import { Prisma, PrismaClient } from '@prisma/client';

const OWNER_TYPE = 'storyAuthor';

export interface StoryAuthorCoreFields {
  name: string;
  salutation?: string | null;
  email: string;
  description?: string | null;
  isActive?: boolean;
}

export type StoryAuthorCreateData = StoryAuthorCoreFields & { slug?: string };
export type StoryAuthorUpdateData = Partial<StoryAuthorCoreFields> & { slug?: string };

export class StoryAuthorRepository {
  constructor(private prisma: PrismaClient) {}

  private async withSlug<T extends { id: string }>(author: T) {
    const urlInfo = await this.prisma.urlInfo.findUnique({
      where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: author.id } },
    });
    return { ...author, slug: urlInfo?.urlSlug ?? null };
  }

  async create(data: StoryAuthorCreateData) {
    const author = await this.prisma.$transaction(async (tx) => {
      const created = await tx.storyAuthor.create({
        data: {
          name: data.name,
          salutation: data.salutation ?? null,
          email: data.email,
          description: data.description ?? null,
          isActive: data.isActive ?? true,
        },
      });

      if (data.slug) {
        await tx.urlInfo.create({
          data: { ownerType: OWNER_TYPE, ownerId: created.id, urlSlug: data.slug, urlTitle: data.name },
        });
      }

      return created;
    });

    return this.withSlug(author);
  }

  async update(id: string, data: StoryAuthorUpdateData) {
    const author = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.storyAuthor.update({
        where: { id },
        data: {
          name: data.name,
          salutation: data.salutation,
          email: data.email,
          description: data.description,
          isActive: data.isActive,
        },
      });

      if (data.slug) {
        await tx.urlInfo.upsert({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          create: { ownerType: OWNER_TYPE, ownerId: id, urlSlug: data.slug, urlTitle: data.name ?? updated.name },
          update: { urlSlug: data.slug, urlTitle: data.name },
        });
      }

      return updated;
    });

    return this.withSlug(author);
  }

  async findById(id: string) {
    const author = await this.prisma.storyAuthor.findUnique({ where: { id } });
    return author ? this.withSlug(author) : null;
  }

  async findByEmail(email: string) {
    return this.prisma.storyAuthor.findUnique({ where: { email } });
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.StoryAuthorWhereInput, options?: { skip?: number; take?: number }) {
    const authors = await this.prisma.storyAuthor.findMany({ where, orderBy: { name: 'asc' }, ...options });
    return Promise.all(authors.map((a) => this.withSlug(a)));
  }

  async count(where: Prisma.StoryAuthorWhereInput) {
    return this.prisma.storyAuthor.count({ where });
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.urlInfo.deleteMany({ where: { ownerType: OWNER_TYPE, ownerId: id } });
      return tx.storyAuthor.delete({ where: { id } });
    });
  }

  async countStories(id: string) {
    return this.prisma.story.count({ where: { authors: { some: { id } } } });
  }
}
