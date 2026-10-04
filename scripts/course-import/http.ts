import { setTimeout as pause } from 'node:timers/promises';
export class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}
let nextRequest = 0;
export function isTransient(error: unknown) {
  return error instanceof HttpError
    ? error.status === 429 || error.status >= 500
    : error instanceof TypeError ||
        (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name));
}
export async function getPublicJSON(url: string): Promise<unknown> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !['coursys.sfu.ca', 'www.sfu.ca'].includes(parsed.hostname))
    throw Error('Non-official request blocked');
  for (let attempt = 0; attempt < 3; attempt++) {
    const wait = Math.max(0, nextRequest - Date.now());
    nextRequest = Math.max(Date.now(), nextRequest) + 300;
    if (wait) await pause(wait);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'error' });
      if (!response.ok) throw new HttpError(response.status);
      return await response.json();
    } catch (error) {
      if (attempt === 2 || !isTransient(error)) throw error;
      await pause(1000 * 2 ** attempt);
    }
  }
  throw Error('Request failed');
}
export async function mapBounded<T, R>(items: T[], work: (item: T) => Promise<R>, concurrency = 3) {
  const result: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        result[i] = await work(items[i]);
      }
    }),
  );
  return result;
}
