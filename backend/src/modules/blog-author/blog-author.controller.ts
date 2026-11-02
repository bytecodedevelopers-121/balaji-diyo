import { Request, Response } from 'express';
import { BlogAuthorService } from './blog-author.service';
import { CreateBlogAuthorDto, UpdateBlogAuthorDto, GetBlogAuthorsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class BlogAuthorController {
  constructor(private service: BlogAuthorService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateBlogAuthorDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Blog author created successfully', data: result, req });
  };

  findAll = async (req: Request, res: Response) => {
    const dto = GetBlogAuthorsDto.parse(req.query);
    const result = await this.service.findAll(dto);

    SuccessResponseDto.send(res, { message: 'Blog authors retrieved successfully', data: result, req });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Blog author retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateBlogAuthorDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Blog author updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Blog author deleted successfully', req });
  };
}
