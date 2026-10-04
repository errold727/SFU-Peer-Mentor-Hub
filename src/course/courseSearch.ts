import {
  courseId,
  offeringTerms,
  type CourseManifest,
  type CourseOffering,
  type OfferingDataset,
} from './courseTypes';
import { validateManifest, validateOfferings } from './offeringValidation';
export { validateCourseDataset } from './validation';
async function json(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/courses/${path}`, { signal });
  if (!response.ok) throw Error('Course data could not be loaded. Please try again.');
  try {
    return await response.json();
  } catch {
    throw Error(
      'This course snapshot is unavailable or needs repair. Use the official sources or retry.',
    );
  }
}
export async function loadManifest(term: string, signal?: AbortSignal) {
  if (!(term in offeringTerms)) throw Error('Choose a supported term.');
  const raw = await json(`${term}/manifest.json`, signal);
  try {
    validateManifest(raw);
    if (raw.termCode !== term) throw Error();
  } catch {
    throw Error('This course manifest is unavailable or needs repair.');
  }
  return raw;
}
const cache = new Map<string, OfferingDataset>();
export async function loadOfferings(
  manifest: CourseManifest,
  subject: string,
  signal?: AbortSignal,
) {
  const file =
    subject === 'All'
      ? manifest.indexFile
      : manifest.subjects.find((s) => s.code === subject)?.file;
  if (!file) throw Error('Subject is not in this term snapshot.');
  const path = `${manifest.termCode}/${file}`;
  const saved = cache.get(path);
  if (saved) return saved;
  const raw = await json(path, signal);
  try {
    validateOfferings(raw);
    if (
      raw.termCode !== manifest.termCode ||
      raw.snapshotAt !== manifest.snapshotAt ||
      (subject !== 'All' && raw.courses.some((c) => c.department !== subject))
    )
      throw Error();
    const count =
      subject === 'All'
        ? manifest.sectionCount
        : manifest.subjects.find((s) => s.code === subject)!.sectionCount;
    if (raw.courses.length !== count) throw Error();
  } catch {
    throw Error('This course snapshot is unavailable or needs repair. Use official SFU sources.');
  }
  if (cache.size >= 20) cache.delete(cache.keys().next().value!);
  cache.set(path, raw);
  return raw;
}
export async function loadCourseDetail(c: CourseOffering, manifest: CourseManifest) {
  const d = await loadOfferings(manifest, c.department);
  const detail = d.courses.find((x) => courseId(x) === courseId(c));
  if (!detail) throw Error('Section detail is unavailable in this snapshot.');
  return detail;
}
export type OfferingFilters = { query: string; campus: string; sectionType: string; sort: string };
export function filterOfferings(courses: CourseOffering[], f: OfferingFilters) {
  const words = f.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return courses
    .filter((c) => {
      const text =
        `${c.department} ${c.courseNumber} ${c.code} ${c.title} ${c.section} ${c.instructor ?? ''} ${c.instructors?.join(' ') ?? ''} ${c.campus ?? ''}`.toLowerCase();
      const kind = c.sectionType ?? 'Other';
      return (
        words.every((w) => text.includes(w)) &&
        (f.campus === 'All' ||
          c.campus === f.campus ||
          (f.campus === 'Online' && c.deliveryMethod === 'Online')) &&
        (f.sectionType === 'All' ||
          (f.sectionType === 'Enrollment'
            ? c.enrollmentSection === true
            : f.sectionType === 'Other'
              ? !['LEC', 'TUT', 'LAB', 'SEM'].includes(kind)
              : kind === f.sectionType))
      );
    })
    .sort(
      (a, b) =>
        (f.sort === 'title'
          ? a.title.localeCompare(b.title)
          : a.code.localeCompare(b.code, undefined, { numeric: true })) ||
        a.code.localeCompare(b.code) ||
        a.section.localeCompare(b.section),
    );
}
export function formatSnapshot(value?: string) {
  return value
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Vancouver',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value)) + ' (Vancouver)'
    : 'Unavailable';
}
