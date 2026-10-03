import { describe, it, expect } from 'vitest';
import {
  normalizeOutline,
  parseTime,
  plainText,
  sourceDate,
} from '../../scripts/course-import/normalize';
import { validateCourseDataset } from '../course/validation';
import { conflictDetails, coursesConflict } from '../course/conflictDetection';
import spring from '../../public/data/courses/2027-spring/engl.json';
import type { CourseOffering } from '../course/courseTypes';
const c = spring.courses.find(
  (c) => c.courseNumber === '211' && c.section === 'D100',
) as CourseOffering;
const wrap = (course: unknown) => ({ ...spring, courses: [course] });
const raw = {
  info: {
    dept: 'ENGL',
    number: '211',
    section: 'D100',
    term: 'Spring 2027',
    title: 'The Place of the Past',
    outlinePath: '2027/spring/engl/211/d100',
    prerequisites: '<p>12 units &amp; permission</p>',
  },
  instructor: [{ name: 'Paul Budra' }, { name: 'Paul Budra' }],
  courseSchedule: [
    {
      days: 'Mo, We',
      startTime: '9:30',
      endTime: '10:20',
      sectionCode: 'LEC',
      startDate: 'Tue Jan 05 00:00:00 PST 2027',
      endDate: 'Mon Apr 12 00:00:00 PST 2027',
    },
  ],
};
describe('reviewed course import', () => {
  it('normalizes real API structure without filling unknown campus or seats', () => {
    const result = normalizeOutline(raw, raw.info.outlinePath, '2026-10-03');
    expect(result.meetings[0]).toMatchObject({
      days: ['Mon', 'Wed'],
      startMinutes: 570,
      endMinutes: 620,
      startDate: '2027-01-05',
      kind: 'LEC',
    });
    expect(result.instructor).toBe('Paul Budra');
    expect(result.prerequisiteText).toBe('12 units & permission');
    expect(result.campus).toBeUndefined();
    expect(result.seatsAvailable).toBeUndefined();
    expect(() => validateCourseDataset(wrap(result))).not.toThrow();
  });
  it.each(['24:00', '9:60', '9 AM', 'abc', '-1:00'])('rejects malformed source time %s', (time) =>
    expect(() => parseTime(time)).toThrow(),
  );
  it('preserves partial schedule warnings and excludes exams', () => {
    const result = normalizeOutline(
      {
        ...raw,
        courseSchedule: [
          ...raw.courseSchedule,
          { days: 'TBA' },
          { isExam: true, days: 'Sa', startTime: '12:00', endTime: '15:00' },
        ],
      },
      raw.info.outlinePath,
      '2026-10-03',
    );
    expect(result.meetings).toHaveLength(1);
    expect(result.scheduleNote).toContain('1 meeting');
  });
  it('rejects mismatched identities and unknown days', () => {
    expect(() => normalizeOutline(raw, '2027/spring/engl/234/d100', '2026-10-03')).toThrow(
      'identity',
    );
    expect(() =>
      normalizeOutline(
        { ...raw, courseSchedule: [{ days: 'Xx', startTime: '9:30', endTime: '10:20' }] },
        raw.info.outlinePath,
        '2026-10-03',
      ),
    ).toThrow('day');
  });
  it('converts dates without timezone shifting and strips markup', () => {
    expect(sourceDate('Wed Sep 09 00:00:00 PDT 2026')).toBe('2026-09-09');
    expect(() => sourceDate('Tue Feb 30 00:00:00 PST 2027')).toThrow();
    expect(plainText('<b>A</b>&nbsp;&#66;')).toBe('A B');
  });
  it.each([
    { code: 'FAKE 1' },
    { term: 'Spring someday' },
    { section: '' },
    { department: '<script>' },
    { courseNumber: 'two' },
    { outlineUrl: 'https://evil.example' },
    { lastUpdated: '2026-02-30' },
    { seatsTotal: -1 },
  ])('rejects invalid normalized fields %j', (patch) =>
    expect(() => validateCourseDataset(wrap({ ...c, ...patch }))).toThrow(),
  );
  it('rejects missing metadata and contradictory display times', () => {
    expect(() => validateCourseDataset({ ...spring, lastVerified: null })).toThrow();
    expect(() =>
      validateCourseDataset(wrap({ ...c, meetings: [{ ...c.meetings[0], displayStart: 'Noon' }] })),
    ).toThrow();
  });
  it('finds overlaps in secondary blocks and tutorial schedules', () => {
    const a = {
      ...c,
      meetings: [
        { ...c.meetings[0], days: ['Mon'] },
        { ...c.meetings[0], days: ['Thu'], kind: 'TUT' },
      ],
    };
    const b = { ...c, section: 'D101', meetings: [{ ...c.meetings[0], days: ['Thu'] }] };
    expect(coursesConflict(a, b)).toBe(true);
    expect(conflictDetails(a, b)[0]).toContain('Thu');
    expect(conflictDetails(a, b)[0]).toContain('TUT');
    expect(
      coursesConflict(a, {
        ...b,
        meetings: [{ ...b.meetings[0], startMinutes: 620, endMinutes: 670 }],
      }),
    ).toBe(false);
  });
});
