import type { CourseDataset } from './courseTypes';
import { validISODate } from '../utils/verification';
export function displayTime(minutes: number) {
  return `${Math.floor(minutes / 60) % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${minutes < 720 ? 'AM' : 'PM'}`;
}
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
  if (
    !('lastVerified' in data) ||
    !validISODate(data.lastVerified) ||
    !('note' in data) ||
    typeof data.note !== 'string'
  )
    throw new Error('Invalid dataset metadata.');
  const ids = new Set<string>(),
    urls = new Set<string>();
  for (const c of data.courses) {
    if (
      !c ||
      typeof c !== 'object' ||
      ['term', 'department', 'courseNumber', 'code', 'section', 'title', 'outlineUrl'].some(
        (k) => typeof c[k] !== 'string' || !c[k].trim(),
      ) ||
      !Array.isArray(c.meetings)
    )
      throw new Error('Invalid course record.');
    if (
      !/^(Spring|Summer|Fall) 20\d{2}$/.test(c.term) ||
      !/^[A-Z]{2,8}$/.test(c.department) ||
      !/^(?:\d{3}[A-Z]?|X\d{2})$/.test(c.courseNumber) ||
      c.code !== `${c.department} ${c.courseNumber}` ||
      !/^(?:[A-Z]\d{3}|[A-Z]{2}\d{2}|[A-Z]{3}\d)$/.test(c.section)
    )
      throw new Error('Invalid course identifier or term.');
    const [season, year] = c.term.toLowerCase().split(' ');
    const path = `${year}/${season}/${c.department.toLowerCase()}/${c.courseNumber.toLowerCase()}/${c.section.toLowerCase()}`;
    if (c.outlineUrl !== `https://www.sfu.ca/outlines.html?${path}`)
      throw new Error('Invalid official outline URL.');
    if (
      c.sourceUrl !== undefined &&
      c.sourceUrl !== `https://www.sfu.ca/bin/wcm/course-outlines?${path}`
    )
      throw new Error('Invalid official API source.');
    const id = `${c.term}:${c.code}:${c.section}`;
    if (ids.has(id)) throw new Error('Duplicate course record.');
    if (urls.has(c.outlineUrl)) throw new Error('Duplicate outline URL.');
    ids.add(id);
    urls.add(c.outlineUrl);
    for (const key of [
      'instructor',
      'campus',
      'prerequisiteText',
      'sectionType',
      'associatedClass',
      'scheduleNote',
    ])
      if (c[key] !== undefined && typeof c[key] !== 'string')
        throw new Error('Invalid optional course text.');
    if (c.lastUpdated !== undefined && !validISODate(c.lastUpdated))
      throw new Error('Invalid verification date.');
    for (const key of ['seatsTotal', 'seatsAvailable', 'waitlistTotal', 'waitlistAvailable'])
      if (c[key] !== undefined && (!Number.isInteger(c[key]) || c[key] < 0))
        throw new Error('Invalid seat data.');
    for (const m of c.meetings) {
      if (
        !m ||
        !Array.isArray(m.days) ||
        !m.days.length ||
        new Set(m.days).size !== m.days.length ||
        m.days.some(
          (d: unknown) =>
            typeof d !== 'string' || !['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(d),
        ) ||
        !Number.isInteger(m.startMinutes) ||
        !Number.isInteger(m.endMinutes) ||
        m.startMinutes < 0 ||
        m.endMinutes >= 1440 ||
        m.startMinutes >= m.endMinutes ||
        m.displayStart !== displayTime(m.startMinutes) ||
        m.displayEnd !== displayTime(m.endMinutes)
      )
        throw new Error('Invalid meeting interval.');
      if (
        (m.startDate !== undefined && !validISODate(m.startDate)) ||
        (m.endDate !== undefined && !validISODate(m.endDate)) ||
        (m.startDate && m.endDate && m.startDate > m.endDate)
      )
        throw new Error('Invalid meeting dates.');
      for (const key of ['location', 'kind'])
        if (m[key] !== undefined && typeof m[key] !== 'string')
          throw new Error('Invalid meeting text.');
    }
  }
}
