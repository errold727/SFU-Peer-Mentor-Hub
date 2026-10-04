import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import {
  canonicalSourceUrl,
  safeSourceUrl,
  type SourceFetchResult,
} from '../../src/utils/resourceLinks';

const { JSDOM, VirtualConsole } = createRequire(import.meta.url)('jsdom') as {
  JSDOM: new (
    html: string,
    options: { virtualConsole: object },
  ) => { window: { document: Document; close: () => void } };
  VirtualConsole: new () => object;
};
export const MAX_SNAPSHOT_TEXT = 32000;
const MAX_SOURCES = 1000;
export type SourceChangeContext = { removed: string[]; added: string[] };
export type PendingSourceChange = {
  detectedAt: string;
  previousFingerprint: string;
  newFingerprint: string;
  context: SourceChangeContext;
};
export type SourceSnapshot = {
  url: string;
  finalUrl: string;
  fingerprint: string;
  text: string;
  retrievedAt: string;
  pending?: PendingSourceChange;
};
export type SourceSnapshotState = {
  version: 1;
  normalizationVersion: 1;
  sources: Record<string, SourceSnapshot>;
};
export type SourceFingerprintResult = {
  url: string;
  status: 'baseline' | 'unchanged' | 'changed' | 'uncovered';
  coverage: 'main-text' | 'body-text' | 'plain-text' | 'none';
  reason: string;
  fingerprint?: string;
  previousFingerprint?: string;
  pending?: PendingSourceChange;
};
type NormalizedSource = {
  coverage: SourceFingerprintResult['coverage'];
  reason: string;
  text?: string;
};
export const emptySourceState = (): SourceSnapshotState => ({
  version: 1,
  normalizationVersion: 1,
  sources: {},
});
const hash = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
const plainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const timestamp = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z');
const fingerprint = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
// Explicitly reject transport/control characters while preserving tabs and line endings.
const unsafeControl = (text: string) =>
  [...text].some((char) => char.charCodeAt(0) < 32 && ![9, 10, 13].includes(char.charCodeAt(0)));
function parsePending(value: unknown): PendingSourceChange {
  if (
    !plainObject(value) ||
    !timestamp(value.detectedAt) ||
    !fingerprint(value.previousFingerprint) ||
    !fingerprint(value.newFingerprint) ||
    !plainObject(value.context)
  )
    throw new Error('Invalid pending source change');
  function excerpts(value: unknown): string[] {
    if (
      !Array.isArray(value) ||
      value.length > 6 ||
      value.some((item) => typeof item !== 'string' || item.length > 240 || unsafeControl(item))
    )
      throw new Error('Invalid source change context');
    return [...value];
  }
  return {
    detectedAt: value.detectedAt,
    previousFingerprint: value.previousFingerprint,
    newFingerprint: value.newFingerprint,
    context: { removed: excerpts(value.context.removed), added: excerpts(value.context.added) },
  };
}

/** Restored Actions artifacts are untrusted. Return a fresh bounded plain-data object. */
export function parseSourceState(value: unknown): SourceSnapshotState {
  if (
    !plainObject(value) ||
    value.version !== 1 ||
    value.normalizationVersion !== 1 ||
    !plainObject(value.sources) ||
    Object.keys(value.sources).length > MAX_SOURCES
  )
    throw new Error('Unsupported or malformed source snapshot state');
  const state = emptySourceState();
  for (const [url, item] of Object.entries(value.sources)) {
    if (
      !safeSourceUrl(url) ||
      url.length > 4096 ||
      canonicalSourceUrl(url) !== url ||
      !plainObject(item) ||
      item.url !== url ||
      typeof item.finalUrl !== 'string' ||
      item.finalUrl.length > 4096 ||
      !safeSourceUrl(item.finalUrl) ||
      !fingerprint(item.fingerprint) ||
      typeof item.text !== 'string' ||
      !item.text.length ||
      item.text.length > MAX_SNAPSHOT_TEXT ||
      unsafeControl(item.text) ||
      !timestamp(item.retrievedAt) ||
      hash(item.text) !== item.fingerprint
    )
      throw new Error(`Invalid source snapshot: ${url.slice(0, 120)}`);
    const pending = item.pending === undefined ? undefined : parsePending(item.pending);
    if (
      pending &&
      (pending.newFingerprint !== item.fingerprint ||
        Date.parse(pending.detectedAt) > Date.parse(item.retrievedAt))
    )
      throw new Error('Pending change does not match its current source snapshot');
    state.sources[url] = {
      url,
      finalUrl: item.finalUrl,
      fingerprint: item.fingerprint,
      text: item.text,
      retrievedAt: item.retrievedAt,
      ...(pending ? { pending } : {}),
    };
  }
  return state;
}

function cleanLines(text: string) {
  return (
    [...text.normalize('NFKC')]
      .filter((char) => !unsafeControl(char))
      .join('')
      .replace(/[\u200b-\u200d\ufeff]/g, '')
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      // Generated retrieval/render timestamps are transport chrome. Published/updated dates remain.
      .filter(
        (line) =>
          line &&
          !/^(?:page\s+)?(?:generated|rendered|downloaded|accessed)\s+(?:at|on)\s*:?\s*\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T].*)?\.?$/i.test(
            line,
          ),
      )
      .join('\n')
  );
}
const blockTags = new Set([
  'P',
  'DIV',
  'SECTION',
  'ARTICLE',
  'MAIN',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'LI',
  'UL',
  'OL',
  'TABLE',
  'TR',
  'DL',
  'DT',
  'DD',
  'BLOCKQUOTE',
]);
function renderedText(node: Node): string {
  if (node.nodeType === 3) return node.textContent?.replace(/\s+/g, ' ') ?? '';
  if (node.nodeType !== 1) return '';
  const element = node as Element;
  if (element.tagName === 'BR') return '\n';
  const content = [...element.childNodes].map(renderedText).join('');
  if (['TD', 'TH'].includes(element.tagName)) return `${content} | `;
  return blockTags.has(element.tagName) ? `\n${content}\n` : content;
}

/** Parse inert HTML only. JSDOM receives no runScripts/resources option, so it executes/fetches nothing. */
export function normalizeSourceContent(result: SourceFetchResult): NormalizedSource {
  if (!['healthy', 'redirected'].includes(result.status))
    return {
      coverage: 'none',
      reason: `No successful source body (${result.status}); prior evidence is retained`,
    };
  if (result.redirectWarning)
    return {
      coverage: 'none',
      reason: 'Redirect relevance needs review; destination is not a comparable source snapshot',
    };
  if (result.bodyTruncated)
    return {
      coverage: 'none',
      reason: 'Response exceeded the byte limit; partial text is not fingerprinted',
    };
  if (result.httpStatus === 206)
    return { coverage: 'none', reason: 'HTTP partial content is not a complete source snapshot' };
  if (!result.body)
    return {
      coverage: 'none',
      reason: 'No text body; PDF, binary and empty responses have no fingerprint coverage',
    };
  let text: string;
  let coverage: NormalizedSource['coverage'];
  let dynamic = false;
  if (/^text\/plain(?:;|$)/i.test(result.contentType ?? '')) {
    text = cleanLines(result.body);
    coverage = 'plain-text';
  } else if (/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(result.contentType ?? '')) {
    // Parser/CSS diagnostics must not forward untrusted source text to Actions logs.
    const dom = new JSDOM(result.body, { virtualConsole: new VirtualConsole() });
    try {
      const document = dom.window.document;
      dynamic =
        Boolean(document.querySelector('#root, #app, [ng-app], #__next')) ||
        /enable javascript|javascript (?:is )?required/i.test(document.body.textContent ?? '');
      document
        .querySelectorAll(
          'script,style,noscript,template,nav,[role="navigation"],[role="banner"],[role="contentinfo"],body > header,body > footer,[hidden],[aria-hidden="true"],.breadcrumb,.breadcrumbs,[aria-label="breadcrumb"],.cookie-banner,.cookie-consent,#cookie-banner,.generated-timestamp,[data-generated-at]',
        )
        .forEach((node) => node.remove());
      const hostname = new URL(result.finalUrl ?? result.url).hostname;
      if (hostname === 'sfu.ca' || hostname.endsWith('.sfu.ca')) {
        // SFU's older Safety template and newer Recreation template place a duplicate
        // site menu inside <main>. These exact containers were inspected on both public
        // pages; the surrounding .page-content.side-nav also contains facts and must stay.
        document
          .querySelectorAll('#side-bar-content > ul, .page-content__side-nav')
          .forEach((node) => node.remove());
      }
      const candidates = [
        ...document.querySelectorAll(
          'main,[role="main"],#main-content,#maincontent,#page-content,#content,article',
        ),
      ];
      const main = candidates.sort(
        (a, b) => (b.textContent?.length ?? 0) - (a.textContent?.length ?? 0),
      )[0];
      text = cleanLines(renderedText(main ?? document.body));
      coverage = main ? 'main-text' : 'body-text';
    } finally {
      dom.window.close();
    }
  } else
    return {
      coverage: 'none',
      reason: 'Unsupported content type; only HTML and plain text are fingerprinted',
    };
  if (text.length < 120 || text.split(/\s+/).length < 18)
    return {
      coverage: 'none',
      reason: dynamic
        ? 'Dynamic shell has insufficient server-rendered text; browser review is required'
        : 'Page is too thin to establish a useful content fingerprint',
    };
  if (text.length > MAX_SNAPSHOT_TEXT)
    return {
      coverage: 'none',
      reason: 'Relevant text exceeds the snapshot limit; no partial fingerprint is claimed',
    };
  return {
    coverage,
    text,
    reason:
      coverage === 'body-text'
        ? 'Static body text after navigation/chrome removal; no explicit main region was available'
        : 'Normalized static source text; unchanged text does not certify factual correctness',
  };
}

function changeContext(before: string, after: string): SourceChangeContext {
  const oldLines = before.split('\n'),
    newLines = after.split('\n');
  const oldSet = new Set(oldLines),
    newSet = new Set(newLines);
  const compact = (lines: string[]) =>
    lines.slice(0, 6).map((line) => (line.length > 240 ? `${line.slice(0, 239)}…` : line));
  let removed = oldLines.filter((line) => !newSet.has(line));
  let added = newLines.filter((line) => !oldSet.has(line));
  if (!removed.length && !added.length) {
    const index = oldLines.findIndex((line, i) => line !== newLines[i]);
    removed = oldLines.slice(Math.max(0, index), Math.max(0, index) + 3);
    added = newLines.slice(Math.max(0, index), Math.max(0, index) + 3);
  }
  return { removed: compact(removed), added: compact(added) };
}

/** No network call here: each bounded fetch body is consumed once, then discarded. */
export function fingerprintSources(
  fetched: SourceFetchResult[],
  previousState: SourceSnapshotState = emptySourceState(),
): { results: SourceFingerprintResult[]; state: SourceSnapshotState } {
  const state = parseSourceState(previousState);
  const results = fetched.map((result): SourceFingerprintResult => {
    const url = canonicalSourceUrl(result.url);
    const prior = state.sources[url];
    const normalized = normalizeSourceContent(result);
    if (!normalized.text)
      return {
        url,
        status: 'uncovered',
        coverage: 'none',
        reason: normalized.reason,
        ...(prior ? { previousFingerprint: prior.fingerprint } : {}),
        ...(prior?.pending ? { pending: prior.pending } : {}),
      };
    const next = hash(normalized.text);
    const changed = Boolean(prior && prior.fingerprint !== next);
    const pending = changed
      ? {
          detectedAt: result.checkedAt,
          previousFingerprint: prior.fingerprint,
          newFingerprint: next,
          context: changeContext(prior.text, normalized.text),
        }
      : prior?.pending;
    state.sources[url] = {
      url,
      finalUrl: result.finalUrl ?? url,
      fingerprint: next,
      text: normalized.text,
      retrievedAt: result.checkedAt,
      ...(pending ? { pending } : {}),
    };
    return {
      url,
      status: !prior ? 'baseline' : changed ? 'changed' : 'unchanged',
      coverage: normalized.coverage,
      reason: !prior
        ? `Initial snapshot; there is no previous content to compare. ${normalized.reason}`
        : normalized.reason,
      fingerprint: next,
      ...(prior ? { previousFingerprint: prior.fingerprint } : {}),
      ...(pending ? { pending } : {}),
    };
  });
  return { results, state };
}
