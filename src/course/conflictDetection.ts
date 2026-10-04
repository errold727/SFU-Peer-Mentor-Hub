import type { CourseMeeting, CourseOffering } from './courseTypes';
import { validISODate } from '../utils/verification';
const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Legacy callers may compare undated recurring patterns. The timetable model
// separately requires complete date bounds before calling an overlap confirmed.
export function sharedMeetingDays(a: CourseMeeting, b: CourseMeeting): string[] {
  if (
    [a, b].some(
      (m) =>
        !Array.isArray(m.days) ||
        (m.startDate !== undefined && !validISODate(m.startDate)) ||
        (m.endDate !== undefined && !validISODate(m.endDate)) ||
        (m.startDate && m.endDate && m.startDate > m.endDate),
    )
  )
    return [];
  const sharedDays = [...new Set(a.days)].filter(
    (day) => week.includes(day) && b.days.includes(day),
  );
  // A short intersection of teaching dates may not contain the shared weekday.
  const start = [a.startDate, b.startDate]
    .filter((x): x is string => !!x)
    .sort()
    .at(-1);
  const end = [a.endDate, b.endDate].filter((x): x is string => !!x).sort()[0];
  if (start && end) {
    if (start > end) return [];
    const startMs = Date.parse(start + 'T00:00:00Z'),
      endMs = Date.parse(end + 'T00:00:00Z');
    const dayIndex = new Date(startMs).getUTCDay();
    return sharedDays.filter(
      (day) => startMs + ((week.indexOf(day) - dayIndex + 7) % 7) * 86400000 <= endMs,
    );
  }
  return sharedDays;
}
export function meetingsOverlap(a: CourseMeeting, b: CourseMeeting) {
  if (
    [a, b].some(
      (m) =>
        !Number.isInteger(m.startMinutes) ||
        !Number.isInteger(m.endMinutes) ||
        m.startMinutes < 0 ||
        m.endMinutes >= 1440 ||
        m.startMinutes >= m.endMinutes,
    )
  )
    return false;
  return (
    a.startMinutes < b.endMinutes &&
    b.startMinutes < a.endMinutes &&
    sharedMeetingDays(a, b).length > 0
  );
}
export function coursesConflict(a: CourseOffering, b: CourseOffering) {
  return a.term === b.term && a.meetings.some((x) => b.meetings.some((y) => meetingsOverlap(x, y)));
}
export function conflictDetails(a: CourseOffering, b: CourseOffering) {
  if (a.term !== b.term) return [];
  return [
    ...new Set(
      a.meetings.flatMap((x) =>
        b.meetings
          .filter((y) => meetingsOverlap(x, y))
          .map(
            (y) =>
              `${sharedMeetingDays(x, y).join(', ')} · ${x.displayStart}–${x.displayEnd} (${x.kind ?? a.section}) / ${y.displayStart}–${y.displayEnd} (${y.kind ?? b.section})`,
          ),
      ),
    ),
  ];
}
export function findConflicts(courses: CourseOffering[]) {
  return courses.flatMap((a, i) =>
    courses
      .slice(i + 1)
      .filter((b) => coursesConflict(a, b))
      .map((b) => ({ a, b })),
  );
}
