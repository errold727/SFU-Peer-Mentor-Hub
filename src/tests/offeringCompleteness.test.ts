import { describe, it, expect } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { normalizeCoursys } from '../../scripts/course-import/coursys';
import {
  publishTerm,
  validateTermDirectory,
  writeJSON,
} from '../../scripts/course-import/pipeline';
import { type CourseManifest, type CourseOffering, type TermCode } from '../course/courseTypes';
import { filterOfferings } from '../course/courseSearch';
import { coursesConflict, meetingsOverlap } from '../course/conflictDetection';
import { courseToResource } from '../course/comparison';
import { resourcePosterText, resourceText } from '../utils/search';
import { resources } from '../data/resources';
const at = '2026-10-04T01:00:00.000Z';
const offering = () =>
  normalizeCoursys(
    [
      'Spring 2027',
      '<a href="/browse/info/2027sp-cmpt-354-d1">CMPT 354 D100</a>',
      'Database Systems',
      '0/190',
      'Example, Instructor',
      'VANCOUVER',
    ],
    '1271',
    at,
  );
async function candidate(dir: string) {
  const c = offering();
  const d = { schemaVersion: 2, termCode: '1271', snapshotAt: at, courses: [c] };
  const m: CourseManifest = {
    schemaVersion: 2,
    termCode: '1271',
    termLabel: 'Spring 2027',
    source: 'SFU CourSys',
    snapshotAt: at,
    completedAt: at,
    subjectCount: 1,
    courseCount: 1,
    sectionCount: 1,
    sourceSectionCount: 1,
    subjects: [{ code: 'CMPT', courseCount: 1, sectionCount: 1, file: 'snapshots/test/CMPT.json' }],
    indexFile: 'snapshots/test/index.json',
    failedSubjects: [],
    complete: true,
    enrollmentSections: 0,
    tutorialLabSections: 0,
    withSchedules: 0,
    withoutSchedules: 1,
    withEnrollment: 1,
    enrichedSections: 0,
    enrichmentFailures: [{ code: c.code, section: c.section, reason: 'Outline HTTP 404' }],
  };
  await writeJSON(join(dir, 'manifest.json'), m);
  await writeJSON(join(dir, 'subjects.json'), {
    termCode: '1271',
    snapshotAt: at,
    subjects: m.subjects,
  });
  await writeJSON(join(dir, m.subjects[0].file), d);
  await writeJSON(join(dir, m.indexFile), d);
  return m;
}
describe('complete staged data promotion', () => {
  it('publishes complete data and preserves the production pointer on incomplete/corrupt candidates', async () => {
    const root = await mkdtemp(join(tmpdir(), 'sfu-course-test-'));
    try {
      const stage = join(root, 'stage'),
        output = join(root, 'public');
      const m = await candidate(stage);
      await publishTerm('1271', output, stage);
      const before = await readFile(join(output, '1271/manifest.json'), 'utf8');
      await writeJSON(join(stage, 'manifest.json'), {
        ...m,
        complete: false,
        failedSubjects: ['MATH'],
      });
      await expect(publishTerm('1271', output, stage)).rejects.toThrow();
      expect(await readFile(join(output, '1271/manifest.json'), 'utf8')).toBe(before);
      await writeJSON(join(stage, 'manifest.json'), m);
      await writeJSON(join(stage, 'snapshots/test/EXTRA.json'), {});
      await expect(validateTermDirectory(stage)).rejects.toThrow('extra subject');
      expect(await readFile(join(output, '1271/manifest.json'), 'utf8')).toBe(before);
    } finally {
      if (
        resolve(root).startsWith(resolve(tmpdir()) + '\\') ||
        resolve(root).startsWith(resolve(tmpdir()) + '/')
      )
        await rm(root, { recursive: true, force: true });
    }
  });
  it('searches across subjects, code, instructor, section and normalized campus', () => {
    const a = offering(),
      b = {
        ...a,
        department: 'LING',
        code: 'LING 282W',
        courseNumber: '282W',
        instructor: 'Budra, Example',
      };
    for (const query of ['cmpt 354', 'database', 'D100', 'vancouver'])
      expect(
        filterOfferings([a], { query, campus: 'All', sectionType: 'All', sort: 'code' }),
      ).toHaveLength(1);
    expect(
      filterOfferings([a, b], { query: 'budra', campus: 'All', sectionType: 'All', sort: 'code' }),
    ).toEqual([b]);
    expect(
      filterOfferings([a, b], { query: '', campus: 'Surrey', sectionType: 'All', sort: 'code' }),
    ).toHaveLength(0);
    expect(
      filterOfferings([a], { query: '', campus: 'All', sectionType: 'All', sort: 'code' })[0]
        .meetings,
    ).toEqual([]);
  });
  it('checks real intersecting teaching weekdays across departments', () => {
    const m = {
      days: ['Mon'],
      startMinutes: 600,
      endMinutes: 660,
      displayStart: '10:00 AM',
      displayEnd: '11:00 AM',
      startDate: '2026-10-05',
      endDate: '2026-10-09',
    };
    const a = { ...offering(), meetings: [m] },
      b = { ...a, department: 'MATH', code: 'MATH 151' };
    expect(coursesConflict(a, b)).toBe(true);
    expect(meetingsOverlap(m, { ...m, startDate: '2026-10-06', endDate: '2026-10-09' })).toBe(
      false,
    );
    expect(meetingsOverlap(m, { ...m, startMinutes: 660, endMinutes: 720 })).toBe(false);
  });
  it('keeps poster bodies concise while retaining full official provenance', () => {
    const c = offering(),
      r = courseToResource(c);
    expect(r.campus).toBe('Vancouver');
    expect(resourcePosterText(r)).toContain('CMPT 354');
    expect(resourcePosterText(r)).not.toMatch(/https?:|Last updated|Last verified/);
    expect(resourceText(r)).toContain(c.courSysUrl);
    for (const item of resources) {
      expect(resourcePosterText(item)).not.toMatch(/https?:\/\//);
      expect(resourceText(item)).toContain(item.sourceUrl);
    }
  });
});
// Checked-in public snapshots are tested offline; the importer is the only live-source boundary.
describe('committed manifest coverage', () => {
  it.each(['1267', '1271'] as TermCode[])('has matching complete files for %s', async (term) => {
    const { manifest: m, courses } = await validateTermDirectory(`public/data/courses/${term}`);
    expect(m.complete).toBe(true);
    expect(m.failedSubjects).toEqual([]);
    expect(courses).toHaveLength(m.sourceSectionCount);
    expect(new Set(courses.map((c: CourseOffering) => c.department)).size).toBe(m.subjectCount);
  });
});
