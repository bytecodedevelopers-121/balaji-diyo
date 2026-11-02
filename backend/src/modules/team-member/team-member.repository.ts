import { Prisma, PrismaClient } from '@prisma/client';

// Kebab-case, matching every other multi-word owner type in this codebase
// (see 'blog-author', 'package-map', 'trip-info') — the legacy-import ETL
// already created real url_infos rows under this exact key for all 8
// existing team members (2026-08-14). An earlier session queried
// 'teamMember' (camelCase) instead, found nothing, and wrongly concluded
// no slugs existed — DO NOT reintroduce that camelCase key here.
const OWNER_TYPE = 'team-member';

const teamMemberInclude = { categories: true } satisfies Prisma.TeamMemberInclude;

export interface TeamMemberCoreFields {
  position: string;
  positionOrder?: number;
  salutation?: string | null;
  fullName: string;
  photoUrl?: string | null;
  countryCode: string;
  countryName: string;
  memberAddress: string;
  memberPhone?: string | null;
  memberEmail?: string | null;
  memberFacebook?: string | null;
  memberTwitter?: string | null;
  memberInstagram?: string | null;
  memberWebsite?: string | null;
  quoteAbstract?: string | null;
  quote?: string | null;
  description?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface TeamMemberRelationFields {
  categoryIds?: string[];
}

export interface TeamMemberSeoFields {
  slug?: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type TeamMemberCreateData = TeamMemberCoreFields & TeamMemberRelationFields & TeamMemberSeoFields;
export type TeamMemberUpdateData = Partial<TeamMemberCoreFields> & TeamMemberRelationFields & TeamMemberSeoFields;

const toConnect = (ids?: string[]) => (ids ? { connect: ids.map((id) => ({ id })) } : undefined);
const toSet = (ids?: string[]) => (ids ? { set: ids.map((id) => ({ id })) } : undefined);

export class TeamMemberRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeo(id: string) {
    const [urlInfo, meta] = await Promise.all([
      this.prisma.urlInfo.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
      this.prisma.meta.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } } }),
    ]);
    return { urlInfo, meta };
  }

  private async withSeo<T extends { id: string }>(member: T) {
    const { urlInfo, meta } = await this.attachSeo(member.id);
    return { ...member, slug: urlInfo?.urlSlug ?? null, meta };
  }

  async create(data: TeamMemberCreateData) {
    const member = await this.prisma.$transaction(async (tx) => {
      const created = await tx.teamMember.create({
        data: {
          position: data.position,
          positionOrder: data.positionOrder ?? 0,
          salutation: data.salutation ?? null,
          fullName: data.fullName,
          photoUrl: data.photoUrl ?? null,
          countryCode: data.countryCode,
          countryName: data.countryName,
          memberAddress: data.memberAddress,
          memberPhone: data.memberPhone ?? null,
          memberEmail: data.memberEmail ?? null,
          memberFacebook: data.memberFacebook ?? null,
          memberTwitter: data.memberTwitter ?? null,
          memberInstagram: data.memberInstagram ?? null,
          memberWebsite: data.memberWebsite ?? null,
          quoteAbstract: data.quoteAbstract ?? null,
          quote: data.quote ?? null,
          description: data.description ?? null,
          isFeatured: data.isFeatured ?? false,
          isActive: data.isActive ?? true,
          categories: toConnect(data.categoryIds),
        },
        include: teamMemberInclude,
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

    return this.withSeo(member);
  }

  async update(id: string, data: TeamMemberUpdateData) {
    const member = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.teamMember.update({
        where: { id },
        data: {
          position: data.position,
          positionOrder: data.positionOrder,
          salutation: data.salutation,
          fullName: data.fullName,
          photoUrl: data.photoUrl,
          countryCode: data.countryCode,
          countryName: data.countryName,
          memberAddress: data.memberAddress,
          memberPhone: data.memberPhone,
          memberEmail: data.memberEmail,
          memberFacebook: data.memberFacebook,
          memberTwitter: data.memberTwitter,
          memberInstagram: data.memberInstagram,
          memberWebsite: data.memberWebsite,
          quoteAbstract: data.quoteAbstract,
          quote: data.quote,
          description: data.description,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
          categories: toSet(data.categoryIds),
        },
        include: teamMemberInclude,
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

    return this.withSeo(member);
  }

  async findById(id: string) {
    const member = await this.prisma.teamMember.findUnique({ where: { id }, include: teamMemberInclude });
    return member ? this.withSeo(member) : null;
  }

  async findBySlug(slug: string, extraWhere: Prisma.TeamMemberWhereInput = {}) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    if (!urlInfo) return null;
    const member = await this.prisma.teamMember.findFirst({
      where: { id: urlInfo.ownerId, ...extraWhere },
      include: teamMemberInclude,
    });
    return member ? this.withSeo(member) : null;
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.TeamMemberWhereInput, options?: { skip?: number; take?: number }) {
    const members = await this.prisma.teamMember.findMany({
      where,
      include: teamMemberInclude,
      orderBy: { positionOrder: 'asc' },
      ...options,
    });
    return Promise.all(members.map((m) => this.withSeo(m)));
  }

  async count(where: Prisma.TeamMemberWhereInput) {
    return this.prisma.teamMember.count({ where });
  }

  async softDelete(id: string) {
    return this.prisma.teamMember.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
