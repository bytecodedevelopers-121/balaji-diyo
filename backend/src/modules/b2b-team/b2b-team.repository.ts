import { Prisma, PrismaClient, B2BUserRole } from '@prisma/client';
import { PARTNER_ROLE_NAME } from '../b2b-common/b2b.constants';
import { buildAuditEntry } from '../b2b-common/b2b-audit';
import { teamUserSelect } from '../b2b-common/b2b-partner.mapper';

export type UpdateMemberResult =
  | { kind: 'not_found' }
  | { kind: 'last_admin' }
  | { kind: 'ok'; user: Prisma.UserGetPayload<{ select: typeof teamUserSelect }> };

export class B2BTeamRepository {
  constructor(private prisma: PrismaClient) {}

  list(partnerId: string) {
    return this.prisma.user.findMany({
      where: { b2bPartnerId: partnerId, deletedAt: null },
      select: teamUserSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
  }

  ensurePartnerRole() {
    return this.prisma.role.upsert({
      where: { name: PARTNER_ROLE_NAME },
      update: {},
      create: { name: PARTNER_ROLE_NAME, description: 'B2B agency user (no internal permissions)', isSystem: true },
    });
  }

  createMember(
    partnerId: string,
    actorId: string,
    data: { email: string; passwordHash: string; firstName: string; lastName: string; b2bRole: B2BUserRole; roleId: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: data.roleId,
          isSuperAdmin: false,
          isActive: true,
          b2bPartnerId: partnerId,
          b2bRole: data.b2bRole,
        },
        select: teamUserSelect,
      });
      await tx.activityLog.create({
        data: buildAuditEntry({
          actorType: 'user', actorId, action: 'team.member_invited', title: 'Team member invited',
          category: 'b2b_partner', categoryId: partnerId, data: { userId: user.id, b2bRole: data.b2bRole },
        }),
      });
      return user;
    });
  }

  /**
   * Locks the partner row so two concurrent demotions/deactivations of the
   * last two AGENCY_ADMINs serialize, then refuses any change that would leave
   * the agency without an active AGENCY_ADMIN. Target lookup is scoped to
   * `partnerId`, so another tenant's user id is simply "not found".
   */
  updateMember(partnerId: string, targetUserId: string, actorId: string, patch: { b2bRole?: B2BUserRole; isActive?: boolean }): Promise<UpdateMemberResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM b2b_partners WHERE id = ${partnerId} FOR UPDATE`;

      const target = await tx.user.findFirst({
        where: { id: targetUserId, b2bPartnerId: partnerId, deletedAt: null },
        select: { id: true, b2bRole: true, isActive: true },
      });
      if (!target) return { kind: 'not_found' } as const;

      const nextRole = patch.b2bRole ?? target.b2bRole;
      const nextActive = patch.isActive ?? target.isActive;
      const wasActiveAdmin = target.b2bRole === 'AGENCY_ADMIN' && target.isActive;
      const willBeActiveAdmin = nextRole === 'AGENCY_ADMIN' && nextActive;
      if (wasActiveAdmin && !willBeActiveAdmin) {
        const otherAdmins = await tx.user.count({
          where: { b2bPartnerId: partnerId, deletedAt: null, isActive: true, b2bRole: 'AGENCY_ADMIN', id: { not: target.id } },
        });
        if (otherAdmins === 0) return { kind: 'last_admin' } as const;
      }

      const user = await tx.user.update({
        where: { id: target.id },
        data: { b2bRole: nextRole, isActive: nextActive },
        select: teamUserSelect,
      });
      await tx.activityLog.create({
        data: buildAuditEntry({
          actorType: 'user', actorId, action: 'team.member_updated', title: 'Team member updated',
          category: 'b2b_partner', categoryId: partnerId,
          data: { userId: target.id, from: { b2bRole: target.b2bRole, isActive: target.isActive }, to: { b2bRole: nextRole, isActive: nextActive } },
        }),
      });
      return { kind: 'ok', user } as const;
    });
  }
}
