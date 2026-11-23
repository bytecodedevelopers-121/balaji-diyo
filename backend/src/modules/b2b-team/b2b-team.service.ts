import bcrypt from 'bcrypt';
import { ApiError } from '../../common/exceptions/api-error';
import { B2BTeamRepository } from './b2b-team.repository';
import type { InviteTeamMemberDtoType, UpdateTeamMemberDtoType } from './dto';

export class B2BTeamService {
  constructor(private repository: B2BTeamRepository) {}

  list(partnerId: string) {
    return this.repository.list(partnerId);
  }

  async invite(partnerId: string, actorId: string, dto: InviteTeamMemberDtoType) {
    if (await this.repository.findUserByEmail(dto.email)) {
      throw new ApiError(409, 'An account with this email already exists');
    }
    const [role, passwordHash] = await Promise.all([this.repository.ensurePartnerRole(), bcrypt.hash(dto.password, 12)]);
    return this.repository.createMember(partnerId, actorId, {
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      b2bRole: dto.b2bRole,
      roleId: role.id,
    });
  }

  async update(partnerId: string, actorId: string, targetUserId: string, dto: UpdateTeamMemberDtoType) {
    const result = await this.repository.updateMember(partnerId, targetUserId, actorId, dto);
    if (result.kind === 'not_found') throw new ApiError(404, 'Team member not found');
    if (result.kind === 'last_admin') {
      throw new ApiError(409, 'Cannot demote or deactivate the last active agency admin');
    }
    return result.user;
  }
}
