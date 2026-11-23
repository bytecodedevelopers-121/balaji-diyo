import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Departure } from "@/types/departure";
import type {
  ApiKeyMeta,
  OneTimeKey,
  OneTimeSecret,
  RecordSettlementInput,
  SettlementOverviewRow,
  SettlementSummary,
  SlaPriority,
  SlaStatus,
  SlaTicket,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEvent,
  AnyB2BBooking,
  B2BBooking,
  BookingStatus,
  FundingMethod,
  InstantBookingInput,
  LedgerAdjustmentInput,
  LedgerEntry,
  LedgerEntryType,
  OnRequestInput,
  TravellerInput,
  WalletSummary,
  AdminAllotment,
  AdminContract,
  CatalogPackageDetail,
  CatalogPackageRow,
  ContractInput,
  Hold,
  HoldStatus,
  Quote,
  QuoteInput,
  AdminPartnerDetail,
  AdminPartnerRow,
  B2BPartnerStatus,
  B2BTier,
  B2BUserRole,
  KycDocument,
  KycUpload,
  MyPartner,
  PartnerDecisionInput,
  RegisterPartnerInput,
  TeamUser,
} from "@/types/b2b";

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

function appendDocuments(form: FormData, docs: KycUpload[]) {
  // Repeated `docTypes` fields pair positionally with the repeated `documents` files.
  docs.forEach((d) => {
    form.append("docTypes", d.docType);
    form.append("documents", d.file);
  });
}

export interface RegisterPartnerResult {
  partner: { id: string; partnerCode: string; legalName: string; status: B2BPartnerStatus };
  user: { id: string; email: string };
  documentsSubmitted: number;
}

export const b2bPartnerService = {
  register: (input: RegisterPartnerInput, docs: KycUpload[]) => {
    const form = new FormData();
    Object.entries(input).forEach(([k, v]) => {
      if (v !== undefined && v !== "") form.append(k, v);
    });
    appendDocuments(form, docs);
    return api.post<ApiResponse<RegisterPartnerResult>>("/b2b/onboarding/register", form, MULTIPART).then((r) => r.data);
  },

  me: () => api.get<ApiResponse<MyPartner>>("/b2b/partner/me").then((r) => r.data),

  uploadKyc: (docs: KycUpload[]) => {
    const form = new FormData();
    appendDocuments(form, docs);
    return api.post<ApiResponse<KycDocument[]>>("/b2b/onboarding/kyc-documents", form, MULTIPART).then((r) => r.data);
  },

  team: () => api.get<ApiResponse<TeamUser[]>>("/b2b/team").then((r) => r.data),

  invite: (data: { email: string; firstName: string; lastName: string; b2bRole: B2BUserRole; password: string }) =>
    api.post<ApiResponse<TeamUser>>("/b2b/team/invite", data).then((r) => r.data),

  updateMember: (userId: string, data: { b2bRole?: B2BUserRole; isActive?: boolean }) =>
    api.patch<ApiResponse<TeamUser>>(`/b2b/team/${userId}`, data).then((r) => r.data),
};

export interface PartnerListParams {
  page?: number;
  perPage?: number;
  status?: B2BPartnerStatus;
  tierId?: string;
  q?: string;
}

export const b2bAdminService = {
  partners: (params?: PartnerListParams) =>
    api.get<ApiResponse<PaginatedResponse<AdminPartnerRow>>>("/admin/b2b/partners", { params }).then((r) => r.data),

  partner: (id: string) => api.get<ApiResponse<AdminPartnerDetail>>(`/admin/b2b/partners/${id}`).then((r) => r.data),

  reviewDocument: (partnerId: string, data: { documentId: string; action: "VERIFY" | "REJECT"; notes?: string }) =>
    api.patch<ApiResponse<KycDocument>>(`/admin/b2b/partners/${partnerId}/kyc`, data).then((r) => r.data),

  decide: (partnerId: string, data: PartnerDecisionInput) =>
    api.patch<ApiResponse<AdminPartnerDetail>>(`/admin/b2b/partners/${partnerId}/decision`, data).then((r) => r.data),

  tiers: () => api.get<ApiResponse<B2BTier[]>>("/admin/b2b/tiers").then((r) => r.data),

  createTier: (data: Partial<B2BTier> & { name: string; code: string }) =>
    api.post<ApiResponse<B2BTier>>("/admin/b2b/tiers", toTierPayload(data)).then((r) => r.data),

  updateTier: (id: string, data: Partial<B2BTier>) =>
    api.patch<ApiResponse<B2BTier>>(`/admin/b2b/tiers/${id}`, toTierPayload(data)).then((r) => r.data),
};

// Decimal columns are strings in responses but the API validates numbers.
function toTierPayload(t: Partial<B2BTier>) {
  const { id: _id, _count, code, ...rest } = t as Partial<B2BTier> & { id?: string };
  void _id; void _count;
  return {
    ...rest,
    ...(code !== undefined ? { code } : {}),
    ...(rest.defaultCommissionPct !== undefined ? { defaultCommissionPct: Number(rest.defaultCommissionPct) } : {}),
    ...(rest.defaultCreditLimit !== undefined ? { defaultCreditLimit: Number(rest.defaultCreditLimit) } : {}),
  };
}

/** Fetches a KYC file with the bearer token (an <a href> can't send it) and opens it in a new tab. */
export async function openKycFile(url: string): Promise<void> {
  const res = await api.get<Blob>(url, { responseType: "blob" });
  const objectUrl = URL.createObjectURL(res.data);
  window.open(objectUrl, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

// ── Phase 2 ─────────────────────────────────────────────────────────────────

export const b2bCatalogService = {
  list: (params?: { page?: number; perPage?: number; q?: string }) =>
    api.get<ApiResponse<PaginatedResponse<CatalogPackageRow>>>("/b2b/packages", { params }).then((r) => r.data),

  detail: (id: string) => api.get<ApiResponse<CatalogPackageDetail>>(`/b2b/packages/${id}`).then((r) => r.data),

  quote: (data: QuoteInput) => api.post<ApiResponse<Quote>>("/b2b/pricing/quote", data).then((r) => r.data),

  holds: (params?: { page?: number; perPage?: number; status?: HoldStatus }) =>
    api.get<ApiResponse<PaginatedResponse<Hold>>>("/b2b/inventory/holds", { params }).then((r) => r.data),

  createHold: (data: { departureId: string; seatsHeld: number }) =>
    api.post<ApiResponse<Hold>>("/b2b/inventory/holds", data).then((r) => r.data),

  releaseHold: (id: string) => api.post<ApiResponse<Hold>>(`/b2b/inventory/holds/${id}/release`).then((r) => r.data),
};

export const b2bContractService = {
  list: (params?: { page?: number; perPage?: number; partnerId?: string; packageId?: string; isActive?: boolean }) =>
    api.get<ApiResponse<PaginatedResponse<AdminContract>>>("/admin/b2b/contracts", { params }).then((r) => r.data),

  create: (data: ContractInput) => api.post<ApiResponse<AdminContract>>("/admin/b2b/contracts", data).then((r) => r.data),

  update: (id: string, data: Partial<Omit<ContractInput, "partnerId" | "packageId">>) =>
    api.patch<ApiResponse<AdminContract>>(`/admin/b2b/contracts/${id}`, data).then((r) => r.data),
};

export const b2bAllotmentService = {
  list: (params?: { page?: number; perPage?: number; partnerId?: string; departureId?: string; packageId?: string }) =>
    api.get<ApiResponse<PaginatedResponse<AdminAllotment>>>("/admin/b2b/allotments", { params }).then((r) => r.data),

  upsert: (data: { partnerId: string; departureId: string; allocatedSeats: number; releaseBeforeHours: number; isActive: boolean }) =>
    api.put<ApiResponse<AdminAllotment>>("/admin/b2b/allotments", data).then((r) => r.data),

  setCapacity: (departureId: string, data: { totalSeats: number | null; cutoffHours?: number }) =>
    api.patch<ApiResponse<Departure>>(`/admin/departures/${departureId}/capacity`, data).then((r) => r.data),
};

// ── Phase 3 ─────────────────────────────────────────────────────────────────

export const b2bBookingService = {
  hold: (id: string) => api.get<ApiResponse<Hold>>(`/b2b/inventory/holds/${id}`).then((r) => r.data),

  instant: (data: InstantBookingInput) => api.post<ApiResponse<B2BBooking>>("/b2b/bookings/instant", data).then((r) => r.data),

  onRequest: (data: OnRequestInput) => api.post<ApiResponse<AnyB2BBooking>>("/b2b/bookings/on-request", data).then((r) => r.data),

  list: (params?: { page?: number; perPage?: number; kind?: "BOOKING" | "CUSTOM"; status?: BookingStatus; q?: string }) =>
    api.get<ApiResponse<PaginatedResponse<AnyB2BBooking>>>("/b2b/bookings", { params }).then((r) => r.data),

  get: (id: string) => api.get<ApiResponse<AnyB2BBooking>>(`/b2b/bookings/${id}`).then((r) => r.data),

  cancel: (id: string, reason?: string) => api.post<ApiResponse<B2BBooking>>(`/b2b/bookings/${id}/cancel`, { reason }).then((r) => r.data),

  amend: (id: string, data: { reason: string; changes: { paxCount?: number; departureId?: string; travellers?: TravellerInput[] } }) =>
    api.post<ApiResponse<B2BBooking>>(`/b2b/bookings/${id}/amend`, data).then((r) => r.data),

  walletSummary: () => api.get<ApiResponse<WalletSummary>>("/b2b/wallet/summary").then((r) => r.data),

  ledger: (params?: { page?: number; perPage?: number; entryType?: LedgerEntryType; account?: "WALLET" | "CREDIT" }) =>
    api.get<ApiResponse<PaginatedResponse<LedgerEntry>>>("/b2b/ledger", { params }).then((r) => r.data),

  initiateTopUp: (data: { amount: number; currency?: "USD" | "NPR" }) =>
    api.post<ApiResponse<{ paymentUrl: string; paymentId: string }>>("/b2b/wallet/topup/initiate", data).then((r) => r.data),
};

export const b2bAdminBookingService = {
  list: (params?: { page?: number; perPage?: number; kind?: "BOOKING" | "CUSTOM"; status?: BookingStatus; partnerId?: string; q?: string }) =>
    api.get<ApiResponse<PaginatedResponse<AnyB2BBooking>>>("/admin/b2b/bookings", { params }).then((r) => r.data),

  get: (id: string) => api.get<ApiResponse<AnyB2BBooking>>(`/admin/b2b/bookings/${id}`).then((r) => r.data),

  approve: (id: string, data: { note?: string; netPayable?: number; fundingMethod?: FundingMethod }) =>
    api.post<ApiResponse<AnyB2BBooking>>(`/admin/b2b/bookings/${id}/approve`, data).then((r) => r.data),

  reject: (id: string, reason: string) => api.post<ApiResponse<AnyB2BBooking>>(`/admin/b2b/bookings/${id}/reject`, { reason }).then((r) => r.data),

  cancel: (id: string, data: { reason: string; penaltyAmount?: number }) =>
    api.post<ApiResponse<B2BBooking>>(`/admin/b2b/bookings/${id}/cancel`, data).then((r) => r.data),

  resolveAmendment: (id: string, data: { action: "APPROVE" | "REJECT"; note?: string }) =>
    api.post<ApiResponse<B2BBooking>>(`/admin/b2b/bookings/${id}/amendment/resolve`, data).then((r) => r.data),

  partnerWallet: (partnerId: string) => api.get<ApiResponse<WalletSummary>>(`/admin/b2b/partners/${partnerId}/wallet`).then((r) => r.data),

  partnerLedger: (partnerId: string, params?: { page?: number; perPage?: number }) =>
    api.get<ApiResponse<PaginatedResponse<LedgerEntry>>>(`/admin/b2b/partners/${partnerId}/ledger`, { params }).then((r) => r.data),

  adjust: (partnerId: string, data: LedgerAdjustmentInput) =>
    api.post<ApiResponse<WalletSummary>>(`/admin/b2b/partners/${partnerId}/ledger-adjustment`, data).then((r) => r.data),
};

// ── Phase 4 ─────────────────────────────────────────────────────────────────

export interface Period { from?: string; to?: string }

export const b2bSettlementService = {
  summary: (p: Period) => api.get<ApiResponse<SettlementSummary>>("/b2b/settlements/summary", { params: p }).then((r) => r.data),

  /** Fetched with the bearer token, then handed to the browser as a file download. */
  exportCsv: async (p: Period): Promise<void> => {
    const res = await api.get<Blob>("/b2b/settlements/export", { params: p, responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement-${p.from ?? "last-30-days"}_${p.to ?? "today"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  adminOverview: (p: Period & { page?: number; perPage?: number }) =>
    api.get<ApiResponse<PaginatedResponse<SettlementOverviewRow>>>("/admin/b2b/settlements", { params: p }).then((r) => r.data),

  adminPartner: (partnerId: string, p: Period) =>
    api.get<ApiResponse<SettlementSummary>>("/admin/b2b/settlements", { params: { ...p, partnerId } }).then((r) => r.data),

  record: (partnerId: string, data: RecordSettlementInput) =>
    api.post<ApiResponse<{ replayed: boolean; ledgerEntryId: string | null }>>(`/admin/b2b/partners/${partnerId}/settlements`, data).then((r) => r.data),
};

export const b2bDeveloperService = {
  keys: () => api.get<ApiResponse<ApiKeyMeta[]>>("/b2b/developer/api-keys").then((r) => r.data),
  createKey: (data: { name: string; rateLimitRpm?: number; expiresAt?: string }) => api.post<ApiResponse<OneTimeKey>>("/b2b/developer/api-keys", data).then((r) => r.data),
  rotateKey: (id: string) => api.post<ApiResponse<OneTimeKey>>(`/b2b/developer/api-keys/${id}/rotate`).then((r) => r.data),
  revokeKey: (id: string) => api.delete<ApiResponse<ApiKeyMeta>>(`/b2b/developer/api-keys/${id}`).then((r) => r.data),

  webhooks: () => api.get<ApiResponse<WebhookEndpoint[]>>("/b2b/developer/webhooks").then((r) => r.data),
  createWebhook: (data: { url: string; events: WebhookEvent[]; isActive?: boolean }) => api.post<ApiResponse<OneTimeSecret>>("/b2b/developer/webhooks", data).then((r) => r.data),
  updateWebhook: (id: string, data: { url?: string; events?: WebhookEvent[]; isActive?: boolean }) => api.patch<ApiResponse<WebhookEndpoint>>(`/b2b/developer/webhooks/${id}`, data).then((r) => r.data),
  deleteWebhook: (id: string) => api.delete<ApiResponse<null>>(`/b2b/developer/webhooks/${id}`).then((r) => r.data),
  rotateSecret: (id: string) => api.post<ApiResponse<OneTimeSecret>>(`/b2b/developer/webhooks/${id}/rotate-secret`).then((r) => r.data),
  sendTest: (id: string) => api.post<ApiResponse<{ deliveryId: string }>>(`/b2b/developer/webhooks/${id}/test`).then((r) => r.data),
  deliveries: (id: string, params?: { page?: number; perPage?: number; status?: string }) =>
    api.get<ApiResponse<PaginatedResponse<WebhookDelivery>>>(`/b2b/developer/webhooks/${id}/deliveries`, { params }).then((r) => r.data),
};

export const b2bSlaService = {
  mine: (params?: { page?: number; perPage?: number; status?: SlaStatus }) => api.get<ApiResponse<PaginatedResponse<SlaTicket>>>("/b2b/sla-tickets", { params }).then((r) => r.data),
  adminList: (params?: { page?: number; perPage?: number; status?: SlaStatus; priority?: SlaPriority; partnerId?: string; overdue?: boolean }) =>
    api.get<ApiResponse<PaginatedResponse<SlaTicket>>>("/admin/b2b/sla-tickets", { params }).then((r) => r.data),
  adminUpdate: (id: string, data: { status?: "IN_PROGRESS" | "ESCALATED" | "RESOLVED"; priority?: SlaPriority; notes?: string; dueAt?: string }) =>
    api.patch<ApiResponse<SlaTicket>>(`/admin/b2b/sla-tickets/${id}`, data).then((r) => r.data),
};
