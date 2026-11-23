import type { B2BUserRole, LedgerEntryType } from "@/types/b2b";

export const ROLE_LABELS: Record<B2BUserRole, string> = {
  AGENCY_ADMIN: "Agency Admin",
  BOOKING_AGENT: "Booking Agent",
  FINANCE_MANAGER: "Finance Manager",
};

export const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as B2BUserRole[]).map((value) => ({ value, label: ROLE_LABELS[value] }));

export function formatMoney(amount: string | number, currency: string): string {
  const n = Number(amount);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export const docTypeLabel = (value: string): string =>
  value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const LEDGER_TYPE_LABEL: Record<LedgerEntryType, string> = {
  WALLET_TOPUP: "Top-up",
  BOOKING_DEBIT: "Booking (wallet)",
  CREDIT_LINE_DRAW: "Booking (credit)",
  CREDIT_LINE_REPAYMENT: "Credit repayment",
  REFUND_CREDIT: "Refund",
  COMMISSION_CREDIT: "Commission",
  ADJUSTMENT: "Adjustment",
};
