import { describe, it, expect, vi } from 'vitest';
import { checkResourceLinks, retryAfterMilliseconds } from '../utils/resourceLinks';
const now = () => new Date('2026-10-04T18:00Z');
describe('bounded read-only source checks', () => {
  it('contains response-body timeouts so other source results are retained', async () => {
    const body = new Response('partial', { headers: { 'content-type': 'text/html' } });
    vi.spyOn(body, 'text').mockRejectedValue(new DOMException('body timed out', 'AbortError'));
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(body)
      .mockResolvedValueOnce(new Response('ok'));
    const results = await checkResourceLinks(['https://www.sfu.ca/a', 'https://www.sfu.ca/b'], 1, {
      fetch,
      now,
    });
    expect(results.map((r) => r.status)).toEqual(['timeout', 'reachable']);
  });
  it('deduplicates requests and distinguishes blocked challenge from factual review', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response('Anubis browser challenge', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );
    const result = await checkResourceLinks(
      ['https://www.lib.sfu.ca/', 'https://www.lib.sfu.ca/'],
      3,
      { fetch, now },
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result[0].status).toBe('blocked');
    expect(result[0]).not.toHaveProperty('verifiedAt');
  });
  it('respects Retry-After and defers long delays', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '2' } }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    expect(
      (await checkResourceLinks(['https://www.sfu.ca/test'], 1, { fetch, sleep, now }))[0].status,
    ).toBe('reachable');
    expect(sleep).toHaveBeenCalledWith(2000);
    fetch.mockResolvedValue(new Response('', { status: 429, headers: { 'Retry-After': '120' } }));
    expect(
      (await checkResourceLinks(['https://www.sfu.ca/test'], 1, { fetch, sleep, now }))[0].note,
    ).toContain('deferred');
    expect(retryAfterMilliseconds('Sun, 04 Oct 2026 18:00:05 GMT', now())).toBe(5000);
  });
  it('rejects unsafe input and flags generic or unrecognized redirects', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(
        new Response('', { status: 302, headers: { location: 'https://www.sfu.ca/' } }),
      );
    const result = await checkResourceLinks(['javascript:x', 'https://www.sfu.ca/detail'], 2, {
      fetch,
      now,
    });
    expect(result.map((r) => r.status)).toEqual(['invalid', 'suspicious-redirect']);
  });
  it('bounds concurrency without making unit tests access websites', async () => {
    let active = 0,
      max = 0;
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => {
      active++;
      max = Math.max(max, active);
      await new Promise((r) => setTimeout(r, 1));
      active--;
      return new Response('', { status: 404 });
    });
    const result = await checkResourceLinks(
      Array.from({ length: 10 }, (_, i) => `https://www.sfu.ca/${i}`),
      3,
      { fetch, now },
    );
    expect(max).toBe(3);
    expect(result.every((r) => r.status === 'invalid')).toBe(true);
  });
});
