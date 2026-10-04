import { createHash } from 'node:crypto';
import { auditCatalog } from './catalog';
import { auditCourses } from './courses';
import { canonicalSourceUrl, fetchResourceSources } from '../../src/utils/resourceLinks';
import { emptySourceState, fingerprintSources, type SourceSnapshotState } from './sources';
import { auditTimeZone } from './policy';
import type { AuditReport } from './report';
import type { Finding } from './types';

export const registryDigest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
type AuditOptions = {
  now?: Date;
  offline?: boolean;
  deepCheck?: boolean;
  commit?: string;
  runUrl?: string;
  courseRoot?: string;
  previousState?: SourceSnapshotState;
  baseline?: AuditReport['baseline'];
};
type Dependencies = {
  loadResources: () => Promise<unknown>;
  courses: typeof auditCourses;
  fetchSources: typeof fetchResourceSources;
};
const defaults: Dependencies = {
  loadResources: async () => (await import('../../src/data/resources')).resources,
  courses: auditCourses,
  fetchSources: fetchResourceSources,
};

export async function runAudit(options: AuditOptions = {}, overrides: Partial<Dependencies> = {}) {
  const deps = { ...defaults, ...overrides };
  const now = options.now ?? new Date();
  let input: unknown = [];
  const findings: Finding[] = [];
  const fatal = (code: string, message: string) =>
    findings.push({
      id: code,
      code,
      severity: 'error',
      priority: 'normal',
      resourceIds: [],
      message,
    });
  try {
    input = await deps.loadResources();
  } catch {
    fatal(
      'REGISTRY_UNAVAILABLE',
      'The canonical resource registry could not be loaded; no coverage can be claimed.',
    );
  }
  const before = registryDigest(input);
  const catalog = auditCatalog(input, now);
  findings.push(...catalog.findings);
  let courses: Awaited<ReturnType<typeof auditCourses>> = { terms: [], findings: [] };
  try {
    courses = await deps.courses(options.courseRoot ?? 'public/data/courses', now);
  } catch {
    fatal(
      'COURSE_AUDIT_CRASH',
      'Course validation could not complete; inspect the workflow diagnostics.',
    );
  }
  findings.push(...courses.findings);
  let state = options.previousState ?? emptySourceState();
  let sources: Awaited<ReturnType<typeof fetchResourceSources>> = [];
  let fingerprints: ReturnType<typeof fingerprintSources>['results'] = [];
  if (!options.offline) {
    try {
      const urls = catalog.records.flatMap((r) => r.urls.map((entry) => entry.url));
      sources = await deps.fetchSources(urls, {
        maxResponseBytes: options.deepCheck ? 2 * 1024 * 1024 : 512 * 1024,
      });
      const fingerprinted = fingerprintSources(sources, state);
      state = fingerprinted.state;
      fingerprints = fingerprinted.results;
      for (const source of sources) {
        const records = catalog.records.filter((r) =>
          r.urls.some((entry) => canonicalSourceUrl(entry.url) === source.url),
        );
        const ids = records.map((r) => r.id);
        const high = records.some((r) => r.highImpact);
        const unavailable = !['healthy', 'redirected'].includes(source.status);
        if (unavailable || source.redirectWarning) {
          const code =
            source.status === 'blocked'
              ? 'SOURCE_BLOCKED'
              : source.status === 'rateLimited'
                ? 'SOURCE_RATE_LIMITED'
                : source.redirectWarning
                  ? 'SUSPICIOUS_REDIRECT'
                  : 'SOURCE_UNAVAILABLE';
          findings.push({
            id: `${code}:${source.url}`,
            code,
            severity: source.status === 'invalid' ? 'error' : 'warning',
            priority: high ? 'high' : 'normal',
            resourceIds: ids,
            url: source.url,
            message: `${source.status}${source.httpStatus ? ` (HTTP ${source.httpStatus})` : ''}. ${source.note ?? 'Link availability requires review; this is not evidence that the service or fact is invalid.'}`,
            ...(source.redirectWarning ? { context: String(source.redirectWarning) } : {}),
          });
        }
      }
    } catch {
      fatal(
        'SOURCE_AUDIT_CRASH',
        'Source checks or snapshot normalization failed; source-change coverage is incomplete. Existing factual content was preserved.',
      );
    }
  }
  // Retained review alerts must survive a failed fetch/normalization pass too.
  for (const [url, snapshot] of Object.entries(state.sources)) {
    const pending = snapshot.pending;
    if (!pending) continue;
    const unreviewed = catalog.records.filter(
      (r) =>
        r.urls.some((entry) => canonicalSourceUrl(entry.url) === url) &&
        (!r.verifiedAt || Date.parse(r.verifiedAt) <= Date.parse(pending.detectedAt)),
    );
    if (unreviewed.length)
      findings.push({
        id: `SOURCE_CHANGED:${url}`,
        code: 'SOURCE_CHANGED',
        severity: 'warning',
        priority: unreviewed.some((r) => r.highImpact) ? 'high' : 'normal',
        resourceIds: unreviewed.map((r) => r.id),
        url,
        message:
          'Relevant source text changed. Content review is required; this does not prove the Resource Hub wording is wrong.',
        context: `Detected ${pending.detectedAt}; ${pending.previousFingerprint} → ${pending.newFingerprint}. Removed: ${pending.context.removed.join(' ')} Added: ${pending.context.added.join(' ')}`,
      });
  }
  const after = registryDigest(input);
  if (before !== after)
    fatal(
      'FACTS_MUTATED',
      'The audit changed the in-memory resource registry. Publication is prohibited.',
    );
  const report: AuditReport = {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    timeZone: auditTimeZone,
    commit: options.commit ?? 'unknown',
    runUrl: options.runUrl,
    mode: options.offline ? 'offline' : 'live',
    deepCheck: options.deepCheck ?? false,
    baseline: options.baseline ?? {
      status: options.previousState ? 'loaded' : 'missing',
      note: options.previousState
        ? 'Using prior successful public source snapshots.'
        : 'First observation establishes a baseline; no previous content comparison is possible.',
    },
    catalog,
    courses,
    links: sources.map((source) => {
      const metadata = { ...source };
      delete metadata.body;
      return metadata;
    }),
    fingerprints,
    findings,
    integrity: { before, after, unchanged: before === after },
    gates: {
      'Resource schema': catalog.findings.some((f) => f.severity === 'error') ? 'failed' : 'passed',
      'Course validation': findings.some(
        (f) => f.code.startsWith('COURSE_') && f.severity === 'error',
      )
        ? 'failed'
        : 'passed',
      'Unit tests': 'not run by local audit command',
      Lint: 'not run by local audit command',
      Build: 'not run by local audit command',
    },
  };
  return { report, state };
}
