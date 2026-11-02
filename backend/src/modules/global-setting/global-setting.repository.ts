import { Prisma, PrismaClient } from '@prisma/client';

export class GlobalSettingRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.GlobalSettingUncheckedCreateInput) {
    return this.prisma.globalSetting.create({ data });
  }

  findById(id: string) {
    return this.prisma.globalSetting.findUnique({ where: { id } });
  }

  findByKey(key: string) {
    return this.prisma.globalSetting.findUnique({ where: { key } });
  }

  findManyActive() {
    return this.prisma.globalSetting.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { key: 'asc' },
    });
  }

  findMany(where: Prisma.GlobalSettingWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.globalSetting.findMany({ where, orderBy: { key: 'asc' }, ...options });
  }

  count(where: Prisma.GlobalSettingWhereInput) {
    return this.prisma.globalSetting.count({ where });
  }

  update(id: string, data: Prisma.GlobalSettingUncheckedUpdateInput) {
    return this.prisma.globalSetting.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.globalSetting.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
