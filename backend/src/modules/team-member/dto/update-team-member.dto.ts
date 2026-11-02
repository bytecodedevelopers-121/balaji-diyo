import { z } from 'zod';
import { CreateTeamMemberDto } from './create-team-member.dto';

export const UpdateTeamMemberDto = CreateTeamMemberDto.partial();

export type UpdateTeamMemberDtoType = z.infer<typeof UpdateTeamMemberDto>;
