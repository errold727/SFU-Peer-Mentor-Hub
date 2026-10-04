export type ResourceCategory =
  | 'deadline'
  | 'library'
  | 'recreation'
  | 'safety'
  | 'academic-support'
  | 'international'
  | 'student-essential'
  | 'course-planning'
  | 'advising'
  | 'digital'
  | 'health'
  | 'accessibility'
  | 'money'
  | 'transport'
  | 'housing'
  | 'food'
  | 'involvement'
  | 'career'
  | 'exchange'
  | 'records'
  | 'rights';
export type Campus = 'Burnaby' | 'Surrey' | 'Vancouver' | 'Online';
export type Audience =
  'Undergraduate' | 'Graduate' | 'International' | 'Exchange' | 'Visiting' | 'FIC' | 'All students';
export type Topic =
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17'
  | '18'
  | '19'
  | '20';
export type ResourceSource = {
  id: string;
  title: string;
  url: string;
  lastRetrievalAttemptAt: string;
  lastRetrievedAt: string | null;
  retrievalStatus: 'retrieved' | 'blocked' | 'unavailable' | 'not-published';
  sourcePublishedAt?: string;
  sourceUpdatedAt?: string;
};
export type Evidence = { field: string; sourceId: string; locator: string; note?: string };
export type ResourceReview = {
  status: 'reviewed' | 'partial' | 'unresolved';
  verifiedAt: string | null;
  reviewedAt: string;
  reviewer: 'agent' | 'human';
  note?: string;
};
export type ResourceSession = {
  day: string;
  sport?: string;
  start: string;
  end: string;
  location: string;
  validFrom: string;
  validUntil: string;
  exceptions: string[];
};
export type DirectoryMetadata = {
  dates?: {
    label: string;
    kind: 'date' | 'range' | 'timestamp';
    start: string;
    end?: string;
    timeZone?: 'America/Vancouver';
  }[];
  schemaVersion: 2;
  topic: Topic;
  provider: { name: string; type: 'sfu' | 'student-organization' | 'external-official' };
  details: { heading: string; body: string }[];
  access: string[];
  eligibility: string[];
  audiences: Audience[];
  campuses: Campus[];
  locations: { campus: Campus; name: string; details?: string }[];
  hours?: string;
  sessions?: ResourceSession[];
  cost: { status: 'unknown' | 'published'; details?: string };
  contacts: { label: string; value: string; kind: 'phone' | 'email' | 'address' }[];
  actionUrl: string;
  sources: ResourceSource[];
  evidence: Evidence[];
  validFrom?: string;
  lifecycle: 'active' | 'historical' | 'discontinued';
  verification: ResourceReview;
  reviewCadence: 'schedule' | 'sensitive' | 'safety' | 'evergreen';
  reviewDueAt: string | null;
  highImpact: boolean;
  secondReview?: { reviewedAt: string; reviewer: 'agent' | 'human'; note: string };
  aliases: string[];
  relatedIds: string[];
  poster: { title: string; facts: string[]; conditions: string[]; mode: 'facts' | 'link' };
};
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
} & Partial<DirectoryMetadata>;
export type DirectoryResource = SFUResource & DirectoryMetadata;
export const categories: Record<ResourceCategory, string> = {
  deadline: 'Deadlines',
  library: 'Library',
  recreation: 'Recreation',
  safety: 'Campus Safety',
  'academic-support': 'Academic Support',
  international: 'International Students',
  'student-essential': 'Student Essentials',
  'course-planning': 'Course Planning',
  advising: 'Academic Advising',
  digital: 'Accounts & Digital Tools',
  health: 'Health & Wellbeing',
  accessibility: 'Accessibility & Community',
  money: 'Money & Financial Aid',
  transport: 'Maps & Transportation',
  housing: 'Housing & Residence',
  food: 'Food & Daily Essentials',
  involvement: 'Clubs & Events',
  career: 'Career & Experience',
  exchange: 'Study Abroad',
  records: 'Student Records',
  rights: 'Rights & Referrals',
};
