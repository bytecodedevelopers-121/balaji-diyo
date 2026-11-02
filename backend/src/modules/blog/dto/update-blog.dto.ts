import { z } from 'zod';
import { CreateBlogDto } from './create-blog.dto';

export const UpdateBlogDto = CreateBlogDto.partial();

export type UpdateBlogDtoType = z.infer<typeof UpdateBlogDto>;
