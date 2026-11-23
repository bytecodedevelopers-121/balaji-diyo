import { z } from 'zod';
import { KYC_DOC_TYPES, KYC_MAX_FILES_PER_REQUEST } from '../../b2b-common/b2b.constants';

// Multipart forms send empty inputs as "" — treat as absent.
const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().trim().max(max).optional());

// Repeated multipart fields arrive as string | string[].
const docTypeList = z.preprocess(
  (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]),
  z.array(z.enum(KYC_DOC_TYPES)).max(KYC_MAX_FILES_PER_REQUEST),
);

export const RegisterPartnerDto = z.object({
  legalName: z.string().trim().min(2).max(200),
  tradeName: optionalText(200),
  email: z.string().trim().email().max(254),
  phone: optionalText(40),
  country: z.string().trim().min(2).max(100),
  city: optionalText(100),
  address: optionalText(300),
  website: optionalText(200),
  taxOrRegNumber: optionalText(100),
  adminFirstName: z.string().trim().min(1).max(80),
  adminLastName: z.string().trim().min(1).max(80),
  adminEmail: z.string().trim().email().max(254),
  adminPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a digit'),
  docTypes: docTypeList,
});
export type RegisterPartnerDtoType = z.infer<typeof RegisterPartnerDto>;

export const UploadKycDocumentDto = z.object({ docTypes: docTypeList });
export type UploadKycDocumentDtoType = z.infer<typeof UploadKycDocumentDto>;

export const KycDocumentParamsDto = z.object({ docId: z.string().min(1).max(64) });
