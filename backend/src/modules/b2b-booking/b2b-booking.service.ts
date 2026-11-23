import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { buildAuditEntry, type B2BAuditAction } from '../b2b-common/b2b-audit';
import { Dec, ZERO, round2 } from '../b2b-common/b2b-money';
import { B2BFinanceRepository, FinanceTx } from '../b2b-finance/b2b-finance.repository';
import { B2BLedgerService, assertUsdSettlement } from '../b2b-ledger/b2b-ledger.service';
import { fundingFromCode, paymentOptionsCode, planFunding } from '../b2b-ledger/credit.policy';
import type { CreditAlertEvent, FundingMethod, FundingPlan, LockedPartner } from '../b2b-ledger/ledger.types';
import { computeAvailability, type AllotmentSeats } from '../b2b-inventory/availability';
import type { LockedDeparture } from '../b2b-inventory/b2b-inventory.repository';
import { resolveRate } from '../b2b-pricing/pricing.engine';
import type { MarkupMode, PolicyIssue, RateResult } from '../b2b-pricing/pricing.types';
import { allocateRefund, daysUntil, penaltyPctFor, summariseSettlement, type Settlement } from './booking.policy';
import {
  AdminCancelDtoType, AmendBookingDtoType, ApproveBookingDtoType, CancelBookingDtoType, InstantBookingDtoType, ListBookingsQueryDtoType,
  OnRequestBookingDtoType, RejectBookingDtoType, ResolveAmendmentDtoType, TravellerDto, type TravellerDtoType,
} from './dto';

export type Actor = { kind: 'partner'; partnerId: string; userId: string } | { kind: 'admin'; userId: string };

type TravellerRow = Prisma.TravellerCreateWithoutBookingInput;
interface LockedDeparturePair { dep: LockedDeparture; allotments: AllotmentSeats[] }

const AmendmentPayload = z.object({
  paxCount: z.number().int().min(1).optional(),
  departureId: z.string().optional(),
  travellers: z.array(TravellerDto).optional(),
});

const DAY_MS = 86_400_000;

const bookingRef = (n: number): string => `BA-${n}`;

/** Exactly one lead traveller; defaults to the first. */
const toTravellerRows = (list: TravellerDtoType[]): TravellerRow[] => {
  const leads = list.filter((t) => t.isLead);
  if (leads.length > 1) throw ApiError.badRequest('Only one traveller can be the lead');
  const leadIdx = leads[0] ? list.indexOf(leads[0]) : 0;
  return list.map((t, i) => ({
    fullName: t.fullName, gender: t.gender ?? null, email: t.email, dateOfBirth: t.dateOfBirth ?? null, nationality: t.nationality,
    countryCode: t.countryCode, mobileNumber: t.mobileNumber ?? null, passportNo: t.passportNo ?? null, isLead: i === leadIdx,
  }));
};

const endDateFor = (start: Date, duration: Prisma.Decimal, durationType: string): Date => {
  if (!/day/i.test(durationType)) return start;
  const days = Math.max(Math.ceil(Number(duration.toString())), 1);
  return new Date(start.getTime() + (days - 1) * DAY_MS);
};

/** Booking-blocking policy reasons → HTTP errors (conflicts are 409, contract-rule violations 422). */
const failOnPolicy = (reasons: PolicyIssue[], ignore: string[] = []): void => {
  const r = reasons.find((x) => !ignore.includes(x.code));
  if (r) throw new ApiError(r.code === 'DEPARTURE_NOT_BOOKABLE' || r.code === 'CUTOFF_PASSED' ? 409 : 422, r.message);
};

const searchWhere = (q: string): Prisma.BookingWhereInput[] => {
  const conds: Prisma.BookingWhereInput[] = [
    { fullName: { contains: q, mode: 'insensitive' } },
    { email: { contains: q, mode: 'insensitive' } },
  ];
  const m = /^(?:BA-)?(\d{1,9})$/i.exec(q);
  if (m) conds.push({ bookingNumber: Number(m[1]) });
  return conds;
};

export class B2BBookingService {
  constructor(
    private repository: B2BFinanceRepository,
    private ledger: B2BLedgerService,
    // Webhook deliveries are written to the outbox inside each transaction; this just wakes the sender after commit.
    private webhooks: { kick(): void },
  ) {}

  /** Event payloads carry booking facts only — no traveller PII. */
  private eventData(
    b: { id: string; bookingNumber: number; packageId: string | null; departureId: string | null; startDate: Date; numberOfTraveller: number; netPayable: Prisma.Decimal | null; commissionAmount: Prisma.Decimal | null; agentMarkup: Prisma.Decimal | null },
    status: string,
    extra: Prisma.InputJsonObject = {},
  ): Prisma.InputJsonObject {
    return {
      bookingId: b.id, reference: bookingRef(b.bookingNumber), status, packageId: b.packageId, departureId: b.departureId, startDate: b.startDate.toISOString(),
      travellers: b.numberOfTraveller, netPayable: b.netPayable?.toString() ?? null, commissionAmount: b.commissionAmount?.toString() ?? null, agentMarkup: b.agentMarkup?.toString() ?? null, ...extra,
    };
  }

  /** SLA clock starts when a request needs human review; due = now + the partner tier's response hours. */
  private async openSla(tx: FinanceTx, partnerId: string, ref: { bookingId?: string; customBookingId?: string }, subject: string, hours: number, now: Date, priority = 'NORMAL'): Promise<void> {
    const t = await tx.createSlaTicket({ partnerId, ...ref, subject, priority, dueAt: new Date(now.getTime() + hours * 3_600_000) });
    await tx.audit(buildAuditEntry({
      actorType: 'system', actorId: 'sla-monitor', action: 'sla.created', title: 'SLA ticket opened', category: 'b2b_sla', categoryId: t.id,
      data: { partnerId, ...ref, subject, dueInHours: hours },
    }));
  }

  private async closeSla(tx: FinanceTx, ref: { bookingId?: string; customBookingId?: string }, now: Date, actor: Actor): Promise<void> {
    for (const t of await tx.resolveSlaTicketsFor(ref, now)) {
      await tx.audit(buildAuditEntry({
        actorType: actor.kind === 'admin' ? 'admin' : 'user', actorId: actor.userId, action: 'sla.resolved', title: 'SLA ticket resolved', category: 'b2b_sla', categoryId: t.id,
        data: { partnerId: t.partnerId, previousStatus: t.status, ...ref },
      }));
    }
  }

  // ═════════════════════════════ shared building blocks ═════════════════════════════

  /** Locks departures in id order (then each one's allotments) — the global lock order. */
  private async lockDepartures(tx: FinanceTx, ids: (string | null | undefined)[]): Promise<Map<string, LockedDeparturePair>> {
    const map = new Map<string, LockedDeparturePair>();
    for (const id of [...new Set(ids.filter((x): x is string => !!x))].sort()) map.set(id, await this.reloadDeparture(tx, id));
    return map;
  }

  /** Re-reads a departure we already hold the lock on (e.g. after seat counters changed in this tx). */
  private async reloadDeparture(tx: FinanceTx, id: string): Promise<LockedDeparturePair> {
    const dep = await tx.lockDeparture(id);
    if (!dep) throw new ApiError(404, 'Departure not found');
    return { dep, allotments: await tx.lockAllotments(dep.id) };
  }

  private async lockActivePartner(tx: FinanceTx, partnerId: string): Promise<LockedPartner> {
    const partner = await tx.lockPartner(partnerId);
    if (!partner) throw new ApiError(404, 'Partner not found');
    if (partner.status !== 'ACTIVE') throw new ApiError(403, 'Partner account is not active');
    return partner;
  }

  private async priceFor(tx: FinanceTx, partnerId: string, dep: LockedDeparture, pax: number, markup: { amount: Dec; mode: MarkupMode } | null, now: Date) {
    const [inputs, full] = await Promise.all([tx.findPricingInputs(partnerId, dep.packageId), tx.findDepartureFull(dep.id)]);
    if (!inputs.tier || !inputs.pkg || !full) throw new ApiError(404, 'Package or departure not found');
    const rate = resolveRate({
      tier: inputs.tier, pkg: inputs.pkg, priceGroups: inputs.priceGroups, contracts: inputs.contracts,
      departure: { departureDate: dep.departureDate, departureCost: new Dec(full.departureCost.toString()), cutoffHours: dep.cutoffHours, departureStatus: dep.departureStatus },
      travelDate: dep.departureDate, paxCount: pax, agentMarkup: markup, now,
    });
    return { rate, inputs };
  }

  private bookingData(a: {
    partnerId: string; dep: LockedDeparture; pkg: { duration: Prisma.Decimal; durationType: string }; rate: RateResult; pax: number;
    travellers: TravellerRow[]; status: 'CONFIRMED' | 'PENDING_APPROVAL'; method: FundingMethod; markup: Dec; pickupDetails?: string | null;
  }): Prisma.BookingUncheckedCreateInput {
    const lead = a.travellers.find((t) => t.isLead) ?? a.travellers[0];
    if (!lead) throw ApiError.badRequest('At least one traveller is required');
    return {
      packageId: a.dep.packageId,
      departureId: a.dep.id,
      startDate: a.dep.departureDate,
      endDate: endDateFor(a.dep.departureDate, a.pkg.duration, a.pkg.durationType),
      numberOfTraveller: a.pax,
      fullName: lead.fullName, email: lead.email, dateOfBirth: lead.dateOfBirth as Date | null, nationality: lead.nationality,
      countryCode: lead.countryCode, mobileNumber: lead.mobileNumber ?? null, pickupDetails: a.pickupDetails ?? null,
      paymentOptions: paymentOptionsCode(a.method),
      // totalPrice = what the agent's end client pays; the partner owes `netPayable`.
      totalPrice: a.rate.clientDisplayAmount,
      payablePercentage: 100,
      channel: 'B2B', b2bPartnerId: a.partnerId, b2bStatus: a.status,
      agentMarkup: a.markup, commissionAmount: a.rate.commissionAmount, netPayable: a.rate.netPayable,
      travellers: { create: a.travellers },
    };
  }

  /** Debits the booking's cost: wallet part as BOOKING_DEBIT, credit part as CREDIT_LINE_DRAW. */
  private async settle(
    tx: FinanceTx, partner: LockedPartner, plan: FundingPlan, ref: { type: 'BOOKING' | 'CUSTOM_BOOKING' | 'AMENDMENT'; id: string }, description: string, userId: string,
  ): Promise<{ partner: LockedPartner; entryIds: string[]; alerts: CreditAlertEvent[] }> {
    let p = partner;
    const entryIds: string[] = [];
    const alerts: CreditAlertEvent[] = [];
    if (plan.wallet.gt(0)) {
      const r = await this.ledger.post(tx, p, { account: 'WALLET', direction: 'DEBIT', entryType: 'BOOKING_DEBIT', amount: plan.wallet, referenceType: ref.type, referenceId: ref.id, description, createdById: userId });
      p = r.partner; if (r.entryId) entryIds.push(r.entryId); if (r.alert) alerts.push(r.alert);
    }
    if (plan.credit.gt(0)) {
      const r = await this.ledger.post(tx, p, { account: 'CREDIT', direction: 'DEBIT', entryType: 'CREDIT_LINE_DRAW', amount: plan.credit, referenceType: ref.type, referenceId: ref.id, description, createdById: userId });
      p = r.partner; if (r.entryId) entryIds.push(r.entryId); if (r.alert) alerts.push(r.alert);
    }
    return { partner: p, entryIds, alerts };
  }

  /** Returns money to wherever it came from (see allocateRefund). */
  private async refund(
    tx: FinanceTx, partner: LockedPartner, amount: Dec, settled: Settlement, ref: { type: 'BOOKING' | 'AMENDMENT'; id: string }, description: string, userId: string,
  ): Promise<{ partner: LockedPartner; wallet: Dec; credit: Dec; alerts: CreditAlertEvent[] }> {
    const split = allocateRefund(amount, settled, partner.creditUsed);
    let p = partner;
    const alerts: CreditAlertEvent[] = [];
    if (split.wallet.gt(0)) {
      const r = await this.ledger.post(tx, p, { account: 'WALLET', direction: 'CREDIT', entryType: 'REFUND_CREDIT', amount: split.wallet, referenceType: ref.type, referenceId: ref.id, description, createdById: userId });
      p = r.partner; if (r.alert) alerts.push(r.alert);
    }
    if (split.credit.gt(0)) {
      const r = await this.ledger.post(tx, p, { account: 'CREDIT', direction: 'CREDIT', entryType: 'REFUND_CREDIT', amount: split.credit, referenceType: ref.type, referenceId: ref.id, description, createdById: userId });
      p = r.partner; if (r.alert) alerts.push(r.alert);
    }
    return { partner: p, wallet: split.wallet, credit: split.credit, alerts };
  }

  /** Gives every seat a booking occupies back to inventory (live converted holds + any pending hold). */
  private async releaseBookingSeats(tx: FinanceTx, bookingId: string, now: Date): Promise<number> {
    let released = 0;
    for (const h of await tx.findLiveBookingHolds(bookingId)) {
      await tx.adjustSeatCounters(h.departureId, h.allotmentId, 0, -h.seatsHeld);
      await tx.markHoldSeatsReturned(h.id, now);
      released += h.seatsHeld;
    }
    const pending = await tx.findActiveHoldForBooking(bookingId);
    if (pending && (await tx.transitionHold(pending.id, 'RELEASED', now))) {
      await tx.adjustSeatCounters(pending.departureId, pending.allotmentId, -pending.seatsHeld, 0);
      released += pending.seatsHeld;
    }
    return released;
  }

  private audit(tx: FinanceTx, actor: Actor | { kind: 'system'; userId: string }, action: B2BAuditAction, title: string, bookingId: string, data: Prisma.InputJsonValue) {
    return tx.audit(buildAuditEntry({
      actorType: actor.kind === 'admin' ? 'admin' : actor.kind === 'partner' ? 'user' : 'system', actorId: actor.userId,
      action, title, category: 'b2b_booking', categoryId: bookingId, data,
    }));
  }

  // ═════════════════════════════ instant booking ═════════════════════════════

  async createInstant(partnerId: string, userId: string, dto: InstantBookingDtoType) {
    // Replay protection for the hold flow: confirming an already-converted hold returns that booking.
    let departureId = dto.departureId;
    if (dto.holdId) {
      const hold = await this.repository.findHoldForPartner(partnerId, dto.holdId);
      if (!hold) throw new ApiError(404, 'Hold not found');
      if (hold.status === 'CONVERTED' && hold.convertedBookingId) {
        return { ...(await this.getPartnerBooking(partnerId, hold.convertedBookingId)), replayed: true };
      }
      departureId = hold.departureId;
    }
    if (!departureId) throw ApiError.badRequest('departureId is required');

    const out = await this.repository.withTransaction(async (tx) => {
      const now = new Date();
      const locks = await this.lockDepartures(tx, [departureId]);
      const { dep, allotments } = locks.get(departureId) as LockedDeparturePair;
      const partner = await this.lockActivePartner(tx, partnerId);
      assertUsdSettlement(partner);

      let pax: number;
      let hold: Awaited<ReturnType<FinanceTx['findHoldById']>> = null;
      if (dto.holdId) {
        hold = await tx.findHoldById(dto.holdId);
        if (!hold || hold.partnerId !== partnerId) throw new ApiError(404, 'Hold not found');
        if (hold.status === 'CONVERTED' && hold.convertedBookingId) return { bookingId: hold.convertedBookingId, alerts: [] as CreditAlertEvent[], replay: true };
        if (hold.status !== 'ACTIVE') throw new ApiError(409, `Hold is ${hold.status.toLowerCase()}`);
        if (hold.expiresAt.getTime() <= now.getTime()) throw new ApiError(409, 'Hold has expired');
        pax = hold.seatsHeld;
      } else {
        pax = dto.paxCount as number;
      }
      if (dto.travellers.length !== pax) throw ApiError.badRequest(`Provide details for exactly ${pax} traveller(s)`);

      // Price is always computed here, never taken from the client.
      const markup = dto.agentMarkup ? { amount: dto.agentMarkup, mode: dto.agentMarkupMode } : null;
      const { rate, inputs } = await this.priceFor(tx, partnerId, dep, pax, markup, now);
      failOnPolicy(rate.reasons);

      let allotmentId: string | null = hold?.allotmentId ?? null;
      if (!hold) {
        const avail = computeAvailability(dep, allotments, partnerId, now);
        if (avail.available !== null && avail.available < pax) throw new ApiError(409, `Only ${avail.available} seat(s) available on this departure`);
        allotmentId = avail.allotmentId;
      }

      // Funding is validated BEFORE any write; an insufficient balance leaves seats and ledger untouched.
      const plan = planFunding(dto.fundingMethod, partner, rate.netPayable);

      const booking = await tx.createBooking(this.bookingData({
        partnerId, dep, pkg: inputs.pkg as NonNullable<typeof inputs.pkg>, rate, pax, travellers: toTravellerRows(dto.travellers), status: 'CONFIRMED',
        method: dto.fundingMethod, markup: rate.agentMarkup, pickupDetails: dto.pickupDetails,
      }));

      if (hold) {
        if (!(await tx.convertHold(hold.id, booking.id))) throw new ApiError(409, 'Hold is no longer active');
        await tx.adjustSeatCounters(dep.id, allotmentId, -pax, +pax);
      } else {
        await tx.createConvertedHold({ partnerId, departureId: dep.id, seatsHeld: pax, allotmentId, expiresAt: now, bookingId: booking.id });
        await tx.adjustSeatCounters(dep.id, allotmentId, 0, +pax);
      }

      const s = await this.settle(tx, partner, plan, { type: 'BOOKING', id: booking.id }, `${bookingRef(booking.bookingNumber)} booking`, userId);
      await tx.upsertInvoice(booking.id, {
        invoiceAmount: rate.netPayable, invoicePayType: paymentOptionsCode(dto.fundingMethod), invoiceStatus: 1,
        invoiceNote: `Settled from wallet ${plan.wallet.toString()} / credit ${plan.credit.toString()}`, transactionCode: `B2B-${s.entryIds[0] ?? booking.id}`,
      });
      await this.audit(tx, { kind: 'partner', partnerId, userId }, 'booking.instant_confirmed', 'B2B booking confirmed', booking.id, {
        partnerId, reference: bookingRef(booking.bookingNumber), departureId: dep.id, pax, netPayable: rate.netPayable.toString(),
        wallet: plan.wallet.toString(), credit: plan.credit.toString(), holdId: hold?.id ?? null, ledgerEntryIds: s.entryIds,
      });
      await tx.enqueueWebhookEvent(partnerId, 'booking.confirmed', this.eventData(booking, 'CONFIRMED'));
      return { bookingId: booking.id, alerts: s.alerts, replay: false };
    });

    this.webhooks.kick();
    await this.ledger.deliverCreditAlerts(out.alerts);
    const view = await this.getPartnerBooking(partnerId, out.bookingId);
    return out.replay ? { ...view, replayed: true } : view;
  }

  // ═════════════════════════════ on-request / custom ═════════════════════════════

  async createOnRequest(partnerId: string, userId: string, dto: OnRequestBookingDtoType) {
    return dto.kind === 'DEPARTURE' ? this.onRequestDeparture(partnerId, userId, dto) : this.onRequestCustom(partnerId, userId, dto);
  }

  private async onRequestDeparture(partnerId: string, userId: string, dto: Extract<OnRequestBookingDtoType, { kind: 'DEPARTURE' }>) {
    if (dto.travellers.length !== dto.paxCount) throw ApiError.badRequest(`Provide details for exactly ${dto.paxCount} traveller(s)`);

    const bookingId = await this.repository.withTransaction(async (tx) => {
      const now = new Date();
      const { dep, allotments } = (await this.lockDepartures(tx, [dto.departureId])).get(dto.departureId) as LockedDeparturePair;
      const partner = await this.lockActivePartner(tx, partnerId);
      assertUsdSettlement(partner);

      const markup = dto.agentMarkup ? { amount: dto.agentMarkup, mode: dto.agentMarkupMode } : null;
      const { rate, inputs } = await this.priceFor(tx, partnerId, dep, dto.paxCount, markup, now);
      // On-request may be tailored, so only hard contract/departure rules block it (cut-off still applies).
      failOnPolicy(rate.reasons);

      const booking = await tx.createBooking(this.bookingData({
        partnerId, dep, pkg: inputs.pkg as NonNullable<typeof inputs.pkg>, rate, pax: dto.paxCount, travellers: toTravellerRows(dto.travellers),
        status: 'PENDING_APPROVAL', method: dto.fundingMethod, markup: rate.agentMarkup, pickupDetails: [dto.pickupDetails, dto.specialRequirement && `Request: ${dto.specialRequirement}`].filter(Boolean).join(' | ') || null,
      }));

      // Best-effort seat hold while ops review; funds are NOT touched until approval.
      let held = false;
      const avail = computeAvailability(dep, allotments, partnerId, now);
      const holdEnds = now.getTime() + (inputs.tier?.slaResponseHours ?? 4) * 3_600_000;
      const expiresAt = new Date(rate.cutoffAt ? Math.min(holdEnds, rate.cutoffAt.getTime()) : holdEnds);
      if ((avail.available === null || avail.available >= dto.paxCount) && expiresAt.getTime() > now.getTime()) {
        const hold = await tx.createActiveHold({ partnerId, departureId: dep.id, seatsHeld: dto.paxCount, allotmentId: avail.allotmentId, expiresAt });
        await tx.linkHoldToBooking(hold.id, booking.id);
        await tx.adjustSeatCounters(dep.id, avail.allotmentId, +dto.paxCount, 0);
        held = true;
      }
      await this.audit(tx, { kind: 'partner', partnerId, userId }, 'booking.on_request_submitted', 'On-request booking submitted', booking.id, {
        partnerId, reference: bookingRef(booking.bookingNumber), departureId: dep.id, pax: dto.paxCount, netPayable: rate.netPayable.toString(), seatsHeld: held,
      });
      await this.openSla(tx, partnerId, { bookingId: booking.id }, `On-request booking ${bookingRef(booking.bookingNumber)}`, inputs.tier?.slaResponseHours ?? 4, now);
      return booking.id;
    });
    return this.getPartnerBooking(partnerId, bookingId);
  }

  private async onRequestCustom(partnerId: string, userId: string, dto: Extract<OnRequestBookingDtoType, { kind: 'CUSTOM' }>) {
    const id = await this.repository.withTransaction(async (tx) => {
      const now = new Date();
      await this.lockActivePartner(tx, partnerId);
      const inputs = await tx.findPricingInputs(partnerId, dto.packageId);
      if (!inputs.pkg) throw new ApiError(404, 'Package not found');
      const custom = await tx.createCustomBooking({
        packageId: dto.packageId, startDate: dto.startDate, endDate: dto.endDate ?? null, numberOfTraveller: dto.travellers.length,
        arrivalDate: dto.arrivalDate ?? null, arrivalFlightNo: dto.arrivalFlightNo ?? null, airportPickup: dto.airportPickup,
        departureDate: dto.departureDate ?? null, departureFlightNo: dto.departureFlightNo ?? null, airportDropoff: dto.airportDropoff,
        travelInsurance: dto.travelInsurance, specialRequirement: dto.specialRequirement ?? null,
        channel: 'B2B', b2bPartnerId: partnerId, b2bStatus: 'PENDING_APPROVAL', fundingMethod: paymentOptionsCode(dto.fundingMethod),
        travellers: {
          create: toTravellerRows(dto.travellers).map((t) => ({
            fullName: t.fullName, gender: t.gender ?? 'N/A', email: t.email, dateOfBirth: t.dateOfBirth, nationality: t.nationality,
            countryCode: t.countryCode, mobileNumber: t.mobileNumber, passportNo: t.passportNo, isLead: t.isLead,
          })),
        },
      });
      await this.audit(tx, { kind: 'partner', partnerId, userId }, 'booking.on_request_submitted', 'Custom booking submitted', custom.id, {
        partnerId, kind: 'CUSTOM', packageId: dto.packageId, pax: dto.travellers.length,
      });
      await this.openSla(tx, partnerId, { customBookingId: custom.id }, `Custom booking request (${dto.travellers.length} pax)`, inputs.tier?.slaResponseHours ?? 4, now);
      return custom.id;
    });
    return this.getPartnerBooking(partnerId, id);
  }

  // ═════════════════════════════ approve / reject (admin) ═════════════════════════════

  async approve(adminId: string, id: string, dto: ApproveBookingDtoType) {
    const pre = await this.repository.findBooking(id);
    const out = pre ? await this.approveBooking(adminId, pre, dto) : await this.approveCustom(adminId, id, dto);
    this.webhooks.kick();
    await this.ledger.deliverCreditAlerts(out.alerts);
    return this.getAdminBooking(id);
  }

  private async approveBooking(adminId: string, pre: NonNullable<Awaited<ReturnType<B2BFinanceRepository['findBooking']>>>, dto: ApproveBookingDtoType) {
    if (pre.channel !== 'B2B' || !pre.b2bPartnerId || !pre.departureId) throw new ApiError(409, 'Not a B2B departure booking');
    const partnerId = pre.b2bPartnerId;
    const departureId = pre.departureId;
    return this.repository.withTransaction(async (tx) => {
      const now = new Date();
      const { dep, allotments } = (await this.lockDepartures(tx, [departureId])).get(departureId) as LockedDeparturePair;
      const partner = await this.lockActivePartner(tx, partnerId);
      assertUsdSettlement(partner);
      await tx.lockBooking(pre.id);
      const booking = await tx.findBooking(pre.id);
      if (!booking || booking.b2bStatus !== 'PENDING_APPROVAL') throw new ApiError(409, 'Booking is not awaiting approval');
      const pax = booking.numberOfTraveller;
      const net = new Dec((booking.netPayable ?? ZERO).toString());

      // Seats: convert the review-time hold if it exists, otherwise take seats now (or fail cleanly).
      const hold = await tx.findActiveHoldForBooking(booking.id);
      if (hold) {
        if (!(await tx.convertHold(hold.id, booking.id))) throw new ApiError(409, 'Hold is no longer active');
        await tx.adjustSeatCounters(dep.id, hold.allotmentId, -hold.seatsHeld, +hold.seatsHeld);
      } else {
        const avail = computeAvailability(dep, allotments, partnerId, now);
        if (avail.available !== null && avail.available < pax) throw new ApiError(409, `No seats left: only ${avail.available} available`);
        await tx.createConvertedHold({ partnerId, departureId, seatsHeld: pax, allotmentId: avail.allotmentId, expiresAt: now, bookingId: booking.id });
        await tx.adjustSeatCounters(dep.id, avail.allotmentId, 0, +pax);
      }

      const method = dto.fundingMethod ?? fundingFromCode(booking.paymentOptions);
      const plan = planFunding(method, partner, net);
      const s = await this.settle(tx, partner, plan, { type: 'BOOKING', id: booking.id }, `${bookingRef(booking.bookingNumber)} approved`, adminId);
      await tx.upsertInvoice(booking.id, {
        invoiceAmount: net, invoicePayType: paymentOptionsCode(method), invoiceStatus: 1,
        invoiceNote: `Approved. Settled from wallet ${plan.wallet.toString()} / credit ${plan.credit.toString()}`, transactionCode: `B2B-${s.entryIds[0] ?? booking.id}`,
      });
      const confirmed = await tx.updateBooking(booking.id, { b2bStatus: 'CONFIRMED', paymentOptions: paymentOptionsCode(method), b2bStatusReason: dto.note ?? null });
      await this.closeSla(tx, { bookingId: booking.id }, now, { kind: 'admin', userId: adminId });
      // An approved on-request booking is both "approved" (ops decision) and "confirmed" (final state).
      await tx.enqueueWebhookEvent(partnerId, 'booking.approved', this.eventData(confirmed, 'CONFIRMED', { note: dto.note ?? null }));
      await tx.enqueueWebhookEvent(partnerId, 'booking.confirmed', this.eventData(confirmed, 'CONFIRMED'));
      await this.audit(tx, { kind: 'admin', userId: adminId }, 'booking.approved', 'On-request booking approved', booking.id, {
        partnerId, reference: bookingRef(booking.bookingNumber), netPayable: net.toString(), wallet: plan.wallet.toString(), credit: plan.credit.toString(), ledgerEntryIds: s.entryIds,
      });
      return { alerts: s.alerts };
    });
  }

  private async approveCustom(adminId: string, id: string, dto: ApproveBookingDtoType) {
    const pre = await this.repository.findCustomBooking(id);
    if (!pre || pre.channel !== 'B2B' || !pre.b2bPartnerId) throw new ApiError(404, 'Booking not found');
    if (!dto.netPayable) throw ApiError.badRequest('netPayable (the agreed net amount) is required to approve a custom booking');
    const partnerId = pre.b2bPartnerId;
    const net = dto.netPayable;
    return this.repository.withTransaction(async (tx) => {
      const partner = await this.lockActivePartner(tx, partnerId);
      assertUsdSettlement(partner);
      await tx.lockCustomBooking(id);
      const custom = await tx.findCustomBooking(id);
      if (!custom || custom.b2bStatus !== 'PENDING_APPROVAL') throw new ApiError(409, 'Custom booking is not awaiting approval');
      const method = dto.fundingMethod ?? fundingFromCode(custom.fundingMethod);
      const plan = planFunding(method, partner, net);
      const s = await this.settle(tx, partner, plan, { type: 'CUSTOM_BOOKING', id }, 'Custom booking approved', adminId);
      await tx.updateCustomBooking(id, { b2bStatus: 'CONFIRMED', netPayable: net, fundingMethod: paymentOptionsCode(method), b2bStatusReason: dto.note ?? null });
      await this.closeSla(tx, { customBookingId: id }, new Date(), { kind: 'admin', userId: adminId });
      const evt: Prisma.InputJsonObject = { customBookingId: id, kind: 'CUSTOM', status: 'CONFIRMED', netPayable: net.toString(), travellers: custom.numberOfTraveller };
      await tx.enqueueWebhookEvent(partnerId, 'booking.approved', evt);
      await tx.enqueueWebhookEvent(partnerId, 'booking.confirmed', evt);
      await this.audit(tx, { kind: 'admin', userId: adminId }, 'booking.approved', 'Custom booking approved', id, {
        partnerId, kind: 'CUSTOM', netPayable: net.toString(), wallet: plan.wallet.toString(), credit: plan.credit.toString(), ledgerEntryIds: s.entryIds,
      });
      return { alerts: s.alerts };
    });
  }

  async reject(adminId: string, id: string, dto: RejectBookingDtoType) {
    const pre = await this.repository.findBooking(id);
    await this.repository.withTransaction(async (tx) => {
      const now = new Date();
      if (pre) {
        if (pre.channel !== 'B2B') throw new ApiError(409, 'Not a B2B booking');
        await this.lockDepartures(tx, [pre.departureId]);
        await tx.lockBooking(id);
        const b = await tx.findBooking(id);
        if (!b || b.b2bStatus !== 'PENDING_APPROVAL') throw new ApiError(409, 'Booking is not awaiting approval');
        await this.releaseBookingSeats(tx, id, now);
        const rejected = await tx.updateBooking(id, { b2bStatus: 'CANCELLED', b2bStatusReason: dto.reason });
        await this.closeSla(tx, { bookingId: id }, now, { kind: 'admin', userId: adminId });
        await this.audit(tx, { kind: 'admin', userId: adminId }, 'booking.rejected', 'On-request booking rejected', id, { partnerId: pre.b2bPartnerId, reason: dto.reason });
        if (pre.b2bPartnerId) await tx.enqueueWebhookEvent(pre.b2bPartnerId, 'booking.rejected', this.eventData(rejected, 'CANCELLED', { reason: dto.reason }));
        return;
      }
      await tx.lockCustomBooking(id);
      const c = await tx.findCustomBooking(id);
      if (!c || c.channel !== 'B2B') throw new ApiError(404, 'Booking not found');
      if (c.b2bStatus !== 'PENDING_APPROVAL') throw new ApiError(409, 'Custom booking is not awaiting approval');
      await tx.updateCustomBooking(id, { b2bStatus: 'CANCELLED', b2bStatusReason: dto.reason });
      await this.closeSla(tx, { customBookingId: id }, now, { kind: 'admin', userId: adminId });
      await this.audit(tx, { kind: 'admin', userId: adminId }, 'booking.rejected', 'Custom booking rejected', id, { partnerId: c.b2bPartnerId, kind: 'CUSTOM', reason: dto.reason });
      if (c.b2bPartnerId) await tx.enqueueWebhookEvent(c.b2bPartnerId, 'booking.rejected', { customBookingId: id, kind: 'CUSTOM', status: 'CANCELLED', reason: dto.reason });
    });
    this.webhooks.kick();
    return this.getAdminBooking(id);
  }

  // ═════════════════════════════ cancellation ═════════════════════════════

  async cancel(actor: Actor, id: string, dto: CancelBookingDtoType | AdminCancelDtoType) {
    const pre = await this.repository.findBooking(id);
    if (!pre) return this.cancelCustom(actor, id, dto.reason);
    if (pre.channel !== 'B2B' || !pre.b2bPartnerId) throw new ApiError(404, 'Booking not found');
    if (actor.kind === 'partner' && pre.b2bPartnerId !== actor.partnerId) throw new ApiError(404, 'Booking not found'); // tenant isolation
    const partnerId = pre.b2bPartnerId;
    const override = 'penaltyAmount' in dto && actor.kind === 'admin' ? dto.penaltyAmount : undefined;

    const out = await this.repository.withTransaction(async (tx) => {
      const now = new Date();
      await this.lockDepartures(tx, [pre.departureId]);
      const partner = await tx.lockPartner(partnerId);
      if (!partner) throw new ApiError(404, 'Partner not found');
      if (actor.kind === 'partner' && partner.status !== 'ACTIVE') throw new ApiError(403, 'Partner account is not active');
      await tx.lockBooking(id);
      const b = await tx.findBooking(id);
      if (!b) throw new ApiError(404, 'Booking not found');
      if (b.b2bStatus === 'CANCELLED' || b.b2bStatus === 'EXPIRED') throw new ApiError(409, 'Booking is already cancelled');

      const reason = dto.reason ?? 'Cancelled';
      let refundInfo = { base: ZERO, penalty: ZERO, refund: ZERO, wallet: ZERO, credit: ZERO, penaltyPct: 0 };
      let alerts: CreditAlertEvent[] = [];

      if (b.b2bStatus === 'PENDING_APPROVAL') {
        await this.releaseBookingSeats(tx, id, now); // nothing was charged yet
      } else {
        const days = daysUntil(b.startDate, now);
        if (actor.kind === 'partner' && days < 0) throw new ApiError(409, 'The departure date has passed; contact support to cancel');
        const settled = summariseSettlement(await tx.findBookingLedger(id));
        const base = settled.wallet.plus(settled.credit);
        const pct = penaltyPctFor(days);
        const penalty = override ? override : round2(base.times(pct).dividedBy(100));
        if (penalty.gt(base)) throw ApiError.badRequest('Penalty cannot exceed the amount paid');
        const refundAmt = base.minus(penalty);
        const r = await this.refund(tx, partner, refundAmt, settled, { type: 'BOOKING', id }, `${bookingRef(b.bookingNumber)} cancelled`, actor.userId);
        alerts = r.alerts;
        refundInfo = { base, penalty, refund: refundAmt, wallet: r.wallet, credit: r.credit, penaltyPct: override ? -1 : pct };
        await this.releaseBookingSeats(tx, id, now);
        if (b.invoice) {
          await tx.upsertInvoice(id, { invoiceAmount: penalty, invoicePayType: b.invoice.invoicePayType, invoiceStatus: b.invoice.invoiceStatus, transactionCode: b.invoice.transactionCode, invoiceNote: `Cancelled. Refunded ${refundAmt.toString()}, retained ${penalty.toString()}` });
        }
      }
      // A pending amendment is moot once the booking is cancelled.
      const pendingAmendment = await tx.findPendingAmendment(id);
      if (pendingAmendment) await tx.resolveAmendment(pendingAmendment.id, { status: 'REJECTED', resolutionNote: 'Booking cancelled', resolvedAt: now, resolvedById: actor.userId });

      const cancelled = await tx.updateBooking(id, { b2bStatus: 'CANCELLED', b2bStatusReason: reason });
      await this.closeSla(tx, { bookingId: id }, now, actor);
      await tx.enqueueWebhookEvent(partnerId, 'booking.cancelled', this.eventData(cancelled, 'CANCELLED', {
        reason, cancelledBy: actor.kind, penalty: refundInfo.penalty.toString(), refund: refundInfo.refund.toString(),
      }));
      await this.audit(tx, actor, 'booking.cancelled', 'B2B booking cancelled', id, {
        partnerId, reference: bookingRef(b.bookingNumber), reason, paid: refundInfo.base.toString(), penalty: refundInfo.penalty.toString(), refund: refundInfo.refund.toString(),
        refundToWallet: refundInfo.wallet.toString(), refundToCredit: refundInfo.credit.toString(),
      });
      return { alerts, refundInfo };
    });
    this.webhooks.kick();
    await this.ledger.deliverCreditAlerts(out.alerts);
    const view = actor.kind === 'partner' ? await this.getPartnerBooking(actor.partnerId, id) : await this.getAdminBooking(id);
    return {
      ...view,
      cancellation: {
        amountPaid: out.refundInfo.base, penalty: out.refundInfo.penalty, refund: out.refundInfo.refund,
        refundedToWallet: out.refundInfo.wallet, refundedToCredit: out.refundInfo.credit,
        penaltyPct: out.refundInfo.penaltyPct >= 0 ? out.refundInfo.penaltyPct : null,
      },
    };
  }

  private async cancelCustom(actor: Actor, id: string, reason?: string) {
    const pre = await this.repository.findCustomBooking(id);
    if (!pre || pre.channel !== 'B2B' || !pre.b2bPartnerId) throw new ApiError(404, 'Booking not found');
    if (actor.kind === 'partner' && pre.b2bPartnerId !== actor.partnerId) throw new ApiError(404, 'Booking not found');
    await this.repository.withTransaction(async (tx) => {
      await tx.lockCustomBooking(id);
      const c = await tx.findCustomBooking(id);
      if (!c || c.b2bStatus !== 'PENDING_APPROVAL') throw new ApiError(409, 'Only a custom booking awaiting approval can be cancelled here; contact support');
      await tx.updateCustomBooking(id, { b2bStatus: 'CANCELLED', b2bStatusReason: reason ?? 'Cancelled' });
      await this.closeSla(tx, { customBookingId: id }, new Date(), actor);
      await this.audit(tx, actor, 'booking.cancelled', 'Custom booking cancelled', id, { partnerId: c.b2bPartnerId, kind: 'CUSTOM', reason: reason ?? null });
      if (c.b2bPartnerId) await tx.enqueueWebhookEvent(c.b2bPartnerId, 'booking.cancelled', { customBookingId: id, kind: 'CUSTOM', status: 'CANCELLED', reason: reason ?? null, cancelledBy: actor.kind });
    });
    this.webhooks.kick();
    return actor.kind === 'partner' ? this.getPartnerBooking(actor.partnerId, id) : this.getAdminBooking(id);
  }

  // ═════════════════════════════ amendments ═════════════════════════════

  async requestAmendment(partnerId: string, userId: string, id: string, dto: AmendBookingDtoType) {
    const pre = await this.repository.findBooking(id);
    if (!pre || pre.channel !== 'B2B' || pre.b2bPartnerId !== partnerId) throw new ApiError(404, 'Booking not found');

    await this.repository.withTransaction(async (tx) => {
      await this.lockActivePartner(tx, partnerId);
      await tx.lockBooking(id);
      const b = await tx.findBooking(id);
      if (!b || b.b2bStatus !== 'CONFIRMED') throw new ApiError(409, 'Only a confirmed booking can be amended (and not while another amendment is pending)');
      if (await tx.findPendingAmendment(id)) throw new ApiError(409, 'An amendment is already pending');

      const newPax = dto.changes.paxCount ?? b.numberOfTraveller;
      if (dto.changes.travellers && dto.changes.travellers.length !== newPax) throw ApiError.badRequest(`Provide details for exactly ${newPax} traveller(s)`);
      if (dto.changes.paxCount !== undefined && dto.changes.paxCount !== b.numberOfTraveller && !dto.changes.travellers && b.travellers.length !== newPax) {
        throw ApiError.badRequest('When changing the number of travellers, send the full updated traveller list');
      }
      if (dto.changes.departureId) {
        const target = await tx.findDepartureFull(dto.changes.departureId);
        if (!target || target.packageId !== b.packageId) throw new ApiError(404, 'Target departure not found for this package');
      }
      const payload: Prisma.InputJsonValue = {
        ...(dto.changes.paxCount !== undefined ? { paxCount: dto.changes.paxCount } : {}),
        ...(dto.changes.departureId ? { departureId: dto.changes.departureId } : {}),
        ...(dto.changes.travellers
          ? { travellers: dto.changes.travellers.map((t) => ({ ...t, dateOfBirth: t.dateOfBirth ? t.dateOfBirth.toISOString() : undefined })) }
          : {}),
      };
      const amendment = await tx.createAmendment({ bookingId: id, reason: dto.reason, payload, requestedById: userId });
      await tx.updateBooking(id, { b2bStatus: 'AMENDMENT_REQUESTED' });
      const tier = (await tx.findPricingInputs(partnerId, b.packageId ?? '')).tier;
      await this.openSla(tx, partnerId, { bookingId: id }, `Amendment request ${bookingRef(b.bookingNumber)}`, tier?.slaResponseHours ?? 4, new Date());
      await this.audit(tx, { kind: 'partner', partnerId, userId }, 'booking.amendment_requested', 'Amendment requested', id, {
        partnerId, amendmentId: amendment.id, reason: dto.reason, changes: Object.keys(dto.changes),
      });
    });
    return this.getPartnerBooking(partnerId, id);
  }

  async resolveAmendment(adminId: string, id: string, dto: ResolveAmendmentDtoType) {
    const pre = await this.repository.findBooking(id);
    if (!pre || pre.channel !== 'B2B' || !pre.b2bPartnerId || !pre.departureId) throw new ApiError(404, 'Booking not found');
    const partnerId = pre.b2bPartnerId;
    const pending = pre.amendments.find((a) => a.status === 'PENDING');
    if (!pending) throw new ApiError(409, 'No pending amendment on this booking');
    const payload = AmendmentPayload.parse(pending.payload);
    const newDepartureId = payload.departureId ?? pre.departureId;

    const out = await this.repository.withTransaction(async (tx) => {
      const now = new Date();
      const locks = await this.lockDepartures(tx, [pre.departureId, newDepartureId]);
      const partner = await tx.lockPartner(partnerId);
      if (!partner) throw new ApiError(404, 'Partner not found');
      await tx.lockBooking(id);
      const b = await tx.findBooking(id);
      const amendment = b?.amendments.find((a) => a.id === pending.id);
      if (!b || b.b2bStatus !== 'AMENDMENT_REQUESTED' || amendment?.status !== 'PENDING') throw new ApiError(409, 'Amendment is no longer pending');

      if (dto.action === 'REJECT') {
        await tx.resolveAmendment(pending.id, { status: 'REJECTED', resolutionNote: dto.note ?? null, resolvedAt: now, resolvedById: adminId });
        await tx.updateBooking(id, { b2bStatus: 'CONFIRMED' });
        await this.closeSla(tx, { bookingId: id }, now, { kind: 'admin', userId: adminId });
        await this.audit(tx, { kind: 'admin', userId: adminId }, 'booking.amendment_resolved', 'Amendment rejected', id, { partnerId, amendmentId: pending.id, outcome: 'REJECTED', note: dto.note ?? null });
        return { alerts: [] as CreditAlertEvent[], delta: ZERO };
      }

      assertUsdSettlement(partner);
      const oldNet = new Dec((b.netPayable ?? ZERO).toString());
      const newPax = payload.paxCount ?? b.numberOfTraveller;
      const seatsChange = newPax !== b.numberOfTraveller || newDepartureId !== b.departureId;

      let depPair = locks.get(newDepartureId) as LockedDeparturePair;
      let allotmentId: string | null = null;
      if (seatsChange) {
        // Release then re-take inside this transaction: if the new seats aren't available the whole amendment rolls back.
        await this.releaseBookingSeats(tx, id, now);
        depPair = await this.reloadDeparture(tx, newDepartureId);
        const avail = computeAvailability(depPair.dep, depPair.allotments, partnerId, now);
        if (avail.available !== null && avail.available < newPax) throw new ApiError(409, `Cannot amend: only ${avail.available} seat(s) available on the target departure`);
        allotmentId = avail.allotmentId;
      }

      const markup = { amount: new Dec((b.agentMarkup ?? ZERO).toString()), mode: 'TOTAL' as MarkupMode };
      const { rate, inputs } = await this.priceFor(tx, partnerId, depPair.dep, newPax, markup, now);
      failOnPolicy(rate.reasons, ['CUTOFF_PASSED']); // ops approval may override the booking cut-off
      const newNet = rate.netPayable;
      const delta = round2(newNet.minus(oldNet));

      let alerts: CreditAlertEvent[] = [];
      if (delta.gt(0)) {
        const plan = planFunding(fundingFromCode(b.paymentOptions), partner, delta);
        alerts = (await this.settle(tx, partner, plan, { type: 'AMENDMENT', id: pending.id }, `${bookingRef(b.bookingNumber)} amendment`, adminId)).alerts;
      } else if (delta.lt(0)) {
        const settled = summariseSettlement(await tx.findBookingLedger(id));
        alerts = (await this.refund(tx, partner, delta.negated(), settled, { type: 'AMENDMENT', id: pending.id }, `${bookingRef(b.bookingNumber)} amendment`, adminId)).alerts;
      }

      if (seatsChange) {
        await tx.createConvertedHold({ partnerId, departureId: newDepartureId, seatsHeld: newPax, allotmentId, expiresAt: now, bookingId: id });
        await tx.adjustSeatCounters(newDepartureId, allotmentId, 0, +newPax);
      }
      if (payload.travellers) await tx.replaceTravellers(id, toTravellerRows(payload.travellers));

      const pkg = inputs.pkg as NonNullable<typeof inputs.pkg>;
      await tx.updateBooking(id, {
        b2bStatus: 'CONFIRMED', numberOfTraveller: newPax, departureId: newDepartureId, startDate: depPair.dep.departureDate,
        endDate: endDateFor(depPair.dep.departureDate, pkg.duration, pkg.durationType),
        totalPrice: rate.grossAmount.plus(rate.agentMarkup), commissionAmount: rate.commissionAmount, netPayable: newNet,
      });
      if (b.invoice) {
        await tx.upsertInvoice(id, { invoiceAmount: newNet, invoicePayType: b.invoice.invoicePayType, invoiceStatus: b.invoice.invoiceStatus, transactionCode: b.invoice.transactionCode, invoiceNote: `Amended; price change ${delta.toString()}` });
      }
      await tx.resolveAmendment(pending.id, { status: 'APPROVED', priceDelta: delta, resolutionNote: dto.note ?? null, resolvedAt: now, resolvedById: adminId });
      await this.closeSla(tx, { bookingId: id }, now, { kind: 'admin', userId: adminId });
      await this.audit(tx, { kind: 'admin', userId: adminId }, 'booking.amendment_resolved', 'Amendment approved', id, {
        partnerId, amendmentId: pending.id, outcome: 'APPROVED', oldNet: oldNet.toString(), newNet: newNet.toString(), delta: delta.toString(), pax: newPax, departureId: newDepartureId,
      });
      return { alerts, delta };
    });
    await this.ledger.deliverCreditAlerts(out.alerts);
    return { ...(await this.getAdminBooking(id)), priceDelta: out.delta };
  }

  // ═════════════════════════════ reads ═════════════════════════════

  private async bookingView<T extends { id: string; bookingNumber: number }>(b: T) {
    const ledger = await this.repository.findBookingLedgerRead(b.id);
    return { kind: 'BOOKING' as const, ...b, reference: bookingRef(b.bookingNumber), settlement: summariseSettlement(ledger), ledger };
  }

  async getPartnerBooking(partnerId: string, id: string) {
    const b = await this.repository.findBooking(id);
    if (b && b.channel === 'B2B' && b.b2bPartnerId === partnerId) return this.bookingView(b);
    const c = await this.repository.findCustomBooking(id);
    if (c && c.channel === 'B2B' && c.b2bPartnerId === partnerId) return { kind: 'CUSTOM' as const, ...c };
    throw new ApiError(404, 'Booking not found'); // another tenant's id is indistinguishable from a missing one
  }

  async getAdminBooking(id: string) {
    const b = await this.repository.findBooking(id);
    if (b && b.channel === 'B2B') return this.bookingView(b);
    const c = await this.repository.findCustomBooking(id);
    if (c && c.channel === 'B2B') return { kind: 'CUSTOM' as const, ...c };
    throw new ApiError(404, 'Booking not found');
  }

  async listPartner(partnerId: string, dto: ListBookingsQueryDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    if (dto.kind === 'CUSTOM') {
      const where: Prisma.CustomBookingWhereInput = dto.status ? { b2bStatus: dto.status } : {};
      const { items, total } = await this.repository.listPartnerCustomBookings(partnerId, where, pagination.skip, pagination.take);
      return PaginationDto.create({ items: items.map((c) => ({ kind: 'CUSTOM' as const, ...c })), page: pagination.page, perPage: pagination.perPage, total });
    }
    const where: Prisma.BookingWhereInput = { ...(dto.status ? { b2bStatus: dto.status } : {}), ...(dto.q ? { OR: searchWhere(dto.q) } : {}) };
    const { items, total } = await this.repository.listPartnerBookings(partnerId, where, pagination.skip, pagination.take);
    return PaginationDto.create({ items: items.map((b) => ({ kind: 'BOOKING' as const, ...b, reference: bookingRef(b.bookingNumber) })), page: pagination.page, perPage: pagination.perPage, total });
  }

  async listAdmin(dto: ListBookingsQueryDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    if (dto.kind === 'CUSTOM') {
      const where: Prisma.CustomBookingWhereInput = { ...(dto.status ? { b2bStatus: dto.status } : {}), ...(dto.partnerId ? { b2bPartnerId: dto.partnerId } : {}) };
      const { items, total } = await this.repository.listAdminCustomBookings(where, pagination.skip, pagination.take);
      return PaginationDto.create({ items: items.map((c) => ({ kind: 'CUSTOM' as const, ...c })), page: pagination.page, perPage: pagination.perPage, total });
    }
    const where: Prisma.BookingWhereInput = {
      ...(dto.status ? { b2bStatus: dto.status } : {}), ...(dto.partnerId ? { b2bPartnerId: dto.partnerId } : {}), ...(dto.q ? { OR: searchWhere(dto.q) } : {}),
    };
    const { items, total } = await this.repository.listAdminBookings(where, pagination.skip, pagination.take);
    return PaginationDto.create({ items: items.map((b) => ({ kind: 'BOOKING' as const, ...b, reference: bookingRef(b.bookingNumber) })), page: pagination.page, perPage: pagination.perPage, total });
  }
}
