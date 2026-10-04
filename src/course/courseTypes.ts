export type CourseMeeting = {
  days: string[];
  startMinutes: number;
  endMinutes: number;
  displayStart: string;
  displayEnd: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  kind?: string;
};
export type CourseOffering = {
  term: string;
  department: string;
  courseNumber: string;
  code: string;
  section: string;
  title: string;
  instructor?: string;
  meetings: CourseMeeting[];
  campus?: string;
  prerequisiteText?: string;
  seatsTotal?: number;
  seatsAvailable?: number;
  waitlistTotal?: number;
  waitlistAvailable?: number;
  outlineUrl?: string;
  catalogUrl?: string;
  sourceUrl?: string;
  lastUpdated?: string;
  sectionType?: string;
  associatedClass?: string;
  scheduleNote?: string;
  termCode?: string;
  instructors?: string[];
  enrollmentSection?: boolean;
  classNumber?: string;
  deliveryMethod?: string;
  corequisites?: string;
  units?: string;
  designation?: string;
  description?: string;
  registrarNotes?: string;
  crosslisted?: boolean;
  crosslistedWith?: string[];
  enrollment?: {
    enrolled?: number;
    capacity?: number;
    waitlistCount?: number;
    waitlistCapacity?: number;
    raw?: string;
  };
  courSysUrl?: string;
  source?: { courSys: boolean; courseOutlines: boolean };
  snapshotAt?: string;
  outlineRetrievedAt?: string;
};
export type CourseDataset = {
  schemaVersion: 1;
  lastVerified: string;
  note: string;
  courses: CourseOffering[];
};
export const courseId = (c: CourseOffering) => `${c.term}:${c.code}:${c.section}`;
export const offeringTerms = {
  '1267': { label: 'Fall 2026', path: '2026/fall' },
  '1271': { label: 'Spring 2027', path: '2027/spring' },
} as const;
export type TermCode = keyof typeof offeringTerms;
export type OfferingDataset = {
  schemaVersion: 2;
  termCode: TermCode;
  snapshotAt: string;
  courses: CourseOffering[];
};
export type SubjectSummary = {
  code: string;
  courseCount: number;
  sectionCount: number;
  file: string;
};
export type CourseManifest = {
  schemaVersion: 2;
  termCode: TermCode;
  termLabel: string;
  source: 'SFU CourSys';
  snapshotAt: string;
  completedAt: string;
  subjectCount: number;
  courseCount: number;
  sectionCount: number;
  sourceSectionCount: number;
  enrollmentSections: number;
  tutorialLabSections: number;
  withSchedules: number;
  withoutSchedules: number;
  withEnrollment: number;
  enrichedSections: number;
  subjects: SubjectSummary[];
  failedSubjects: string[];
  complete: boolean;
  indexFile: string;
  enrichmentFailures: { code: string; section: string; reason: string }[];
};
export function buildCoursysBrowseUrl(termCode: string, subject?: string) {
  if (!(termCode in offeringTerms) || (subject && !/^[A-Z]{2,8}$/.test(subject)))
    throw Error('Invalid CourSys filter');
  return `https://coursys.sfu.ca/browse/#!semester=${termCode}${subject ? `&subject=${subject}` : ''}`;
}
export function normalizeCampus(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const names: Record<string, string> = {
    brnby: 'Burnaby',
    burnaby: 'Burnaby',
    surry: 'Surrey',
    surrey: 'Surrey',
    vancr: 'Vancouver',
    vancouver: 'Vancouver',
    'harbour ctr': 'Vancouver',
    'harbour centre': 'Vancouver',
    'great north. way': 'Vancouver',
    'other vancouver': 'Vancouver',
    online: 'Online',
    'off-campus': 'Other',
    offcampus: 'Other',
    'distance education': 'Online',
  };
  return names[value.trim().toLowerCase()] ?? 'Other';
}
