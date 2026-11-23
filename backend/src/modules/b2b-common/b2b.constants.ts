export const PARTNER_ROLE_NAME = 'B2B Partner';

export const KYC_DOC_TYPES = [
  'BUSINESS_REGISTRATION',
  'TAX_CERTIFICATE',
  'TRADE_LICENSE',
  'IATA_TAAN',
  'OTHER',
] as const;
export type KycDocType = (typeof KYC_DOC_TYPES)[number];

export const KYC_MAX_FILES_PER_REQUEST = 5;
