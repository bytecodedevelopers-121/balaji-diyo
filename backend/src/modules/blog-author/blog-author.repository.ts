import { Prisma, PrismaClient } from '@prisma/client';

const OWNER_TYPE = 'blogAuthor';

export interface BlogAuthorCoreFields {
  name: string;
  salutation?: string | null;
  email: string;
  description?: string | null;
  isActive?: boolean;
}

export type BlogAuthorCreateData = BlogAuthorCoreFields & { slug?: string };
export type BlogAuthorUpdateData = Partial<BlogAuthorCoreFields> & { slug?: string };

export class BlogAuthorRepository {
  constructor(private prisma: PrismaClient) {}

  private async withSlug<T extends { id: string }>(author: T) {
    const urlInfo = await this.prisma.urlInfo.findUnique({
      where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: author.id } },
    });
    return { ...author, slug: urlInfo?.urlSlug ?? null };
  }

  async create(data: BlogAuthorCreateData) {
    const author = await this.prisma.$transaction(async (tx) => {
      const created = await tx.blogAuthor.create({
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

  async update(id: string, data: BlogAuthorUpdateData) {
    const author = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.blogAuthor.update({
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
    const author = await this.prisma.blogAuthor.findUnique({ where: { id } });
    return author ? this.withSlug(author) : null;
  }

  async findByEmail(email: string) {
    return this.prisma.blogAuthor.findUnique({ where: { email } });
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.BlogAuthorWhereInput, options?: { skip?: number; take?: number }) {
    const authors = await this.prisma.blogAuthor.findMany({ where, orderBy: { name: 'asc' }, ...options });
    return Promise.all(authors.map((a) => this.withSlug(a)));
  }

  async count(where: Prisma.BlogAuthorWhereInput) {
    return this.prisma.blogAuthor.count({ where });
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.urlInfo.deleteMany({ where: { ownerType: OWNER_TYPE, ownerId: id } });
      return tx.blogAuthor.delete({ where: { id } });
    });
  }

  async countBlogs(id: string) {
    return this.prisma.blog.count({ where: { authors: { some: { id } } } });
  }
}
