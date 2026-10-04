import { officialSource, type LinkStatus } from './resourceHealth';

export type SourceLinkStatus =
  | 'healthy'
  | 'redirected'
  | 'blocked'
  | 'timeout'
  | 'rateLimited'
  | 'notFound'
  | 'serverError'
  | 'invalid'
  | 'unknown';
export type SourceFetchResult = {
  url: string;
  requestedUrls: string[];
  status: SourceLinkStatus;
  checkedAt: string;
  httpStatus?: number;
  finalUrl?: string;
  note?: string;
  redirectWarning?: 'outside-provider' | 'generic-page' | 'invalid-location' | 'redirect-loop';
  contentType?: string;
  body?: string;
  bodyTruncated: boolean;
  bytesRead: number;
};
export type SourceFetchOptions = {
  concurrency?: number;
  minStartIntervalMs?: number;
  timeoutMs?: number;
  maxResponseBytes?: number;
  retries?: number;
  maxRetryAfterMs?: number;
};
export type SourceFetchDependencies = {
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  now: () => Date;
};
export type LinkResult = {
  url: string;
  status: LinkStatus | 'timeout' | 'suspicious-redirect';
  httpStatus?: number;
  finalUrl?: string;
  checkedAt: string;
  note?: string;
};
const defaults: SourceFetchDependencies = {
  fetch: (...args) => fetch(...args),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => new Date(),
};
const challengePattern =
  /anubis|botstopper|captcha|verify you are human|making sure you're not a bot|just a moment.{0,100}(?:cloudflare|challenge)|cf-chl-/i;
const isTimeout = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  /timeout|abort/i.test(String(error.name));
const bounded = (value: number | undefined, fallback: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.floor(value!))) : fallback;

/** Only fragments and known marketing parameters are removed; meaningful queries survive. */
export function canonicalSourceUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()])
      if (/^(?:utm_.+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid)$/i.test(key))
        url.searchParams.delete(key);
    url.searchParams.sort();
    return url.href;
  } catch {
    return value;
  }
}
export function safeSourceUrl(value: string): boolean {
  if (!officialSource(value)) return false;
  const url = new URL(value);
  return !url.port || url.port === '443';
}
export function retryAfterMilliseconds(value: string | null, now: Date) {
  if (!value) return 1000;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now.valueOf()) : 1000;
}
export function classifySourceResponse(
  status: number,
  redirected: boolean,
  body = '',
): SourceLinkStatus {
  if (status === 429) return 'rateLimited';
  if ([401, 403].includes(status) || challengePattern.test(body)) return 'blocked';
  if ([404, 410].includes(status)) return 'notFound';
  if (status >= 500) return 'serverError';
  if (status >= 200 && status < 300) return redirected ? 'redirected' : 'healthy';
  return 'unknown';
}
function cancelBody(body: ReadableStream<Uint8Array> | null) {
  void body?.cancel().catch(() => undefined);
}
async function readBoundedBody(response: Response, cap: number, signal: AbortSignal) {
  const contentType = response.headers.get('content-type') ?? '';
  if (!/^(?:text\/|application\/(?:xhtml\+xml|xml)(?:;|$))/i.test(contentType)) {
    cancelBody(response.body);
    return { contentType, bytesRead: 0, bodyTruncated: false };
  }
  const reader = response.body?.getReader();
  if (!reader) return { contentType, body: '', bytesRead: 0, bodyTruncated: false };
  const abort = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener('abort', abort, { once: true });
  const decoder = new TextDecoder();
  let body = '',
    bytesRead = 0,
    bodyTruncated = false;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      const remaining = cap - bytesRead;
      const chunk = next.value.subarray(0, remaining);
      body += decoder.decode(chunk, { stream: true });
      bytesRead += chunk.byteLength;
      if (next.value.byteLength > remaining) {
        bodyTruncated = true;
        void reader.cancel().catch(() => undefined);
        break;
      }
    }
    body += decoder.decode();
    return { contentType, body, bytesRead, bodyTruncated };
  } finally {
    signal.removeEventListener('abort', abort);
    reader.releaseLock();
  }
}

/** GET-only, bounded retrieval. No scripts run, no credentials/cookies are supplied. */
export async function fetchResourceSources(
  urls: string[],
  options: SourceFetchOptions = {},
  dependencies: Partial<SourceFetchDependencies> = {},
): Promise<SourceFetchResult[]> {
  const deps = { ...defaults, ...dependencies };
  const concurrency = bounded(options.concurrency, 2, 1, 2);
  const interval = bounded(options.minStartIntervalMs, 750, 0, 10000);
  const timeout = bounded(options.timeoutMs, 15000, 1, 60000);
  const cap = bounded(options.maxResponseBytes, 512 * 1024, 1, 2 * 1024 * 1024);
  const retries = bounded(options.retries, 1, 0, 2);
  const maxRetry = bounded(options.maxRetryAfterMs, 10000, 0, 30000);
  const grouped = new Map<string, string[]>();
  for (const raw of urls) {
    const key = canonicalSourceUrl(raw);
    const aliases = grouped.get(key) ?? [];
    if (!aliases.includes(raw)) aliases.push(raw);
    grouped.set(key, aliases);
  }
  const unique = [...grouped];
  const results: SourceFetchResult[] = new Array(unique.length);
  let next = 0,
    started = false;
  let startGate = Promise.resolve();
  type Cooldown = {
    until: number;
    deferred: boolean;
    status: 'rateLimited' | 'serverError';
    note: string;
  };
  const cooldowns = new Map<string, Cooldown>();
  type Hop = {
    response: Response;
    data: Awaited<ReturnType<typeof readBoundedBody>>;
    retryDelay?: number;
    note?: string;
  };
  type HopResult =
    | Hop
    | { failure: { status: 'timeout' | 'unknown' | 'rateLimited' | 'serverError'; note: string } };
  const hops = new Map<string, Promise<HopResult>>();
  function reserveStart(current: string) {
    const origin = new URL(current).origin;
    if (cooldowns.get(origin)?.deferred) return Promise.resolve();
    startGate = startGate.then(async () => {
      if (started && interval) await deps.sleep(interval);
      for (;;) {
        const cooldown = cooldowns.get(origin);
        if (!cooldown || cooldown.deferred) break;
        const remaining = Math.max(0, cooldown.until - deps.now().valueOf());
        if (remaining) await deps.sleep(remaining);
        // A different in-flight response may have extended this provider's cooldown.
        if (cooldowns.get(origin) === cooldown) {
          cooldowns.delete(origin);
          break;
        }
      }
      started = true;
    });
    return startGate;
  }
  function retryDelay(response: Response, current: string) {
    if (![429, 502, 503, 504].includes(response.status)) return undefined;
    const header = response.headers.get('Retry-After');
    const wait = retryAfterMilliseconds(header, deps.now());
    if (response.status === 429 || header !== null) {
      const origin = new URL(current).origin;
      const until = deps.now().valueOf() + wait;
      const previous = cooldowns.get(origin);
      if (!previous || (!previous.deferred && until > previous.until))
        cooldowns.set(origin, {
          until,
          deferred: wait > maxRetry,
          status: response.status === 429 ? 'rateLimited' : 'serverError',
          note: `Provider requested Retry-After ${Math.ceil(wait / 1000)}s; further requests to this origin are deferred to a later run`,
        });
    }
    return wait;
  }
  async function requestHop(current: string): Promise<HopResult> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      await reserveStart(current);
      const cooldown = cooldowns.get(new URL(current).origin);
      if (cooldown?.deferred) return { failure: { status: cooldown.status, note: cooldown.note } };
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      let readingBody = false;
      let hop: Hop;
      try {
        hop = await Promise.race([
          (async () => {
            const response = await deps.fetch(current, {
              method: 'GET',
              redirect: 'manual',
              credentials: 'omit',
              signal: controller.signal,
              headers: {
                'User-Agent':
                  'SFU-Peer-Mentor-Hub-Resource-Audit/1.0 (+https://github.com/errold727/SFU-Peer-Mentor-Hub)',
                Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1',
              },
            });
            if (controller.signal.aborted) {
              cancelBody(response.body);
              throw new DOMException('Source request timed out', 'TimeoutError');
            }
            const delay = retryDelay(response, current);
            if (response.status >= 300 && response.status < 400) {
              cancelBody(response.body);
              return {
                response,
                data: {
                  contentType: response.headers.get('content-type') ?? '',
                  bytesRead: 0,
                  bodyTruncated: false,
                },
              };
            }
            readingBody = true;
            return {
              response,
              data: await readBoundedBody(response, cap, controller.signal),
              retryDelay: delay,
            };
          })(),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              controller.abort();
              reject(new DOMException('Source request exceeded its deadline', 'TimeoutError'));
            }, timeout);
          }),
        ]);
      } catch (error) {
        controller.abort();
        if (attempt < retries && !readingBody) {
          if (timer) clearTimeout(timer);
          await deps.sleep(500);
          continue;
        }
        return {
          failure: {
            status: isTimeout(error) ? 'timeout' : 'unknown',
            note: readingBody
              ? 'Response body could not be read; not evidence of discontinuation'
              : 'Network request unavailable; not evidence of discontinuation',
          },
        };
      } finally {
        if (timer) clearTimeout(timer);
      }
      if (hop.retryDelay !== undefined) {
        if (hop.retryDelay > maxRetry)
          return {
            ...hop,
            note: `Retry-After ${Math.ceil(hop.retryDelay / 1000)}s; deferred to a later run`,
          };
        if (attempt < retries) {
          // Provider-wide Retry-After is consumed at the shared start gate. Other transient
          // errors without that header use a local backoff instead.
          if (hop.response.status !== 429 && !hop.response.headers.has('Retry-After'))
            await deps.sleep(hop.retryDelay);
          continue;
        }
      }
      return hop;
    }
    return { failure: { status: 'unknown', note: 'Request produced no response' } };
  }
  function getHop(current: string) {
    let pending = hops.get(current);
    if (!pending) {
      pending = requestHop(current);
      hops.set(current, pending);
    }
    return pending;
  }
  async function check([url, requestedUrls]: [string, string[]]): Promise<SourceFetchResult> {
    const base = {
      url,
      requestedUrls,
      checkedAt: deps.now().toISOString(),
      bytesRead: 0,
      bodyTruncated: false,
    };
    if (!safeSourceUrl(url))
      return { ...base, status: 'invalid', note: 'Unsafe or unrecognized official URL' };
    let current = url;
    let warning: SourceFetchResult['redirectWarning'];
    const seen = new Set<string>();
    for (let redirects = 0; redirects < 6; redirects++) {
      if (seen.has(current))
        return {
          ...base,
          status: 'unknown',
          finalUrl: current,
          redirectWarning: 'redirect-loop',
          note: 'Redirect loop; inspect destination',
        };
      seen.add(current);
      const hop = await getHop(current);
      if ('failure' in hop)
        return { ...base, ...hop.failure, finalUrl: current, redirectWarning: warning };
      const { response, data } = hop;
      if (response.status >= 300 && response.status < 400) {
        let destination: string;
        try {
          const location = response.headers.get('location');
          if (!location) throw new Error('Missing location');
          destination = canonicalSourceUrl(new URL(location, current).href);
        } catch {
          return {
            ...base,
            status: 'unknown',
            httpStatus: response.status,
            finalUrl: current,
            redirectWarning: 'invalid-location',
            note: 'Redirect has a missing or malformed destination',
          };
        }
        if (!safeSourceUrl(destination))
          return {
            ...base,
            status: 'redirected',
            httpStatus: response.status,
            finalUrl: destination,
            redirectWarning: 'outside-provider',
            note: 'Destination is outside reviewed provider domains; it was not fetched',
          };
        const generic = (value: string) =>
          /^\/(?:index|home|default)?(?:\.html?)?\/?$/i.test(new URL(value).pathname);
        if (generic(destination) && !generic(url)) warning = 'generic-page';
        current = destination;
        continue;
      }
      return {
        ...base,
        ...data,
        status: classifySourceResponse(response.status, current !== url, data.body),
        httpStatus: response.status,
        finalUrl: current,
        redirectWarning: warning,
        ...(hop.note
          ? { note: hop.note }
          : warning
            ? { note: 'Detailed source redirects to a generic page; inspect relevance' }
            : {}),
      };
    }
    return {
      ...base,
      status: 'unknown',
      finalUrl: current,
      redirectWarning: warning ?? 'redirect-loop',
      note: 'Redirect limit reached',
    };
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, unique.length) }, async () => {
      while (next < unique.length) {
        const index = next++;
        results[index] = await check(unique[index]);
      }
    }),
  );
  return results;
}

/** Compatibility view for the existing resources:links command. */
export async function checkResourceLinks(
  urls: string[],
  concurrency = 2,
  dependencies: Partial<SourceFetchDependencies> = {},
): Promise<LinkResult[]> {
  const results = await fetchResourceSources(urls, { concurrency }, dependencies);
  return results.map(({ url, status, httpStatus, finalUrl, checkedAt, note, redirectWarning }) => ({
    url,
    httpStatus,
    finalUrl,
    checkedAt,
    note,
    status: redirectWarning
      ? 'suspicious-redirect'
      : (
          {
            healthy: 'reachable',
            redirected: 'redirect',
            blocked: 'blocked',
            rateLimited: 'blocked',
            notFound: 'invalid',
            invalid: 'invalid',
            timeout: 'timeout',
            serverError: 'unverified',
            unknown: 'unverified',
          } as const
        )[status],
  }));
}
