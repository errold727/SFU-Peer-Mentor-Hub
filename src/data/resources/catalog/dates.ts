import { defineResource, type CatalogInput } from './define';
import type { DirectoryResource } from '../types';

// Explicit published dates, never extrapolated from another term.
const checked = '2026-10-04T15:27:33Z';
const allCampuses = ['Burnaby', 'Surrey', 'Vancouver', 'Online'] as const;
type DateItem = { label: string; start: string; end?: string };
function termRecord(
  id: string,
  term: string,
  title: string,
  url: string,
  locator: string,
  dates: DateItem[],
  conditions: string[],
  extra: Partial<CatalogInput> = {},
): DirectoryResource {
  const facts = dates.map((d) => ({
    label: d.label,
    value: `${d.start}${d.end ? ' – ' + d.end : ''}`,
  }));
  return defineResource({
    id,
    title: `${title} — ${term}`,
    topic: '01',
    category: 'deadline',
    term,
    summary: `${title} for undergraduate students. Review the conditions before acting.`,
    provider: { name: 'SFU Student Services', type: 'sfu' },
    access: ['Open the official term page and find the named section.'],
    eligibility: ['Undergraduate dates; graduate deadlines differ.', ...conditions],
    audiences: ['Undergraduate'],
    campuses: [...allCampuses],
    cost: { status: 'unknown' },
    facts,
    dates: dates.map((d) => ({ ...d, kind: d.end ? 'range' : 'date' })),
    validUntil: term === 'Fall 2026' ? '2027-01-04' : '2027-05-07',
    verification: {
      status: 'reviewed',
      reviewedAt: checked,
      verifiedAt: checked,
      reviewer: 'agent',
    },
    reviewCadence: 'sensitive',
    highImpact: true,
    poster: {
      title: `${title} · ${term}`,
      facts: facts.slice(0, 4).map((f) => `${f.label}: ${f.value}`),
      conditions: ['Undergraduate dates.', ...conditions],
      mode: 'facts',
    },
    sources: [
      {
        title: `SFU ${term} dates`,
        url,
        locator,
        fields: [
          'title',
          'summary',
          'access',
          'eligibility',
          'audiences',
          'facts',
          'dates',
          'details',
          'poster',
          'term',
        ],
        lastRetrievalAttemptAt: checked,
        lastRetrievedAt: checked,
        retrievalStatus: 'retrieved',
      },
    ],
    tags: ['dates', term],
    ...extra,
  });
}
const fall = 'https://www.sfu.ca/students/deadlines/fall.html';
const spring = 'https://www.sfu.ca/students/deadlines/spring.html';
const calendar = 'https://www.sfu.ca/students/calendar/2026/fall/academic-dates/';
const refundConditions = [
  'Tuition refunds are separate from academic-record withdrawal rules.',
  'Ask the department about mandatory supplementary course-fee refunds.',
];
const withdrawalConditions = [
  'Dropping every class has different record consequences from dropping one class.',
  'These dates do not determine tuition refunds.',
];
const aidConditions = ['Application windows do not establish eligibility or guarantee funding.'];
export const dateResources: DirectoryResource[] = [
  termRecord(
    'deadline-0',
    'Fall 2026',
    'Classes, exams and closures',
    calendar + '2026.html',
    'Fall Term (September–December 2026)',
    [
      { label: 'Classes', start: '2026-09-09', end: '2026-12-07' },
      { label: 'Exams', start: '2026-12-09', end: '2026-12-20' },
      { label: 'Thanksgiving closure', start: '2026-10-12' },
      { label: 'Remembrance Day closure', start: '2026-11-11' },
    ],
    ['Exam dates are a period, not your individual exam schedule.'],
    {
      details: [
        {
          heading: 'Earlier closures',
          body: 'University closed September 7 and September 30, 2026.',
        },
      ],
      relatedIds: ['course-outlines'],
    },
  ),
  termRecord(
    'spring-term-dates',
    'Spring 2027',
    'Classes, exams and closures',
    calendar + '2027.html',
    'Spring Term (January–April 2027)',
    [
      { label: 'Classes', start: '2027-01-05', end: '2027-04-12' },
      { label: 'Exams', start: '2027-04-14', end: '2027-04-26' },
      { label: 'Reading break (classes cancelled)', start: '2027-02-16', end: '2027-02-21' },
    ],
    ['Exam dates are a period, not your individual exam schedule.'],
    {
      details: [
        {
          heading: 'University closures',
          body: 'January 1, February 15, March 26 and March 29, 2027.',
        },
      ],
    },
  ),
  termRecord(
    'deadline-1',
    'Fall 2026',
    'Add, swap and tutorial changes',
    fall,
    'Classes: add/swap/change tutorial',
    [
      { label: 'goSFU add/swap/tutorial change', start: '2026-09-15' },
      { label: 'Department add/tutorial change', start: '2026-09-29' },
    ],
    ['Department additions require chair and instructor permission.'],
    { aliases: ['add course', 'swap class', '换课'] },
  ),
  termRecord(
    'spring-course-changes',
    'Spring 2027',
    'Add, swap and tutorial changes',
    spring,
    'Classes: add/swap/change tutorial',
    [
      { label: 'goSFU add/swap/tutorial change', start: '2027-01-11' },
      { label: 'Department add/tutorial change', start: '2027-01-25' },
    ],
    ['Department additions require chair and instructor permission.'],
    { aliases: ['add course', 'swap class', '换课'] },
  ),
  termRecord(
    'deadline-2',
    'Fall 2026',
    'Course tuition refund deadlines',
    fall,
    'Tuition and Supplementary Fees refunds',
    [
      { label: '100% tuition refund through', start: '2026-09-15' },
      { label: '75% through', start: '2026-09-22' },
      { label: '50% through', start: '2026-09-29' },
      { label: 'No tuition refund from', start: '2026-09-30' },
    ],
    refundConditions,
    { aliases: ['course refund', '退课退费', 'drop course refund'] },
  ),
  termRecord(
    'spring-tuition-refunds',
    'Spring 2027',
    'Course tuition refund deadlines',
    spring,
    'Refunds/interest charges',
    [
      { label: '100% tuition refund through', start: '2027-01-11' },
      { label: '75% through', start: '2027-01-18' },
      { label: '50% through', start: '2027-01-25' },
      { label: 'No tuition refund from', start: '2027-01-26' },
    ],
    refundConditions,
    { aliases: ['course refund', '退课退费', 'drop course refund'] },
  ),
  termRecord(
    'deadline-3',
    'Fall 2026',
    'Drop and withdrawal notation',
    fall,
    'Classes: drop/withdraw/extenuating circumstances (WE)',
    [
      { label: 'All classes: no notation through', start: '2026-09-15' },
      { label: 'One class: no WD through', start: '2026-09-22' },
      { label: 'goSFU drop with WD through', start: '2026-11-03' },
      { label: 'Current-term WE only from', start: '2026-11-04' },
    ],
    withdrawalConditions,
    { aliases: ['drop course', 'withdraw', '退课'], date: '2026-11-03' },
  ),
  termRecord(
    'spring-withdrawal',
    'Spring 2027',
    'Drop and withdrawal notation',
    spring,
    'Classes: drop/withdraw/extenuating circumstances (WE)',
    [
      { label: 'All classes: no notation through', start: '2027-01-11' },
      { label: 'One class: no WD through', start: '2027-01-18' },
      { label: 'goSFU drop with WD through', start: '2027-03-08' },
      { label: 'Current-term WE only from', start: '2027-03-09' },
    ],
    withdrawalConditions,
    { aliases: ['drop course', 'withdraw', '退课'], date: '2027-03-08' },
  ),
  termRecord(
    'deadline-5',
    'Fall 2026',
    'Tuition and fee payment dates',
    fall,
    'Payments Due',
    [
      { label: 'Tuition/supplementary fees', start: '2026-09-22' },
      { label: 'Co-op practicum fees', start: '2026-10-23' },
    ],
    ['Allow payment processing time; consult How to Pay.'],
    { aliases: ['学费', 'tuition payment'] },
  ),
  termRecord(
    'spring-fees-due',
    'Spring 2027',
    'Tuition and fee payment dates',
    spring,
    'Fees: payment',
    [
      { label: 'Tuition/student fees', start: '2027-01-18' },
      { label: 'Co-op practicum fees', start: '2027-02-12' },
    ],
    ['Allow payment processing time; consult How to Pay.'],
    { aliases: ['学费', 'tuition payment'] },
  ),
  termRecord(
    'fall-enrolment-dates',
    'Fall 2026',
    'Enrolment periods and appointments',
    fall,
    'Enrolment',
    [
      { label: 'Enrolment begins', start: '2026-07-06' },
      { label: 'Open enrolment', start: '2026-07-27' },
    ],
    ['Check your personal appointment in goSFU.'],
  ),
  termRecord(
    'spring-enrolment-dates',
    'Spring 2027',
    'Enrolment periods and appointments',
    spring,
    'Enrolment',
    [
      { label: 'Enrolment begins', start: '2026-11-02' },
      { label: 'Open enrolment', start: '2026-11-23' },
    ],
    ['Check your personal appointment in goSFU.'],
  ),
  termRecord(
    'fall-aid-dates',
    'Fall 2026',
    'Financial aid application windows',
    fall,
    'Financial aid and awards',
    [
      { label: 'Work-Study', start: '2026-07-13', end: '2026-07-24' },
      { label: 'Bursaries', start: '2026-08-31', end: '2026-09-18' },
      { label: 'Undergraduate scholarships/awards', start: '2026-08-31', end: '2026-09-18' },
    ],
    aidConditions,
  ),
  termRecord(
    'spring-aid-dates',
    'Spring 2027',
    'Financial aid application windows',
    spring,
    'Financial aid and awards',
    [
      { label: 'Work-Study', start: '2026-11-09', end: '2026-11-20' },
      { label: 'Bursaries', start: '2026-12-21', end: '2027-01-15' },
      { label: 'Undergraduate scholarships/awards', start: '2026-12-21', end: '2027-01-15' },
    ],
    aidConditions,
  ),
  termRecord(
    'fall-graduation-dates',
    'Fall 2026',
    'Graduation application dates',
    fall,
    'Graduation application/cancellation',
    [
      { label: 'Applications open', start: '2026-09-23' },
      { label: 'Early application/payment', start: '2026-10-23' },
      { label: 'Final application/payment', start: '2026-12-18' },
      { label: 'Cancellation', start: '2027-01-04' },
    ],
    ['For Fall 2026 degree completion and June 2027 convocation. Apply/pay in goSFU.'],
  ),
  termRecord(
    'spring-graduation-dates',
    'Spring 2027',
    'Graduation application dates',
    spring,
    'Graduation application/cancellation',
    [
      { label: 'Applications open', start: '2027-01-19' },
      { label: 'Early application/payment', start: '2027-02-19' },
      { label: 'Final application/payment', start: '2027-04-23' },
      { label: 'Cancellation', start: '2027-05-07' },
    ],
    ['For Spring 2027 degree completion and June 2027 convocation. Apply/pay in goSFU.'],
  ),
  defineResource({
    id: 'graduate-deadlines',
    title: 'Graduate dates and deadlines',
    topic: '01',
    category: 'deadline',
    summary:
      'Graduate Studies publishes separate enrolment, fee, completion and defence deadlines.',
    provider: { name: 'SFU Faculty of Graduate Studies', type: 'sfu' },
    access: ['Choose the relevant term on the Graduate Studies deadlines page.'],
    eligibility: [
      'Graduate students: do not substitute undergraduate withdrawal or refund deadlines.',
    ],
    audiences: ['Graduate'],
    campuses: [...allCampuses],
    cost: { status: 'unknown' },
    highImpact: true,
    reviewCadence: 'sensitive',
    verification: {
      status: 'reviewed',
      verifiedAt: checked,
      reviewedAt: checked,
      reviewer: 'agent',
    },
    sources: [
      {
        title: 'SFU Graduate Studies — Dates + Deadlines',
        url: 'https://www.sfu.ca/gradstudies/graduate-students/managing-your-program/deadlines.html',
        locator: 'Fall 2026 and Spring 2027 term sections',
        fields: ['summary', 'access', 'eligibility', 'poster'],
        lastRetrievalAttemptAt: checked,
        lastRetrievedAt: checked,
        retrievalStatus: 'retrieved',
      },
    ],
    poster: {
      title: 'Graduate deadlines',
      facts: [
        'Select your term on the official page.',
        'Check enrolment, fees and completion dates.',
      ],
      conditions: ['Graduate deadlines differ from undergraduate dates.'],
      mode: 'facts',
    },
  }),
];

// Consolidated legacy fragments resolve to the canonical procedure without duplicating cards.
export const mergedResourceIds: Record<string, string> = {
  'deadline-4': 'deadline-2',
  'deadline-6': 'deadline-2',
  'deadline-7': 'deadline-2',
  'deadline-8': 'deadline-3',
  'deadline-9': 'deadline-0',
  'deadline-10': 'deadline-0',
  'deadline-11': 'deadline-0',
};
