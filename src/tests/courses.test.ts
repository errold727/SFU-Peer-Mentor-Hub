import { describe, it, expect } from 'vitest';
import spring from '../../public/data/courses/2027-spring/engl.json';
import fall from '../../public/data/courses/2026-fall/engl.json';
import { coursesConflict, meetingsOverlap, findConflicts } from '../course/conflictDetection';
import { comparisonRows, courseToResource, prerequisiteLabel } from '../course/comparison';
import { validateCourseDataset } from '../course/courseSearch';
import type { CourseOffering } from '../course/courseTypes';
const [a, b, c] = ['211', '234', '383'].map((number) =>
  (spring.courses as CourseOffering[]).find(
    (c) => c.courseNumber === number && c.section === 'D100',
  )!,
);
describe('course planning', () => {
  it('detects complete schedule overlaps', () => expect(coursesConflict(a, b)).toBe(true));
  it('detects partial and contained overlaps', () => {
    expect(
      meetingsOverlap(a.meetings[0], { ...a.meetings[0], startMinutes: 600, endMinutes: 660 }),
    ).toBe(true);
    expect(
      meetingsOverlap(a.meetings[0], { ...a.meetings[0], startMinutes: 580, endMinutes: 590 }),
    ).toBe(true);
  });
  it('allows adjacent meetings', () =>
    expect(
      meetingsOverlap(a.meetings[0], { ...a.meetings[0], startMinutes: 620, endMinutes: 670 }),
    ).toBe(false));
  it('does not conflict on different days', () => expect(coursesConflict(a, c)).toBe(false));
  it('does not conflict across terms', () =>
    expect(coursesConflict(a, fall.courses[0] as CourseOffering)).toBe(false));
  it('respects non-overlapping teaching dates', () =>
    expect(
      meetingsOverlap(
        { ...a.meetings[0], endDate: '2027-02-01' },
        { ...a.meetings[0], startDate: '2027-02-02' },
      ),
    ).toBe(false));
  it('returns each conflicting pair once', () => expect(findConflicts([a, b, c])).toHaveLength(1));
  it('does not infer missing schedules', () =>
    expect(coursesConflict(a, { ...b, meetings: [] })).toBe(false));
  it('compares all requested fields without ranking', () => {
    const rows = comparisonRows([a, b]);
    expect(rows).toHaveLength(8);
    expect(rows.find((r) => r.label === 'Instructor')?.values).toEqual([
      'Paul Budra',
      'Michael Everton',
    ]);
    expect(rows.find((r) => r.label === 'Seats')?.values).toEqual(['Unavailable', 'Unavailable']);
  });
  it('does not infer prerequisites', () =>
    expect(prerequisiteLabel({ ...a, prerequisiteText: undefined })).toBe(
      'Prerequisite information unavailable',
    ));
  it('converts courses into sourced poster content', () => {
    const r = courseToResource(a);
    expect(r.facts?.some((f) => f.value.includes('9:30 AM'))).toBe(true);
    expect(r.sourceUrl).toBe(a.outlineUrl);
  });
  it('validates curated datasets', () => {
    expect(() => validateCourseDataset(spring)).not.toThrow();
    expect(() => validateCourseDataset(fall)).not.toThrow();
  });
  it('rejects invalid meeting times', () =>
    expect(() =>
      validateCourseDataset({
        ...spring,
        courses: [{ ...a, meetings: [{ ...a.meetings[0], endMinutes: 5 }] }],
      }),
    ).toThrow('Invalid meeting interval'));
  it('rejects duplicate offerings', () =>
    expect(() => validateCourseDataset({ ...spring, courses: [a, a] })).toThrow('Duplicate'));
});
