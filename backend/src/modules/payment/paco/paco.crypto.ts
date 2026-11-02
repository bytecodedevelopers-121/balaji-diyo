import { createPrivateKey, createPublicKey, type KeyObject } from 'node:crypto';
import { CompactSign, CompactEncrypt, compactVerify, compactDecrypt } from 'jose';
import { pacoConfig, type PacoConfig } from '../../../config/paco';

// PACO's request/response tokens are nested JOSE: sign the JSON payload as a
// compact JWS, then encrypt that compact JWS string as the plaintext of a
// compact JWE. Mirrors flamingo-base's App\Lib\ActionRequest::EncryptPayload()
// / DecryptToken() (web-token/jwt-framework in PHP) — see the PACO research
// notes in memory for the source reference.
const JWS_ALG = 'PS256';
const JWE_ALG = 'RSA-OAEP';
const JWE_ENC = 'A128CBC-HS256';

function toPem(base64Der: string, header: string): string {
  const body = base64Der.match(/.{1,64}/g)?.join('\n') ?? base64Der;
  return `-----BEGIN ${header}-----\n${body}\n-----END ${header}-----\n`;
}

// Legacy (flamingo-base) wraps private key material with the traditional
// PKCS#1 "RSA PRIVATE KEY" header before handing it to its JOSE library.
// Without official docs there's no way to confirm this is what a *new*
// PACO/2c2p merchant onboarding will issue — if the PKCS#1 parse fails, this
// falls back to PKCS#8 ("PRIVATE KEY") automatically, so either format works
// without a code change once real keys are added.
export function parsePrivateKey(base64Der: string): KeyObject {
  try {
    return createPrivateKey({ key: toPem(base64Der, 'RSA PRIVATE KEY'), format: 'pem' });
  } catch {
    return createPrivateKey({ key: toPem(base64Der, 'PRIVATE KEY'), format: 'pem' });
  }
}

export function parsePublicKey(base64Der: string): KeyObject {
  return createPublicKey({ key: toPem(base64Der, 'PUBLIC KEY'), format: 'pem' });
}

/** Signs (PS256) then encrypts (RSA-OAEP + A128CBC-HS256) a JSON payload into a compact JWE string. */
export async function signAndEncrypt(payload: Record<string, unknown>, config: PacoConfig = pacoConfig): Promise<string> {
  const signingKey = parsePrivateKey(config.merchantSigningPrivateKey);
  const encryptionKey = parsePublicKey(config.encryptionPublicKey);

  const jws = await new CompactSign(new TextEncoder().encode(JSON.stringify(payload)))
    .setProtectedHeader({ alg: JWS_ALG })
    .sign(signingKey);

  return new CompactEncrypt(new TextEncoder().encode(jws))
    .setProtectedHeader({ alg: JWE_ALG, enc: JWE_ENC, kid: config.encryptionKeyId })
    .encrypt(encryptionKey);
}

/**
 * Reverse of {@link signAndEncrypt}: JWE-decrypts then JWS-verifies a compact
 * token, returning the parsed JSON payload.
 *
 * Deliberately does NOT enforce `iss`/`aud`/`exp` claim checks the way
 * flamingo-base's DecryptToken() does — that behavior was confirmed against
 * *request* claims (`{request, iss, aud, CompanyApiKey, iat, nbf, exp}`), but
 * there's no confirmed evidence of the exact claim shape PACO's *responses*
 * use. The cryptographic checks here (JWE decryption succeeding, JWS
 * signature verifying against PACO's public key) are the actual security
 * boundary; guessing wrong at an additional claim shape risks rejecting
 * legitimate responses once real credentials are in place. Revisit if/when
 * official 2c2p docs are available.
 */
export async function decryptAndVerify(compactJwe: string, config: PacoConfig = pacoConfig): Promise<unknown> {
  const decryptionKey = parsePrivateKey(config.merchantDecryptionPrivateKey);
  const verificationKey = parsePublicKey(config.signingPublicKey);

  const { plaintext } = await compactDecrypt(compactJwe, decryptionKey);
  const innerJws = new TextDecoder().decode(plaintext);

  const { payload } = await compactVerify(innerJws, verificationKey);
  return JSON.parse(new TextDecoder().decode(payload));
}
