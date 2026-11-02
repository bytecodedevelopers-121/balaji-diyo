import { Prisma, PrismaClient } from '@prisma/client';

export class RedirectManagerRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.RedirectManagerCreateInput) {
    return this.prisma.redirectManager.create({ data });
  }

  createMany(data: Prisma.RedirectManagerCreateManyInput[]) {
    return this.prisma.redirectManager.createMany({ data, skipDuplicates: true });
  }

  findById(id: string) {
    return this.prisma.redirectManager.findUnique({ where: { id } });
  }

  findBySources(sources: string[]) {
    return this.prisma.redirectManager.findMany({ where: { source: { in: sources } } });
  }

  findMany(where: Prisma.RedirectManagerWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.redirectManager.findMany({ where, orderBy: { createdAt: 'desc' }, ...options });
  }

  count(where: Prisma.RedirectManagerWhereInput) {
    return this.prisma.redirectManager.count({ where });
  }

  update(id: string, data: Prisma.RedirectManagerUpdateInput) {
    return this.prisma.redirectManager.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.redirectManager.delete({ where: { id } });
  }

  bulkDelete(ids: string[]) {
    return this.prisma.redirectManager.deleteMany({ where: { id: { in: ids } } });
  }
}
