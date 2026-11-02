import { Prisma, PrismaClient } from '@prisma/client';

const OWNER_TYPE = 'faq';

export interface FaqCoreFields {
  question: string;
  answer: string;
  isActive?: boolean;
}

export interface FaqSeoFields {
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type FaqCreateData = FaqCoreFields & FaqSeoFields;
export type FaqUpdateData = Partial<FaqCoreFields> & FaqSeoFields;

export class FaqRepository {
  constructor(private prisma: PrismaClient) {}

  private async withMeta<T extends { id: string }>(faq: T) {
    const meta = await this.prisma.meta.findUnique({
      where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: faq.id } },
    });
    return { ...faq, meta };
  }

  async nextOrder() {
    return (await this.prisma.fAQ.count()) + 1;
  }

  async create(data: FaqCreateData) {
    const faq = await this.prisma.$transaction(async (tx) => {
      const created = await tx.fAQ.create({
        data: {
          question: data.question,
          answer: data.answer,
          isActive: data.isActive ?? true,
          faqOrder: (await tx.fAQ.count()) + 1,
        },
      });

      if (data.metaTitle || data.metaKeywords || data.metaDescription) {
        await tx.meta.create({
          data: {
            ownerType: OWNER_TYPE,
            ownerId: created.id,
            metaTitle: data.metaTitle ?? null,
            metaKeywords: data.metaKeywords ?? null,
            metaDescription: data.metaDescription ?? null,
          },
        });
      }

      return created;
    });

    return this.withMeta(faq);
  }

  async update(id: string, data: FaqUpdateData) {
    const faq = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.fAQ.update({
        where: { id },
        data: { question: data.question, answer: data.answer, isActive: data.isActive },
      });

      if (data.metaTitle !== undefined || data.metaKeywords !== undefined || data.metaDescription !== undefined) {
        await tx.meta.upsert({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          create: {
            ownerType: OWNER_TYPE,
            ownerId: id,
            metaTitle: data.metaTitle ?? null,
            metaKeywords: data.metaKeywords ?? null,
            metaDescription: data.metaDescription ?? null,
          },
          update: {
            metaTitle: data.metaTitle,
            metaKeywords: data.metaKeywords,
            metaDescription: data.metaDescription,
          },
        });
      }

      return updated;
    });

    return this.withMeta(faq);
  }

  async findById(id: string) {
    const faq = await this.prisma.fAQ.findUnique({ where: { id } });
    return faq ? this.withMeta(faq) : null;
  }

  async findMany(where: Prisma.FAQWhereInput, options?: { skip?: number; take?: number }) {
    const faqs = await this.prisma.fAQ.findMany({ where, orderBy: { faqOrder: 'asc' }, ...options });
    return Promise.all(faqs.map((f) => this.withMeta(f)));
  }

  async count(where: Prisma.FAQWhereInput) {
    return this.prisma.fAQ.count({ where });
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.meta.deleteMany({ where: { ownerType: OWNER_TYPE, ownerId: id } });
      return tx.fAQ.delete({ where: { id } });
    });
  }

  async bulkDelete(ids: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.meta.deleteMany({ where: { ownerType: OWNER_TYPE, ownerId: { in: ids } } });
      return tx.fAQ.deleteMany({ where: { id: { in: ids } } });
    });
  }
}
