import { Prisma, PrismaClient } from '@prisma/client';

export class BlogCommentRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.BlogCommentUncheckedCreateInput) {
    return this.prisma.blogComment.create({ data });
  }

  findById(id: string) {
    return this.prisma.blogComment.findUnique({ where: { id } });
  }

  // Cross-domain read (Blog table) kept here rather than in the service —
  // Prisma access is repository-only per project convention.
  findBlogSummary(blogId: string) {
    return this.prisma.blog.findUnique({
      where: { id: blogId },
      select: { id: true, isActive: true, deletedAt: true },
    });
  }

  // Public thread for a blog — only approved (isActive) comments, nested one level.
  findApprovedForBlog(blogId: string) {
    return this.prisma.blogComment.findMany({
      where: { blogId, parentId: null, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  findMany(where: Prisma.BlogCommentWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.blogComment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { blog: { select: { id: true, title: true } } },
      ...options,
    });
  }

  count(where: Prisma.BlogCommentWhereInput) {
    return this.prisma.blogComment.count({ where });
  }

  setActive(id: string, isActive: boolean) {
    return this.prisma.blogComment.update({ where: { id }, data: { isActive } });
  }

  delete(id: string) {
    return this.prisma.blogComment.delete({ where: { id } });
  }
}
