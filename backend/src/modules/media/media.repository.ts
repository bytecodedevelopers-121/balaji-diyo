import { Prisma, PrismaClient } from '@prisma/client';

export class MediaRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.MediaCreateInput) {
    return this.prisma.media.create({ data });
  }

  async findById(id: string) {
    return this.prisma.media.findUnique({ where: { id } });
  }

  async findMany(where: Prisma.MediaWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...options,
    });
  }

  async count(where: Prisma.MediaWhereInput) {
    return this.prisma.media.count({ where });
  }

  async update(id: string, data: Prisma.MediaUpdateInput) {
    return this.prisma.media.update({ where: { id }, data });
  }

  async countAttachments(id: string) {
    return this.prisma.attachment.count({ where: { mediaId: id } });
  }

  async delete(id: string) {
    return this.prisma.media.delete({ where: { id } });
  }
}
