import { classifyResponse, officialSource, type LinkStatus } from './resourceHealth';
export type LinkResult = {
  url: string;
  status: LinkStatus | 'timeout' | 'suspicious-redirect';
  httpStatus?: number;
  finalUrl?: string;
  checkedAt: string;
  note?: string;
};
type Dependencies = { fetch: typeof fetch; sleep: (ms: number) => Promise<void>; now: () => Date };
const defaults: Dependencies = {
  fetch: (...args) => fetch(...args),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => new Date(),
};
const isTimeout = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  /timeout|abort/i.test(String(error.name));
export function retryAfterMilliseconds(value: string | null, now: Date) {
  if (!value) return 1000;
  const seconds = Number(value);
  return Number.isFinite(seconds)
    ? Math.max(0, seconds * 1000)
    : Math.max(0, Date.parse(value) - now.valueOf()) || 1000;
}
export async function checkResourceLinks(
  urls: string[],
  concurrency = 3,
  dependencies: Partial<Dependencies> = {},
) {
  const deps = { ...defaults, ...dependencies };
  const unique = [...new Set(urls)];
  const results: LinkResult[] = new Array(unique.length);
  let next = 0;
  async function check(url: string): Promise<LinkResult> {
    const checkedAt = deps.now().toISOString();
    if (!officialSource(url))
      return { url, checkedAt, status: 'invalid', note: 'Unsafe or unrecognized official URL' };
    let current = url;
    for (let redirects = 0; redirects < 6; redirects++) {
      let response: Response | undefined;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await deps.fetch(current, {
            method: 'GET',
            redirect: 'manual',
            signal: AbortSignal.timeout(15000),
          });
          if ([429, 502, 503, 504].includes(response.status) && attempt === 0) {
            const wait = retryAfterMilliseconds(response.headers.get('Retry-After'), deps.now());
            if (wait > 10000)
              return {
                url,
                checkedAt,
                status: response.status === 429 ? 'blocked' : 'unverified',
                httpStatus: response.status,
                finalUrl: current,
                note: `Retry-After ${Math.ceil(wait / 1000)}s; deferred to a later run`,
              };
            await response.body?.cancel();
            await deps.sleep(wait);
            continue;
          }
          break;
        } catch (error) {
          if (attempt === 0) {
            await deps.sleep(500);
            continue;
          }
          return {
            url,
            checkedAt,
            status: isTimeout(error) ? 'timeout' : 'unverified',
            finalUrl: current,
            note: 'Network request unavailable; not evidence of discontinuation',
          };
        }
      }
      if (!response) return { url, checkedAt, status: 'unverified' };
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        const destination = new URL(response.headers.get('location')!, current).href;
        await response.body?.cancel();
        if (!officialSource(destination))
          return {
            url,
            checkedAt,
            status: 'suspicious-redirect',
            httpStatus: response.status,
            finalUrl: destination,
            note: 'Destination is outside the reviewed provider domains',
          };
        if (new URL(destination).pathname === '/' && new URL(url).pathname !== '/')
          return {
            url,
            checkedAt,
            status: 'suspicious-redirect',
            httpStatus: response.status,
            finalUrl: destination,
            note: 'Detailed source redirects to a homepage; inspect relevance',
          };
        current = destination;
        continue;
      }
      let text = '';
      try {
        if (/text|html/.test(response.headers.get('content-type') ?? ''))
          text = (await response.text()).slice(0, 200000);
        else await response.body?.cancel();
      } catch (error) {
        return {
          url,
          checkedAt,
          finalUrl: current,
          httpStatus: response.status,
          status: isTimeout(error) ? 'timeout' : 'unverified',
          note: 'Response body could not be read; other source checks continue',
        };
      }
      return {
        url,
        checkedAt,
        status: classifyResponse(response.status, current !== url, text),
        httpStatus: response.status,
        finalUrl: current,
      };
    }
    return {
      url,
      checkedAt,
      status: 'unverified',
      finalUrl: current,
      note: 'Redirect limit reached',
    };
  }
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(6, concurrency, unique.length)) }, async () => {
      while (next < unique.length) {
        const i = next++;
        results[i] = await check(unique[i]);
      }
    }),
  );
  return results;
}
