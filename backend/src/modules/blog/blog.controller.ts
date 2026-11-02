import { Request, Response } from 'express';
import { BlogService } from './blog.service';
import { CreateBlogDto, UpdateBlogDto, GetBlogsDto, GetBlogsAdminDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { withAbsoluteImageField } from '../../lib/media';

export class BlogController {
  constructor(private service: BlogService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateBlogDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, { message: 'Blog created successfully', data: result, req });
  };

  findAllPublic = async (req: Request, res: Response) => {
    const dto = GetBlogsDto.parse(req.query);
    const result = await this.service.findAllPublic(dto);
    const items = result.items.map((item) => withAbsoluteImageField(req, item, 'imageUrl'));

    SuccessResponseDto.send(res, { message: 'Blogs retrieved successfully', data: { ...result, items }, req });
  };

  findAllAdmin = async (req: Request, res: Response) => {
    const dto = GetBlogsAdminDto.parse(req.query);
    const result = await this.service.findAllAdmin(dto);
    const items = result.items.map((item) => withAbsoluteImageField(req, item, 'imageUrl'));

    SuccessResponseDto.send(res, { message: 'Blogs retrieved successfully', data: { ...result, items }, req });
  };

  findPublicBySlug = async (req: Request, res: Response) => {
    const result = await this.service.findPublicBySlug(req.params.slug as string);

    SuccessResponseDto.send(res, {
      message: 'Blog retrieved successfully',
      data: withAbsoluteImageField(req, result, 'imageUrl'),
      req,
    });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Blog retrieved successfully', data: result, req });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateBlogDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, { message: 'Blog updated successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Blog deleted successfully', req });
  };

  restore = async (req: Request, res: Response) => {
    await this.service.restore(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Blog restored successfully', req });
  };

  hardDelete = async (req: Request, res: Response) => {
    await this.service.hardDelete(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Blog permanently deleted', req });
  };
}
