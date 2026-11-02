import { z } from 'zod';
import { CreateTestimonialDto } from './create-testimonial.dto';

export const UpdateTestimonialDto = CreateTestimonialDto.partial();

export type UpdateTestimonialDtoType = z.infer<typeof UpdateTestimonialDto>;
