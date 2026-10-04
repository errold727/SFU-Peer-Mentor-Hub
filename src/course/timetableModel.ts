import { courseId, type CourseMeeting, type CourseOffering } from './courseTypes';
import {
  conflictDetails,
  findConflicts,
  meetingsOverlap,
  sharedMeetingDays,
} from './conflictDetection';
import { displayTime } from './validation';
import { validISODate } from '../utils/verification';

export const TIMETABLE_COLOR_COUNT = 8;
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export type ScheduleStatus =
  | 'Scheduled'
  | 'Asynchronous — no scheduled meetings'
  | 'Schedule unavailable'
  | 'Partially published schedule'
  | 'Invalid/incomplete meeting data'
  | 'Examination details only';
export type TimetableEntry = {
  id: string;
  course: CourseOffering;
  meeting: CourseMeeting;
  day: string;
  lane: number;
  laneCount: number;
  conflict: boolean;
  colorIndex: number;
};
export type ScheduleSection = {
  course: CourseOffering;
  status: ScheduleStatus;
  warning?: string;
  meetings: CourseMeeting[];
  exams: CourseMeeting[];
  unplacedCount: number;
  incomplete: boolean;
};
export type TimetableConflict = { a: CourseOffering; b: CourseOffering; details: string[] };
export type TimetableModel = {
  term: string;
  days: string[];
  startMinutes: number;
  endMinutes: number;
  entries: TimetableEntry[];
  sections: ScheduleSection[];
  conflicts: TimetableConflict[];
  incomplete: boolean;
};

function bounded(m: CourseMeeting) {
  return !!m.startDate && !!m.endDate;
}
function exam(m: CourseMeeting, c: CourseOffering) {
  return /^(?:EXAM|EXM|EXAMINATION|FINAL(?: EXAM(?:INATION)?)?|MIDTERM(?: EXAM(?:INATION)?)?)$/i.test(
    (m.kind ?? c.sectionType ?? '').trim(),
  );
}
function asynchronous(c: CourseOffering) {
  return /^(?:asynchronous|online[ -]+asynchronous|asynchronous[ -]+online)$/i.test(
    (c.deliveryMethod ?? '').trim().replace(/[–—]/g, '-'),
  );
}
function validMeeting(m: CourseMeeting) {
  return (
    !!m &&
    Array.isArray(m.days) &&
    m.days.length > 0 &&
    new Set(m.days).size === m.days.length &&
    m.days.every((day) => weekdays.includes(day)) &&
    Number.isInteger(m.startMinutes) &&
    Number.isInteger(m.endMinutes) &&
    m.startMinutes >= 0 &&
    m.endMinutes < 1440 &&
    m.startMinutes < m.endMinutes &&
    m.displayStart === displayTime(m.startMinutes) &&
    m.displayEnd === displayTime(m.endMinutes) &&
    (m.startDate === undefined || validISODate(m.startDate)) &&
    (m.endDate === undefined || validISODate(m.endDate)) &&
    (!bounded(m) || (m.startDate! <= m.endDate! && sharedMeetingDays(m, m).length > 0))
  );
}
function courseColor(c: CourseOffering) {
  // Hash identity, not selection order: other selections never recolor this course.
  let hash = 2166136261;
  for (const char of `${c.term}:${c.department}:${c.courseNumber}`)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % TIMETABLE_COLOR_COUNT;
}
function sectionModel(course: CourseOffering): ScheduleSection {
  const raw = Array.isArray(course.meetings) ? course.meetings : [];
  const meetings: CourseMeeting[] = [],
    exams: CourseMeeting[] = [];
  let invalid = Array.isArray(course.meetings) ? 0 : 1;
  let ambiguousDates = false;
  for (const meeting of raw) {
    if (!validMeeting(meeting)) {
      invalid++;
      continue;
    }
    if (exam(meeting, course)) {
      exams.push(meeting);
      // A range of exam dates does not establish a recurring examination pattern.
      if (!bounded(meeting) || meeting.startDate !== meeting.endDate) ambiguousDates = true;
    } else {
      meetings.push(meeting);
      if (!bounded(meeting)) ambiguousDates = true;
    }
  }
  const explicitAsync = asynchronous(course);
  const warnings = [
    course.scheduleNote?.trim(),
    invalid
      ? `${invalid} meeting block(s) have invalid or incomplete data and are not plotted.`
      : undefined,
    ambiguousDates
      ? 'Some meeting dates are unavailable or ambiguous; conflict checking is incomplete.'
      : undefined,
    explicitAsync && meetings.length
      ? 'Asynchronous delivery and scheduled meetings are both listed; confirm the arrangement with SFU.'
      : undefined,
  ].filter((value): value is string => !!value);
  const incomplete = warnings.length > 0 || (!meetings.length && !explicitAsync);
  const status: ScheduleStatus = meetings.length
    ? incomplete
      ? 'Partially published schedule'
      : 'Scheduled'
    : invalid
      ? 'Invalid/incomplete meeting data'
      : explicitAsync && !warnings.length
        ? 'Asynchronous — no scheduled meetings'
        : exams.length
          ? 'Examination details only'
          : 'Schedule unavailable';
  if (!meetings.length && !explicitAsync && !warnings.length)
    warnings.push(
      exams.length
        ? 'Examinations are listed separately; the teaching schedule is unavailable.'
        : 'No published teaching meetings are available; this does not establish asynchronous delivery.',
    );
  return {
    course,
    status,
    warning: warnings.join(' ') || undefined,
    meetings,
    exams,
    unplacedCount: invalid,
    incomplete,
  };
}
function allocateLanes(entries: TimetableEntry[]) {
  const sorted = [...entries].sort(
    (a, b) =>
      a.meeting.startMinutes - b.meeting.startMinutes ||
      b.meeting.endMinutes - a.meeting.endMinutes ||
      a.id.localeCompare(b.id, 'en'),
  );
  let cluster: TimetableEntry[] = [],
    clusterEnd = -1;
  const flush = () => {
    const ends: number[] = [];
    for (const entry of cluster) {
      let lane = ends.findIndex((end) => end <= entry.meeting.startMinutes);
      if (lane < 0) lane = ends.length;
      ends[lane] = entry.meeting.endMinutes;
      entry.lane = lane;
    }
    for (const entry of cluster) entry.laneCount = ends.length;
    cluster = [];
  };
  for (const entry of sorted) {
    // Adjacent intervals start a new cluster and regain the full column width.
    if (entry.meeting.startMinutes >= clusterEnd) flush();
    cluster.push(entry);
    clusterEnd = Math.max(clusterEnd, entry.meeting.endMinutes);
  }
  flush();
  return sorted;
}

export function buildTimetableModel(courses: CourseOffering[]): TimetableModel {
  const terms = new Set(courses.map((c) => c.term));
  if (terms.size > 1) throw new Error('A timetable must contain one term at a time.');
  const unique = [...new Map(courses.map((c) => [courseId(c), c])).values()];
  const sections = unique.map(sectionModel);
  // Only complete bounds can establish a confirmed shared calendar occurrence.
  // One-day exam records are checked without ever entering the recurring grid.
  const eligible = sections.map((section) => ({
    ...section.course,
    meetings: [
      ...section.meetings.filter(bounded),
      ...section.exams.filter((m) => bounded(m) && m.startDate === m.endDate),
    ],
  }));
  const original = new Map(unique.map((c) => [courseId(c), c]));
  const conflicts = findConflicts(eligible).map(({ a, b }) => ({
    a: original.get(courseId(a))!,
    b: original.get(courseId(b))!,
    details: conflictDetails(a, b),
  }));
  const entries = sections.flatMap(({ course, meetings }) =>
    meetings.flatMap((meeting, meetingIndex) => {
      return sharedMeetingDays(meeting, meeting).map((day): TimetableEntry => ({
        id: `${courseId(course)}:${meetingIndex}:${day}`,
        course,
        meeting,
        day,
        lane: 0,
        laneCount: 1,
        colorIndex: courseColor(course),
        conflict:
          bounded(meeting) &&
          eligible.some(
            (other) =>
              courseId(course) !== courseId(other) &&
              other.meetings.some((candidate) =>
                meetingsOverlap({ ...meeting, days: [day] }, candidate),
              ),
          ),
      }));
    }),
  );
  const days = weekdays.filter((day, index) => index < 5 || entries.some((e) => e.day === day));
  return {
    term: unique[0]?.term ?? '',
    days,
    startMinutes: Math.min(
      480,
      ...entries.map((e) => Math.floor(e.meeting.startMinutes / 60) * 60),
    ),
    endMinutes: Math.max(1200, ...entries.map((e) => Math.ceil(e.meeting.endMinutes / 60) * 60)),
    entries: days.flatMap((day) => allocateLanes(entries.filter((entry) => entry.day === day))),
    sections,
    conflicts,
    incomplete: sections.some((section) => section.incomplete),
  };
}
