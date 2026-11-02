// PACO payment gateway (2c2p JOSE-secured API — see paco.crypto.ts/paco.client.ts
// for the mechanics). All credentials are optional: without them the module
// degrades to a clear 503 "not configured" response instead of crashing, same
// pattern as googleAnalytics.ts. No live PACO credentials exist yet — this
// wires the shape so real ones can be dropped into .env later without any
// code changes.
export type PacoCurrency = 'USD' | 'NPR';

export interface PacoConfig {
  enabled: boolean;
  apiBaseUrl: string;
  merchantId: string;
  accessToken: string;
  encryptionKeyId: string;
  merchantSigningPrivateKey: string;
  merchantDecryptionPrivateKey: string;
  encryptionPublicKey: string;
  signingPublicKey: string;
  publicSiteUrl: string;
  // Default currency PACO charges in; prices stay USD and are converted when 'NPR'.
  chargeCurrency: PacoCurrency;
}

export const pacoConfig: PacoConfig = {
  enabled: process.env.PACO_ENABLED === 'true',
  apiBaseUrl: process.env.PACO_API_BASE_URL || 'https://core.paco.2c2p.com/',
  merchantId: process.env.PACO_MERCHANT_ID ?? '',
  accessToken: process.env.PACO_ACCESS_TOKEN ?? '',
  encryptionKeyId: process.env.PACO_ENCRYPTION_KEY_ID ?? '',
  merchantSigningPrivateKey: process.env.PACO_MERCHANT_SIGNING_PRIVATE_KEY ?? '',
  merchantDecryptionPrivateKey: process.env.PACO_MERCHANT_DECRYPTION_PRIVATE_KEY ?? '',
  encryptionPublicKey: process.env.PACO_ENCRYPTION_PUBLIC_KEY ?? '',
  signingPublicKey: process.env.PACO_SIGNING_PUBLIC_KEY ?? '',
  publicSiteUrl: process.env.PUBLIC_SITE_URL || 'http://localhost:3000',
  chargeCurrency: process.env.PACO_CHARGE_CURRENCY === 'NPR' ? 'NPR' : 'USD',
};

export const isPacoConfigured = Boolean(
  pacoConfig.enabled &&
    pacoConfig.merchantId &&
    pacoConfig.accessToken &&
    pacoConfig.encryptionKeyId &&
    pacoConfig.merchantSigningPrivateKey &&
    pacoConfig.merchantDecryptionPrivateKey &&
    pacoConfig.encryptionPublicKey &&
    pacoConfig.signingPublicKey,
);

// NPR charges reuse the USD credential set by default (same access token);
// set any PACO_NPR_* var to override it for NPR only.
const nprConfig: PacoConfig = {
  ...pacoConfig,
  merchantId: process.env.PACO_NPR_MERCHANT_ID || pacoConfig.merchantId,
  accessToken: process.env.PACO_NPR_ACCESS_TOKEN || pacoConfig.accessToken,
  encryptionKeyId: process.env.PACO_NPR_ENCRYPTION_KEY_ID || pacoConfig.encryptionKeyId,
  merchantSigningPrivateKey: process.env.PACO_NPR_MERCHANT_SIGNING_PRIVATE_KEY || pacoConfig.merchantSigningPrivateKey,
  merchantDecryptionPrivateKey:
    process.env.PACO_NPR_MERCHANT_DECRYPTION_PRIVATE_KEY || pacoConfig.merchantDecryptionPrivateKey,
  encryptionPublicKey: process.env.PACO_NPR_ENCRYPTION_PUBLIC_KEY || pacoConfig.encryptionPublicKey,
  signingPublicKey: process.env.PACO_NPR_SIGNING_PUBLIC_KEY || pacoConfig.signingPublicKey,
};

export function pacoConfigFor(currency: PacoCurrency): PacoConfig {
  return currency === 'NPR' ? nprConfig : pacoConfig;
}

export function isPacoConfiguredFor(currency: PacoCurrency): boolean {
  const c = pacoConfigFor(currency);
  return Boolean(
    c.enabled &&
      c.merchantId &&
      c.accessToken &&
      c.encryptionKeyId &&
      c.merchantSigningPrivateKey &&
      c.merchantDecryptionPrivateKey &&
      c.encryptionPublicKey &&
      c.signingPublicKey,
  );
}
