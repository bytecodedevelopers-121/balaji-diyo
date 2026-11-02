import { Prisma, PrismaClient } from '@prisma/client';

export class MenuTypeRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.MenuTypeCreateInput) {
    return this.prisma.menuType.create({ data });
  }

  findById(id: string) {
    return this.prisma.menuType.findUnique({ where: { id } });
  }

  findByKey(key: string) {
    return this.prisma.menuType.findUnique({ where: { key } });
  }

  findMany(where: Prisma.MenuTypeWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.menuType.findMany({ where, orderBy: { name: 'asc' }, ...options });
  }

  count(where: Prisma.MenuTypeWhereInput) {
    return this.prisma.menuType.count({ where });
  }

  update(id: string, data: Prisma.MenuTypeUpdateInput) {
    return this.prisma.menuType.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.menuType.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  restore(id: string) {
    return this.prisma.menuType.update({ where: { id }, data: { deletedAt: null } });
  }

  countItems(id: string) {
    return this.prisma.menuItem.count({ where: { typeId: id } });
  }
}
