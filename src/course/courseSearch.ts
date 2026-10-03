import { departments, terms, type CourseDataset } from './courseTypes';
export function validateCourseDataset(data: unknown): asserts data is CourseDataset {
  if (
    !data ||
    typeof data !== 'object' ||
    !('schemaVersion' in data) ||
    data.schemaVersion !== 1 ||
    !('courses' in data) ||
    !Array.isArray(data.courses)
  )
    throw new Error('Unsupported course dataset.');
  const ids = new Set<string>();
  for (const c of data.courses) {
    if (
      !c ||
      typeof c !== 'object' ||
      ['term', 'department', 'courseNumber', 'code', 'section', 'title', 'outlineUrl'].some(
        (k) => typeof c[k] !== 'string' || !c[k],
      ) ||
      !Array.isArray(c.meetings) ||
      !/^https:\/\/www\.sfu\.ca\//.test(c.outlineUrl)
    )
      throw new Error('Invalid course record.');
    const id = `${c.term}:${c.code}:${c.section}`;
    if (ids.has(id)) throw new Error('Duplicate course record.');
    ids.add(id);
    for (const m of c.meetings) {
      if (
        !m ||
        !Array.isArray(m.days) ||
        !m.days.length ||
        m.days.some(
          (d: unknown) =>
            typeof d !== 'string' || !['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(d),
        ) ||
        !Number.isInteger(m.startMinutes) ||
        !Number.isInteger(m.endMinutes) ||
        m.startMinutes < 0 ||
        m.endMinutes > 1440 ||
        m.startMinutes >= m.endMinutes ||
        typeof m.displayStart !== 'string' ||
        typeof m.displayEnd !== 'string'
      )
        throw new Error('Invalid meeting interval.');
    }
  }
}
export async function loadCourses(term: string, department: string, signal?: AbortSignal) {
  if (!(term in terms) || !departments.includes(department))
    throw new Error('Choose a supported term and department.');
  const response = await fetch(
    `${import.meta.env.BASE_URL}data/courses/${term}/${department.toLowerCase()}.json`,
    { signal },
  );
  if (!response.ok) throw new Error('Course data could not be loaded. Please try again.');
  const data: unknown = await response.json();
  validateCourseDataset(data);
  if (
    data.courses.some(
      (c) => c.term !== terms[term as keyof typeof terms] || c.department !== department,
    )
  )
    throw new Error('Course dataset does not match the selected filters.');
  return data;
}
