import { Request, Response } from 'express';
import { StoryService } from './story.service';
import { CreateStoryDto, UpdateStoryDto, GetStoriesDto, GetStoriesAdminDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class StoryController {
  constructor(private service: StoryService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateStoryDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Story created successfully', data: result, req });
  };

  findAllPublic = async (req: Request, res: Response) => {
    const dto = GetStoriesDto.parse(req.query);
    const result = await this.service.findAllPublic(dto);

    SuccessResponseDto.send(res, { message: 'Stories retrieved successfully', data: result, req });
  };

  findAllAdmin = async (req: Request, res: Response) => {
    const dto = GetStoriesAdminDto.parse(req.query);
    const result = await this.service.findAllAdmin(dto);

    SuccessResponseDto.send(res, { message: 'Stories retrieved successfully', data: result, req });
  };

  findPublicBySlug = async (req: Request, res: Response) => {
    const result = await this.service.findPublicBySlug(req.params.slug as string);

    SuccessResponseDto.send(res, { message: 'Story retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Story retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateStoryDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Story updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Story deleted successfully', req });
  };

  restore = async (req: Request, res: Response) => {
    await this.service.restore(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Story restored successfully', req });
  };

  hardDelete = async (req: Request, res: Response) => {
    await this.service.hardDelete(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Story permanently deleted', req });
  };
}
