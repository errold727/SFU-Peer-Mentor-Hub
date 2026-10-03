import type { CourseMeeting, CourseOffering } from './courseTypes';
export function meetingsOverlap(a: CourseMeeting, b: CourseMeeting) {
  if (a.startDate && b.endDate && a.startDate > b.endDate) return false;
  if (b.startDate && a.endDate && b.startDate > a.endDate) return false;
  return (
    a.days.some((day) => b.days.includes(day)) &&
    a.startMinutes < b.endMinutes &&
    b.startMinutes < a.endMinutes
  );
}
export function coursesConflict(a: CourseOffering, b: CourseOffering) {
  return a.term === b.term && a.meetings.some((x) => b.meetings.some((y) => meetingsOverlap(x, y)));
}
export function findConflicts(courses: CourseOffering[]) {
  return courses.flatMap((a, i) =>
    courses
      .slice(i + 1)
      .filter((b) => coursesConflict(a, b))
      .map((b) => ({ a, b })),
  );
}
