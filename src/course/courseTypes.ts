export type CourseMeeting = {
  days: string[];
  startMinutes: number;
  endMinutes: number;
  displayStart: string;
  displayEnd: string;
  location?: string;
  startDate?: string;
  endDate?: string;
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
  outlineUrl: string;
  catalogUrl?: string;
  sourceUrl?: string;
  lastUpdated?: string;
};
export type CourseDataset = {
  schemaVersion: 1;
  lastVerified: string;
  note: string;
  courses: CourseOffering[];
};
export const courseId = (c: CourseOffering) => `${c.term}:${c.code}:${c.section}`;
export const terms = { '2027-spring': 'Spring 2027', '2026-fall': 'Fall 2026' };
export const departments = ['ENGL', 'ECON', 'CMPT'];
