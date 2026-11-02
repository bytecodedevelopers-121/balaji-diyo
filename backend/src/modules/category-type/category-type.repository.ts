import { Prisma, PrismaClient } from '@prisma/client';

export class CategoryTypeRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.CategoryTypeCreateInput) {
    return this.prisma.categoryType.create({ data });
  }

  findById(id: string) {
    return this.prisma.categoryType.findUnique({ where: { id } });
  }

  findByKey(key: string) {
    return this.prisma.categoryType.findUnique({ where: { key } });
  }

  findMany(where: Prisma.CategoryTypeWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.categoryType.findMany({ where, orderBy: { name: 'asc' }, ...options });
  }

  count(where: Prisma.CategoryTypeWhereInput) {
    return this.prisma.categoryType.count({ where });
  }

  update(id: string, data: Prisma.CategoryTypeUpdateInput) {
    return this.prisma.categoryType.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.categoryType.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  restore(id: string) {
    return this.prisma.categoryType.update({ where: { id }, data: { deletedAt: null } });
  }

  countCategories(id: string) {
    return this.prisma.category.count({ where: { typeId: id } });
  }
}
