import { z } from 'zod';
import { CreateCompanyDocumentDto } from './create-company-document.dto';

export const UpdateCompanyDocumentDto = CreateCompanyDocumentDto.partial();

export type UpdateCompanyDocumentDtoType = z.infer<typeof UpdateCompanyDocumentDto>;
