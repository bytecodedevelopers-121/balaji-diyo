import { Request, Response } from 'express';
import { TeamMemberService } from './team-member.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto, GetTeamMembersDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class TeamMemberController {
  constructor(private service: TeamMemberService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateTeamMemberDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Team member created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetTeamMembersDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Team members retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Team member retrieved successfully', data: result, req });
  };

  findPublicBySlug = async (req: Request, res: Response) => {
    const result = await this.service.findPublicBySlug(req.params.slug as string);

    SuccessResponseDto.send(res, { message: 'Team member retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateTeamMemberDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Team member updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Team member deleted successfully', req });
  };
}
