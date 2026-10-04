// Recorded public display shape with fictional instructor names; no live requests in unit tests.
import { describe, it, expect } from 'vitest';
import {
  browseRequest,
  normalizeCoursys,
  parseBrowseResponse,
  subjectsFromOfferings,
} from '../../scripts/course-import/coursys';
import { enrichOffering } from '../../scripts/course-import/pipeline';
import { HttpError, isTransient, mapBounded } from '../../scripts/course-import/http';
import { buildCoursysBrowseUrl, normalizeCampus } from '../course/courseTypes';
import { validateOfferings, validateManifest } from '../course/offeringValidation';
const at = '2026-10-04T01:00:00.000Z';
const row = [
  'Fall\u00a02026',
  '<a href="/browse/info/2026fa-cmpt-354-d1">CMPT\u00a0354\u00a0D100</a>',
  'Database Systems',
  '185/190 (+7)',
  'Example, Instructor',
  'Burnaby',
];
const base = () => normalizeCoursys(row, '1267', at);
describe('CourSys public contract', () => {
  it('uses real array query parameters, deterministic ordering and bounded pages', () => {
    const u = new URL(browseRequest('1267', 500));
    expect(u.hash).toBe('');
    expect(u.searchParams.get('semester[]')).toBe('1267');
    expect(u.searchParams.get('length')).toBe('500');
    expect(u.searchParams.get('start')).toBe('500');
    expect(buildCoursysBrowseUrl('1271', 'MATH')).toBe(
      'https://coursys.sfu.ca/browse/#!semester=1271&subject=MATH',
    );
    expect(() => buildCoursysBrowseUrl('1264')).toThrow();
  });
  it('discovers subjects from returned offerings, not a handwritten list', () =>
    expect(
      subjectsFromOfferings([
        base(),
        { ...base(), department: 'ACMA' },
        { ...base(), department: 'CMPT' },
      ]),
    ).toEqual(['ACMA', 'CMPT']));
  it('preserves current enrolment counts without prediction', () => {
    expect(base()).toMatchObject({
      code: 'CMPT 354',
      campus: 'Burnaby',
      enrollment: { enrolled: 185, capacity: 190, waitlistCount: 7 },
      source: { courSys: true, courseOutlines: false },
      meetings: [],
    });
    expect(base().outlineUrl).toBeUndefined();
  });
  it('retains valid offerings when an outline is absent', () =>
    expect(() =>
      validateOfferings({ schemaVersion: 2, termCode: '1267', snapshotAt: at, courses: [base()] }),
    ).not.toThrow());
  it('keeps crosslisted identity and counts separate', () => {
    const r = [...row];
    r[1] += '<br> X <a href="/browse/info/2026fa-math-354-d1">MATH 354 D100</a>';
    r[3] += '<br> X 10/20';
    expect(normalizeCoursys(r, '1267', at)).toMatchObject({
      crosslisted: true,
      crosslistedWith: ['MATH 354 D100'],
      enrollment: { enrolled: 185 },
    });
  });
  it.each([
    ['VANCOUVER', 'Vancouver'],
    ['Harbour Ctr', 'Vancouver'],
    ['Great North. Way', 'Vancouver'],
    ['SURRY', 'Surrey'],
    ['BRNBY', 'Burnaby'],
    ['Online', 'Online'],
    ['Off-campus', 'Other'],
  ])('normalizes %s', (source, expected) => expect(normalizeCampus(source)).toBe(expected));
  it('fails loudly for empty or changed public response contracts', () => {
    expect(() => parseBrowseResponse({ result: 'ok', recordsFiltered: 0, data: [] })).toThrow();
    expect(() =>
      parseBrowseResponse({ result: 'ok', recordsFiltered: 3, data: [['x']] }),
    ).toThrow();
    expect(() => normalizeCoursys(row, '1271', at)).toThrow();
  });
  it('rejects duplicate identities and negative enrollment', () => {
    const wrap = (courses: unknown[]) => ({
      schemaVersion: 2,
      termCode: '1267',
      snapshotAt: at,
      courses,
    });
    expect(() => validateOfferings(wrap([base(), base()]))).toThrow('Duplicate');
    expect(() => validateOfferings(wrap([{ ...base(), enrollment: { enrolled: -1 } }]))).toThrow(
      'enrollment',
    );
    expect(() =>
      validateOfferings(wrap([{ ...base(), enrollment: { enrolled: 11, capacity: 10 } }])),
    ).not.toThrow();
  });
  it('retains an outline with no published schedule', () => {
    const info = {
      dept: 'CMPT',
      number: '354',
      section: 'D100',
      term: 'Fall 2026',
      title: 'Database Systems',
      outlinePath: '2026/fall/cmpt/354/d100',
      type: 'e',
      units: '3',
    };
    expect(enrichOffering(base(), { info }, at)).toMatchObject({
      meetings: [],
      enrollmentSection: true,
      units: '3',
      source: { courseOutlines: true },
    });
  });
  it('does not call incomplete manifests complete', () => {
    expect(() =>
      validateManifest({
        schemaVersion: 2,
        termCode: '1267',
        termLabel: 'Fall 2026',
        source: 'SFU CourSys',
        snapshotAt: at,
        completedAt: at,
        subjects: [{}],
        failedSubjects: ['MATH'],
        complete: true,
      }),
    ).toThrow('Failed subjects');
  });
  it('retries only transient failures', () => {
    expect(isTransient(new HttpError(429))).toBe(true);
    expect(isTransient(new HttpError(503))).toBe(true);
    expect(isTransient(new HttpError(404))).toBe(false);
    expect(isTransient(new SyntaxError())).toBe(false);
  });
  it('bounds worker concurrency and preserves input order', async () => {
    let active = 0,
      peak = 0;
    const values = await mapBounded(
      [1, 2, 3, 4, 5, 6],
      async (n) => {
        active++;
        peak = Math.max(peak, active);
        await Promise.resolve();
        active--;
        return n * 2;
      },
      3,
    );
    expect(peak).toBeLessThanOrEqual(3);
    expect(values).toEqual([2, 4, 6, 8, 10, 12]);
  });
});
