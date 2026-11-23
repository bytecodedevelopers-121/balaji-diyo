import dns from 'dns';
import http from 'http';
import https from 'https';
import net from 'net';

/** Dev/test only: allows http:// and loopback/private targets. Never set in production. */
const allowPrivate = (): boolean => process.env.B2B_WEBHOOK_ALLOW_PRIVATE === 'true';

const inV4 = (a: number[], base: number[], bits: number): boolean => {
  const toInt = (x: number[]) => (((x[0] ?? 0) << 24) | ((x[1] ?? 0) << 16) | ((x[2] ?? 0) << 8) | (x[3] ?? 0)) >>> 0;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (toInt(a) & mask) === (toInt(base) & mask);
};

const PRIVATE_V4: [number[], number][] = [
  [[0, 0, 0, 0], 8], [[10, 0, 0, 0], 8], [[100, 64, 0, 0], 10], [[127, 0, 0, 0], 8], [[169, 254, 0, 0], 16], [[172, 16, 0, 0], 12],
  [[192, 0, 0, 0], 24], [[192, 168, 0, 0], 16], [[198, 18, 0, 0], 15], [[224, 0, 0, 0], 3],
];

/** True for loopback, private, link-local (incl. cloud metadata 169.254.169.254), CGNAT, multicast and reserved ranges. */
export const isPrivateAddress = (ip: string): boolean => {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    return PRIVATE_V4.some(([base, bits]) => inV4(parts, base, bits));
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v);
    if (mapped?.[1]) return isPrivateAddress(mapped[1]);
    return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb') || v.startsWith('ff');
  }
  return true; // not an IP at all — refuse
};

/** Static checks done when an endpoint is saved. Returns an error message, or null if acceptable. */
export const webhookUrlProblem = (raw: string): string | null => {
  let u: URL;
  try { u = new URL(raw); } catch { return 'Enter a valid URL'; }
  if (u.username || u.password) return 'URLs with embedded credentials are not allowed';
  if (u.protocol !== 'https:' && !(allowPrivate() && u.protocol === 'http:')) return 'Webhook URLs must use https';
  if (allowPrivate()) return null;
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) return 'Webhook URL must be publicly reachable';
  if (net.isIP(host) && isPrivateAddress(host)) return 'Webhook URL must not point at a private or reserved address';
  return null;
};

export interface PostResult { status: number; bodySnippet: string }

/**
 * POSTs JSON without following redirects. The destination is re-resolved on every call and the
 * validated address is the one actually connected to (custom `lookup`), so a hostname that later
 * rebinds to an internal IP cannot be used to reach internal services (SSRF / DNS rebinding).
 */
export const postJson = (url: string, headers: Record<string, string>, body: string, timeoutMs = 10_000): Promise<PostResult> =>
  new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const lookup: net.LookupFunction = (hostname, options, cb) => {
      dns.lookup(hostname, { all: true }, (err, addrs) => {
        if (err) return cb(err, '', 4);
        if (!allowPrivate() && addrs.some((a) => isPrivateAddress(a.address))) return cb(new Error('Destination resolves to a private or reserved address'), '', 4);
        const first = addrs[0];
        if (!first) return cb(new Error('No address found'), '', 4);
        if (options.all) return (cb as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, addrs);
        cb(null, first.address, first.family);
      });
    };
    const req = lib.request(
      u,
      { method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(body).toString() }, lookup, timeout: timeoutMs },
      (res) => {
        let snippet = '';
        res.setEncoding('utf8');
        res.on('data', (c: string) => { if (snippet.length < 512) snippet += c; });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, bodySnippet: snippet.slice(0, 512) }));
      },
    );
    req.on('timeout', () => req.destroy(new Error(`Timed out after ${timeoutMs}ms`)));
    req.on('error', reject);
    req.end(body);
  });
