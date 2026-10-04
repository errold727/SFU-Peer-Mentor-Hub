import type { CatalogAuditResult } from './catalog';
import type { CourseAuditResult } from './courses';
import type { SourceFingerprintResult } from './sources';
import type { SourceFetchResult } from '../../src/utils/resourceLinks';
import type { Finding } from './types';
import { canonicalSourceUrl } from '../../src/utils/resourceLinks';

export type AuditReport = {
  schemaVersion: 1;
  generatedAt: string;
  timeZone: string;
  commit: string;
  runUrl?: string;
  mode: 'live' | 'offline';
  deepCheck: boolean;
  baseline: { status: 'loaded' | 'missing' | 'invalid'; note: string };
  catalog: CatalogAuditResult;
  courses: CourseAuditResult;
  links: Omit<SourceFetchResult, 'body'>[];
  fingerprints: SourceFingerprintResult[];
  findings: Finding[];
  integrity: { before: string; after: string; unchanged: boolean };
  gates: Record<string, string>;
};

// Neither remote text nor catalog fields may inject HTML, mentions, links or workflow commands.
export function safeText(value: unknown, limit = 600) {
  return String(value ?? '')
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit)
    .replace(/[\\`*_{}[\]()#+.!|~]/g, '\\$&')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/@/g, '&#64;')
    .replace(/:/g, '&#58;');
}

export function auditCounts(report: AuditReport) {
  const links = (status: SourceFetchResult['status']) =>
    report.links.filter((r) => r.status === status).length;
  const freshness = (value: string) =>
    report.catalog.records.filter((r) => r.freshness === value).length;
  return {
    resources: report.catalog.totalRecords,
    configuredUrls: new Set(
      report.catalog.records.flatMap((r) => r.urls.map((u) => canonicalSourceUrl(u.url))),
    ).size,
    sourceUrls: new Set(
      report.catalog.records.flatMap((r) =>
        r.urls.filter((u) => u.roles.includes('source')).map((u) => canonicalSourceUrl(u.url)),
      ),
    ).size,
    uniqueUrls: new Set(report.links.map((r) => r.url)).size,
    healthy: links('healthy'),
    redirected: links('redirected'),
    blocked: links('blocked'),
    broken: links('notFound') + links('invalid'),
    timeout: links('timeout'),
    rateLimited: links('rateLimited'),
    serverError: links('serverError'),
    unknown: links('unknown'),
    fingerprintCoverage: report.fingerprints.filter((r) => r.status !== 'uncovered').length,
    changed: report.fingerprints.filter((r) => r.status === 'changed').length,
    pendingSourceReviews: new Set(
      report.findings.filter((f) => f.code === 'SOURCE_CHANGED').map((f) => f.url),
    ).size,
    fresh: freshness('fresh'),
    reviewSoon: freshness('reviewSoon'),
    reviewDue: freshness('reviewDue'),
    stale: freshness('stale'),
    expired: report.catalog.records.filter((r) => r.lifecycle === 'expired').length,
    historical: report.catalog.records.filter((r) => r.lifecycle === 'historical').length,
    highPriority: new Set(
      report.findings.filter((f) => f.priority === 'high').flatMap((f) => f.resourceIds),
    ).size,
    searchRegressions: report.catalog.search.filter((r) => r.status === 'regression').length,
    posterIssues: report.findings.filter((f) => /POSTER|QR/.test(f.code)).length,
    errors: report.findings.filter((f) => f.severity === 'error').length,
    warnings: report.findings.filter((f) => f.severity === 'warning').length,
  };
}

function findingLines(items: Finding[], checklist = false) {
  return items.map(
    (f) =>
      `${checklist ? '- [ ]' : '-'} **${safeText(f.code)}${f.priority === 'high' ? ' — HIGH PRIORITY REVIEW REQUIRED' : ''}** ${safeText(f.resourceIds.join(', '), 250)}: ${safeText(f.message)}${f.url ? ` — ${safeText(f.url, 350)}` : ''}${f.context ? ` (${safeText(f.context, 500)})` : ''}`,
  );
}

export function renderSummary(report: AuditReport) {
  const c = auditCounts(report);
  return [
    '# SFU Peer Mentor Hub — Weekly Information Audit',
    '',
    `Audit: ${safeText(report.generatedAt)} · ${report.timeZone} · Commit: ${safeText(report.commit)}`,
    '',
    '**Reachability and page fingerprints are not factual verification. verifiedAt and published facts are never refreshed by this audit.**',
    '',
    report.mode === 'offline'
      ? '**Offline run: live link and source-change checks were skipped.**'
      : report.findings.some((f) => f.code === 'SOURCE_AUDIT_CRASH')
        ? '**Source audit failed; current link/change coverage is incomplete.**'
        : 'Live source checks completed with the individual outcomes below.',
    '',
    '| Measure | Count |',
    '| --- | ---: |',
    `| Resources checked | ${c.resources} |`,
    `| Unique source/action/QR URLs checked / configured | ${c.uniqueUrls} / ${c.configuredUrls} |`,
    `| Unique official source URLs configured | ${c.sourceUrls} |`,
    `| Healthy / redirected / blocked | ${c.healthy} / ${c.redirected} / ${c.blocked} |`,
    `| Broken (not found or invalid) / timeout | ${c.broken} / ${c.timeout} |`,
    `| Rate limited / server error / unknown | ${c.rateLimited} / ${c.serverError} / ${c.unknown} |`,
    `| Fingerprinted this run / changed since prior snapshot | ${c.fingerprintCoverage} / ${c.changed} |`,
    `| Sources with pending content reviews | ${c.pendingSourceReviews} |`,
    `| Fresh / review soon / review due / stale | ${c.fresh} / ${c.reviewSoon} / ${c.reviewDue} / ${c.stale} |`,
    `| Expired / historical records | ${c.expired} / ${c.historical} |`,
    `| Resources requiring high priority review | ${c.highPriority} |`,
    `| Search regressions / poster issues | ${c.searchRegressions} / ${c.posterIssues} |`,
    `| Errors / warnings | ${c.errors} / ${c.warnings} |`,
    '',
    `Baseline: ${safeText(report.baseline.status)} — ${safeText(report.baseline.note)}`,
    '',
    '## Course data status',
    '',
    '| Term | Validation | Subjects | Courses | Sections | With / without schedule | Age (days) | Failed subjects |',
    '| --- | --- | ---: | ---: | ---: | --- | ---: | --- |',
    ...report.courses.terms.map(
      (t) =>
        `| ${safeText(t.term)} | ${safeText(t.status)} | ${t.subjectCount ?? 'Unknown'} | ${t.courseCount ?? 'Unknown'} | ${t.sectionCount ?? 'Unknown'} | ${t.withSchedules ?? 'Unknown'} / ${t.withoutSchedules ?? 'Unknown'} | ${t.snapshotAgeDays === null ? 'Unknown' : t.snapshotAgeDays.toFixed(2)} | ${safeText(t.failedSubjects.join(', ') || 'None reported')} |`,
    ),
    '',
    '## Quality gates',
    '',
    ...Object.entries(report.gates).map(
      ([name, status]) => `- ${safeText(name)}: ${safeText(status)}`,
    ),
    `- Published registry unchanged: ${report.integrity.unchanged ? 'yes' : '**NO — ERROR**'}`,
    '',
    '## High priority',
    '',
    ...findingLines(report.findings.filter((f) => f.priority === 'high').slice(0, 12)),
    report.findings.some((f) => f.priority === 'high')
      ? 'Full findings, per-record coverage and source outcomes are in the JSON/Markdown artifact.'
      : 'No high-priority finding this run.',
    '',
    'Automated warnings require review; they do not prove a published fact is wrong. Missing schedules, inaccessible pages and baseline gaps remain explicit.',
    '',
  ].join('\n');
}

export function renderReport(report: AuditReport) {
  const sections: [string, (finding: Finding) => boolean][] = [
    ['Source changes', (f) => f.code === 'SOURCE_CHANGED'],
    [
      'Broken / redirected sources',
      (f) => /LINK_|SOURCE_UNAVAILABLE|REDIRECT/.test(f.code) && !/BLOCKED/.test(f.code),
    ],
    ['Blocked sources', (f) => /BLOCKED|RATE_LIMIT/.test(f.code)],
    ['Review due', (f) => /REVIEW_|STALE|VERIFICATION/.test(f.code)],
    ['Expired / historical', (f) => /EXPIRED|HISTORICAL|TERM_/.test(f.code)],
    ['Search regressions', (f) => f.code === 'SEARCH_REGRESSION'],
    ['Poster content issues', (f) => /POSTER|QR/.test(f.code)],
    ['Unresolved items', () => true],
  ];
  return [
    renderSummary(report),
    ...sections.flatMap(([title, predicate]) => [
      `## ${title}`,
      '',
      ...(report.findings.some(predicate)
        ? findingLines(report.findings.filter(predicate))
        : ['None.']),
      '',
    ]),
    '## All canonical records',
    '',
    '| ID | Category | Freshness | Lifecycle | Term scope | High impact |',
    '| --- | --- | --- | --- | --- | --- |',
    ...report.catalog.records.map(
      (r) =>
        `| ${safeText(r.id)} | ${safeText(r.category)} | ${r.freshness} | ${r.lifecycle} | ${r.termApplicability} | ${r.highImpact ? 'Yes' : 'No'} |`,
    ),
    '',
    '## Search probes',
    '',
    '| Query | Result | Applicable expected IDs | Returned IDs |',
    '| --- | --- | --- | --- |',
    ...report.catalog.search.map(
      (r) =>
        `| ${safeText(r.query)} | ${r.status} | ${safeText(r.applicableIds.join(', '))} | ${safeText(r.actualIds.join(', '), 300)} |`,
    ),
    '',
    '## All source outcomes',
    '',
    '| URL | Link health | Destination / note | Fingerprint coverage |',
    '| --- | --- | --- | --- |',
    ...report.links.map(
      (r) =>
        `| ${safeText(r.url, 500)} | ${r.status} | ${safeText([r.finalUrl, r.note, r.redirectWarning].filter(Boolean).join(' · '), 600)} | ${safeText(report.fingerprints.find((f) => f.url === r.url)?.status ?? 'Not checked')} |`,
    ),
    '',
  ].join('\n');
}

export function renderIssue(report: AuditReport) {
  const findings = [...report.findings].sort(
    (a, b) =>
      Number(b.priority === 'high') - Number(a.priority === 'high') ||
      Number(b.severity === 'error') - Number(a.severity === 'error') ||
      a.id.localeCompare(b.id),
  );
  const lines = findingLines(findings, true);
  let checklist = '';
  let included = 0;
  for (const line of lines) {
    if (checklist.length + line.length > 33000) break;
    checklist += line + '\n';
    included++;
  }
  return `${renderSummary(report)}\n## Review checklist\n\n${checklist}\n${included < lines.length ? `${lines.length - included} further findings are in the audit artifact.\n` : ''}\nThis issue is updated in place. Checkboxes describe this run; closing/resolving factual findings remains a maintainer decision. Source-change alerts persist until a later recorded factual review.\n`;
}
