import { z } from 'zod';
import { CreateBlogAuthorDto } from './create-blog-author.dto';

export const UpdateBlogAuthorDto = CreateBlogAuthorDto.partial();

export type UpdateBlogAuthorDtoType = z.infer<typeof UpdateBlogAuthorDto>;
