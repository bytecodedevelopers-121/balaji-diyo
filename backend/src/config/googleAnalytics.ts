import { BetaAnalyticsDataClient } from '@google-analytics/data';

// GA4_SERVICE_ACCOUNT_KEY holds the full service-account JSON (as a string) —
// simpler to deploy than shipping a key file. Both are optional: the
// analytics module degrades to an empty "not configured" response instead
// of crashing the app when they're absent.
const propertyId = process.env.GA4_PROPERTY_ID;
const serviceAccountKey = process.env.GA4_SERVICE_ACCOUNT_KEY;

export const GA4_PROPERTY_ID = propertyId;
export const isAnalyticsConfigured = Boolean(propertyId && serviceAccountKey);

let client: BetaAnalyticsDataClient | null = null;

export function getAnalyticsClient(): BetaAnalyticsDataClient {
  if (!serviceAccountKey) {
    throw new Error('GA4_SERVICE_ACCOUNT_KEY is not configured');
  }

  if (!client) {
    client = new BetaAnalyticsDataClient({
      credentials: JSON.parse(serviceAccountKey),
    });
  }

  return client;
}
