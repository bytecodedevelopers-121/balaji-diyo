import { Request, Response } from 'express';
import { BlogCommentService } from './blog-comment.service';
import { CreateBlogCommentDto, GetBlogCommentsDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class BlogCommentController {
  constructor(private service: BlogCommentService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateBlogCommentDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, {
      message: 'Comment submitted successfully — it will appear once approved',
      data: result,
      req,
    });
  };

  findForBlog = async (req: Request, res: Response) => {
    const result = await this.service.findForBlog(req.params.blogId as string);

    SuccessResponseDto.send(res, { message: 'Comments retrieved successfully', data: result, req });
  };

  findAllAdmin = async (req: Request, res: Response) => {
    const dto = GetBlogCommentsDto.parse(req.query);
    const result = await this.service.findAllAdmin(dto);

    SuccessResponseDto.send(res, { message: 'Comments retrieved successfully', data: result, req });
  };

  approve = async (req: Request, res: Response) => {
    const result = await this.service.approve(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Comment approved successfully', data: result, req });
  };

  reject = async (req: Request, res: Response) => {
    const result = await this.service.reject(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Comment rejected successfully', data: result, req });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, { message: 'Comment deleted successfully', req });
  };
}
