import type { CourseOffering } from './courseTypes';
import type { SFUResource } from '../data/resources/types';
import { courseId } from './courseTypes';
export const prerequisiteLabel = (c: CourseOffering) =>
  c.prerequisiteText?.trim() || 'Prerequisite information unavailable';
export const scheduleLabel = (c: CourseOffering) =>
  c.meetings.length
    ? c.meetings
        .map(
          (m) =>
            `${m.kind ? m.kind + ' · ' : ''}${m.days.join(', ')} ${m.displayStart}–${m.displayEnd}${m.location ? ' · ' + m.location : ''}`,
        )
        .join('\n')
    : 'Schedule unavailable';
export const seatsLabel = (available?: number, total?: number) =>
  available !== undefined && total !== undefined
    ? `${available} available / ${total} total`
    : total !== undefined
      ? `${total} total · availability unavailable`
      : 'Unavailable';
export function comparisonRows(courses: CourseOffering[]) {
  return [
    { label: 'Term', values: courses.map((c) => c.term) },
    { label: 'Instructor', values: courses.map((c) => c.instructor || 'Unavailable') },
    { label: 'Schedule', values: courses.map(scheduleLabel) },
    { label: 'Section', values: courses.map((c) => c.section) },
    { label: 'Campus', values: courses.map((c) => c.campus || 'Unavailable') },
    { label: 'Course requirement — prerequisites', values: courses.map(prerequisiteLabel) },
    { label: 'Seats', values: courses.map((c) => seatsLabel(c.seatsAvailable, c.seatsTotal)) },
    {
      label: 'Waitlist',
      values: courses.map((c) => seatsLabel(c.waitlistAvailable, c.waitlistTotal)),
    },
  ];
}
export function courseToResource(c: CourseOffering): SFUResource {
  return {
    id: 'course:' + courseId(c),
    title: `${c.code} · ${c.term}`,
    category: 'course-planning',
    summary: c.title,
    facts: [
      { label: 'Section', value: c.section },
      { label: 'Instructor', value: c.instructor || 'Unavailable' },
      { label: 'Schedule', value: scheduleLabel(c) },
      { label: 'Campus', value: c.campus || 'Unavailable' },
      { label: 'Course requirement — prerequisites', value: prerequisiteLabel(c) },
      { label: 'Snapshot', value: 'Verify all required sections in the official outline.' },
    ],
    campus:
      c.campus === 'Burnaby' || c.campus === 'Surrey' || c.campus === 'Vancouver'
        ? c.campus
        : 'All',
    term: c.term,
    sourceName: 'SFU Course Outlines',
    sourceUrl: c.outlineUrl,
    lastVerified: c.lastUpdated ?? null,
    posterCompatible: true,
    tags: [c.code, c.title],
  };
}
