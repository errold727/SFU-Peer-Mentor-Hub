import { describe, it, expect } from 'vitest';
import { resources } from '../data/resources';
import { auditResources, classifyResponse, officialSource } from '../utils/resourceHealth';
import { searchResources } from '../utils/search';
import { getVerificationStatus, validISODate } from '../utils/verification';
describe('resource reliability', () => {
  it.each([
    'quiet study',
    'silent floor',
    'safe walk',
    'refund',
    'drop course',
    'library',
    'printing',
    'international student',
    'academic advising',
    'recreation',
    'badminton',
    'computing ID',
    'U-Pass',
  ])('finds useful results for %s', (q) => {
    expect(searchResources(resources, q).length).toBeGreaterThan(0);
  });
  it('prioritizes the intended aliases', () => {
    expect(['belzberg-library', 'fraser-library']).toContain(
      searchResources(resources, 'quiet study')[0].id,
    );
    expect(searchResources(resources, 'printing')[0].id).toBe('printing');
    expect(searchResources(resources, 'drop course')[0].id).toBe('enrolment-changes');
  });
  it('validates all public resource metadata and intentional shared URLs', () => {
    const report = auditResources(resources, new Date('2026-10-03T20:00:00Z'));
    expect(report.errors).toEqual([]);
    expect(report.warnings).toContain('bennett-library: unverified');
    expect(report.sharedSources.length).toBeGreaterThan(0);
    expect(report.sharedSources.every(([, ids]) => new Set(ids).size === ids.length)).toBe(true);
  });
  it('flags missing URLs, duplicate IDs, stale and malformed dates', () => {
    const r = { ...resources[1], sourceUrl: '', lastVerified: '2026-02-30' };
    expect(auditResources([r, r]).errors.length).toBeGreaterThanOrEqual(3);
    expect(auditResources([{ ...r, lastVerified: '2020-01-01' }]).warnings[0]).toContain('stale');
  });
  it.each([
    'javascript:alert(1)',
    'http://www.sfu.ca',
    'https://sfu.ca.evil.example/',
    'https://user:pass@sfu.ca/',
    '',
  ])('rejects unsafe source %s', (url) => expect(officialSource(url)).toBe(false));
  it('rejects impossible and future verification dates', () => {
    expect(validISODate('2026-02-30')).toBe(false);
    expect(getVerificationStatus('2030-01-01', new Date('2026-10-03'))).toBe('unverified');
  });
  it.each([
    [200, false, '', 'reachable'],
    [200, true, '', 'redirect'],
    [403, false, '', 'blocked'],
    [200, false, 'Anubis', 'blocked'],
    [404, false, '', 'invalid'],
    [503, false, '', 'unverified'],
  ] as const)('classifies HTTP %s with context', (code, redirect, body, result) =>
    expect(classifyResponse(code, redirect, body)).toBe(result),
  );
});
