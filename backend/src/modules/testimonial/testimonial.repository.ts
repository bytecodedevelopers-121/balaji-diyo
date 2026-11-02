import { Prisma, PrismaClient } from '@prisma/client';

const OWNER_TYPE = 'testimonial';

const testimonialInclude = {
  packages: { select: { id: true, title: true } },
  members: { select: { id: true, fullName: true } },
} satisfies Prisma.TestimonialInclude;

export interface TestimonialCoreFields {
  salutation?: string | null;
  fullName: string;
  reviewAbstract?: string | null;
  reviewTitle?: string | null;
  review: string;
  reviewRating?: number | null;
  reviewDate?: Date | null;
  countryCode: string;
  countryName: string;
  address?: string | null;
  affiliateOrganization?: string | null;
  organizationAddress?: string | null;
  organizationPosition?: string | null;
  organizationDescription?: string | null;
  organizationLink?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface TestimonialRelationFields {
  packageIds?: string[];
  memberIds?: string[];
}

export interface TestimonialSeoFields {
  slug?: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type TestimonialCreateData = TestimonialCoreFields & TestimonialRelationFields & TestimonialSeoFields;
export type TestimonialUpdateData = Partial<TestimonialCoreFields> & TestimonialRelationFields & TestimonialSeoFields;

const toConnect = (ids?: string[]) => (ids ? { connect: ids.map((id) => ({ id })) } : undefined);
const toSet = (ids?: string[]) => (ids ? { set: ids.map((id) => ({ id })) } : undefined);

export class TestimonialRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeo(id: string) {
    const [urlInfo, meta] = await Promise.all([
      this.prisma.urlInfo.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
      this.prisma.meta.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
    ]);
    return { urlInfo, meta };
  }

  private async withSeo<T extends { id: string }>(entity: T) {
    const { urlInfo, meta } = await this.attachSeo(entity.id);
    return { ...entity, slug: urlInfo?.urlSlug ?? null, meta };
  }

  async create(data: TestimonialCreateData) {
    const testimonial = await this.prisma.$transaction(async (tx) => {
      const created = await tx.testimonial.create({
        data: {
          salutation: data.salutation ?? null,
          fullName: data.fullName,
          reviewAbstract: data.reviewAbstract ?? null,
          reviewTitle: data.reviewTitle ?? null,
          review: data.review,
          reviewRating: data.reviewRating ?? null,
          reviewDate: data.reviewDate ?? null,
          countryCode: data.countryCode,
          countryName: data.countryName,
          address: data.address ?? null,
          affiliateOrganization: data.affiliateOrganization ?? null,
          organizationAddress: data.organizationAddress ?? null,
          organizationPosition: data.organizationPosition ?? null,
          organizationDescription: data.organizationDescription ?? null,
          organizationLink: data.organizationLink ?? null,
          isFeatured: data.isFeatured ?? false,
          isActive: data.isActive ?? true,
          packages: toConnect(data.packageIds),
          members: toConnect(data.memberIds),
        },
        include: testimonialInclude,
      });

      if (data.slug) {
        await tx.urlInfo.create({
          data: { ownerType: OWNER_TYPE, ownerId: created.id, urlSlug: data.slug, urlTitle: data.fullName },
        });
      }

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

    return this.withSeo(testimonial);
  }

  async update(id: string, data: TestimonialUpdateData) {
    const testimonial = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.testimonial.update({
        where: { id },
        data: {
          salutation: data.salutation,
          fullName: data.fullName,
          reviewAbstract: data.reviewAbstract,
          reviewTitle: data.reviewTitle,
          review: data.review,
          reviewRating: data.reviewRating,
          reviewDate: data.reviewDate,
          countryCode: data.countryCode,
          countryName: data.countryName,
          address: data.address,
          affiliateOrganization: data.affiliateOrganization,
          organizationAddress: data.organizationAddress,
          organizationPosition: data.organizationPosition,
          organizationDescription: data.organizationDescription,
          organizationLink: data.organizationLink,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
          packages: toSet(data.packageIds),
          members: toSet(data.memberIds),
        },
        include: testimonialInclude,
      });

      if (data.slug) {
        await tx.urlInfo.upsert({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          create: { ownerType: OWNER_TYPE, ownerId: id, urlSlug: data.slug, urlTitle: data.fullName ?? updated.fullName },
          update: { urlSlug: data.slug, urlTitle: data.fullName },
        });
      }

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

    return this.withSeo(testimonial);
  }

  async findById(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({ where: { id }, include: testimonialInclude });
    return testimonial ? this.withSeo(testimonial) : null;
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.TestimonialWhereInput, options?: { skip?: number; take?: number }) {
    const testimonials = await this.prisma.testimonial.findMany({
      where,
      include: testimonialInclude,
      orderBy: { createdAt: 'desc' },
      ...options,
    });
    return Promise.all(testimonials.map((t) => this.withSeo(t)));
  }

  async count(where: Prisma.TestimonialWhereInput) {
    return this.prisma.testimonial.count({ where });
  }

  async softDelete(id: string) {
    return this.prisma.testimonial.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
