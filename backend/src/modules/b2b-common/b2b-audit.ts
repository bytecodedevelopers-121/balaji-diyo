import { Prisma } from '@prisma/client';

export type B2BAuditAction =
  | 'partner.registered'
  | 'partner.kyc_uploaded'
  | 'partner.kyc_resubmitted'
  | 'partner.kyc_document_verified'
  | 'partner.kyc_document_rejected'
  | 'partner.status_changed'
  | 'partner.tier_assigned'
  | 'partner.credit_updated'
  | 'team.member_invited'
  | 'team.member_updated'
  | 'tier.created'
  | 'tier.updated'
  | 'contract.created'
  | 'contract.updated'
  | 'allotment.upserted'
  | 'departure.capacity_updated'
  | 'hold.created'
  | 'hold.released'
  | 'hold.expired'
  | 'booking.instant_confirmed'
  | 'booking.on_request_submitted'
  | 'booking.approved'
  | 'booking.rejected'
  | 'booking.cancelled'
  | 'booking.amendment_requested'
  | 'booking.amendment_resolved'
  | 'wallet.topup_initiated'
  | 'wallet.topup_credited'
  | 'ledger.adjustment'
  | 'ledger.credit_limit_updated'
  | 'credit.alert_raised'
  | 'credit.alert_reset'
  | 'sla.created'
  | 'sla.resolved'
  | 'sla.escalated'
  | 'sla.breached'
  | 'sla.updated'
  | 'settlement.recorded'
  | 'apikey.created'
  | 'apikey.rotated'
  | 'apikey.revoked'
  | 'webhook.created'
  | 'webhook.updated'
  | 'webhook.deleted'
  | 'webhook.secret_rotated';

interface AuditInput {
  // 'admin' = internal staff (ActivityLogService resolves these to actor names), 'user' = partner user.
  actorType: 'admin' | 'user' | 'system';
  actorId: string;
  action: B2BAuditAction;
  title: string;
  categoryId: string; // partner / tier id the entry is about
  category: 'b2b_partner' | 'b2b_tier' | 'b2b_contract' | 'b2b_allotment' | 'b2b_departure' | 'b2b_booking' | 'b2b_ledger' | 'b2b_payment' | 'b2b_sla' | 'b2b_integration';
  data?: Prisma.InputJsonValue;
}

/** Builds an ActivityLog row; repositories write it inside the same transaction as the change it records. */
export const buildAuditEntry = (a: AuditInput): Prisma.ActivityLogUncheckedCreateInput => ({
  loggerType: a.actorType,
  loggerId: a.actorId,
  primaryAction: a.action,
  actionTitle: a.title,
  actionKey: a.action,
  actionCategory: a.category,
  actionCategoryKey: a.category,
  actionCategoryId: a.categoryId,
  ...(a.data !== undefined ? { actionData: a.data } : {}),
});
