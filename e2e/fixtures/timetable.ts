import type { Page } from '@playwright/test';
import {
  buildCoursysBrowseUrl,
  offeringTerms,
  type CourseManifest,
  type CourseMeeting,
  type CourseOffering,
  type OfferingDataset,
  type TermCode,
} from '../../src/course/courseTypes';
import { validateManifest, validateOfferings } from '../../src/course/offeringValidation';
import { displayTime } from '../../src/course/validation';

// Entirely synthetic section data. The official-link shapes satisfy production
// validation; tests never visit those URLs or depend on a live SFU response.
const snapshotAt = '2026-10-04T12:00:00Z';
const snapshotFolder = 'snapshots/timetable-fixture';

function meeting(
  days: string[],
  startMinutes: number,
  endMinutes: number,
  extra: Partial<CourseMeeting> = {},
): CourseMeeting {
  return {
    days,
    startMinutes,
    endMinutes,
    displayStart: displayTime(startMinutes),
    displayEnd: displayTime(endMinutes),
    location: 'Example Room A',
    startDate: '2027-01-04',
    endDate: '2027-04-10',
    kind: 'LEC',
    ...extra,
  };
}

function section(
  courseNumber: string,
  title: string,
  meetings: CourseMeeting[],
  extra: Partial<CourseOffering> = {},
): CourseOffering {
  const termCode = (extra.termCode as TermCode | undefined) ?? '1271';
  const department = extra.department ?? 'TEST';
  const section = extra.section ?? 'D100';
  const outlinePath = `${offeringTerms[termCode].path}/${department.toLowerCase()}/${courseNumber.toLowerCase()}/${section.toLowerCase()}`;
  return {
    term: offeringTerms[termCode].label,
    termCode,
    department,
    courseNumber,
    code: `${department} ${courseNumber}`,
    section,
    title: `Synthetic: ${title}`,
    instructor: 'Example instructor',
    instructors: ['Example instructor'],
    meetings,
    campus: 'Burnaby',
    sectionType: 'LEC',
    enrollmentSection: true,
    prerequisiteText: 'Synthetic fixture; not an enrolment or eligibility decision.',
    outlineUrl: `https://www.sfu.ca/outlines.html?${outlinePath}`,
    sourceUrl: `https://www.sfu.ca/bin/wcm/course-outlines?${outlinePath}`,
    courSysUrl: buildCoursysBrowseUrl(termCode, department),
    source: { courSys: true, courseOutlines: true },
    lastUpdated: '2026-10-04',
    snapshotAt,
    outlineRetrievedAt: snapshotAt,
    description: 'Deterministic browser-test data. This is not a published SFU offering.',
    ...extra,
  };
}

const springCourses: CourseOffering[] = [
  section('101', 'Three-day lecture', [meeting(['Mon', 'Wed', 'Fri'], 570, 620)]),
  section('101', 'Alternative lecture', [meeting(['Tue'], 780, 830)], { section: 'D200' }),
  section('101', 'Independent tutorial', [meeting(['Thu'], 780, 830, { kind: 'TUT' })], {
    section: 'T101',
    sectionType: 'TUT',
    enrollmentSection: false,
  }),
  section('102', 'Same-start overlap', [meeting(['Mon'], 570, 630)]),
  section('103', 'Partial overlap', [meeting(['Mon'], 590, 610)]),
  section('104', 'Adjacent lecture', [meeting(['Mon'], 620, 660)]),
  section('105', 'January dates only', [meeting(['Tue'], 660, 720, { endDate: '2027-01-31' })]),
  section('106', 'March dates only', [meeting(['Tue'], 660, 720, { startDate: '2027-03-01' })]),
  section('107', 'Weekend, early, late and short meetings', [
    meeting(['Sat'], 435, 465, { location: 'Example Saturday Room' }),
    meeting(['Sun'], 1290, 1320, { location: 'Example Sunday Room' }),
    meeting(['Thu'], 570, 580, { location: 'Example Short Room' }),
    meeting(['Mon'], 840, 960, {
      kind: 'EXAM',
      startDate: '2027-04-19',
      endDate: '2027-04-19',
      location: 'Example Exam Room',
    }),
  ]),
  section('108', 'Schedule unavailable', []),
  section('109', 'Partially published schedule', [meeting(['Wed'], 840, 890)], {
    scheduleNote: '1 meeting block(s) have unavailable times. Check the official outline.',
  }),
  section('110', 'Explicit asynchronous delivery', [], {
    deliveryMethod: 'Asynchronous',
    campus: 'Online',
  }),
  ...Array.from({ length: 6 }, (_, index) =>
    section(String(111 + index), `Pagination course ${index + 1}`, [
      meeting(['Fri'], 900 + index * 20, 910 + index * 20),
    ]),
  ),
  section('201', 'Cross-subject Surrey lecture', [meeting(['Tue'], 840, 890)], {
    department: 'ALT',
    campus: 'Surrey',
  }),
  section('202', 'Cross-subject Vancouver lecture', [meeting(['Thu'], 900, 950)], {
    department: 'ALT',
    campus: 'Vancouver',
  }),
];

const fallCourses: CourseOffering[] = [
  section(
    '101',
    'Fall-only evening lecture',
    [meeting(['Tue'], 1090, 1140, { startDate: '2026-09-08', endDate: '2026-12-07' })],
    { termCode: '1267' },
  ),
  section(
    '201',
    'Fall Surrey lecture',
    [meeting(['Thu'], 840, 890, { startDate: '2026-09-08', endDate: '2026-12-07' })],
    { termCode: '1267', department: 'ALT', campus: 'Surrey' },
  ),
];

function termFixtures(termCode: TermCode, courses: CourseOffering[]) {
  const subjects = [...new Set(courses.map((course) => course.department))].sort().map((code) => {
    const subjectCourses = courses.filter((course) => course.department === code);
    return {
      code,
      courseCount: new Set(subjectCourses.map((course) => course.code)).size,
      sectionCount: subjectCourses.length,
      file: `${snapshotFolder}/${code}.json`,
    };
  });
  const withSchedules = courses.filter((course) => course.meetings.length > 0).length;
  const manifest: CourseManifest = {
    schemaVersion: 2,
    termCode,
    termLabel: offeringTerms[termCode].label,
    source: 'SFU CourSys',
    snapshotAt,
    completedAt: snapshotAt,
    subjectCount: subjects.length,
    courseCount: new Set(courses.map((course) => course.code)).size,
    sectionCount: courses.length,
    sourceSectionCount: courses.length,
    enrollmentSections: courses.filter((course) => course.enrollmentSection).length,
    tutorialLabSections: courses.filter((course) =>
      ['TUT', 'LAB'].includes(course.sectionType ?? ''),
    ).length,
    withSchedules,
    withoutSchedules: courses.length - withSchedules,
    withEnrollment: 0,
    enrichedSections: courses.length,
    subjects,
    failedSubjects: [],
    complete: true,
    indexFile: `${snapshotFolder}/index.json`,
    enrichmentFailures: [],
  };
  const datasets: Record<string, OfferingDataset> = {
    [manifest.indexFile]: { schemaVersion: 2, termCode, snapshotAt, courses },
    ...Object.fromEntries(
      subjects.map((subject) => [
        subject.file,
        {
          schemaVersion: 2 as const,
          termCode,
          snapshotAt,
          courses: courses.filter((course) => course.department === subject.code),
        },
      ]),
    ),
  };
  validateManifest(manifest);
  Object.values(datasets).forEach(validateOfferings);
  return { manifest, datasets };
}

export const timetableFixtures = {
  '1267': termFixtures('1267', fallCourses),
  '1271': termFixtures('1271', springCourses),
};

export async function installTimetableFixtures(
  page: Page,
  beforeResponse?: (path: string) => Promise<void>,
) {
  await page.route('**/data/courses/**', async (route) => {
    const path = new URL(route.request().url()).pathname.split('/data/courses/')[1];
    const [term, ...fileParts] = path.split('/');
    const fixture = timetableFixtures[term as TermCode];
    const file = fileParts.join('/');
    const payload = file === 'manifest.json' ? fixture?.manifest : fixture?.datasets[file];
    await beforeResponse?.(path);
    await route.fulfill({
      status: payload ? 200 : 404,
      contentType: 'application/json',
      body: JSON.stringify(payload ?? { error: `Unexpected synthetic fixture path: ${path}` }),
    });
  });
}
