import { Prisma, PrismaClient } from '@prisma/client';

export class GlobalCategoryRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.GlobalCategoryCreateInput) {
    return this.prisma.globalCategory.create({ data });
  }

  findById(id: string) {
    return this.prisma.globalCategory.findUnique({ where: { id } });
  }

  findByKey(key: string) {
    return this.prisma.globalCategory.findUnique({ where: { key } });
  }

  findMany(where: Prisma.GlobalCategoryWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.globalCategory.findMany({ where, orderBy: { name: 'asc' }, ...options });
  }

  count(where: Prisma.GlobalCategoryWhereInput) {
    return this.prisma.globalCategory.count({ where });
  }

  update(id: string, data: Prisma.GlobalCategoryUpdateInput) {
    return this.prisma.globalCategory.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.globalCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  countSettings(id: string) {
    return this.prisma.globalSetting.count({ where: { categoryId: id } });
  }
}
