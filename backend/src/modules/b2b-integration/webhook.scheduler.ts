import cron from 'node-cron';
import type { WebhookDispatcher } from './webhook-dispatcher';

/**
 * Picks up deliveries that are due for (re)try — the immediate send after a booking commit is
 * `dispatcher.kick()`; this covers retries and anything left behind by a restart. Every 5 seconds;
 * the due-row query is index-backed and the dispatcher coalesces overlapping runs.
 */
export function startWebhookScheduler(dispatcher: WebhookDispatcher, onError: (err: unknown) => void): void {
  cron.schedule('*/5 * * * * *', () => void dispatcher.processDue().catch(onError));
  dispatcher.kick();
}
