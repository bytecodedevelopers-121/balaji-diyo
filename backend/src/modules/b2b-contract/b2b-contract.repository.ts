import { Prisma, PrismaClient } from '@prisma/client';

const contractInclude = {
  partner: { select: { id: true, partnerCode: true, legalName: true } },
  package: { select: { id: true, title: true } },
} as const satisfies Prisma.B2BPartnerContractInclude;

export class ContractTx {
  constructor(private tx: Prisma.TransactionClient) {}

  /** Serializes concurrent contract writes for one partner so the overlap check can't be raced. */
  async lockPartner(partnerId: string): Promise<void> {
    await this.tx.$queryRaw`SELECT id FROM b2b_partners WHERE id = ${partnerId} FOR UPDATE`;
  }

  findById(id: string) {
    return this.tx.b2BPartnerContract.findUnique({ where: { id } });
  }

  findOverlapping(partnerId: string, packageId: string, from: Date, to: Date, excludeId?: string) {
    return this.tx.b2BPartnerContract.findFirst({
      where: { partnerId, packageId, isActive: true, validFrom: { lte: to }, validTo: { gte: from }, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true, validFrom: true, validTo: true },
    });
  }

  create(data: Prisma.B2BPartnerContractUncheckedCreateInput) {
    return this.tx.b2BPartnerContract.create({ data, include: contractInclude });
  }

  update(id: string, data: Prisma.B2BPartnerContractUncheckedUpdateInput) {
    return this.tx.b2BPartnerContract.update({ where: { id }, data, include: contractInclude });
  }

  audit(entry: Prisma.ActivityLogUncheckedCreateInput) {
    return this.tx.activityLog.create({ data: entry, select: { id: true } });
  }
}

export class B2BContractRepository {
  constructor(private prisma: PrismaClient) {}

  withTransaction<T>(fn: (tx: ContractTx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((client) => fn(new ContractTx(client)));
  }

  async list(where: Prisma.B2BPartnerContractWhereInput, skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.b2BPartnerContract.findMany({ where, include: contractInclude, orderBy: [{ createdAt: 'desc' }], skip, take }),
      this.prisma.b2BPartnerContract.count({ where }),
    ]);
    return { items, total };
  }

  findPartner(id: string) {
    return this.prisma.b2BPartner.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  }

  findPackage(id: string) {
    return this.prisma.package.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  }
}
