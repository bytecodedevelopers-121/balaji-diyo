import { BlogCommentRepository } from './blog-comment.repository';
import { CreateBlogCommentDtoType, GetBlogCommentsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';

export class BlogCommentService {
  constructor(private repository: BlogCommentRepository) {}

  async create(dto: CreateBlogCommentDtoType) {
    const blog = await this.repository.findBlogSummary(dto.blogId);
    if (!blog || blog.deletedAt || !blog.isActive) throw new ApiError(404, 'Blog not found');

    if (dto.parentId) {
      const parent = await this.repository.findById(dto.parentId);
      if (!parent || parent.blogId !== dto.blogId) throw new ApiError(400, 'Invalid parentId');
    }

    // Public submissions are unapproved until an admin moderates them.
    return this.repository.create({ ...dto, isActive: false });
  }

  async findForBlog(blogId: string) {
    return this.repository.findApprovedForBlog(blogId);
  }

  async findAllAdmin(dto: GetBlogCommentsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where = {
      ...(dto.blogId ? { blogId: dto.blogId } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  private async assertExists(id: string) {
    const comment = await this.repository.findById(id);
    if (!comment) throw new ApiError(404, 'Comment not found');
    return comment;
  }

  async approve(id: string) {
    await this.assertExists(id);
    return this.repository.setActive(id, true);
  }

  async reject(id: string) {
    await this.assertExists(id);
    return this.repository.setActive(id, false);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.repository.delete(id);
  }
}
