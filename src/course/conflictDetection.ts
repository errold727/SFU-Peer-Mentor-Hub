import type { CourseMeeting, CourseOffering } from './courseTypes';
export function meetingsOverlap(a: CourseMeeting, b: CourseMeeting) {
  if (a.startDate && b.endDate && a.startDate > b.endDate) return false;
  if (b.startDate && a.endDate && b.startDate > a.endDate) return false;
  const sharedDays = a.days.filter((day) => b.days.includes(day));
  // A short intersection of teaching dates may not contain the shared weekday.
  const start = [a.startDate, b.startDate]
    .filter((x): x is string => !!x)
    .sort()
    .at(-1);
  const end = [a.endDate, b.endDate].filter((x): x is string => !!x).sort()[0];
  if (start && end) {
    const startMs = Date.parse(start + 'T00:00:00Z'),
      endMs = Date.parse(end + 'T00:00:00Z');
    const dayIndex = new Date(startMs).getUTCDay();
    if (
      !sharedDays.some(
        (day) =>
          startMs +
            ((['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day) - dayIndex + 7) % 7) *
              86400000 <=
          endMs,
      )
    )
      return false;
  }
  return sharedDays.length > 0 && a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
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
              `${x.days.filter((d) => y.days.includes(d)).join(', ')} · ${x.displayStart}–${x.displayEnd} (${x.kind ?? a.section}) / ${y.displayStart}–${y.displayEnd} (${y.kind ?? b.section})`,
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
