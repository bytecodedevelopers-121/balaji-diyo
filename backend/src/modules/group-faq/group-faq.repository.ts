import { Prisma, PrismaClient } from '@prisma/client';

const OWNER_TYPE = 'groupFaq';

const groupFaqInclude = { categories: true } satisfies Prisma.GroupFAQInclude;

export interface GroupFaqCoreFields {
  question: string;
  answer: string;
  isActive?: boolean;
  categoryIds: string[];
}

export interface GroupFaqSeoFields {
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type GroupFaqCreateData = GroupFaqCoreFields & GroupFaqSeoFields;
export type GroupFaqUpdateData = Partial<GroupFaqCoreFields> & GroupFaqSeoFields;

export class GroupFaqRepository {
  constructor(private prisma: PrismaClient) {}

  private async withMeta<T extends { id: string }>(faq: T) {
    const meta = await this.prisma.meta.findUnique({
      where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: faq.id } },
    });
    return { ...faq, meta };
  }

  async create(data: GroupFaqCreateData) {
    const faq = await this.prisma.$transaction(async (tx) => {
      const created = await tx.groupFAQ.create({
        data: {
          question: data.question,
          answer: data.answer,
          isActive: data.isActive ?? true,
          faqOrder: (await tx.groupFAQ.count()) + 1,
          categories: { connect: data.categoryIds.map((id) => ({ id })) },
        },
        include: groupFaqInclude,
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

  async update(id: string, data: GroupFaqUpdateData) {
    const faq = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.groupFAQ.update({
        where: { id },
        data: {
          question: data.question,
          answer: data.answer,
          isActive: data.isActive,
          categories: data.categoryIds ? { set: data.categoryIds.map((id) => ({ id })) } : undefined,
        },
        include: groupFaqInclude,
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
    const faq = await this.prisma.groupFAQ.findUnique({ where: { id }, include: groupFaqInclude });
    return faq ? this.withMeta(faq) : null;
  }

  async findMany(where: Prisma.GroupFAQWhereInput, options?: { skip?: number; take?: number }) {
    const faqs = await this.prisma.groupFAQ.findMany({
      where,
      include: groupFaqInclude,
      orderBy: { faqOrder: 'asc' },
      ...options,
    });
    return Promise.all(faqs.map((f) => this.withMeta(f)));
  }

  async count(where: Prisma.GroupFAQWhereInput) {
    return this.prisma.groupFAQ.count({ where });
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.meta.deleteMany({ where: { ownerType: OWNER_TYPE, ownerId: id } });
      return tx.groupFAQ.delete({ where: { id } });
    });
  }
}
