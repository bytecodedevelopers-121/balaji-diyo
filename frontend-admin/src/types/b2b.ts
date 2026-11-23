export type B2BPartnerStatus = "PENDING_KYC" | "ACTIVE" | "SUSPENDED" | "REJECTED";
export type B2BUserRole = "AGENCY_ADMIN" | "BOOKING_AGENT" | "FINANCE_MANAGER";
export type B2BRateType = "NET" | "COMMISSIONABLE";

export const KYC_DOC_TYPES = [
  { value: "BUSINESS_REGISTRATION", label: "Business registration" },
  { value: "TAX_CERTIFICATE", label: "Tax / PAN / VAT certificate" },
  { value: "TRADE_LICENSE", label: "Trade license" },
  { value: "IATA_TAAN", label: "IATA / TAAN membership" },
  { value: "OTHER", label: "Other" },
] as const;
export type KycDocType = (typeof KYC_DOC_TYPES)[number]["value"];

/** Decimal columns arrive as strings. */
export interface B2BTier {
  id: string;
  name: string;
  code: string;
  priorityOrder: number;
  defaultRateType: B2BRateType;
  defaultCommissionPct: string;
  defaultCreditLimit: string;
  creditTermDays: number;
  holdDurationMinutes: number;
  slaResponseHours: number;
  isActive: boolean;
  _count?: { partners: number };
}

export interface KycDocument {
  id: string;
  partnerId: string;
  docType: string;
  fileName: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface TeamUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  b2bRole: B2BUserRole | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PartnerWallet {
  currency: string;
  walletBalance: string;
  creditLimit: string;
  creditUsed: string;
  creditAvailable: string;
  creditAlertSentAt: string | null;
}

export interface B2BPartnerProfile {
  id: string;
  partnerCode: string;
  legalName: string;
  tradeName: string | null;
  email: string;
  phone: string | null;
  country: string;
  city: string | null;
  address: string | null;
  website: string | null;
  taxOrRegNumber: string | null;
  status: B2BPartnerStatus;
  kycVerifiedAt: string | null;
  rejectionReason: string | null;
  currency: string;
  tier: B2BTier;
  kycDocuments: KycDocument[];
  wallet: PartnerWallet;
  createdAt: string;
}

/** GET /b2b/partner/me */
export interface MyPartner extends B2BPartnerProfile {
  myRole: B2BUserRole | null;
}

/** GET /admin/b2b/partners/:id */
export interface AdminPartnerDetail extends B2BPartnerProfile {
  users: TeamUser[];
}

export interface AdminPartnerRow {
  id: string;
  partnerCode: string;
  legalName: string;
  tradeName: string | null;
  email: string;
  country: string;
  taxOrRegNumber: string | null;
  status: B2BPartnerStatus;
  currency: string;
  creditLimit: string;
  createdAt: string;
  tier: Pick<B2BTier, "id" | "code" | "name">;
  kyc: { total: number; verified: number };
  _count: { users: number };
}

export interface RegisterPartnerInput {
  legalName: string;
  tradeName?: string;
  email: string;
  phone?: string;
  country: string;
  city?: string;
  address?: string;
  website?: string;
  taxOrRegNumber?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface KycUpload {
  docType: KycDocType;
  file: File;
}

export interface PartnerDecisionInput {
  status?: Exclude<B2BPartnerStatus, "PENDING_KYC">;
  rejectionReason?: string;
  tierId?: string;
  creditLimit?: number;
  currency?: string;
}

export type TierInput = Partial<Omit<B2BTier, "id" | "_count">> & { name: string; code: string };

// ── Phase 2: catalog, quotes, holds, contracts, allotments ─────────────────

export type RateSource = "CONTRACT" | "TIER_PRICE_GROUP" | "DEPARTURE_DEFAULT" | "PACKAGE_DEFAULT";
export type MarkupMode = "PER_PAX" | "TOTAL";

export interface PolicyIssue {
  code: string;
  message: string;
}

export interface RateSummary {
  rateSource: RateSource;
  rateType: B2BRateType;
  currency: string;
  paxCount: number;
  unitPrice: string;
  commissionPct: string | null;
  commissionAmount: string;
  netPayable: string;
  grossAmount: string;
  eligible: boolean;
  reasons: PolicyIssue[];
}

export interface CatalogAvailability {
  capacityTracked: boolean;
  available: number | null;
  source: "ALLOTMENT" | "POOL";
  allotmentReleaseAt: string | null;
}

export interface CatalogDeparture {
  id: string;
  departureDate: string;
  departureStatus: string;
  bookable: boolean;
  cutoffAt: string | null;
  availability: CatalogAvailability;
  rate: RateSummary;
}

export interface CatalogPackageRow {
  id: string;
  title: string;
  abstract: string | null;
  duration: string;
  durationType: string;
  groupSize: string | null;
  price: string;
  isFeatured: boolean;
  hasContract: boolean;
  upcomingDepartures: number;
  nextDeparture: CatalogDeparture | null;
  rate: RateSummary;
}

export interface PartnerContractView {
  id: string;
  rateType: B2BRateType;
  netUnitPrice: string | null;
  commissionPct: string | null;
  validFrom: string;
  validTo: string;
  blackoutDates: { start: string; end: string }[];
  minPax: number | null;
  maxPax: number | null;
  cutoffHours: number;
}

export interface CatalogPackageDetail {
  id: string;
  title: string;
  abstract: string | null;
  details: string | null;
  highlights: string | null;
  costIncludesText: string | null;
  costExcludesText: string | null;
  duration: string;
  durationType: string;
  groupSize: string | null;
  price: string;
  priceGroups: { packageTier: string; minPeople: number; maxPeople: number; unitPrice: string; offerUnitPrice: string | null }[];
  contracts: PartnerContractView[];
  tier: { defaultRateType: B2BRateType; defaultCommissionPct: string };
  departures: CatalogDeparture[];
}

export interface Quote extends RateSummary {
  packageId: string;
  packageTitle: string;
  departureId: string | null;
  travelDate: string;
  rateType: B2BRateType;
  baseRateSource: string;
  contractId: string | null;
  agentMarkup: string;
  clientDisplayAmount: string;
  cutoffAt: string | null;
  warnings: PolicyIssue[];
  availability: { source: "ALLOTMENT" | "POOL"; available: number | null; allotmentReleaseAt: string | null } | null;
}

export interface QuoteInput {
  packageId: string;
  departureId?: string;
  travelDate?: string;
  paxCount: number;
  agentMarkup?: number;
  agentMarkupMode?: MarkupMode;
}

export type HoldStatus = "ACTIVE" | "CONVERTED" | "EXPIRED" | "RELEASED";

export interface Hold {
  id: string;
  partnerId: string;
  departureId: string;
  seatsHeld: number;
  expiresAt: string;
  releasedAt: string | null;
  status: HoldStatus;
  /** ACTIVE holds past their expiry already read as EXPIRED. */
  effectiveStatus: HoldStatus;
  createdAt: string;
  departure: { id: string; departureDate: string; package: { id: string; title: string } };
}

export interface AdminContract {
  id: string;
  partnerId: string;
  packageId: string;
  rateType: B2BRateType;
  netUnitPrice: string | null;
  commissionPct: string | null;
  validFrom: string;
  validTo: string;
  blackoutDates: { start: string; end: string }[] | null;
  minPax: number | null;
  maxPax: number | null;
  cutoffHours: number;
  isActive: boolean;
  partner: { id: string; partnerCode: string; legalName: string };
  package: { id: string; title: string };
}

export interface ContractInput {
  partnerId?: string;
  packageId?: string;
  rateType: B2BRateType;
  netUnitPrice: number | null;
  commissionPct: number | null;
  validFrom: string;
  validTo: string;
  blackoutDates: { start: string; end: string }[];
  minPax: number | null;
  maxPax: number | null;
  cutoffHours: number;
  isActive: boolean;
}

export interface AdminAllotment {
  id: string;
  partnerId: string;
  departureId: string;
  allocatedSeats: number;
  bookedSeats: number;
  heldSeats: number;
  releaseBeforeHours: number;
  isActive: boolean;
  partner: { id: string; partnerCode: string; legalName: string };
  departure: { id: string; departureDate: string; totalSeats: number | null; bookedSeats: number; heldSeats: number; package: { id: string; title: string } };
}

// ── Phase 3: bookings, wallet, ledger ──────────────────────────────────────

export type BookingStatus = "DRAFT" | "HELD" | "PENDING_APPROVAL" | "CONFIRMED" | "AMENDMENT_REQUESTED" | "CANCELLED" | "EXPIRED";
export type FundingMethod = "WALLET" | "CREDIT" | "WALLET_THEN_CREDIT";
export type LedgerEntryType = "WALLET_TOPUP" | "BOOKING_DEBIT" | "CREDIT_LINE_DRAW" | "CREDIT_LINE_REPAYMENT" | "REFUND_CREDIT" | "COMMISSION_CREDIT" | "ADJUSTMENT";

export interface LedgerEntry {
  id: string;
  account: "WALLET" | "CREDIT";
  direction: "DEBIT" | "CREDIT";
  entryType: LedgerEntryType;
  amount: string;
  currency: string;
  balanceAfter: string;
  creditUsedAfter: string;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface WalletSummary {
  currency: string;
  walletBalance: string;
  creditLimit: string;
  creditUsed: string;
  creditAvailable: string;
  creditEnabled: boolean;
  utilizationPct: string;
  alert: { thresholdPct: string; atOrAboveThreshold: boolean; raised: boolean; raisedAt: string | null };
}

export interface BookingTraveller {
  id: string;
  fullName: string;
  email: string;
  gender: string | null;
  nationality: string;
  countryCode: string;
  mobileNumber: string | null;
  passportNo: string | null;
  isLead: boolean;
}

export interface BookingAmendment {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  payload: { paxCount?: number; departureId?: string; travellers?: unknown[] };
  priceDelta: string | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface BookingSettlement {
  wallet: string;
  credit: string;
  walletPaid: string;
  creditDrawn: string;
  refunded: string;
}

export interface B2BBooking {
  kind: "BOOKING";
  id: string;
  bookingNumber: number;
  reference: string;
  b2bStatus: BookingStatus;
  b2bStatusReason: string | null;
  b2bPartnerId: string;
  b2bPartner?: { id: string; partnerCode: string; legalName: string };
  departureId: string | null;
  packageId: string | null;
  package: { id: string; title: string } | null;
  startDate: string;
  endDate: string;
  numberOfTraveller: number;
  fullName: string;
  email: string;
  paymentOptions: string;
  totalPrice: string;
  agentMarkup: string | null;
  commissionAmount: string | null;
  netPayable: string | null;
  travellers: BookingTraveller[];
  invoice: { id: string; invoiceAmount: string; invoicePayType: string; invoiceStatus: number; invoiceNote: string | null; transactionCode: string } | null;
  amendments: BookingAmendment[];
  settlement?: BookingSettlement;
  ledger?: LedgerEntry[];
  createdAt: string;
  replayed?: boolean;
  cancellation?: { amountPaid: string; penalty: string; refund: string; refundedToWallet: string; refundedToCredit: string; penaltyPct: number | null };
  priceDelta?: string;
}

export interface B2BCustomBooking {
  kind: "CUSTOM";
  id: string;
  b2bStatus: BookingStatus;
  b2bStatusReason: string | null;
  b2bPartnerId: string;
  b2bPartner?: { id: string; partnerCode: string; legalName: string };
  packageId: string;
  package: { id: string; title: string };
  startDate: string;
  endDate: string | null;
  numberOfTraveller: number;
  specialRequirement: string | null;
  netPayable: string | null;
  fundingMethod: string | null;
  travellers: BookingTraveller[];
  createdAt: string;
}

export type AnyB2BBooking = B2BBooking | B2BCustomBooking;

export interface TravellerInput {
  fullName: string;
  email: string;
  gender?: string;
  nationality: string;
  countryCode: string;
  mobileNumber?: string;
  passportNo?: string;
  isLead?: boolean;
}

export interface InstantBookingInput {
  holdId?: string;
  departureId?: string;
  paxCount?: number;
  travellers: TravellerInput[];
  agentMarkup?: number;
  agentMarkupMode?: MarkupMode;
  fundingMethod: FundingMethod;
  pickupDetails?: string;
}

export type OnRequestInput =
  | {
      kind: "DEPARTURE";
      departureId: string;
      paxCount: number;
      travellers: TravellerInput[];
      agentMarkup?: number;
      agentMarkupMode?: MarkupMode;
      fundingMethod: FundingMethod;
      specialRequirement?: string;
    }
  | {
      kind: "CUSTOM";
      packageId: string;
      startDate: string;
      endDate?: string;
      travellers: (TravellerInput & { gender: string })[];
      specialRequirement?: string;
      airportPickup?: boolean;
      airportDropoff?: boolean;
      travelInsurance?: boolean;
      fundingMethod: FundingMethod;
    };

export type LedgerAdjustmentInput =
  | { kind: "ADJUSTMENT"; account: "WALLET" | "CREDIT"; direction: "DEBIT" | "CREDIT"; amount: number; description: string }
  | { kind: "CREDIT_LINE_REPAYMENT"; amount: number; description?: string }
  | { kind: "CREDIT_LIMIT"; creditLimit: number; description: string };

// ── Phase 4: settlements, developer portal, SLA ────────────────────────────

export interface SettlementStatusRow { count: number; grossClientPrice: string; netPayable: string; commission: string; agentMarkup: string }

export interface SettlementSummary {
  period: { from: string; to: string };
  currency: string;
  bookings: { byStatus: Record<string, SettlementStatusRow>; totals: { count: number; grossClientPrice: string; netPayable: string } };
  commission: { earned: string; reversed: string; net: string };
  agentMarkup: string;
  ledger: {
    byType: { entryType: LedgerEntryType; account: "WALLET" | "CREDIT"; direction: "DEBIT" | "CREDIT"; count: number; amount: string }[];
    topUps: string; bookingDebits: string; refunds: string; repayments: string; commissionPayouts: string; adjustmentsNet: string; cancellationPenaltiesRetained: string;
  };
  position: {
    opening: { wallet: string; creditUsed: string };
    closing: { wallet: string; creditUsed: string };
    movement: { wallet: string; creditUsed: string };
    reconciles: boolean;
    current: { wallet: string; creditLimit: string; creditUsed: string; creditAvailable: string };
  };
}

export interface SettlementOverviewRow {
  id: string; partnerCode: string; legalName: string; status: B2BPartnerStatus; currency: string;
  walletBalance: string; creditLimit: string; creditUsed: string; creditAvailable: string;
  period: { topUps: string; bookingDebits: string; refunds: string; repayments: string; commissionPayouts: string };
}

export type RecordSettlementInput =
  | { kind: "CREDIT_LINE_REPAYMENT"; amount: number; description?: string; settlementRef?: string }
  | { kind: "COMMISSION_CREDIT"; amount: number; description: string; settlementRef?: string }
  | { kind: "ADJUSTMENT"; account: "WALLET" | "CREDIT"; direction: "DEBIT" | "CREDIT"; amount: number; description: string; settlementRef?: string };

export const WEBHOOK_EVENTS = ["booking.confirmed", "booking.approved", "booking.cancelled", "booking.rejected", "sla.escalated", "sla.breached"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface ApiKeyMeta { id: string; name: string; keyPrefix: string; rateLimitRpm: number; isActive: boolean; lastUsedAt: string | null; expiresAt: string | null; createdAt: string }
export interface OneTimeKey { key: ApiKeyMeta; token: string; notice: string }

export interface WebhookDelivery {
  id: string; eventType: string; status: "PENDING" | "DELIVERED" | "FAILED"; attemptCount: number; maxAttempts: number;
  nextRetryAt: string | null; lastResponseCode: number | null; lastError: string | null; deliveredAt: string | null; createdAt: string;
}
export interface WebhookEndpoint { id: string; url: string; events: WebhookEvent[]; isActive: boolean; createdAt: string; updatedAt: string; deliveries?: WebhookDelivery[] }
export interface OneTimeSecret { endpoint: WebhookEndpoint; secret: string; notice: string }

export type SlaStatus = "OPEN" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED" | "BREACHED";
export type SlaPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export interface SlaTicket {
  id: string; partnerId: string; bookingId: string | null; customBookingId: string | null; reference: string | null; subject: string;
  priority: SlaPriority; status: SlaStatus; dueAt: string; escalatedAt: string | null; resolvedAt: string | null; createdAt: string;
  /** Internal; only present in admin responses. */
  notes?: string | null;
  partner?: { id: string; partnerCode: string; legalName: string };
}
