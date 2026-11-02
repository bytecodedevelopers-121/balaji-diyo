import { Request, Response } from 'express';
import { StoryAuthorService } from './story-author.service';
import { CreateStoryAuthorDto, UpdateStoryAuthorDto, GetStoryAuthorsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class StoryAuthorController {
  constructor(private service: StoryAuthorService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateStoryAuthorDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Story author created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetStoryAuthorsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Story authors retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Story author retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateStoryAuthorDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Story author updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Story author deleted successfully', req });
  };
}
