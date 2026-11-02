import { Prisma, PrismaClient } from '@prisma/client';

const paymentInclude = {
  package: { select: { id: true, title: true } },
} satisfies Prisma.PaymentInclude;

export class PaymentRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({ data, include: paymentInclude });
  }

  findById(id: string) {
    return this.prisma.payment.findUnique({ where: { id }, include: paymentInclude });
  }

  findMany(where: Prisma.PaymentWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.payment.findMany({
      where,
      include: paymentInclude,
      orderBy: { createdAt: 'desc' },
      ...options,
    });
  }

  count(where: Prisma.PaymentWhereInput) {
    return this.prisma.payment.count({ where });
  }

  updateStatus(id: string, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.update({ where: { id }, data, include: paymentInclude });
  }

  update(id: string, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.update({ where: { id }, data, include: paymentInclude });
  }

  softDelete(id: string) {
    return this.prisma.payment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  restore(id: string) {
    return this.prisma.payment.update({ where: { id }, data: { deletedAt: null } });
  }

  hardDelete(id: string) {
    return this.prisma.payment.delete({ where: { id } });
  }

  findByGatewayReference(gatewayReference: string) {
    return this.prisma.payment.findFirst({ where: { gatewayReference }, include: paymentInclude });
  }
}
