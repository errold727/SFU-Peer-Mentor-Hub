import { describe, expect, it } from 'vitest';
import {
  courseToResource,
  enrollmentSnapshotLabel,
  enrollmentSnapshotTable,
  waitlistSnapshotLabel,
} from '../course/comparison';
import type { CourseOffering } from '../course/courseTypes';

const course: CourseOffering = {
  term: 'Spring 2027',
  department: 'TEST',
  courseNumber: '101',
  code: 'TEST 101',
  section: 'D100',
  title: 'Example course',
  meetings: [],
  outlineUrl: 'https://www.sfu.ca/outlines.html',
  courSysUrl: 'https://coursys.sfu.ca/browse/#!semester=1271&subject=TEST',
  snapshotAt: '2026-10-01T12:30:00.000Z',
};

describe('poster enrollment snapshots', () => {
  it('retains recorded counts, section identity, timestamp and enrollment source', () => {
    const resource = courseToResource({
      ...course,
      enrollment: { enrolled: 25, capacity: 30, waitlistCount: 0, waitlistCapacity: 10 },
    });
    const table = enrollmentSnapshotTable([resource]);
    expect(table.rows).toEqual([
      ['TEST 101 · D100 · Spring 2027', '25 / 30 enrolled · Waitlist: 0 / 10', course.snapshotAt],
    ]);
    expect(table.provenance).toEqual([
      {
        id: resource.id,
        title: 'TEST 101 · Spring 2027 · enrollment snapshot',
        sourceUrl: course.courSysUrl,
        lastVerified: '2026-10-01',
      },
    ]);
    expect(table.subtitle).toContain('Recorded counts');
    expect(table.subtitle).toContain('Spring 2027');
  });

  it('never derives available seats or enrolled counts from legacy capacity fields', () => {
    const resource = courseToResource({
      ...course,
      seatsTotal: 30,
      seatsAvailable: 5,
      waitlistAvailable: 4,
      waitlistTotal: 10,
    });
    const row = enrollmentSnapshotTable([resource]).rows[0];
    expect(row[1]).toBe('Unavailable · Waitlist: Unavailable');
    expect(row[1]).not.toContain('25');
    expect(row[1]).not.toContain('6');
  });

  it('keeps unknown values explicit without treating lastUpdated as a snapshot timestamp', () => {
    const resource = courseToResource({
      ...course,
      snapshotAt: undefined,
      lastUpdated: '2026-09-01',
    });
    const table = enrollmentSnapshotTable([resource]);
    expect(table.rows[0][2]).toBe('Unavailable');
    expect(table.provenance[0].lastVerified).toBeNull();
  });

  it('retains partially known counts and does not report missing counts as zero', () => {
    expect(enrollmentSnapshotLabel({ ...course, enrollment: { enrolled: 12 } })).toBe(
      '12 enrolled · capacity unavailable',
    );
    expect(enrollmentSnapshotLabel({ ...course, enrollment: { capacity: 40 } })).toBe(
      'Enrollment unavailable · capacity 40',
    );
    expect(waitlistSnapshotLabel({ ...course, enrollment: { waitlistCount: 0 } })).toBe('0');
    expect(waitlistSnapshotLabel({ ...course, enrollment: { waitlistCapacity: 10 } })).toBe(
      'Count unavailable · capacity 10',
    );
  });

  it('supports multiple distinct sections while ignoring ordinary resources', () => {
    const first = courseToResource(course);
    const second = courseToResource({
      ...course,
      section: 'D200',
      snapshotAt: '2026-10-02T09:00:00Z',
    });
    const table = enrollmentSnapshotTable([first, { ...first, id: 'ordinary-resource' }, second]);
    expect(table.rows).toHaveLength(2);
    expect(table.rows.map((row) => row[0])).toEqual([
      'TEST 101 · D100 · Spring 2027',
      'TEST 101 · D200 · Spring 2027',
    ]);
    expect(table.provenance.map((source) => source.lastVerified)).toEqual([
      '2026-10-01',
      '2026-10-02',
    ]);
  });

  it('keeps existing concise course cards free of snapshot detail and handles older baskets', () => {
    const resource = courseToResource({ ...course, enrollment: { enrolled: 18, capacity: 35 } });
    expect(resource.posterContent).not.toContain('18 / 35');
    expect(resource.posterContent).not.toContain(course.snapshotAt);
    const oldResource = { ...resource, facts: [{ label: 'Instructor', value: 'Unavailable' }] };
    const table = enrollmentSnapshotTable([oldResource]);
    expect(table.rows[0]).toEqual([
      'TEST 101 · Unavailable · Spring 2027',
      'Unavailable · Waitlist: Unavailable',
      'Unavailable',
    ]);
    expect(table.provenance[0].sourceUrl).toBe(resource.sourceUrl);
    expect(table.provenance[0].lastVerified).toBeNull();
  });

  it('identifies the term on each row when the same course and section span two terms', () => {
    const fall = courseToResource({
      ...course,
      term: 'Fall 2026',
      courSysUrl: 'https://coursys.sfu.ca/browse/#!semester=1267&subject=TEST',
      enrollment: { enrolled: 25, capacity: 30, waitlistCount: 2 },
    });
    const spring = courseToResource({
      ...course,
      enrollment: { enrolled: 0, capacity: 30, waitlistCount: 0 },
    });
    const table = enrollmentSnapshotTable([fall, spring]);
    expect(table.columns).toHaveLength(3);
    expect(table.rows.map((row) => row[0])).toEqual([
      'TEST 101 · D100 · Fall 2026',
      'TEST 101 · D100 · Spring 2027',
    ]);
    expect(table.rows.map((row) => row[1])).toEqual([
      '25 / 30 enrolled · Waitlist: 2',
      '0 / 30 enrolled · Waitlist: 0',
    ]);
    expect(table.provenance.map((source) => source.sourceUrl)).toEqual([
      fall.facts!.find((fact) => fact.label === 'Enrollment source')!.value,
      course.courSysUrl,
    ]);
    expect(new Set(table.provenance.map((source) => source.id)).size).toBe(2);
  });

  it('labels missing row terms explicitly instead of guessing from other selected courses', () => {
    const resource = courseToResource(course);
    const table = enrollmentSnapshotTable([{ ...resource, term: undefined }]);
    expect(table.rows[0][0]).toBe('TEST 101 · D100 · Term unavailable');
  });
});
