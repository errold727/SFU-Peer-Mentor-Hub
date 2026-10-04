import type { CourseOffering } from './courseTypes';
import type { SFUResource } from '../data/resources/types';
import { courseId, normalizeCampus } from './courseTypes';
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
    : 'Schedule not yet published';
export const enrollmentLabel = (c: CourseOffering) =>
  c.enrollment?.enrolled !== undefined && c.enrollment.capacity !== undefined
    ? `${c.enrollment.enrolled} / ${c.enrollment.capacity} enrolled`
    : 'Unavailable';
/** Recorded counts only: do not derive availability from capacity minus enrollment. */
export function enrollmentSnapshotLabel(c: CourseOffering) {
  const { enrolled, capacity } = c.enrollment ?? {};
  if (enrolled !== undefined && capacity !== undefined) return `${enrolled} / ${capacity} enrolled`;
  if (enrolled !== undefined) return `${enrolled} enrolled · capacity unavailable`;
  if (capacity !== undefined) return `Enrollment unavailable · capacity ${capacity}`;
  return 'Unavailable';
}
export function waitlistSnapshotLabel(c: CourseOffering) {
  const { waitlistCount, waitlistCapacity } = c.enrollment ?? {};
  if (waitlistCount !== undefined && waitlistCapacity !== undefined)
    return `${waitlistCount} / ${waitlistCapacity}`;
  if (waitlistCount !== undefined) return String(waitlistCount);
  if (waitlistCapacity !== undefined) return `Count unavailable · capacity ${waitlistCapacity}`;
  return 'Unavailable';
}
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
    {
      label: 'Seats',
      values: courses.map((c) =>
        c.enrollment ? enrollmentLabel(c) : seatsLabel(c.seatsAvailable, c.seatsTotal),
      ),
    },
    {
      label: 'Waitlist',
      values: courses.map((c) =>
        c.enrollment?.waitlistCount !== undefined
          ? String(c.enrollment.waitlistCount)
          : seatsLabel(c.waitlistAvailable, c.waitlistTotal),
      ),
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
      { label: 'Enrollment', value: enrollmentSnapshotLabel(c) },
      { label: 'Enrollment waitlist', value: waitlistSnapshotLabel(c) },
      { label: 'Enrollment snapshot', value: c.snapshotAt || 'Unavailable' },
      {
        label: 'Enrollment source',
        value: c.courSysUrl ?? c.sourceUrl ?? c.outlineUrl ?? 'https://coursys.sfu.ca/browse/',
      },
    ],
    posterContent: [
      c.term.toUpperCase(),
      `${c.code} · ${c.section}`,
      c.title,
      c.instructor,
      scheduleLabel(c),
      c.campus,
      'Confirm final details with SFU.',
    ]
      .filter(Boolean)
      .join('\n'),
    campus: ['Burnaby', 'Surrey', 'Vancouver'].includes(normalizeCampus(c.campus) ?? '')
      ? (normalizeCampus(c.campus) as 'Burnaby' | 'Surrey' | 'Vancouver')
      : 'All',
    term: c.term,
    sourceName: c.outlineUrl ? 'SFU Course Outlines' : 'SFU CourSys',
    sourceUrl: c.outlineUrl ?? c.courSysUrl ?? 'https://www.sfu.ca/outlines.html',
    lastVerified: c.snapshotAt?.slice(0, 10) ?? c.lastUpdated ?? null,
    posterCompatible: true,
    tags: [c.code, c.title],
  };
}

/** Poster presentation of course snapshots; source facts remain separately preserved. */
export function enrollmentSnapshotTable(resources: SFUResource[]) {
  const courses = resources.filter((r) => r.id.startsWith('course:'));
  const fact = (r: SFUResource, label: string) =>
    r.facts?.find((f) => f.label === label)?.value || 'Unavailable';
  return {
    title: 'ENROLLMENT SNAPSHOT',
    subtitle: [
      ...new Set(courses.map((r) => r.term).filter(Boolean)),
      'Recorded counts; confirm current details with SFU.',
    ].join(' · '),
    columns: ['Course / section', 'Enrollment', 'Snapshot'],
    rows: courses.map((r) => [
      `${r.title.split(' · ')[0]} · ${fact(r, 'Section')}`,
      `${fact(r, 'Enrollment')} · Waitlist: ${fact(r, 'Enrollment waitlist')}`,
      fact(r, 'Enrollment snapshot'),
    ]),
    provenance: courses.map((r) => ({
      id: r.id,
      title: `${r.title} · enrollment snapshot`,
      sourceUrl:
        fact(r, 'Enrollment source') === 'Unavailable' ? r.sourceUrl : fact(r, 'Enrollment source'),
      lastVerified:
        fact(r, 'Enrollment snapshot') === 'Unavailable'
          ? null
          : fact(r, 'Enrollment snapshot').slice(0, 10),
    })),
  };
}
