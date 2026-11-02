import { z } from 'zod';

export const CreateContactMessageDto = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  type: z.string().min(1).max(255),
  url: z.string().min(1).max(255),
  phone: z.string().max(50).optional(),
  message: z.string().min(1).max(3000),
  packageId: z.string().optional(),
  numberOfTraveller: z.number().int().optional(),
});

export type CreateContactMessageDtoType = z.infer<typeof CreateContactMessageDto>;
