import { Prisma, PrismaClient } from '@prisma/client';

const keySelect = { id: true, name: true, keyPrefix: true, rateLimitRpm: true, isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true } as const satisfies Prisma.B2BApiKeySelect;

// `secret` is deliberately absent from every client-facing select.
const endpointSelect = { id: true, url: true, events: true, isActive: true, createdAt: true, updatedAt: true } as const satisfies Prisma.B2BWebhookEndpointSelect;
const deliverySelect = { id: true, eventType: true, status: true, attemptCount: true, maxAttempts: true, nextRetryAt: true, lastResponseCode: true, lastError: true, deliveredAt: true, createdAt: true } as const satisfies Prisma.B2BWebhookDeliverySelect;

export interface ClaimedDelivery { id: string; endpointId: string; eventType: string; payload: Prisma.JsonValue; attemptCount: number; maxAttempts: number }

export class B2BIntegrationRepository {
  constructor(private prisma: PrismaClient) {}

  writeAudit(entry: Prisma.ActivityLogUncheckedCreateInput) {
    return this.prisma.activityLog.create({ data: entry, select: { id: true } });
  }

  // ── API keys ────────────────────────────────────────────────────────────
  countActiveKeys(partnerId: string) {
    return this.prisma.b2BApiKey.count({ where: { partnerId, isActive: true } });
  }

  createKey(data: Prisma.B2BApiKeyUncheckedCreateInput) {
    return this.prisma.b2BApiKey.create({ data, select: keySelect });
  }

  listKeys(partnerId: string) {
    return this.prisma.b2BApiKey.findMany({ where: { partnerId }, select: keySelect, orderBy: { createdAt: 'desc' } });
  }

  findKey(partnerId: string, id: string) {
    return this.prisma.b2BApiKey.findFirst({ where: { id, partnerId }, select: keySelect });
  }

  async revokeKey(partnerId: string, id: string): Promise<boolean> {
    const { count } = await this.prisma.b2BApiKey.updateMany({ where: { id, partnerId, isActive: true }, data: { isActive: false } });
    return count === 1;
  }

  /** Revoke + replace atomically, so there is never a moment with neither or both usable. */
  rotateKey(partnerId: string, id: string, replacement: Prisma.B2BApiKeyUncheckedCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.b2BApiKey.updateMany({ where: { id, partnerId, isActive: true }, data: { isActive: false } });
      if (count !== 1) return null;
      return tx.b2BApiKey.create({ data: replacement, select: keySelect });
    });
  }

  findKeyByHash(keyHash: string) {
    return this.prisma.b2BApiKey.findUnique({
      where: { keyHash },
      select: { id: true, partnerId: true, keyHash: true, keyPrefix: true, rateLimitRpm: true, isActive: true, expiresAt: true, lastUsedAt: true, partner: { select: { status: true, deletedAt: true } } },
    });
  }

  async touchKey(id: string, at: Date): Promise<void> {
    await this.prisma.b2BApiKey.update({ where: { id }, data: { lastUsedAt: at }, select: { id: true } });
  }

  // ── webhook endpoints ───────────────────────────────────────────────────
  countEndpoints(partnerId: string) {
    return this.prisma.b2BWebhookEndpoint.count({ where: { partnerId } });
  }

  createEndpoint(data: Prisma.B2BWebhookEndpointUncheckedCreateInput) {
    return this.prisma.b2BWebhookEndpoint.create({ data, select: endpointSelect });
  }

  listEndpoints(partnerId: string) {
    return this.prisma.b2BWebhookEndpoint.findMany({
      where: { partnerId },
      select: { ...endpointSelect, deliveries: { select: deliverySelect, orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findEndpoint(partnerId: string, id: string) {
    return this.prisma.b2BWebhookEndpoint.findFirst({ where: { id, partnerId }, select: endpointSelect });
  }

  updateEndpoint(id: string, data: Prisma.B2BWebhookEndpointUpdateInput) {
    return this.prisma.b2BWebhookEndpoint.update({ where: { id }, data, select: endpointSelect });
  }

  deleteEndpoint(id: string) {
    return this.prisma.b2BWebhookEndpoint.delete({ where: { id }, select: { id: true } });
  }

  async listDeliveries(endpointId: string, status: string | undefined, skip: number, take: number) {
    const where: Prisma.B2BWebhookDeliveryWhereInput = { endpointId, ...(status ? { status } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.b2BWebhookDelivery.findMany({ where, select: deliverySelect, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.b2BWebhookDelivery.count({ where }),
    ]);
    return { items, total };
  }

  enqueueDelivery(data: { id: string; endpointId: string; partnerId: string; eventType: string; payload: Prisma.InputJsonObject }) {
    return this.prisma.b2BWebhookDelivery.create({ data, select: { id: true } });
  }

  // ── dispatcher ──────────────────────────────────────────────────────────
  /**
   * Atomically leases due deliveries: SKIP LOCKED lets several workers/instances pull disjoint rows, and
   * pushing nextRetryAt out by `leaseSeconds` means a crashed worker's rows simply become due again.
   */
  claimDue(limit: number, leaseSeconds: number): Promise<ClaimedDelivery[]> {
    return this.prisma.$queryRaw<ClaimedDelivery[]>`
      UPDATE b2b_webhook_deliveries d
      SET "nextRetryAt" = now() + (${leaseSeconds}::int * interval '1 second'), "updatedAt" = now()
      WHERE d.id IN (
        SELECT id FROM b2b_webhook_deliveries
        WHERE status = 'PENDING' AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= now())
        ORDER BY "createdAt" LIMIT ${limit} FOR UPDATE SKIP LOCKED
      )
      RETURNING d.id, d."endpointId", d."eventType", d.payload, d."attemptCount", d."maxAttempts"`;
  }

  findEndpointForDelivery(id: string) {
    return this.prisma.b2BWebhookEndpoint.findUnique({ where: { id }, select: { id: true, url: true, secret: true, isActive: true } });
  }

  async recordAttempt(
    id: string,
    r: { status: 'PENDING' | 'DELIVERED' | 'FAILED'; attemptCount: number; responseCode: number | null; error: string | null; nextRetryAt: Date | null; deliveredAt: Date | null },
  ): Promise<void> {
    await this.prisma.b2BWebhookDelivery.update({
      where: { id },
      data: { status: r.status, attemptCount: r.attemptCount, lastResponseCode: r.responseCode, lastError: r.error, nextRetryAt: r.nextRetryAt, deliveredAt: r.deliveredAt },
      select: { id: true },
    });
  }
}
