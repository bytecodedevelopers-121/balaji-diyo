import { Prisma, SlaTicketStatus } from '@prisma/client';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { sendMail } from '../../lib/mail';
import { mailConfig } from '../../config/mail';
import { buildAuditEntry } from '../b2b-common/b2b-audit';
import { B2BFinanceRepository, FinanceTx } from '../b2b-finance/b2b-finance.repository';
import type { ListSlaQueryDtoType, UpdateSlaDtoType } from './dto';

const HOUR_MS = 3_600_000;
const SWEEP_LIMIT = 200;

/** A ticket is BREACHED once it is overdue by half its original response window (minimum one hour). */
export const breachAt = (t: { createdAt: Date; dueAt: Date }): Date =>
  new Date(t.dueAt.getTime() + Math.max(HOUR_MS, (t.dueAt.getTime() - t.createdAt.getTime()) * 0.5));

type TicketRow = NonNullable<Awaited<ReturnType<FinanceTx['findSlaTicket']>>>;

const eventData = (t: TicketRow, status: SlaTicketStatus): Prisma.InputJsonObject => ({
  ticketId: t.id, subject: t.subject, priority: t.priority, status, dueAt: t.dueAt.toISOString(), bookingId: t.bookingId, customBookingId: t.customBookingId,
});

export class B2BSlaService {
  constructor(
    private repository: B2BFinanceRepository,
    private webhooks: { kick(): void },
  ) {}

  /** Moves an overdue ticket to ESCALATED/BREACHED, auditing it and queuing the partner webhook — one transaction. */
  private async transition(tx: FinanceTx, t: TicketRow, to: 'ESCALATED' | 'BREACHED', now: Date, actor: { type: 'system' | 'admin'; id: string }): Promise<boolean> {
    if (!(await tx.transitionSlaTicket(t.id, t.status, { status: to, escalatedAt: t.escalatedAt ?? now }))) return false;
    const action = to === 'ESCALATED' ? 'sla.escalated' : 'sla.breached';
    await tx.audit(buildAuditEntry({
      actorType: actor.type, actorId: actor.id, action, title: to === 'ESCALATED' ? 'SLA ticket escalated' : 'SLA ticket breached', category: 'b2b_sla', categoryId: t.id,
      data: { partnerId: t.partnerId, subject: t.subject, from: t.status, dueAt: t.dueAt.toISOString() },
    }));
    await tx.enqueueWebhookEvent(t.partnerId, action, eventData(t, to));
    return true;
  }

  /** Periodic sweep. Idempotent and safe across processes: each change is a compare-and-set on the ticket's status. */
  async sweep(now = new Date()): Promise<{ escalated: number; breached: number }> {
    const result = { escalated: 0, breached: 0 };
    const changed: { subject: string; to: string; partnerId: string }[] = [];
    for (const c of await this.repository.findSlaSweepCandidates(now, SWEEP_LIMIT)) {
      const pastBreach = now.getTime() >= breachAt(c).getTime();
      const to = pastBreach ? 'BREACHED' : c.status === 'ESCALATED' ? null : 'ESCALATED';
      if (!to) continue;
      const moved = await this.repository.withTransaction(async (tx) => {
        const fresh = await tx.findSlaTicket(c.id);
        return fresh && fresh.status === c.status ? this.transition(tx, fresh, to, now, { type: 'system', id: 'sla-monitor' }) : false;
      });
      if (!moved) continue;
      if (to === 'ESCALATED') result.escalated += 1; else result.breached += 1;
      changed.push({ subject: c.subject, to, partnerId: c.partnerId });
    }
    if (changed.length > 0) {
      this.webhooks.kick();
      if (mailConfig.adminEmail) {
        const rows = changed.map((c) => `<li>${c.to}: ${c.subject}</li>`).join('');
        void sendMail({ to: mailConfig.adminEmail, subject: `B2B SLA: ${changed.length} ticket(s) need attention`, html: `<ul>${rows}</ul>` });
      }
    }
    return result;
  }

  // ── reads ─────────────────────────────────────────────────────────────────
  private where(dto: ListSlaQueryDtoType, partnerId?: string): Prisma.B2BSlaTicketWhereInput {
    return {
      ...(partnerId ? { partnerId } : dto.partnerId ? { partnerId: dto.partnerId } : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.priority ? { priority: dto.priority } : {}),
      ...(dto.overdue ? { dueAt: { lte: new Date() }, status: dto.status ?? { not: 'RESOLVED' } } : {}),
    };
  }

  private async withReferences<T extends { bookingId: string | null; customBookingId: string | null }>(items: T[]) {
    const ids = items.flatMap((i) => (i.bookingId ? [i.bookingId] : []));
    const customIds = items.flatMap((i) => (i.customBookingId ? [i.customBookingId] : []));
    const refs = await this.repository.findBookingRefs(ids, customIds);
    return items.map((i) => ({ ...i, reference: i.bookingId ? (refs.bookings.get(i.bookingId) ?? null) : i.customBookingId ? `CUSTOM-${i.customBookingId.slice(-6).toUpperCase()}` : null }));
  }

  async listForPartner(partnerId: string, dto: ListSlaQueryDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const { items, total } = await this.repository.listSlaTickets(this.where(dto, partnerId), pagination.skip, pagination.take);
    // `notes` are internal to the operations team and never shown to partners.
    const visible = items.map(({ notes: _notes, partner: _partner, ...t }) => t);
    return PaginationDto.create({ items: await this.withReferences(visible), page: pagination.page, perPage: pagination.perPage, total });
  }

  async listForAdmin(dto: ListSlaQueryDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const { items, total } = await this.repository.listSlaTickets(this.where(dto), pagination.skip, pagination.take);
    return PaginationDto.create({ items: await this.withReferences(items), page: pagination.page, perPage: pagination.perPage, total });
  }

  // ── admin update ──────────────────────────────────────────────────────────
  async adminUpdate(adminId: string, id: string, dto: UpdateSlaDtoType) {
    const now = new Date();
    await this.repository.withTransaction(async (tx) => {
      const t = await tx.findSlaTicket(id);
      if (!t) throw new ApiError(404, 'SLA ticket not found');
      if (t.status === 'RESOLVED' && (dto.status || dto.priority || dto.dueAt)) throw new ApiError(409, 'A resolved ticket can only receive notes');

      const nextDue = dto.dueAt ?? t.dueAt;
      let escalate = false;
      const data: Prisma.B2BSlaTicketUncheckedUpdateManyInput = {};
      if (dto.priority) data.priority = dto.priority;
      if (dto.notes !== undefined) data.notes = dto.notes;
      if (dto.dueAt) data.dueAt = dto.dueAt;

      if (dto.status === 'IN_PROGRESS') {
        if (t.status !== 'OPEN' && t.status !== 'ESCALATED') throw new ApiError(409, `Cannot move a ${t.status} ticket to IN_PROGRESS`);
        // Otherwise the next sweep would escalate it straight back.
        if (nextDue.getTime() <= now.getTime()) throw new ApiError(409, 'Extend dueAt into the future when moving an overdue ticket to IN_PROGRESS');
        data.status = 'IN_PROGRESS';
      } else if (dto.status === 'RESOLVED') {
        data.status = 'RESOLVED';
        data.resolvedAt = now;
      } else if (dto.status === 'ESCALATED') {
        if (t.status !== 'OPEN' && t.status !== 'IN_PROGRESS') throw new ApiError(409, `A ${t.status} ticket cannot be escalated`);
        escalate = true;
      }

      if (Object.keys(data).length > 0 && !(await tx.transitionSlaTicket(id, t.status, data))) throw new ApiError(409, 'Ticket changed concurrently; reload and retry');
      const fresh = (await tx.findSlaTicket(id)) as TicketRow;
      if (escalate && !(await this.transition(tx, fresh, 'ESCALATED', now, { type: 'admin', id: adminId }))) throw new ApiError(409, 'Ticket changed concurrently; reload and retry');
      await tx.audit(buildAuditEntry({
        actorType: 'admin', actorId: adminId, action: 'sla.updated', title: 'SLA ticket updated', category: 'b2b_sla', categoryId: id,
        data: { partnerId: t.partnerId, from: t.status, changed: Object.keys(dto).join(','), ...(dto.status ? { to: dto.status } : {}) },
      }));
    });
    this.webhooks.kick();
    const { items } = await this.repository.listSlaTickets({ id }, 0, 1);
    const [ticket] = await this.withReferences(items);
    return ticket;
  }
}
