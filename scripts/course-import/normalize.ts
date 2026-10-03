import type { CourseOffering, CourseMeeting } from '../../src/course/courseTypes';
import { displayTime } from '../../src/course/validation';
import { validISODate } from '../../src/utils/verification';
type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected source object');
  return value as RecordValue;
}
export function plainText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const entities: Record<string, string> = {
    nbsp: ' ',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    rsquo: '’',
    lsquo: '‘',
    ndash: '–',
    mdash: '—',
  };
  return (
    value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (full, key: string) => {
        if (key.startsWith('#')) {
          const n =
            key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
          return n <= 0x10ffff ? String.fromCodePoint(n) : full;
        }
        return entities[key] ?? full;
      })
      .replace(/\s+/g, ' ')
      .trim() || undefined
  );
}
export function parseTime(value: unknown) {
  if (typeof value !== 'string' || !/^\d{1,2}:\d{2}$/.test(value))
    throw new Error('Malformed source time');
  const [h, m] = value.split(':').map(Number);
  if (h > 23 || m > 59) throw new Error('Malformed source time');
  return h * 60 + m;
}
export function sourceDate(value: unknown) {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string') throw new Error('Malformed source date');
  if (validISODate(value)) return value;
  const match = value.match(/^\w{3} (\w{3}) (\d{2}) \d{2}:\d{2}:\d{2} (?:PST|PDT) (\d{4})$/);
  if (!match) throw new Error('Unrecognized source date');
  const month =
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(
      match[1],
    ) + 1;
  const date = `${match[3]}-${String(month).padStart(2, '0')}-${match[2]}`;
  if (!validISODate(date)) throw new Error('Malformed source date');
  return date;
}
export function normalizeOutline(
  raw: unknown,
  path: string,
  verified: string,
  sectionMeta?: RecordValue,
): CourseOffering {
  const root = record(raw),
    info = record(root.info);
  const [year, season, dept, number, section] = path.split('/');
  const term = `${season[0].toUpperCase() + season.slice(1)} ${year}`;
  if (
    info.term !== term ||
    String(info.dept).toLowerCase() !== dept ||
    String(info.number).toLowerCase() !== number ||
    String(info.section).toLowerCase() !== section ||
    info.outlinePath !== path
  )
    throw new Error('Source identity mismatch');
  if (!Array.isArray(root.courseSchedule)) throw new Error('Missing courseSchedule array');
  const days: Record<string, string> = {
    Mo: 'Mon',
    Tu: 'Tue',
    We: 'Wed',
    Th: 'Thu',
    Fr: 'Fri',
    Sa: 'Sat',
    Su: 'Sun',
  };
  let unavailable = 0;
  const meetings: CourseMeeting[] = [];
  const campuses = new Set<string>();
  for (const entry of root.courseSchedule) {
    const m = record(entry);
    if (m.isExam === true) continue;
    if (plainText(m.campus)) campuses.add(plainText(m.campus)!);
    if (!m.days || !m.startTime || !m.endTime || /TBA|TBD/i.test(String(m.days))) {
      unavailable++;
      continue;
    }
    const meetingDays = String(m.days)
      .split(',')
      .map((s) => days[s.trim()]);
    if (meetingDays.some((d) => !d)) throw new Error('Unrecognized meeting day');
    const startMinutes = parseTime(m.startTime),
      endMinutes = parseTime(m.endTime);
    if (endMinutes <= startMinutes) throw new Error('End before start');
    meetings.push({
      days: meetingDays,
      startMinutes,
      endMinutes,
      displayStart: displayTime(startMinutes),
      displayEnd: displayTime(endMinutes),
      startDate: sourceDate(m.startDate),
      endDate: sourceDate(m.endDate),
      kind: plainText(m.sectionCode),
      location: plainText(m.room),
    });
  }
  return {
    term,
    department: dept.toUpperCase(),
    courseNumber: number.toUpperCase(),
    code: `${dept.toUpperCase()} ${number.toUpperCase()}`,
    section: section.toUpperCase(),
    title: plainText(info.title) ?? '',
    instructor: Array.isArray(root.instructor)
      ? [...new Set(root.instructor.map((i) => plainText(record(i).name)).filter(Boolean))].join(
          ', ',
        ) || undefined
      : undefined,
    meetings,
    campus: [...campuses].join(' / ') || undefined,
    prerequisiteText: plainText(info.prerequisites),
    outlineUrl: `https://www.sfu.ca/outlines.html?${path}`,
    sourceUrl: `https://www.sfu.ca/bin/wcm/course-outlines?${path}`,
    lastUpdated: verified,
    sectionType: plainText(sectionMeta?.sectionCode),
    associatedClass: plainText(sectionMeta?.associatedClass),
    scheduleNote: unavailable
      ? `${unavailable} meeting block(s) have unavailable times. Check the official outline.`
      : undefined,
  };
}
