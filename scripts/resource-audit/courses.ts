import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { offeringTerms, type CourseManifest, type TermCode } from '../../src/course/courseTypes';
import { validateManifest } from '../../src/course/offeringValidation';
import { validateTermDirectory } from '../course-import/pipeline';
import { courseSnapshotMaxAgeDays } from './policy';
import type { Finding } from './types';

export type CourseTermAudit = {
  termCode: TermCode;
  term: string;
  status: 'valid' | 'invalid';
  subjectCount: number | null;
  courseCount: number | null;
  sectionCount: number | null;
  withSchedules: number | null;
  withoutSchedules: number | null;
  partialScheduleCount: number | null;
  enrichmentFailureCount: number | null;
  failedSubjects: string[];
  snapshotAt: string | null;
  snapshotAgeDays: number | null;
  stale: boolean | null;
  validationError?: string;
};
export type CourseAuditOptions = {
  validateTerm?: typeof validateTermDirectory;
  readManifest?: (path: string) => Promise<unknown>;
  maxAgeDays?: number;
};
export type CourseAuditResult = { terms: CourseTermAudit[]; findings: Finding[] };
const dayMilliseconds = 86_400_000;

/** Read-only inspection; production validation and the existing importer remain authoritative. */
export async function auditCourses(
  root: string,
  now: Date,
  options: CourseAuditOptions = {},
): Promise<CourseAuditResult> {
  const nowMilliseconds = now.getTime();
  const maxAgeDays = options.maxAgeDays ?? courseSnapshotMaxAgeDays;
  if (!Number.isFinite(nowMilliseconds) || !Number.isFinite(maxAgeDays) || maxAgeDays <= 0)
    throw Error('Course audit requires a valid audit time and positive snapshot-age policy.');
  const validateTerm = options.validateTerm ?? validateTermDirectory;
  const readManifest =
    options.readManifest ?? (async (path) => JSON.parse(await readFile(path, 'utf8')));
  const terms: CourseTermAudit[] = [];
  const findings: Finding[] = [];

  for (const termCode of Object.keys(offeringTerms) as TermCode[]) {
    const term = offeringTerms[termCode].label;
    const report: CourseTermAudit = {
      termCode,
      term,
      status: 'invalid',
      subjectCount: null,
      courseCount: null,
      sectionCount: null,
      withSchedules: null,
      withoutSchedules: null,
      partialScheduleCount: null,
      enrichmentFailureCount: null,
      failedSubjects: [],
      snapshotAt: null,
      snapshotAgeDays: null,
      stale: null,
    };
    const add = (
      code: string,
      severity: Finding['severity'],
      message: string,
      context?: string,
    ) => {
      findings.push({
        id: `course:${termCode}:${code}`,
        code,
        severity,
        priority: severity === 'error' ? 'high' : 'normal',
        resourceIds: [],
        message: `${term}: ${message}`,
        ...(context ? { context } : {}),
      });
    };
    function summarize(manifest: CourseManifest) {
      if (manifest.termCode !== termCode)
        throw Error('Manifest term does not match its directory.');
      report.subjectCount = manifest.subjectCount;
      report.courseCount = manifest.courseCount;
      report.sectionCount = manifest.sectionCount;
      report.withSchedules = manifest.withSchedules;
      report.withoutSchedules = manifest.withoutSchedules;
      report.failedSubjects = [...manifest.failedSubjects];
      report.enrichmentFailureCount = manifest.enrichmentFailures?.length ?? 0;
      report.snapshotAt = manifest.snapshotAt;
      report.snapshotAgeDays =
        (nowMilliseconds - Date.parse(manifest.snapshotAt)) / dayMilliseconds;
      report.stale = report.snapshotAgeDays >= maxAgeDays;
    }
    try {
      const { manifest, courses } = await validateTerm(join(root, termCode));
      summarize(manifest);
      if (!manifest.complete || manifest.failedSubjects.length)
        throw Error('Incomplete term cannot be published.');
      report.partialScheduleCount = courses.filter(
        (course) => course.meetings.length > 0 && !!course.scheduleNote?.trim(),
      ).length;
      report.status = 'valid';
    } catch (error) {
      report.validationError = error instanceof Error ? error.message : 'Course validation failed.';
      // Schema-valid manifest counts are useful diagnostics, not a substitute for dataset validation.
      try {
        const manifest = await readManifest(join(root, termCode, 'manifest.json'));
        validateManifest(manifest);
        summarize(manifest);
      } catch {
        /* Missing or corrupt metadata stays explicitly unknown. */
      }
      add(
        'COURSE_VALIDATION_FAILED',
        'error',
        'Course snapshot validation failed; inspect the manifest and subject datasets.',
        report.validationError,
      );
    }
    if (report.stale)
      add(
        'COURSE_SNAPSHOT_STALE',
        'warning',
        `Snapshot is at least ${maxAgeDays} days old. Check the existing reviewed course-refresh workflow; this audit does not refresh data.`,
        report.snapshotAt ?? undefined,
      );
    if (report.snapshotAgeDays !== null && report.snapshotAgeDays < 0)
      add(
        'COURSE_SNAPSHOT_FUTURE',
        'warning',
        'Snapshot time is later than the audit clock; review timestamp consistency.',
        report.snapshotAt ?? undefined,
      );
    if (report.failedSubjects.length)
      add(
        'COURSE_IMPORT_FAILURES',
        'error',
        `${report.failedSubjects.length} subject imports failed.`,
        report.failedSubjects.join(', '),
      );
    if (report.status === 'valid' && report.withoutSchedules)
      add(
        'COURSE_SCHEDULE_UNAVAILABLE',
        'warning',
        `${report.withoutSchedules} sections have no published meeting schedule. This does not establish asynchronous delivery or timetable availability.`,
      );
    if (report.status === 'valid' && report.partialScheduleCount)
      add(
        'COURSE_SCHEDULE_PARTIAL',
        'warning',
        `${report.partialScheduleCount} sections carry schedule notes requiring review; known meetings are retained without inventing missing times.`,
      );
    if (report.status === 'valid' && report.enrichmentFailureCount)
      add(
        'COURSE_ENRICHMENT_FAILURES',
        'warning',
        `${report.enrichmentFailureCount} course-outline enrichments were unavailable. CourSys coverage can remain valid while outline details are incomplete.`,
      );
    terms.push(report);
  }
  return { terms, findings };
}
