import { Prisma, PrismaClient } from '@prisma/client';

export class TagRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.TagCreateInput) {
    return this.prisma.tag.create({ data });
  }

  findById(id: string) {
    return this.prisma.tag.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.tag.findUnique({ where: { slug } });
  }

  findMany(where: Prisma.TagWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.tag.findMany({ where, orderBy: { name: 'asc' }, ...options });
  }

  count(where: Prisma.TagWhereInput) {
    return this.prisma.tag.count({ where });
  }

  update(id: string, data: Prisma.TagUpdateInput) {
    return this.prisma.tag.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.tag.delete({ where: { id } });
  }

  countBlogs(id: string) {
    return this.prisma.blog.count({ where: { tags: { some: { id } } } });
  }
}
