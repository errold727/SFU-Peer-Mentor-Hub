export type ResourceCategory =
  | 'deadline'
  | 'library'
  | 'recreation'
  | 'safety'
  | 'academic-support'
  | 'international'
  | 'student-essential'
  | 'course-planning';
export type ResourceFact = { label?: string; value: string };
export type SFUResource = {
  id: string;
  title: string;
  shortTitle?: string;
  category: ResourceCategory;
  summary: string;
  facts?: ResourceFact[];
  campus: 'Burnaby' | 'Surrey' | 'Vancouver' | 'All';
  term?: string;
  sourceName: string;
  sourceUrl: string;
  lastVerified: string | null;
  verificationNote?: string;
  posterContent?: string;
  posterCompatible: boolean;
  tags: string[];
  date?: string;
  validUntil?: string;
};
export const categories: Record<ResourceCategory, string> = {
  deadline: 'Deadlines',
  library: 'Library',
  recreation: 'Recreation',
  safety: 'Campus Safety',
  'academic-support': 'Academic Support',
  international: 'International Students',
  'student-essential': 'Student Essentials',
  'course-planning': 'Course Planning',
};
