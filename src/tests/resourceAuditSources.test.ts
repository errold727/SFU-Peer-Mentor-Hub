import { describe, expect, it, vi } from 'vitest';
import {
  canonicalSourceUrl,
  classifySourceResponse,
  fetchResourceSources,
  type SourceFetchResult,
} from '../utils/resourceLinks';
import {
  emptySourceState,
  fingerprintSources,
  MAX_SNAPSHOT_TEXT,
  normalizeSourceContent,
  parseSourceState,
} from '../../scripts/resource-audit/sources';

const url = 'https://www.sfu.ca/students/resource.html';
const now = () => new Date('2026-10-04T18:00:00.000Z');
const sleep = async () => undefined;
const main =
  '<h1>Student support</h1><p>Students can consult the official office for current eligibility and application guidance. Review the published requirements before making a request.</p>';
function fetched(
  html = `<main>${main}</main>`,
  change: Partial<SourceFetchResult> = {},
): SourceFetchResult {
  return {
    url,
    requestedUrls: [url],
    status: 'healthy',
    checkedAt: now().toISOString(),
    finalUrl: url,
    httpStatus: 200,
    body: html,
    contentType: 'text/html',
    bodyTruncated: false,
    bytesRead: html.length,
    ...change,
  };
}
const htmlResponse = (html = `<main>${main}</main>`, status = 200) =>
  new Response(html, { status, headers: { 'content-type': 'text/html' } });
const dayTwo = '2026-10-05T18:00:00.000Z';
const dayThree = '2026-10-12T18:00:00.000Z';

describe('weekly source retrieval', () => {
  it('deduplicates fragments and tracking parameters but retains meaningful query values', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => htmlResponse());
    const results = await fetchResourceSources(
      [
        `${url}#one`,
        `${url}?utm_source=email#two`,
        `${url}?program=arts`,
        `${url}?program=science`,
      ],
      {},
      { fetch, now, sleep },
    );
    expect(results).toHaveLength(3);
    expect(results[0].requestedUrls).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(canonicalSourceUrl(`${url}?b=2&utm_medium=x&a=1#intro`)).toBe(`${url}?a=1&b=2`);
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
    });
  });
  it.each([
    [200, 'healthy'],
    [204, 'healthy'],
    [401, 'blocked'],
    [403, 'blocked'],
    [404, 'notFound'],
    [410, 'notFound'],
    [429, 'rateLimited'],
    [500, 'serverError'],
    [503, 'serverError'],
    [400, 'unknown'],
  ] as const)('classifies %i as %s', (code, status) => {
    expect(classifySourceResponse(code, false)).toBe(status);
  });
  it('distinguishes challenge pages and redirects from missing facts', () => {
    expect(classifySourceResponse(200, false, "Making sure you're not a bot")).toBe('blocked');
    expect(classifySourceResponse(200, true)).toBe('redirected');
    expect(classifySourceResponse(429, false, 'captcha')).toBe('rateLimited');
  });
  it('follows only safe redirects and reports final destination', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        new Response('', { status: 301, headers: { location: '/students/new.html' } }),
      )
      .mockResolvedValueOnce(htmlResponse());
    const [result] = await fetchResourceSources([url], {}, { fetch, now, sleep });
    expect(result).toMatchObject({
      status: 'redirected',
      finalUrl: 'https://www.sfu.ca/students/new.html',
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    fetch
      .mockReset()
      .mockResolvedValue(
        new Response('', { status: 302, headers: { location: 'https://example.com/' } }),
      );
    const [external] = await fetchResourceSources([url], {}, { fetch, now, sleep });
    expect(external).toMatchObject({
      status: 'redirected',
      redirectWarning: 'outside-provider',
      finalUrl: 'https://example.com/',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('shares a redirect target request even when the destination is independently listed', async () => {
    const destination = 'https://www.sfu.ca/students/new.html';
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async (input) =>
        String(input) === url
          ? new Response('', { status: 301, headers: { location: destination } })
          : htmlResponse(),
      );
    const results = await fetchResourceSources([url, destination], {}, { fetch, now, sleep });
    expect(results.map((result) => result.status)).toEqual(['redirected', 'healthy']);
    expect(results[0].body).toBe(results[1].body);
    expect(fetch.mock.calls.filter(([input]) => input === destination)).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('flags generic destination, malformed location and redirect loops without throwing the audit', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        new Response('', { status: 302, headers: { location: '/index.html' } }),
      )
      .mockResolvedValueOnce(htmlResponse());
    expect((await fetchResourceSources([url], {}, { fetch, now, sleep }))[0]).toMatchObject({
      status: 'redirected',
      redirectWarning: 'generic-page',
    });
    fetch
      .mockReset()
      .mockImplementation(
        async () => new Response('', { status: 302, headers: { location: 'https://[' } }),
      );
    expect((await fetchResourceSources([url], {}, { fetch, now, sleep }))[0].redirectWarning).toBe(
      'invalid-location',
    );
    fetch
      .mockReset()
      .mockImplementation(
        async () => new Response('', { status: 302, headers: { location: url } }),
      );
    expect((await fetchResourceSources([url], {}, { fetch, now, sleep }))[0].redirectWarning).toBe(
      'redirect-loop',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('never fetches invalid schemes, credentials, foreign domains or custom ports', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const results = await fetchResourceSources(
      [
        'javascript:alert(1)',
        'http://sfu.ca/',
        'https://user:secret@sfu.ca/',
        'https://sfu.ca.evil.test/',
        'https://sfu.ca:8443/',
      ],
      {},
      { fetch, now, sleep },
    );
    expect(results.every((r) => r.status === 'invalid')).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('honours bounded Retry-After and stops rather than retrying before long delays', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '2' } }))
      .mockResolvedValueOnce(htmlResponse());
    expect((await fetchResourceSources([url], {}, { fetch, now, sleep }))[0].status).toBe(
      'healthy',
    );
    expect(sleep).toHaveBeenCalledWith(2000);
    fetch
      .mockReset()
      .mockImplementation(
        async () => new Response('', { status: 503, headers: { 'Retry-After': '120' } }),
      );
    expect((await fetchResourceSources([url], {}, { fetch, now, sleep }))[0]).toMatchObject({
      status: 'serverError',
      note: expect.stringContaining('deferred'),
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('caps response reads in bytes and cancels the remaining stream', async () => {
    const cancelled = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new TextEncoder().encode('é'.repeat(100)));
      },
      cancel: cancelled,
    });
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(stream, { headers: { 'content-type': 'text/html' } }));
    const [result] = await fetchResourceSources(
      [url],
      { maxResponseBytes: 50 },
      { fetch, now, sleep },
    );
    expect(result.bodyTruncated).toBe(true);
    expect(result.bytesRead).toBe(50);
    expect(result.body).toHaveLength(25);
    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(normalizeSourceContent(result).coverage).toBe('none');
  });
  it('defers new URLs on the same origin after a long Retry-After without skipping other providers', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async (input) =>
        String(input).startsWith('https://www.sfu.ca/')
          ? new Response('', { status: 429, headers: { 'Retry-After': '120' } })
          : htmlResponse(),
      );
    const results = await fetchResourceSources(
      [url, 'https://www.sfu.ca/next', 'https://www.lib.sfu.ca/help'],
      { concurrency: 1 },
      { fetch, now, sleep },
    );
    expect(results.map((r) => r.status)).toEqual(['rateLimited', 'rateLimited', 'healthy']);
    expect(results[1].httpStatus).toBeUndefined();
    expect(results[1].note).toContain('further requests to this origin are deferred');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('makes another worker respect a provider cooldown before starting a new request', async () => {
    const events: string[] = [];
    let clock = now().valueOf();
    const sleep = async (ms: number) => {
      events.push(`wait:${ms}`);
      clock += ms;
    };
    let attempts = 0;
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (input) => {
      events.push(`fetch:${String(input)}`);
      if (input === url && attempts++ === 0)
        return new Response('', { status: 429, headers: { 'Retry-After': '2' } });
      return htmlResponse();
    });
    const nextUrl = 'https://www.sfu.ca/next';
    const results = await fetchResourceSources(
      [url, nextUrl],
      {},
      { fetch, now: () => new Date(clock), sleep },
    );
    expect(results.every((r) => r.status === 'healthy')).toBe(true);
    expect(events.indexOf('wait:2000')).toBeGreaterThan(-1);
    expect(events.indexOf('wait:2000')).toBeLessThan(events.indexOf(`fetch:${nextUrl}`));
  });
  it('cancels a stalled body stream when its complete-response deadline expires', async () => {
    const cancelled = vi.fn();
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(new ReadableStream({ cancel: cancelled }), {
        headers: { 'content-type': 'text/html' },
      }),
    );
    const [result] = await fetchResourceSources([url], { timeoutMs: 5 }, { fetch, now, sleep });
    expect(result.status).toBe('timeout');
    expect(cancelled).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('does not consume binary bodies for fingerprints', async () => {
    const cancelled = vi.fn();
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(new ReadableStream({ cancel: cancelled }), {
        headers: { 'content-type': 'application/pdf' },
      }),
    );
    const [result] = await fetchResourceSources([url], {}, { fetch, now, sleep });
    expect(result).toMatchObject({ status: 'healthy', bytesRead: 0 });
    expect(result.body).toBeUndefined();
    expect(cancelled).toHaveBeenCalledOnce();
  });
  it('times out stalled fetches, retries at most once and preserves other URL results', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async (input) =>
        String(input).endsWith('good') ? htmlResponse() : new Promise<Response>(() => undefined),
      );
    const results = await fetchResourceSources(
      [url, 'https://www.sfu.ca/good'],
      { timeoutMs: 5, minStartIntervalMs: 0 },
      { fetch, now, sleep },
    );
    expect(results.map((r) => r.status)).toEqual(['timeout', 'healthy']);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('limits workers to two and separates starts by the polite interval', async () => {
    let active = 0,
      maximum = 0;
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => {
      active++;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
      return htmlResponse();
    });
    await fetchResourceSources(
      Array.from({ length: 5 }, (_, i) => `${url}?id=${i}`),
      { concurrency: 99 },
      { fetch, now, sleep },
    );
    expect(maximum).toBe(2);
    expect(sleep.mock.calls.filter(([ms]) => ms === 750)).toHaveLength(4);
  });
});

describe('inert source fingerprints and persistent pending reviews', () => {
  it.each(['safety', 'recreation'] as const)(
    'excludes the confirmed SFU %s sidebar menu without excluding the surrounding main facts',
    (template) => {
      const page = (navigation: string, addition = '') =>
        template === 'safety'
          ? `<main><div id="main-content"><div id="sub-page-container"><div class="row"><div id="side-bar-container"><div id="side-bar"><div id="side-bar-content"><div id="side-bar-logo-container">Site identity</div><ul><li>${navigation}</li></ul></div></div></div><div class="page-content"><h1>Report an incident</h1><h2>Health and safety incidents</h2>${main}${addition}</div></div></div></div></main>`
          : `<main><section class="main"><div class="main__content--content"><div class="page-content side-nav"><div class="page-content__side-nav"><div class="page-content__side-nav--container"><ul><li>${navigation}</li></ul></div></div><div class="page-content__main"><div class="main_content parsys"><h1>Drop-in sports schedule</h1><h2>Current term information</h2>${main}${addition}</div></div></div></div></section></main>`;
      const first = fingerprintSources([fetched(page('Unrelated menu item'))]);
      const second = fingerprintSources(
        [fetched(page('New unrelated menu item'), { checkedAt: dayTwo })],
        first.state,
      );
      expect(second.results[0].status).toBe('unchanged');
      expect(second.state.sources[url].text).not.toContain('menu item');
      expect(second.state.sources[url].text).toContain(
        template === 'safety' ? 'Health and safety incidents' : 'Current term information',
      );
      expect(second.state.sources[url].text).toContain(
        'current eligibility and application guidance',
      );
      const changed = fingerprintSources(
        [
          fetched(
            page('New unrelated menu item', '<p>New factual guidance must be reviewed.</p>'),
            { checkedAt: dayThree },
          ),
        ],
        second.state,
      );
      expect(changed.results[0].status).toBe('changed');
      expect(changed.results[0].pending?.context.added).toContain(
        'New factual guidance must be reviewed.',
      );
    },
  );
  it('does not apply SFU-specific sidebar removals to other reviewed providers', () => {
    const result = normalizeSourceContent(
      fetched(
        `<main><div class="page-content__side-nav">Provider-specific facts remain here.</div>${main}</main>`,
        { finalUrl: 'https://www.translink.ca/help' },
      ),
    );
    expect(result.text).toContain('Provider-specific facts remain here.');
  });
  it('does not forward parser diagnostics or execute remote scripts into the host console', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(
        normalizeSourceContent(
          fetched(
            `<style>}}} @import "unterminated</style><script>console.error('::error::remote');</script><main>${main}</main>`,
          ),
        ).coverage,
      ).toBe('main-text');
      expect(error).not.toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
      log.mockRestore();
      warn.mockRestore();
    }
  });
  it('removes scripts, navigation and generated timestamps while retaining meaningful dates', () => {
    const first = fetched(
      `<header>Site banner</header><nav>Random menu</nav><main>${main}<script>throw Error('never execute')</script><style>random styles</style><p>Generated at 2026-10-04T18:00:00Z</p><p>Updated on October 4, 2026</p></main><footer>Footer</footer>`,
    );
    const second = fetched(
      `<nav>Different menu</nav><main>${main}<p>Generated at 2026-10-05T18:00:00Z</p><p>Updated on October 4, 2026</p></main>`,
    );
    const baseline = fingerprintSources([first]);
    const next = fingerprintSources([second], baseline.state);
    expect(next.results[0].status).toBe('unchanged');
    expect(next.state.sources[url].text).toContain('Updated on October 4, 2026');
    expect(next.state.sources[url].text).not.toMatch(/Random|Generated|execute|Footer/);
    expect(JSON.stringify(next.state)).not.toContain('<main>');
  });
  it('records an initial baseline without pretending it was an unchanged or verified source', () => {
    const { results, state } = fingerprintSources([fetched()]);
    expect(results[0]).toMatchObject({
      status: 'baseline',
      coverage: 'main-text',
      reason: expect.stringContaining('no previous'),
    });
    expect(JSON.stringify({ results, state })).not.toContain('verifiedAt');
    expect(parseSourceState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });
  it('keeps a pending change on unchanged and blocked runs until the caller applies actual per-record factual review', () => {
    const baseline = fingerprintSources([fetched()]);
    const changed = fingerprintSources(
      [
        fetched(`<main>${main}<p>Applications close October 30, 2026.</p></main>`, {
          checkedAt: dayTwo,
        }),
      ],
      baseline.state,
    );
    const unchanged = fingerprintSources(
      [
        fetched(`<main>${main}<p>Applications close October 30, 2026.</p></main>`, {
          checkedAt: dayThree,
        }),
      ],
      changed.state,
    );
    expect(changed.results[0].status).toBe('changed');
    expect(changed.results[0].pending?.context.added).toContain(
      'Applications close October 30, 2026.',
    );
    expect(unchanged.results[0].status).toBe('unchanged');
    expect(unchanged.results[0].pending).toEqual(changed.results[0].pending);
    const blocked = fingerprintSources(
      [fetched('denied', { status: 'blocked', checkedAt: dayThree })],
      unchanged.state,
    );
    expect(blocked.results[0].status).toBe('uncovered');
    expect(blocked.results[0].pending?.detectedAt).toBe(dayTwo);
    expect(blocked.state).toEqual(unchanged.state);
    expect(baseline.state.sources[url].pending).toBeUndefined();
  });
  it('updates the detection time for a later factual source change so earlier reviews cannot clear it', () => {
    const first = fingerprintSources([fetched()]);
    const second = fingerprintSources(
      [fetched(`<main>${main}<p>First new guidance.</p></main>`, { checkedAt: dayTwo })],
      first.state,
    );
    const third = fingerprintSources(
      [fetched(`<main>${main}<p>Second new guidance.</p></main>`, { checkedAt: dayThree })],
      second.state,
    );
    expect(third.results[0].pending).toMatchObject({
      detectedAt: dayThree,
      previousFingerprint: second.results[0].fingerprint,
      newFingerprint: third.results[0].fingerprint,
    });
    expect(parseSourceState(third.state)).toEqual(third.state);
  });
  it.each([
    [fetched('<main>Small</main>'), 'thin'],
    [fetched('<div id="root">Enable JavaScript</div>'), 'Dynamic'],
    [fetched('data', { contentType: 'application/pdf' }), 'Unsupported'],
    [fetched('', { body: undefined, contentType: 'application/pdf' }), 'PDF'],
    [fetched(undefined, { bodyTruncated: true }), 'byte limit'],
    [fetched(undefined, { httpStatus: 206 }), 'partial content'],
    [fetched(undefined, { redirectWarning: 'generic-page' }), 'Redirect'],
    [fetched(`<main>${'long words '.repeat(MAX_SNAPSHOT_TEXT)}</main>`), 'snapshot limit'],
  ])('explicitly declines unsupported or incomplete coverage %#', (result, reason) => {
    const audit = fingerprintSources([result as SourceFetchResult]);
    expect(audit.results[0]).toMatchObject({
      status: 'uncovered',
      coverage: 'none',
      reason: expect.stringContaining(reason as string),
    });
    expect(Object.keys(audit.state.sources)).toHaveLength(0);
  });
  it('normalizes relevant plain text without inventing HTML or re-fetching', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(htmlResponse());
    const results = await fetchResourceSources([url], {}, { fetch, now, sleep });
    fingerprintSources(results);
    expect(fetch).toHaveBeenCalledOnce();
    expect(
      normalizeSourceContent(fetched(main.replace(/<[^>]+>/g, ' '), { contentType: 'text/plain' }))
        .coverage,
    ).toBe('plain-text');
  });
  it('rejects malformed, unsafe, oversized, inconsistent or unsupported restored snapshots', () => {
    const valid = fingerprintSources([fetched()]).state;
    const bad = (edit: (value: typeof valid) => void) => {
      const copy = structuredClone(valid);
      edit(copy);
      return copy;
    };
    expect(() => parseSourceState({ ...valid, version: 9 })).toThrow();
    expect(() => parseSourceState({ version: 1, sources: {} })).toThrow();
    expect(() =>
      parseSourceState(
        bad((s) => {
          s.sources[url].text = 'tampered';
        }),
      ),
    ).toThrow();
    expect(() =>
      parseSourceState(
        bad((s) => {
          s.sources[url].finalUrl = 'https://evil.test/';
        }),
      ),
    ).toThrow();
    expect(() =>
      parseSourceState(
        bad((s) => {
          s.sources[url].text = 'a'.repeat(MAX_SNAPSHOT_TEXT + 1);
        }),
      ),
    ).toThrow();
    expect(() =>
      parseSourceState(
        bad((s) => {
          s.sources[url].retrievedAt = 'yesterday';
        }),
      ),
    ).toThrow();
    expect(() =>
      parseSourceState(
        bad((s) => {
          s.sources[url].retrievedAt = '2026-02-31T18:00:00.000Z';
        }),
      ),
    ).toThrow();
    expect(() =>
      parseSourceState(
        bad((s) => {
          s.sources[url].fingerprint = 'bad';
        }),
      ),
    ).toThrow();
    expect(() =>
      parseSourceState(
        bad((s) => {
          s.sources['javascript:alert(1)'] = s.sources[url];
        }),
      ),
    ).toThrow();
    expect(parseSourceState(emptySourceState())).toEqual(emptySourceState());
  });
});
