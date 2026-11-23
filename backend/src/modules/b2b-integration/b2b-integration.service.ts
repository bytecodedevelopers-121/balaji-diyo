import { randomBytes } from 'crypto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { buildAuditEntry, type B2BAuditAction } from '../b2b-common/b2b-audit';
import { B2BIntegrationRepository } from './b2b-integration.repository';
import { API_KEY_PREFIX, hashApiKey } from './api-key.guard';
import type { SlidingWindowLimiter } from './rate-window';
import { WebhookDispatcher } from './webhook-dispatcher';
import { encryptSecret } from './secret-crypto';
import { webhookUrlProblem } from './safe-http';
import { WEBHOOK_TEST_EVENT } from './webhook.events';
import type { CreateApiKeyDtoType, CreateWebhookDtoType, DeliveriesQueryDtoType, UpdateWebhookDtoType } from './dto';

const MAX_ACTIVE_KEYS = 10;
const MAX_ENDPOINTS = 5;
const ONCE = 'Copy this now — it is shown only once and cannot be retrieved later.';

const newToken = (): string => `${API_KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
const newSecret = (): string => `whsec_${randomBytes(24).toString('base64url')}`;

export class B2BIntegrationService {
  constructor(
    private repository: B2BIntegrationRepository,
    private dispatcher: WebhookDispatcher,
    private limiter: SlidingWindowLimiter,
  ) {}

  private audit(userId: string, partnerId: string, action: B2BAuditAction, title: string, data: Record<string, string | number | boolean | null>) {
    return this.repository.writeAudit(buildAuditEntry({ actorType: 'user', actorId: userId, action, title, category: 'b2b_integration', categoryId: partnerId, data }));
  }

  // ── API keys ──────────────────────────────────────────────────────────────
  listKeys(partnerId: string) {
    return this.repository.listKeys(partnerId);
  }

  async createKey(partnerId: string, userId: string, dto: CreateApiKeyDtoType) {
    if ((await this.repository.countActiveKeys(partnerId)) >= MAX_ACTIVE_KEYS) throw new ApiError(409, `At most ${MAX_ACTIVE_KEYS} active API keys; revoke one first`);
    const token = newToken();
    const key = await this.repository.createKey({
      partnerId, name: dto.name, keyPrefix: token.slice(0, API_KEY_PREFIX.length + 8), keyHash: hashApiKey(token), rateLimitRpm: dto.rateLimitRpm, expiresAt: dto.expiresAt ?? null,
    });
    await this.audit(userId, partnerId, 'apikey.created', 'API key created', { keyId: key.id, name: dto.name, rateLimitRpm: dto.rateLimitRpm });
    return { key, token, notice: ONCE };
  }

  async revokeKey(partnerId: string, userId: string, id: string) {
    if (!(await this.repository.findKey(partnerId, id))) throw new ApiError(404, 'API key not found'); // foreign ids look missing
    if (!(await this.repository.revokeKey(partnerId, id))) throw new ApiError(409, 'API key is already revoked');
    this.limiter.forget(id);
    await this.audit(userId, partnerId, 'apikey.revoked', 'API key revoked', { keyId: id });
    return this.repository.findKey(partnerId, id);
  }

  /** Replaces a key with a fresh one (same name/limits) and revokes the old one in one step. */
  async rotateKey(partnerId: string, userId: string, id: string) {
    const old = await this.repository.findKey(partnerId, id);
    if (!old) throw new ApiError(404, 'API key not found');
    const token = newToken();
    const key = await this.repository.rotateKey(partnerId, id, {
      partnerId, name: old.name, keyPrefix: token.slice(0, API_KEY_PREFIX.length + 8), keyHash: hashApiKey(token), rateLimitRpm: old.rateLimitRpm, expiresAt: old.expiresAt,
    });
    if (!key) throw new ApiError(409, 'Only an active key can be rotated');
    this.limiter.forget(id);
    await this.audit(userId, partnerId, 'apikey.rotated', 'API key rotated', { oldKeyId: id, newKeyId: key.id });
    return { key, token, notice: ONCE };
  }

  // ── webhooks ──────────────────────────────────────────────────────────────
  listWebhooks(partnerId: string) {
    return this.repository.listEndpoints(partnerId);
  }

  private assertUrl(url: string): void {
    const problem = webhookUrlProblem(url);
    if (problem) throw ApiError.badRequest(problem);
  }

  async createWebhook(partnerId: string, userId: string, dto: CreateWebhookDtoType) {
    this.assertUrl(dto.url);
    if ((await this.repository.countEndpoints(partnerId)) >= MAX_ENDPOINTS) throw new ApiError(409, `At most ${MAX_ENDPOINTS} webhook endpoints`);
    const secret = newSecret();
    const endpoint = await this.repository.createEndpoint({ partnerId, url: dto.url, secret: encryptSecret(secret), events: dto.events, isActive: dto.isActive });
    await this.audit(userId, partnerId, 'webhook.created', 'Webhook endpoint created', { endpointId: endpoint.id, url: dto.url });
    return { endpoint, secret, notice: ONCE };
  }

  private async ownedEndpoint(partnerId: string, id: string) {
    const e = await this.repository.findEndpoint(partnerId, id);
    if (!e) throw new ApiError(404, 'Webhook endpoint not found');
    return e;
  }

  async updateWebhook(partnerId: string, userId: string, id: string, dto: UpdateWebhookDtoType) {
    await this.ownedEndpoint(partnerId, id);
    if (dto.url) this.assertUrl(dto.url);
    const updated = await this.repository.updateEndpoint(id, { ...(dto.url ? { url: dto.url } : {}), ...(dto.events ? { events: dto.events } : {}), ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}) });
    await this.audit(userId, partnerId, 'webhook.updated', 'Webhook endpoint updated', { endpointId: id, changed: Object.keys(dto).join(',') });
    return updated;
  }

  async deleteWebhook(partnerId: string, userId: string, id: string) {
    await this.ownedEndpoint(partnerId, id);
    await this.repository.deleteEndpoint(id);
    await this.audit(userId, partnerId, 'webhook.deleted', 'Webhook endpoint deleted', { endpointId: id });
  }

  async rotateWebhookSecret(partnerId: string, userId: string, id: string) {
    const endpoint = await this.ownedEndpoint(partnerId, id);
    const secret = newSecret();
    await this.repository.updateEndpoint(id, { secret: encryptSecret(secret) });
    await this.audit(userId, partnerId, 'webhook.secret_rotated', 'Webhook signing secret rotated', { endpointId: id });
    return { endpoint, secret, notice: ONCE };
  }

  /** Queues a signed `webhook.test` event to this one endpoint so integrators can verify their receiver. */
  async sendTest(partnerId: string, id: string) {
    await this.ownedEndpoint(partnerId, id);
    const eventId = WebhookDispatcher.newEventId();
    await this.repository.enqueueDelivery({
      id: eventId, endpointId: id, partnerId, eventType: WEBHOOK_TEST_EVENT,
      payload: { id: eventId, type: WEBHOOK_TEST_EVENT, createdAt: new Date().toISOString(), data: { message: 'Test event from Joyful Trekking B2B' } },
    });
    this.dispatcher.kick();
    return { deliveryId: eventId };
  }

  async listDeliveries(partnerId: string, id: string, dto: DeliveriesQueryDtoType) {
    await this.ownedEndpoint(partnerId, id);
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const { items, total } = await this.repository.listDeliveries(id, dto.status, pagination.skip, pagination.take);
    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }
}
