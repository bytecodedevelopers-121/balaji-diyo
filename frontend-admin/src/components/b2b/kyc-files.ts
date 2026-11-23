import type { KycDocType } from "@/types/b2b";

export const KYC_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
export interface KycRow {
  key: number;
  docType: KycDocType;
  file: File | null;
}

export const MAX_KYC_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;

let nextKey = 1;
export const newKycRow = (docType: KycDocType = "BUSINESS_REGISTRATION"): KycRow => ({ key: nextKey++, docType, file: null });

/** Returns an error message if the chosen files can't be submitted, else null. */
export function validateKycRows(rows: KycRow[], { requireOne }: { requireOne: boolean }): string | null {
  const filled = rows.filter((r) => r.file);
  if (requireOne && filled.length === 0) return "Attach at least one KYC document.";
  if (rows.some((r) => !r.file)) return "Choose a file for every document row, or remove the empty row.";
  const tooBig = filled.find((r) => (r.file?.size ?? 0) > MAX_BYTES);
  if (tooBig) return `"${tooBig.file?.name}" is larger than 10 MB.`;
  return null;
}

