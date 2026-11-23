import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import {
  b2bDeveloperService, b2bSettlementService, b2bSlaService, type Period,
  b2bAdminBookingService, b2bBookingService, b2bAdminService, b2bAllotmentService, b2bCatalogService, b2bContractService, b2bPartnerService, type PartnerListParams,
} from "@/services/b2b.service";
import { departureService } from "@/services/departure.service";
import type {
  RecordSettlementInput, SlaPriority, SlaStatus, WebhookEvent,
  B2BTier, B2BUserRole, BookingStatus, ContractInput, FundingMethod, HoldStatus, InstantBookingInput, KycUpload, LedgerAdjustmentInput,
  LedgerEntryType, OnRequestInput, PartnerDecisionInput, QuoteInput, TravellerInput,
} from "@/types/b2b";

// ── Partner portal ──────────────────────────────────────────────────────────

export const useMyPartner = () =>
  useQuery({ queryKey: queryKeys.b2b.me, queryFn: b2bPartnerService.me });

export const useUploadKyc = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (docs: KycUpload[]) => b2bPartnerService.uploadKyc(docs),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.me }),
  });
};

// `enabled` lets a non-admin / non-ACTIVE partner skip a request the API would 403.
export const useTeam = (enabled: boolean) =>
  useQuery({ queryKey: queryKeys.b2b.team, queryFn: b2bPartnerService.team, enabled });

export const useInviteMember = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: b2bPartnerService.invite,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.team }),
  });
};

export const useUpdateMember = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: ({ userId, ...data }: { userId: string; b2bRole?: B2BUserRole; isActive?: boolean }) =>
      b2bPartnerService.updateMember(userId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.team }),
  });
};

// ── Admin console ───────────────────────────────────────────────────────────

export const useAdminPartners = (params?: PartnerListParams) =>
  useQuery({ queryKey: queryKeys.b2b.partners(params), queryFn: () => b2bAdminService.partners(params) });

export const useAdminPartner = (id: string) =>
  useQuery({ queryKey: queryKeys.b2b.partner(id), queryFn: () => b2bAdminService.partner(id), enabled: !!id });

export const useReviewKycDocument = (partnerId: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: { documentId: string; action: "VERIFY" | "REJECT"; notes?: string }) =>
      b2bAdminService.reviewDocument(partnerId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.all }),
  });
};

export const usePartnerDecision = (partnerId: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: PartnerDecisionInput) => b2bAdminService.decide(partnerId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.all }),
  });
};

export const useAdminTiers = () =>
  useQuery({ queryKey: queryKeys.b2b.tiers, queryFn: b2bAdminService.tiers });

export const useCreateTier = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: b2bAdminService.createTier,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.tiers }),
  });
};

export const useUpdateTier = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<B2BTier>) => b2bAdminService.updateTier(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.tiers }),
  });
};

// ── Phase 2 ─────────────────────────────────────────────────────────────────

export const useCatalog = (params?: { page?: number; perPage?: number; q?: string }) =>
  useQuery({ queryKey: queryKeys.b2b.catalog(params), queryFn: () => b2bCatalogService.list(params) });

export const useCatalogPackage = (id: string) =>
  useQuery({ queryKey: queryKeys.b2b.catalogPackage(id), queryFn: () => b2bCatalogService.detail(id), enabled: !!id });

export const useQuote = () => useSafeMutation({ mutationFn: (data: QuoteInput) => b2bCatalogService.quote(data) });

export const useHolds = (params?: { page?: number; perPage?: number; status?: HoldStatus }) =>
  useQuery({ queryKey: queryKeys.b2b.holds(params), queryFn: () => b2bCatalogService.holds(params), refetchInterval: 30_000 });

// Holds change seat availability, so the catalog views are refreshed with them.
export const useCreateHold = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: { departureId: string; seatsHeld: number }) => b2bCatalogService.createHold(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.all }),
  });
};

export const useReleaseHold = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => b2bCatalogService.releaseHold(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.all }),
  });
};

export const useContracts = (params?: { page?: number; perPage?: number; partnerId?: string; packageId?: string; isActive?: boolean }) =>
  useQuery({ queryKey: queryKeys.b2b.contracts(params), queryFn: () => b2bContractService.list(params) });

export const useSaveContract = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: ({ id, data }: { id?: string; data: ContractInput }) => {
      if (id) {
        const { partnerId: _p, packageId: _k, ...patch } = data;
        void _p; void _k;
        return b2bContractService.update(id, patch);
      }
      return b2bContractService.create(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...queryKeys.b2b.all, "contracts"] }),
  });
};

export const useAllotments = (params?: { page?: number; perPage?: number; partnerId?: string; departureId?: string; packageId?: string }) =>
  useQuery({ queryKey: queryKeys.b2b.allotments(params), queryFn: () => b2bAllotmentService.list(params) });

export const useDeparturesForPackage = (packageId: string) =>
  useQuery({
    queryKey: queryKeys.b2b.departures(packageId),
    queryFn: () => departureService.getAll({ packageId, perPage: 100 }),
    enabled: !!packageId,
  });

export const useUpsertAllotment = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: b2bAllotmentService.upsert,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.all }),
  });
};

export const useSetCapacity = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: ({ departureId, ...data }: { departureId: string; totalSeats: number | null; cutoffHours?: number }) =>
      b2bAllotmentService.setCapacity(departureId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.all }),
  });
};

// ── Phase 3 ─────────────────────────────────────────────────────────────────

export const useHold = (id: string) =>
  useQuery({ queryKey: queryKeys.b2b.hold(id), queryFn: () => b2bBookingService.hold(id), enabled: !!id });

export const useWalletSummary = () =>
  useQuery({ queryKey: queryKeys.b2b.wallet, queryFn: b2bBookingService.walletSummary, refetchInterval: 60_000 });

export const useLedger = (params?: { page?: number; perPage?: number; entryType?: LedgerEntryType; account?: "WALLET" | "CREDIT" }, enabled = true) =>
  useQuery({ queryKey: queryKeys.b2b.ledger(params), queryFn: () => b2bBookingService.ledger(params), enabled });

export const useInitiateTopUp = () => useSafeMutation({ mutationFn: b2bBookingService.initiateTopUp });

export const useMyBookings = (params?: { page?: number; perPage?: number; kind?: "BOOKING" | "CUSTOM"; status?: BookingStatus; q?: string }) =>
  useQuery({ queryKey: queryKeys.b2b.bookings(params), queryFn: () => b2bBookingService.list(params) });

export const useMyBooking = (id: string) =>
  useQuery({ queryKey: queryKeys.b2b.booking(id), queryFn: () => b2bBookingService.get(id), enabled: !!id });

// A booking changes wallet, holds and seat availability, so everything under the B2B key is refreshed.
const useBookingMutation = <V, R>(fn: (v: V) => Promise<R>) => {
  const qc = useQueryClient();
  return useSafeMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.b2b.all }) });
};

export const useInstantBooking = () => useBookingMutation((d: InstantBookingInput) => b2bBookingService.instant(d));
export const useOnRequestBooking = () => useBookingMutation((d: OnRequestInput) => b2bBookingService.onRequest(d));
export const useCancelBooking = () => useBookingMutation(({ id, reason }: { id: string; reason?: string }) => b2bBookingService.cancel(id, reason));
export const useAmendBooking = () =>
  useBookingMutation(({ id, ...data }: { id: string; reason: string; changes: { paxCount?: number; departureId?: string; travellers?: TravellerInput[] } }) => b2bBookingService.amend(id, data));

export const useAdminBookings = (params?: { page?: number; perPage?: number; kind?: "BOOKING" | "CUSTOM"; status?: BookingStatus; partnerId?: string; q?: string }) =>
  useQuery({ queryKey: queryKeys.b2b.adminBookings(params), queryFn: () => b2bAdminBookingService.list(params) });

export const useAdminBooking = (id: string | null) =>
  useQuery({ queryKey: queryKeys.b2b.adminBooking(id ?? ""), queryFn: () => b2bAdminBookingService.get(id as string), enabled: !!id });

export const useApproveBooking = () => useBookingMutation(({ id, ...d }: { id: string; note?: string; netPayable?: number; fundingMethod?: FundingMethod }) => b2bAdminBookingService.approve(id, d));
export const useRejectBooking = () => useBookingMutation(({ id, reason }: { id: string; reason: string }) => b2bAdminBookingService.reject(id, reason));
export const useAdminCancelBooking = () => useBookingMutation(({ id, ...d }: { id: string; reason: string; penaltyAmount?: number }) => b2bAdminBookingService.cancel(id, d));
export const useResolveAmendment = () => useBookingMutation(({ id, ...d }: { id: string; action: "APPROVE" | "REJECT"; note?: string }) => b2bAdminBookingService.resolveAmendment(id, d));

export const usePartnerWallet = (partnerId: string) =>
  useQuery({ queryKey: queryKeys.b2b.partnerWallet(partnerId), queryFn: () => b2bAdminBookingService.partnerWallet(partnerId), enabled: !!partnerId });

export const usePartnerLedger = (partnerId: string, params?: { page?: number; perPage?: number }) =>
  useQuery({ queryKey: queryKeys.b2b.partnerLedger(partnerId, params), queryFn: () => b2bAdminBookingService.partnerLedger(partnerId, params), enabled: !!partnerId });

export const useLedgerAdjustment = (partnerId: string) =>
  useBookingMutation((d: LedgerAdjustmentInput) => b2bAdminBookingService.adjust(partnerId, d));

// ── Phase 4 ─────────────────────────────────────────────────────────────────

export const useSettlementSummary = (p: Period) =>
  useQuery({ queryKey: queryKeys.b2b.settlement(p), queryFn: () => b2bSettlementService.summary(p) });

export const useAdminSettlements = (p: Period & { page?: number; perPage?: number }) =>
  useQuery({ queryKey: queryKeys.b2b.adminSettlements(p), queryFn: () => b2bSettlementService.adminOverview(p) });

export const useAdminPartnerSettlement = (partnerId: string | null, p: Period) =>
  useQuery({ queryKey: queryKeys.b2b.adminSettlement(partnerId ?? "", p), queryFn: () => b2bSettlementService.adminPartner(partnerId as string, p), enabled: !!partnerId });

export const useRecordSettlement = (partnerId: string) =>
  useBookingMutation((d: RecordSettlementInput) => b2bSettlementService.record(partnerId, d));

export const useApiKeys = () => useQuery({ queryKey: queryKeys.b2b.apiKeys, queryFn: b2bDeveloperService.keys });
export const useCreateApiKey = () => useBookingMutation((d: { name: string; rateLimitRpm?: number; expiresAt?: string }) => b2bDeveloperService.createKey(d));
export const useRotateApiKey = () => useBookingMutation((id: string) => b2bDeveloperService.rotateKey(id));
export const useRevokeApiKey = () => useBookingMutation((id: string) => b2bDeveloperService.revokeKey(id));

export const useWebhooks = () => useQuery({ queryKey: queryKeys.b2b.webhooks, queryFn: b2bDeveloperService.webhooks, refetchInterval: 15_000 });
export const useCreateWebhook = () => useBookingMutation((d: { url: string; events: WebhookEvent[]; isActive?: boolean }) => b2bDeveloperService.createWebhook(d));
export const useUpdateWebhook = () => useBookingMutation(({ id, ...d }: { id: string; url?: string; events?: WebhookEvent[]; isActive?: boolean }) => b2bDeveloperService.updateWebhook(id, d));
export const useDeleteWebhook = () => useBookingMutation((id: string) => b2bDeveloperService.deleteWebhook(id));
export const useRotateWebhookSecret = () => useBookingMutation((id: string) => b2bDeveloperService.rotateSecret(id));
export const useSendWebhookTest = () => useBookingMutation((id: string) => b2bDeveloperService.sendTest(id));
export const useWebhookDeliveries = (id: string | null, params?: { page?: number; perPage?: number; status?: string }) =>
  useQuery({ queryKey: queryKeys.b2b.deliveries(id ?? "", params), queryFn: () => b2bDeveloperService.deliveries(id as string, params), enabled: !!id, refetchInterval: 10_000 });

export const useMySlaTickets = (params?: { page?: number; perPage?: number; status?: SlaStatus }) =>
  useQuery({ queryKey: queryKeys.b2b.sla(params), queryFn: () => b2bSlaService.mine(params), refetchInterval: 60_000 });
export const useAdminSlaTickets = (params?: { page?: number; perPage?: number; status?: SlaStatus; priority?: SlaPriority; partnerId?: string; overdue?: boolean }) =>
  useQuery({ queryKey: queryKeys.b2b.adminSla(params), queryFn: () => b2bSlaService.adminList(params), refetchInterval: 30_000 });
export const useUpdateSlaTicket = () =>
  useBookingMutation(({ id, ...d }: { id: string; status?: "IN_PROGRESS" | "ESCALATED" | "RESOLVED"; priority?: SlaPriority; notes?: string; dueAt?: string }) => b2bSlaService.adminUpdate(id, d));
