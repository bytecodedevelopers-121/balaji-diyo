import { Prisma, PrismaClient } from '@prisma/client';

export class ContactMessageRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.ContactMessageUncheckedCreateInput) {
    return this.prisma.contactMessage.create({ data });
  }

  findById(id: string) {
    return this.prisma.contactMessage.findUnique({ where: { id } });
  }

  findMany(where: Prisma.ContactMessageWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, ...options });
  }

  count(where: Prisma.ContactMessageWhereInput) {
    return this.prisma.contactMessage.count({ where });
  }

  setRead(id: string, isRead: boolean) {
    return this.prisma.contactMessage.update({ where: { id }, data: { isRead } });
  }

  delete(id: string) {
    return this.prisma.contactMessage.delete({ where: { id } });
  }

  bulkDelete(ids: string[]) {
    return this.prisma.contactMessage.deleteMany({ where: { id: { in: ids } } });
  }
}
