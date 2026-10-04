import { beforeEach, describe, expect, it } from 'vitest';
import { courseId, type CourseOffering } from '../course/courseTypes';
import { defaultTimetableTerm, useCoursePlanner } from '../store/coursePlannerStore';

const section = (number: string, term = 'Spring 2027', section = 'D100'): CourseOffering => ({
  term,
  department: 'TEST',
  courseNumber: number,
  code: `TEST ${number}`,
  section,
  title: 'Synthetic selection',
  meetings: [
    {
      days: ['Mon', 'Wed', 'Fri'],
      startMinutes: 570,
      endMinutes: 620,
      displayStart: '9:30 AM',
      displayEnd: '10:20 AM',
    },
  ],
});

describe('session course selections', () => {
  beforeEach(() =>
    useCoursePlanner.setState({ selected: [], mostRecentTerm: null, selectionRevision: {} }),
  );

  it('does not let an earlier detail request re-add a section after its term is cleared', () => {
    const course = section('101');
    const revision = useCoursePlanner.getState().selectionRevision[course.term] ?? 0;
    useCoursePlanner.getState().clearSelectedSectionsForTerm(course.term);
    useCoursePlanner.getState().addSelectedSection(course, revision);
    expect(useCoursePlanner.getState().selected).toEqual([]);
    useCoursePlanner
      .getState()
      .addSelectedSection(course, useCoursePlanner.getState().selectionRevision[course.term]);
    expect(useCoursePlanner.getState().selected).toEqual([course]);
  });

  it('adds a multi-day section once and supports a normal lecture/tutorial/lab load', () => {
    const { addSelectedSection } = useCoursePlanner.getState();
    const course = section('101');
    addSelectedSection(course);
    addSelectedSection({ ...course });
    expect(useCoursePlanner.getState().selected).toHaveLength(1);
    for (let i = 0; i < 15; i++) addSelectedSection(section('101', 'Spring 2027', `T${i}`));
    expect(useCoursePlanner.getState().selected).toHaveLength(16);
    expect(useCoursePlanner.getState().selected[0].meetings[0].days).toHaveLength(3);
  });

  it('separates terms, removes one identity and clears only the requested term', () => {
    const { addSelectedSection, removeSelectedSection, clearSelectedSectionsForTerm } =
      useCoursePlanner.getState();
    const spring = section('101'),
      fall = section('101', 'Fall 2026');
    addSelectedSection(spring);
    addSelectedSection(fall);
    addSelectedSection(section('102'));
    removeSelectedSection(courseId(spring));
    expect(useCoursePlanner.getState().selected.map(courseId)).toEqual([
      courseId(fall),
      courseId(section('102')),
    ]);
    clearSelectedSectionsForTerm('Spring 2027');
    expect(useCoursePlanner.getState().selected).toEqual([fall]);
  });

  it('prefers the browsed term then the most recently selected remaining term', () => {
    const selected = [section('101'), section('101', 'Fall 2026')];
    expect(defaultTimetableTerm(selected, 'Spring 2027', 'Fall 2026')).toBe('Spring 2027');
    expect(defaultTimetableTerm(selected, 'Summer 2027', 'Fall 2026')).toBe('Fall 2026');
    expect(defaultTimetableTerm(selected.slice(0, 1), 'Summer 2027', 'Fall 2026')).toBe(
      'Spring 2027',
    );
  });
});
