import { plainText } from './normalize';
import {
  buildCoursysBrowseUrl,
  normalizeCampus,
  offeringTerms,
  type CourseOffering,
  type TermCode,
} from '../../src/course/courseTypes';

export type BrowseResponse = { recordsFiltered: number; data: string[][]; result: 'ok' };
export function parseBrowseResponse(raw: unknown): BrowseResponse {
  const x = raw as BrowseResponse;
  if (
    !x ||
    x.result !== 'ok' ||
    !Number.isInteger(x.recordsFiltered) ||
    x.recordsFiltered < 1 ||
    !Array.isArray(x.data) ||
    x.data.some((r) => !Array.isArray(r) || r.length !== 6 || r.some((v) => typeof v !== 'string'))
  )
    throw Error('CourSys browse contract changed or returned an empty term');
  return x;
}
export function browseRequest(term: TermCode, start: number, subject?: string) {
  const params = new URLSearchParams({
    tabledata: 'yes',
    'semester[]': term,
    start: String(start),
    length: '500',
    draw: '1',
    'order[0][column]': '1',
    'order[0][dir]': 'asc',
    'xlist[]': 'yes',
  });
  if (subject) params.set('subject[]', subject);
  return `https://coursys.sfu.ca/browse/?${params}`;
}
export function normalizeCoursys(
  row: string[],
  term: TermCode,
  snapshotAt: string,
): CourseOffering {
  const links = [...row[1].matchAll(/<a href="(\/browse\/info\/[^"<>]+)">([^<]+)<\/a>/g)];
  const identity = plainText(links[0]?.[2])?.match(
    /^([A-Z]{2,8}) (\d{3}[A-Z]?|X\d{2}) ([A-Z0-9]{2,6})$/,
  );
  if (!identity || plainText(row[0]) !== offeringTerms[term].label || !plainText(row[2]))
    throw Error(`CourSys identity/term contract changed: ${JSON.stringify(row.slice(0, 3))}`);
  const [, department, courseNumber, section] = identity;
  const enrollmentRaw = plainText(row[3].split(/<br\s*\/?\s*>/i)[0]);
  const enrollment = enrollmentRaw?.match(/^(\d+)\/(\d+)(?: \(\+(\d+)\))?$/);
  if (!enrollment) throw Error('Unrecognized CourSys enrollment format');
  // The public column is display names, not private instructor/student identifiers.
  const instructors = row[4]
    .split(/<br\s*\/?\s*>|;\s*/i)
    .map(plainText)
    .filter((x): x is string => !!x);
  return {
    term: offeringTerms[term].label,
    termCode: term,
    department,
    courseNumber,
    code: `${department} ${courseNumber}`,
    section,
    title: plainText(row[2].split(/<br\s*\/?\s*>/i)[0])!,
    instructors,
    instructor: instructors.join('; ') || undefined,
    campus: normalizeCampus(plainText(row[5])),
    meetings: [],
    enrollment: {
      enrolled: Number(enrollment[1]),
      capacity: Number(enrollment[2]),
      waitlistCount: Number(enrollment[3] ?? 0),
      raw: enrollmentRaw,
    },
    courSysUrl: buildCoursysBrowseUrl(term, department),
    crosslisted: links.length > 1,
    crosslistedWith: links.length > 1 ? links.slice(1).map((l) => plainText(l[2])!) : undefined,
    source: { courSys: true, courseOutlines: false },
    snapshotAt,
  };
}
export function subjectsFromOfferings(courses: CourseOffering[]) {
  return [...new Set(courses.map((c) => c.department))].sort();
}
