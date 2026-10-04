// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { auditCourses } from '../../scripts/resource-audit/courses';
import {
  buildCoursysBrowseUrl,
  offeringTerms,
  type CourseManifest,
  type CourseOffering,
  type TermCode,
} from '../course/courseTypes';

const snapshotAt = '2026-10-03T12:00:00Z';
const ownedDirectories: string[] = [];
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'resource-audit-courses-'));
  ownedDirectories.push(root);
  for (const termCode of ['1267', '1271'] as TermCode[]) {
    const course: CourseOffering = {
      term: offeringTerms[termCode].label,
      termCode,
      department: 'TEST',
      courseNumber: '101',
      code: 'TEST 101',
      section: 'D100',
      title: 'Synthetic audit fixture',
      meetings: [],
      instructors: [],
      campus: 'Burnaby',
      source: { courSys: true, courseOutlines: false },
      courSysUrl: buildCoursysBrowseUrl(termCode, 'TEST'),
      snapshotAt,
      lastUpdated: '2026-10-03',
    };
    const subjects = [
      { code: 'TEST', courseCount: 1, sectionCount: 1, file: 'snapshots/fixture/TEST.json' },
    ];
    const manifest: CourseManifest = {
      schemaVersion: 2,
      termCode,
      termLabel: offeringTerms[termCode].label,
      source: 'SFU CourSys',
      snapshotAt,
      completedAt: snapshotAt,
      subjectCount: 1,
      courseCount: 1,
      sectionCount: 1,
      sourceSectionCount: 1,
      enrollmentSections: 0,
      tutorialLabSections: 0,
      withSchedules: 0,
      withoutSchedules: 1,
      withEnrollment: 0,
      enrichedSections: 0,
      subjects,
      failedSubjects: [],
      complete: true,
      indexFile: 'snapshots/fixture/index.json',
      enrichmentFailures: [],
    };
    const dataset = { schemaVersion: 2, termCode, snapshotAt, courses: [course] };
    await mkdir(join(root, termCode, 'snapshots/fixture'), { recursive: true });
    for (const [file, data] of Object.entries({
      'manifest.json': manifest,
      'subjects.json': { termCode, snapshotAt, subjects },
      'snapshots/fixture/TEST.json': dataset,
      'snapshots/fixture/index.json': dataset,
    }))
      await writeFile(join(root, termCode, file), JSON.stringify(data));
  }
  return root;
}
async function alter(
  root: string,
  term: TermCode,
  file: string,
  change: (data: Record<string, unknown>) => void,
) {
  const path = join(root, term, file);
  const data = JSON.parse(await readFile(path, 'utf8'));
  change(data);
  await writeFile(path, JSON.stringify(data));
}
afterEach(async () => {
  for (const root of ownedDirectories.splice(0)) {
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep + 'resource-audit-courses-')).toBe(
      true,
    );
    await rm(root, { recursive: true, force: true });
  }
});

describe('read-only weekly course snapshot audit', () => {
  it('runs the production validator and reports both terms separately without fabricating schedules', async () => {
    const root = await fixture();
    const before = await readFile(join(root, '1267', 'manifest.json'), 'utf8');
    const result = await auditCourses(root, new Date('2026-10-04T12:00:00Z'));
    expect(result.terms.map(({ termCode, status }) => [termCode, status])).toEqual([
      ['1267', 'valid'],
      ['1271', 'valid'],
    ]);
    expect(result.terms[0]).toMatchObject({
      term: 'Fall 2026',
      subjectCount: 1,
      courseCount: 1,
      sectionCount: 1,
      withSchedules: 0,
      withoutSchedules: 1,
      snapshotAt,
      snapshotAgeDays: 1,
      stale: false,
    });
    expect(result.findings.map((finding) => finding.code)).toEqual([
      'COURSE_SCHEDULE_UNAVAILABLE',
      'COURSE_SCHEDULE_UNAVAILABLE',
    ]);
    expect(
      result.findings.every(
        (finding) => finding.severity === 'warning' && finding.resourceIds.length === 0,
      ),
    ).toBe(true);
    expect(result.findings[0].message).toContain('does not establish asynchronous');
    expect(await readFile(join(root, '1267', 'manifest.json'), 'utf8')).toBe(before);
  });
  it('uses the central seven-day threshold with exact boundary and explicit policy override', async () => {
    const root = await fixture();
    const now = new Date('2026-10-10T12:00:00Z');
    expect((await auditCourses(root, now)).terms.every((term) => term.stale)).toBe(true);
    expect(
      (await auditCourses(root, new Date(now.getTime() - 1))).terms.every((term) => !term.stale),
    ).toBe(true);
    expect(
      (await auditCourses(root, now, { maxAgeDays: 10 })).findings.some(
        (finding) => finding.code === 'COURSE_SNAPSHOT_STALE',
      ),
    ).toBe(false);
  });
  it('does not conceal future snapshot clocks as fresh timestamps', async () => {
    const result = await auditCourses(await fixture(), new Date('2026-10-02T12:00:00Z'));
    expect(result.terms[0].snapshotAgeDays).toBe(-1);
    expect(
      result.findings.filter((finding) => finding.code === 'COURSE_SNAPSHOT_FUTURE'),
    ).toHaveLength(2);
  });
  it('flags a missing subject as fatal while still auditing the other term', async () => {
    const root = await fixture();
    await rm(join(root, '1267', 'snapshots/fixture/TEST.json'));
    const result = await auditCourses(root, new Date(snapshotAt));
    expect(result.terms[0]).toMatchObject({ status: 'invalid', sectionCount: 1 });
    expect(result.terms[1].status).toBe('valid');
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        code: 'COURSE_VALIDATION_FAILED',
        severity: 'error',
        priority: 'high',
      }),
    );
  });
  it.each(['missing', 'corrupt'])('leaves counts unknown for a %s manifest', async (kind) => {
    const root = await fixture();
    const path = join(root, '1267', 'manifest.json');
    if (kind === 'missing') await rm(path);
    else await writeFile(path, '{broken');
    const result = await auditCourses(root, new Date(snapshotAt));
    expect(result.terms[0]).toMatchObject({
      status: 'invalid',
      subjectCount: null,
      sectionCount: null,
      snapshotAt: null,
      stale: null,
    });
    expect(result.terms[1].status).toBe('valid');
  });
  it('retains failed-subject diagnostics from an incomplete manifest but never certifies it', async () => {
    const root = await fixture();
    await alter(root, '1267', 'manifest.json', (manifest) => {
      manifest.complete = false;
      manifest.failedSubjects = ['MATH'];
    });
    const result = await auditCourses(root, new Date(snapshotAt));
    expect(result.terms[0]).toMatchObject({ status: 'invalid', failedSubjects: ['MATH'] });
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        code: 'COURSE_IMPORT_FAILURES',
        severity: 'error',
        context: 'MATH',
      }),
    );
  });
  it.each(['duplicate', 'bad time', 'bad campus'])(
    'delegates %s rejection to the existing offering validator',
    async (kind) => {
      const root = await fixture();
      await alter(root, '1267', 'snapshots/fixture/TEST.json', (dataset) => {
        const courses = dataset.courses as CourseOffering[];
        if (kind === 'duplicate') courses.push({ ...courses[0] });
        if (kind === 'bad campus') courses[0].campus = 'Invented campus';
        if (kind === 'bad time')
          courses[0].meetings = [
            {
              days: ['Mon'],
              startMinutes: 600,
              endMinutes: 570,
              displayStart: '10:00 AM',
              displayEnd: '9:30 AM',
            },
          ];
      });
      expect((await auditCourses(root, new Date(snapshotAt))).terms[0].status).toBe('invalid');
    },
  );
  it('reports partial schedule notes and outline failures without rewriting the offering', async () => {
    const root = await fixture();
    for (const file of ['snapshots/fixture/TEST.json', 'snapshots/fixture/index.json'])
      await alter(root, '1267', file, (dataset) => {
        (dataset.courses as CourseOffering[])[0].scheduleNote =
          'One meeting has unavailable times.';
        (dataset.courses as CourseOffering[])[0].meetings = [
          {
            days: ['Mon'],
            startMinutes: 570,
            endMinutes: 620,
            displayStart: '9:30 AM',
            displayEnd: '10:20 AM',
          },
        ];
      });
    await alter(root, '1267', 'manifest.json', (manifest) => {
      manifest.withSchedules = 1;
      manifest.withoutSchedules = 0;
      manifest.enrichmentFailures = [
        { code: 'TEST 101', section: 'D100', reason: 'Unavailable outline' },
      ];
    });
    const result = await auditCourses(root, new Date(snapshotAt));
    expect(result.terms[0]).toMatchObject({
      status: 'valid',
      partialScheduleCount: 1,
      enrichmentFailureCount: 1,
    });
    expect(result.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining(['COURSE_SCHEDULE_PARTIAL', 'COURSE_ENRICHMENT_FAILURES']),
    );
  });
  it('does not label an entirely unavailable schedule as a partial known schedule', async () => {
    const root = await fixture();
    for (const file of ['snapshots/fixture/TEST.json', 'snapshots/fixture/index.json'])
      await alter(root, '1267', file, (dataset) => {
        (dataset.courses as CourseOffering[])[0].scheduleNote = 'No usable times are published.';
      });
    const result = await auditCourses(root, new Date(snapshotAt));
    expect(result.terms[0]).toMatchObject({ withoutSchedules: 1, partialScheduleCount: 0 });
    expect(result.findings.some((finding) => finding.code === 'COURSE_SCHEDULE_PARTIAL')).toBe(
      false,
    );
  });
  it('rejects invalid audit clocks and policy rather than manufacturing an age', async () => {
    await expect(auditCourses('unused', new Date('invalid'))).rejects.toThrow('valid audit time');
    await expect(auditCourses('unused', new Date(snapshotAt), { maxAgeDays: 0 })).rejects.toThrow(
      'positive',
    );
  });
});
