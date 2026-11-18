import { Prisma, PrismaClient } from '@prisma/client';

export class PageSectionRepository {
  constructor(private prisma: PrismaClient) {}

  findByPage(pageKey: string) {
    return this.prisma.pageSection.findMany({ where: { pageKey }, orderBy: [{ sortOrder: 'asc' }, { sectionKey: 'asc' }] });
  }

  findOne(pageKey: string, sectionKey: string) {
    return this.prisma.pageSection.findUnique({ where: { pageKey_sectionKey: { pageKey, sectionKey } } });
  }

  listPageKeys() {
    return this.prisma.pageSection.groupBy({ by: ['pageKey'], _count: { _all: true } });
  }

  upsert(pageKey: string, sectionKey: string, content: Prisma.InputJsonValue, isActive?: boolean) {
    return this.prisma.pageSection.upsert({
      where: { pageKey_sectionKey: { pageKey, sectionKey } },
      create: { pageKey, sectionKey, content, isActive: isActive ?? true },
      update: { content, ...(isActive === undefined ? {} : { isActive }) },
    });
  }
}
