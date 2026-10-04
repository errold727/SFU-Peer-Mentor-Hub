import {
  buildCoursysBrowseUrl,
  courseId,
  offeringTerms,
  type CourseManifest,
  type OfferingDataset,
} from './courseTypes';
import { validateCourseDataset } from './validation';
export const validTimestamp = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
export function validateOfferings(raw: unknown): asserts raw is OfferingDataset {
  const d = raw as OfferingDataset;
  if (
    !d ||
    d.schemaVersion !== 2 ||
    !(d.termCode in offeringTerms) ||
    !validTimestamp(d.snapshotAt) ||
    !Array.isArray(d.courses) ||
    !d.courses.length
  )
    throw Error('Invalid offering dataset');
  const ids = new Set<string>();
  for (const c of d.courses) {
    if (
      c.termCode !== d.termCode ||
      c.term !== offeringTerms[d.termCode].label ||
      !c.source?.courSys ||
      !validTimestamp(c.snapshotAt) ||
      c.courSysUrl !== buildCoursysBrowseUrl(d.termCode, c.department)
    )
      throw Error('Offering provenance mismatch');
    if (ids.has(courseId(c))) throw Error('Duplicate section identity');
    ids.add(courseId(c));
    if (
      !Array.isArray(c.instructors) ||
      c.instructors.some((n) => typeof n !== 'string') ||
      (c.campus && !['Burnaby', 'Surrey', 'Vancouver', 'Online', 'Other'].includes(c.campus))
    )
      throw Error('Invalid normalized display fields');
    if (c.source.courseOutlines !== !!c.outlineUrl) throw Error('Outline provenance mismatch');
    if (c.outlineRetrievedAt && !validTimestamp(c.outlineRetrievedAt))
      throw Error('Invalid outline retrieval time');
    for (const [key, value] of Object.entries(c.enrollment ?? {}))
      if (key !== 'raw' && (!Number.isInteger(value) || Number(value) < 0))
        throw Error('Invalid enrollment count');
    if (c.enrollment?.raw !== undefined && typeof c.enrollment.raw !== 'string')
      throw Error('Invalid enrollment text');
    // Over-capacity is valid source evidence. Never clamp enrolled to capacity.
    const path = `${offeringTerms[d.termCode].path}/${c.department.toLowerCase()}/${c.courseNumber.toLowerCase()}/${c.section.toLowerCase()}`;
    validateCourseDataset({
      schemaVersion: 1,
      lastVerified: d.snapshotAt.slice(0, 10),
      note: 'Validate shared fields',
      courses: [{ ...c, outlineUrl: c.outlineUrl ?? `https://www.sfu.ca/outlines.html?${path}` }],
    });
  }
}
export function validateManifest(raw: unknown): asserts raw is CourseManifest {
  const m = raw as CourseManifest;
  if (
    !m ||
    m.schemaVersion !== 2 ||
    !(m.termCode in offeringTerms) ||
    m.termLabel !== offeringTerms[m.termCode].label ||
    m.source !== 'SFU CourSys' ||
    !validTimestamp(m.snapshotAt) ||
    !validTimestamp(m.completedAt) ||
    !Array.isArray(m.subjects) ||
    !m.subjects.length ||
    !Array.isArray(m.failedSubjects) ||
    typeof m.complete !== 'boolean'
  )
    throw Error('Invalid term manifest');
  if (m.complete && m.failedSubjects.length) throw Error('Failed subjects cannot be complete');
  const ids = new Set<string>();
  for (const s of m.subjects) {
    if (
      !/^[A-Z]{2,8}$/.test(s.code) ||
      ids.has(s.code) ||
      !Number.isInteger(s.sectionCount) ||
      s.sectionCount < 1 ||
      !Number.isInteger(s.courseCount) ||
      s.courseCount < 1 ||
      s.courseCount > s.sectionCount ||
      !/^snapshots\/[a-zA-Z0-9-]+\/[A-Z]{2,8}\.json$/.test(s.file)
    )
      throw Error('Invalid or duplicate subject');
    ids.add(s.code);
  }
  if (
    m.subjectCount !== m.subjects.length ||
    m.sectionCount !== m.subjects.reduce((n, s) => n + s.sectionCount, 0) ||
    m.courseCount !== m.subjects.reduce((n, s) => n + s.courseCount, 0) ||
    (m.complete && m.sectionCount !== m.sourceSectionCount) ||
    m.withSchedules + m.withoutSchedules !== m.sectionCount ||
    !/^snapshots\/[a-zA-Z0-9-]+\/index\.json$/.test(m.indexFile)
  )
    throw Error('Manifest completeness/count mismatch');
}
