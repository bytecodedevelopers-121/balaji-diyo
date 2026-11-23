import { Request, Response } from 'express';
import { B2BTeamService } from './b2b-team.service';
import { InviteTeamMemberDto, UpdateTeamMemberDto, TeamMemberParamsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { partnerScope } from '../../common/guards/b2b.guard';

export class B2BTeamController {
  constructor(private service: B2BTeamService) {}

  list = async (req: Request, res: Response) => {
    const { partnerId } = partnerScope(req.user);
    const data = await this.service.list(partnerId);
    SuccessResponseDto.send(res, { message: 'Team retrieved successfully', data, req });
  };

  invite = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const dto = InviteTeamMemberDto.parse(req.body);
    const data = await this.service.invite(partnerId, userId, dto);
    SuccessResponseDto.created(res, { message: 'Team member invited', data, req });
  };

  update = async (req: Request, res: Response) => {
    const { partnerId, userId } = partnerScope(req.user);
    const params = TeamMemberParamsDto.parse(req.params);
    const dto = UpdateTeamMemberDto.parse(req.body);
    const data = await this.service.update(partnerId, userId, params.userId, dto);
    SuccessResponseDto.send(res, { message: 'Team member updated', data, req });
  };
}
