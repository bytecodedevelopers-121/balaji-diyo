export const WEBHOOK_EVENTS = [
  'booking.confirmed',
  'booking.approved',
  'booking.cancelled',
  'booking.rejected',
  'sla.escalated',
  'sla.breached',
] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

/** Sent only by the "send test event" action; always deliverable to the endpoint it targets. */
export const WEBHOOK_TEST_EVENT = 'webhook.test';
