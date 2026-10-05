// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { resources } from '../data/resources';
import { runAudit, registryDigest } from '../../scripts/resource-audit/engine';
import {
  renderReport,
  renderSummary,
  renderIssue,
  safeText,
  auditCounts,
} from '../../scripts/resource-audit/report';
import { fingerprintSources } from '../../scripts/resource-audit/sources';
import type { SourceFetchResult } from '../utils/resourceLinks';

const now = new Date('2026-10-20T18:00:00Z');
const courseAudit = async () => ({ terms: [], findings: [] });
const resource = () =>
  structuredClone(resources.find((r) => r.highImpact && r.verification?.status === 'reviewed')!);
const body = (word: string) =>
  `<main><h1>Public service information</h1><p>The official public source describes the service, available help, contact guidance and conditions. ${word} details should be read carefully before using this student service.</p></main>`;
const fetched = (
  url: string,
  text = body('Original'),
  checkedAt = '2026-10-19T18:00:00Z',
): SourceFetchResult => ({
  url,
  requestedUrls: [url],
  status: 'healthy',
  checkedAt,
  finalUrl: url,
  httpStatus: 200,
  contentType: 'text/html',
  body: text,
  bytesRead: text.length,
  bodyTruncated: false,
});

describe('weekly audit integration and safe reports', () => {
  it('checks a program registration destination and reports a broken link without renewing verification', async () => {
    const r = structuredClone(resources.find((item) => item.id === 'slc-writeaway')!);
    const registrationUrl = 'https://www.sfu.ca/students/synthetic-registration.html';
    r.program = { ...r.program!, registrationUrl, registrationStatus: 'verified' };
    const before = registryDigest(r);
    const fetchSources = vi.fn(async (urls: string[]) => [...new Set(urls)].map((url) =>
      url === registrationUrl
        ? { ...fetched(url), status: 'notFound' as const, httpStatus: 404, body: undefined }
        : fetched(url),
    ));
    const { report } = await runAudit({ now }, {
      loadResources: async () => [r], courses: courseAudit, fetchSources,
    });
    expect(fetchSources.mock.calls[0][0]).toContain(registrationUrl);
    expect(report.findings).toContainEqual(expect.objectContaining({
      code: 'SOURCE_UNAVAILABLE', url: registrationUrl, resourceIds: [r.id],
    }));
    expect(registryDigest(r)).toBe(before);
    expect(report.integrity.unchanged).toBe(true);
  });
  it('checks every registry record offline without network or factual mutation', async () => {
    const snapshot = structuredClone(resources);
    const before = registryDigest(snapshot);
    const fetchSources = vi.fn();
    const { report } = await runAudit(
      { now, offline: true },
      { loadResources: async () => snapshot, courses: courseAudit, fetchSources },
    );
    expect(report.catalog.totalRecords).toBe(resources.length);
    expect(report.catalog.records).toHaveLength(resources.length);
    expect(registryDigest(snapshot)).toBe(before);
    expect(report.integrity.unchanged).toBe(true);
    expect(fetchSources).not.toHaveBeenCalled();
    expect(renderSummary(report)).toContain('live link and source-change checks were skipped');
  });
  it('surfaces high-impact blocked access as review, never dead or verified', async () => {
    const r = resource();
    const before = r.verification!.verifiedAt;
    const result = {
      ...fetched(r.sourceUrl),
      status: 'blocked' as const,
      httpStatus: 403,
      body: undefined,
    };
    const { report } = await runAudit(
      { now },
      { loadResources: async () => [r], courses: courseAudit, fetchSources: async () => [result] },
    );
    expect(report.findings).toContainEqual(
      expect.objectContaining({ code: 'SOURCE_BLOCKED', priority: 'high', severity: 'warning' }),
    );
    expect(auditCounts(report).broken).toBe(0);
    expect(r.verification!.verifiedAt).toBe(before);
    expect(report.links[0]).not.toHaveProperty('body');
  });
  it('retains changed-source review on later unchanged snapshots until actual review is recorded', async () => {
    const r = resource();
    const first = fingerprintSources([fetched(r.sourceUrl)]);
    const change = fetched(r.sourceUrl, body('Changed'), '2026-10-20T10:00:00Z');
    const options = { now, previousState: first.state };
    const deps = {
      loadResources: async () => [r],
      courses: courseAudit,
      fetchSources: async () => [change],
    };
    const changed = await runAudit(options, deps);
    expect(changed.report.findings).toContainEqual(
      expect.objectContaining({ code: 'SOURCE_CHANGED', priority: 'high' }),
    );
    const repeated = await runAudit({ ...options, previousState: changed.state }, deps);
    expect(repeated.report.fingerprints[0].status).toBe('unchanged');
    expect(repeated.report.findings.some((f) => f.code === 'SOURCE_CHANGED')).toBe(true);
    r.verification!.verifiedAt = '2026-10-20T12:00:00Z';
    r.lastVerified = '2026-10-20';
    const reviewed = await runAudit({ ...options, previousState: changed.state }, deps);
    expect(reviewed.report.findings.some((f) => f.code === 'SOURCE_CHANGED')).toBe(false);
    expect(r.verification!.verifiedAt).toBe('2026-10-20T12:00:00Z');
  });
  it('emits fatal findings rather than reporting green for crashes or a missing registry', async () => {
    const { report } = await runAudit(
      { now },
      {
        loadResources: async () => {
          throw Error('missing');
        },
        courses: async () => {
          throw Error('corrupt');
        },
        fetchSources: async () => {
          throw Error('unexpected');
        },
      },
    );
    expect(report.findings.map((f) => f.code)).toEqual(
      expect.arrayContaining(['REGISTRY_UNAVAILABLE', 'COURSE_AUDIT_CRASH', 'SOURCE_AUDIT_CRASH']),
    );
    expect(auditCounts(report).errors).toBeGreaterThan(0);
    expect(report.gates['Course validation']).toBe('failed');
  });
  it('retains pending source reviews when a later source scan crashes', async () => {
    const r = resource();
    const first = fingerprintSources([fetched(r.sourceUrl)]);
    const changed = fingerprintSources([fetched(r.sourceUrl, body('Changed'))], first.state);
    const { report } = await runAudit(
      { now, previousState: changed.state },
      {
        loadResources: async () => [r],
        courses: courseAudit,
        fetchSources: async () => {
          throw Error('network subsystem failed');
        },
      },
    );
    expect(report.findings.some((f) => f.code === 'SOURCE_CHANGED')).toBe(true);
    expect(report.findings.some((f) => f.code === 'SOURCE_AUDIT_CRASH')).toBe(true);
    expect(renderSummary(report)).toContain('current link/change coverage is incomplete');
  });
  it('detects accidental in-memory mutation as an error', async () => {
    const r = resource();
    const { report } = await runAudit(
      { now },
      {
        loadResources: async () => [r],
        courses: courseAudit,
        fetchSources: async () => {
          r.lastVerified = '2000-01-01';
          return [];
        },
      },
    );
    expect(report.integrity.unchanged).toBe(false);
    expect(report.findings.some((f) => f.code === 'FACTS_MUTATED')).toBe(true);
  });
  it('neutralizes remote Markdown, HTML, mentions and workflow commands in reports', async () => {
    const { report } = await runAudit(
      { now, offline: true },
      { loadResources: async () => [resource()], courses: courseAudit },
    );
    report.findings.push({
      id: 'test',
      code: 'SOURCE_CHANGED',
      severity: 'warning',
      priority: 'high',
      resourceIds: ['synthetic'],
      message: '<img src=x> @everyone\n::error:: [evil](javascript:x)',
      context: 'Do not run `malicious` commands.',
    });
    const markdown = renderReport(report);
    expect(markdown).not.toContain('<img');
    expect(markdown).not.toContain('@everyone');
    expect(markdown).not.toContain('::error::');
    expect(markdown).not.toContain('[evil](javascript:');
    expect(markdown).toContain('HIGH PRIORITY REVIEW REQUIRED');
    expect(renderIssue(report)).toContain('- [ ]');
    expect(safeText('x'.repeat(1000), 10)).toHaveLength(10);
    expect(safeText('20:00 @maintainer')).toBe('20&#58;00 &#64;maintainer');
  });
  it('keeps detailed JSON and Markdown findings when a long issue checklist is bounded', async () => {
    const { report } = await runAudit(
      { now, offline: true },
      { loadResources: async () => [resource()], courses: courseAudit },
    );
    report.findings = Array.from({ length: 500 }, (_, i) => ({
      id: `${i}`,
      code: 'REVIEW_DUE',
      severity: 'warning',
      priority: 'normal',
      resourceIds: [`test-${i}`],
      message: 'A'.repeat(400),
    }));
    expect(renderIssue(report).length).toBeLessThan(45000);
    expect(renderIssue(report)).toContain('further findings');
    expect(renderReport(report)).toContain('test-499');
    expect(report.findings).toHaveLength(500);
  });
});
