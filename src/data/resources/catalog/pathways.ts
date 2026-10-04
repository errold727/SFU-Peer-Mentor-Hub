import { defineResource, type CatalogInput, type SourceInput } from './define';
import type { Audience, Campus, ResourceReview } from '../types';

// Research checkpoints are UTC, recorded during the 2026-10-04 source-reading session.
// Review is supplied explicitly for each entry; successful retrieval is not certification.
const moneyRead = '2026-10-04T15:20:09Z';
const transportRead = '2026-10-04T15:25:37Z';
const recordsRead = '2026-10-04T15:28:26Z';
const finalRead = '2026-10-04T15:36:39Z';
const campuses: Campus[] = ['Burnaby', 'Surrey', 'Vancouver', 'Online'];
const students: Audience[] = ['Undergraduate', 'Graduate'];
const undergraduate: Audience[] = ['Undergraduate', 'International'];
const sfu = (name: string) => ({ name, type: 'sfu' as const });
const aid = sfu('SFU Financial Aid and Awards');
const records = sfu('SFU Enrolment Services');
const career = sfu('SFU Career and Volunteer Services');
const abroad = sfu('SFU International Services for Students — Study Abroad');
const commonFields = [
  'summary',
  'provider',
  'access',
  'eligibility',
  'audiences',
  'campuses',
  'poster.facts.0',
  'poster.facts.1',
];
// A later live HTTPS retrieval pass updates retrieval metadata only; it does not change the content review.
const latestRetrieval: Record<string, string> = {
  'https://www.sfu.ca/students/enrolment-services/fees/how-to-pay.html': '2026-10-04T15:57:06.719Z',
  'https://www.sfu.ca/students/enrolment-services/fees/check-your-balance.html':
    '2026-10-04T15:57:06.720Z',
  'https://www.sfu.ca/students/enrolment-services/fees.html': '2026-10-04T15:57:06.858Z',
  'https://www.sfu.ca/students/enrolment-services/fees/refunds.html': '2026-10-04T15:57:06.946Z',
  'https://www.sfu.ca/students/financial-aid/undergraduate/scholarships.html':
    '2026-10-04T15:57:06.953Z',
  'https://www.sfu.ca/students/financial-aid/undergraduate/awards.html': '2026-10-04T15:57:07.002Z',
  'https://www.sfu.ca/students/financial-aid/undergraduate/loans-and-grants.html':
    '2026-10-04T15:57:07.098Z',
  'https://www.sfu.ca/students/financial-aid/undergraduate/work-study.html':
    '2026-10-04T15:57:07.098Z',
  'https://www.sfu.ca/students/financial-aid/undergraduate/bursaries.html':
    '2026-10-04T15:57:07.140Z',
  'https://www.sfu.ca/students/isap/explore/finances/financialaid.html': '2026-10-04T15:57:07.241Z',
  'https://www.sfu.ca/students/financial-aid/indigenous/': '2026-10-04T15:57:07.288Z',
  'https://www.sfu.ca/students/financial-aid/undergraduate/students-with-disabilities.html':
    '2026-10-04T15:57:07.291Z',
  'https://www.sfu.ca/students/financial-aid/plan/typical-costs.html': '2026-10-04T15:57:07.388Z',
  'https://www.sfu.ca/fs/campus-maps.html': '2026-10-04T15:57:07.398Z',
  'https://www.sfu.ca/students/financial-aid/contact.html': '2026-10-04T15:57:07.435Z',
  'https://www.sfu.ca/students/enrolment-services/upass/loading.html': '2026-10-04T15:57:07.531Z',
  'https://www.sfu.ca/students/enrolment-services/upass/eligibility.html':
    '2026-10-04T15:57:07.595Z',
  'https://www.sfu.ca/fs/campus-maps/directory-of-buildings.html': '2026-10-04T15:57:07.688Z',
  'https://www.sfu.ca/parking.html': '2026-10-04T15:57:07.788Z',
  'https://www.sfu.ca/students/enrolment-services/upass/faq.html': '2026-10-04T15:57:07.860Z',
  'https://www.translink.ca/trip-planner': '2026-10-04T15:57:07.916Z',
  'https://www.sfu.ca/parking/Parking/visitors.html': '2026-10-04T15:57:08.019Z',
  'https://www.sfu.ca/parking/Parking/students.html': '2026-10-04T15:57:08.021Z',
  'https://www.sfu.ca/parking/alternative-transport/cycling.html': '2026-10-04T15:57:08.058Z',
  'https://www.sfu.ca/students/get-involved.html': '2026-10-04T15:57:08.178Z',
  'https://www.sfu.ca/parking/alternative-transport/campus-shuttle.html':
    '2026-10-04T15:57:08.188Z',
  'https://www.sfu.ca/students/get-involved/recognition/co-curricular-record.html':
    '2026-10-04T15:57:08.282Z',
  'https://www.sfu.ca/srs/campus-safety-security/traffic-safety/traffic-notices.html':
    '2026-10-04T15:57:08.286Z',
  'https://www.sfu.ca/srs/campus-safety-security/traffic-safety/road-report.html':
    '2026-10-04T15:57:08.289Z',
  'https://go.sfss.ca/': '2026-10-04T15:57:08.578Z',
  'https://go.sfss.ca/clubs/list': '2026-10-04T15:57:08.689Z',
  'https://sfugradsociety.ca/': '2026-10-04T15:57:09.615Z',
  'https://www.sfu.ca/students/get-involved/groups/peer-education.html': '2026-10-04T15:57:09.754Z',
  'https://www.sfu.ca/students/get-involved/groups/peer-mentorship.html':
    '2026-10-04T15:57:09.754Z',
  'https://events.sfu.ca/': '2026-10-04T15:57:10.332Z',
  'https://www.sfu.ca/students/career/advising.html': '2026-10-04T15:57:10.464Z',
  'https://www.sfu.ca/students/career/prepare.html': '2026-10-04T15:57:10.474Z',
  'https://events.sfu.ca/arts-and-culture/all': '2026-10-04T15:57:11.674Z',
  'https://www.sfu.ca/students/career.html': '2026-10-04T15:57:11.795Z',
  'https://www.sfu.ca/students/career/paid-and-work-opportunities.html': '2026-10-04T15:57:11.804Z',
  'https://www.sfu.ca/students/career/workshops-and-event.html': '2026-10-04T15:57:11.835Z',
  'https://www.sfu.ca/coop/costs-and-deadlines.html': '2026-10-04T15:57:11.927Z',
  'https://www.sfu.ca/coop/programs.html': '2026-10-04T15:57:11.980Z',
  'https://www.sfu.ca/research/for-students/participate-in-research.html':
    '2026-10-04T15:57:12.038Z',
  'https://www.sfu.ca/chang-institute/Programs/incubator.html': '2026-10-04T15:57:12.131Z',
  'https://www.sfu.ca/students/studyabroad/exchanges/application.html': '2026-10-04T15:57:12.152Z',
  'https://www.sfu.ca/students/studyabroad/exchanges/eligibility-and-selection.html':
    '2026-10-04T15:57:12.182Z',
  'https://www.sfu.ca/students/studyabroad/fieldschools.html': '2026-10-04T15:57:12.327Z',
  'https://www.sfu.ca/students/studyabroad/summerprograms.html': '2026-10-04T15:57:12.329Z',
  'https://www.sfu.ca/students/studyabroad/exchanges/academic-considerations.html':
    '2026-10-04T15:57:12.329Z',
  'https://www.sfu.ca/students/studyabroad/virtualexchange.html': '2026-10-04T15:57:12.425Z',
  'https://www.sfu.ca/students/studyabroad/safetyabroad.html': '2026-10-04T15:57:14.439Z',
  'https://www.sfu.ca/students/studyabroad/exchanges/costs.html': '2026-10-04T15:57:14.500Z',
  'https://www.sfu.ca/students/studyabroad/contact.html': '2026-10-04T15:57:14.646Z',
  'https://www.sfu.ca/students/enrolment-services/id-card/getting-your-id-card.html':
    '2026-10-04T15:57:14.665Z',
  'https://www.sfu.ca/students/enrolment-services/id-card/replacement-and-maintenance.html':
    '2026-10-04T15:57:14.665Z',
  'https://www.sfu.ca/students/enrolment-services/id-card/changing-your-name.html':
    '2026-10-04T15:57:14.761Z',
  'https://www.sfu.ca/students/enrolment-services/get-help/hours-and-location.html':
    '2026-10-04T15:57:14.761Z',
  'https://www.sfu.ca/students/enrolment-services/id-card.html': '2026-10-04T15:57:14.767Z',
  'https://www.sfu.ca/students/enrolment-services/records/transcripts.html':
    '2026-10-04T15:57:14.935Z',
  'https://www.sfu.ca/students/enrolment-services/records/confirmation-of-enrolment.html':
    '2026-10-04T15:57:14.957Z',
  'https://www.sfu.ca/students/gosfu': '2026-10-04T15:57:15.164Z',
  'https://www.sfu.ca/students/enrolment-services/records/letter-of-permission.html':
    '2026-10-04T15:57:15.274Z',
  'https://www.sfu.ca/students/enrolment-services/records/degree-verification.html':
    '2026-10-04T15:57:15.318Z',
  'https://www.sfu.ca/students/enrolment-services/records/credential-completion-letter.html':
    '2026-10-04T15:57:15.318Z',
  'https://www.sfu.ca/convocation/checklist/undergraduate-checklist.html':
    '2026-10-04T15:57:15.414Z',
  'https://www.sfu.ca/students/enrolment-services/undergraduate-reactivation-form.html':
    '2026-10-04T15:57:15.418Z',
  'https://www.sfu.ca/students/enrolment-services/tax-receipts-and-forms.html':
    '2026-10-04T15:57:15.470Z',
  'https://www.sfu.ca/students/enrolment-services/policies-and-procedures/academic-concessions.html':
    '2026-10-04T15:57:15.573Z',
  'https://www.sfu.ca/ombudsperson/get-help/grade-appeal.html': '2026-10-04T15:57:15.603Z',
  'https://www.sfu.ca/ombudsperson.html': '2026-10-04T15:57:15.603Z',
  'https://www.sfu.ca/students/enrolment-services/appeals/withdrawals-extenuating-circumstances.html':
    '2026-10-04T15:57:15.692Z',
  'https://www.sfu.ca/students/enrolment-services/academic-integrity/using-generative-ai.html':
    '2026-10-04T15:57:15.704Z',
  'https://www.sfu.ca/students/enrolment-services/academic-integrity.html':
    '2026-10-04T15:57:15.761Z',
  'https://www.sfu.ca/humanrights.html': '2026-10-04T15:57:15.891Z',
  'https://www.sfu.ca/sexual-violence.html': '2026-10-04T15:57:15.906Z',
  'https://www.sfu.ca/students/studentsupport.html': '2026-10-04T15:57:16.892Z',
};
const source = (
  url: string,
  title: string,
  locator: string,
  at: string,
  fields = commonFields,
): SourceInput => ({
  url,
  title,
  locator,
  fields,
  lastRetrievalAttemptAt:
    url === 'https://myinvolvement.sfu.ca/home.htm'
      ? '2026-10-04T15:57:08.161Z'
      : (latestRetrieval[url] ?? at),
  lastRetrievedAt: latestRetrieval[url] ?? at,
  retrievalStatus: url === 'https://myinvolvement.sfu.ca/home.htm' ? 'blocked' : 'retrieved',
});
const review = (status: ResourceReview['status'], at: string, note: string): ResourceReview => ({
  status,
  verifiedAt: status === 'reviewed' ? at : null,
  reviewedAt: at,
  reviewer: 'agent',
  note,
});
const poster = (
  title: string,
  facts: string[],
  conditions: string[] = [],
  mode: 'facts' | 'link' = 'facts',
) => ({ title, facts, conditions, mode });
const unknown = { status: 'unknown' as const };
// Independent agent review of these specific records, not a catalogue-wide certification.
// Source bodies, card/detail fields and resourcePosterText output were compared;
// findings and resolved corrections are recorded in docs/resources/review-pathways.md.
const secondReviewedIds = new Set([
  'student-account',
  'tuition-payment',
  'tuition-refunds',
  'scholarships-awards',
  'bursaries',
  'work-study',
  'government-student-aid',
  'international-funding',
  'indigenous-funding',
  'disability-funding',
  'student-budget',
  'financial-aid-advising',
  'upass',
  'parking',
  'campus-shuttle',
  'road-traffic-notices',
  'myinvolvement',
  'co-curricular-record',
  'graduate-student-society',
  'career-advising',
  'co-op',
  'entrepreneurship',
  'exchange-programs',
  'exchange-credit',
  'short-term-study-abroad',
  'study-abroad-funding',
  'study-abroad-safety',
  'id-card',
  'student-name-contact',
  'transcripts',
  'enrolment-letter',
  'completion-letter',
  'degree-verification',
  'letter-of-permission',
  'tax-documents',
  'graduation-application',
  'undergraduate-reactivation',
  'registrar-help',
  'ombudsperson',
  'grade-appeals',
  'academic-concessions',
  'extenuating-withdrawal',
  'academic-integrity',
  'student-support-rights',
  'human-rights-support',
  'sexual-violence-support',
  'peer-mentor-referral-guide',
]);
const define = (data: CatalogInput) =>
  defineResource({
    ...data,
    ...(secondReviewedIds.has(data.id)
      ? {
          secondReview: {
            reviewer: 'agent' as const,
            reviewedAt: '2026-10-04T16:02:06Z',
            note: 'Independent source/body, card/detail and rendered-poster review by agent templates_06_10. See docs/resources/review-pathways.md; partial source qualifications remain in force.',
          },
        }
      : {}),
  });

export const pathwaysResources = [
  define({
    id: 'student-account',
    title: 'Student account, tuition statements and fee explanations',
    category: 'money',
    topic: '12',
    summary:
      'Review term charges, payments and balances in goSFU, and ask Student Accounts about transactions or fee explanations.',
    provider: sfu('SFU Student Accounts'),
    campuses,
    audiences: students,
    access: [
      'In goSFU, open Finances → Account Inquiry → Account Summary.',
      'Use the term account statement and the fee pages to check the charges that apply to your enrolment.',
    ],
    eligibility: [
      'Account information is personal to the student; tuition and supplementary fees depend on enrolment and student status.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      moneyRead,
      'Account navigation and fee basis reviewed; individual balances and dollar amounts are not reproduced.',
    ),
    poster: poster('Check your student account', [
      'Review your term statement in goSFU.',
      'Ask Student Accounts about charges or payments.',
    ]),
    contacts: [{ label: 'Student Accounts', kind: 'email', value: 'student_accounts@sfu.ca' }],
    aliases: ['tuition balance', 'account statement', '学费账单', '学费明细'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/fees/check-your-balance.html',
        'SFU — Check your student account',
        'Check your student account; Printing your Student Account Summary',
        moneyRead,
      ),
      source(
        'https://www.sfu.ca/students/enrolment-services/fees.html',
        'SFU — Fees',
        'Tuition and supplementary fees; Student Accounts contact',
        moneyRead,
        ['eligibility', 'contacts.0'],
      ),
    ],
  }),
  define({
    id: 'tuition-payment',
    title: 'Pay tuition and fees',
    category: 'money',
    topic: '12',
    provider: sfu('SFU Student Accounts'),
    campuses,
    audiences: students,
    summary:
      'Choose an official payment method and allow for its processing time before the applicable payment deadline.',
    access: [
      'Read the method-specific instructions before making a payment.',
      'Use the official goSFU payment link or the banking instructions on the SFU page.',
    ],
    eligibility: ['Methods differ for tuition, residence and particular fee types.'],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      moneyRead,
      'Payment methods and processing qualifications reviewed; no payment instructions, account numbers, fees or processing promises copied.',
    ),
    poster: poster(
      'Pay tuition and fees',
      [
        'Check SFU’s instructions for your payment method.',
        'Allow for processing before your payment deadline.',
      ],
      ['Residence and some fee types use different payment arrangements.'],
    ),
    aliases: ['pay fees', 'Flywire', 'bank payment', '缴学费', '付款'],
    relatedIds: ['student-account'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/fees/how-to-pay.html',
        'SFU — How to pay',
        'Pay tuition fees; Flywire; Internet banking; In person',
        moneyRead,
      ),
    ],
  }),
  define({
    id: 'tuition-refunds',
    title: 'Tuition refunds and credit-balance refunds',
    category: 'money',
    topic: '12',
    provider: sfu('SFU Student Accounts'),
    campuses,
    audiences: students,
    summary:
      'A refund after a course change and repayment of a credit balance use different conditions and procedures.',
    access: [
      'Check the refund schedule for your course and term before changing enrolment.',
      'For an existing credit balance, follow the direct-deposit, cheque or international-payment instructions that apply.',
    ],
    eligibility: [
      'Tuition refunds depend on the relevant withdrawal period and circumstances; a credit balance is a separate account matter.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      moneyRead,
      'The two refund procedures were compared; no refund percentage or entitlement is inferred.',
    ),
    poster: poster('Check refund rules first', [
      'Course-change refunds follow the applicable refund schedule.',
      'Credit-balance refunds use a separate request process.',
    ]),
    aliases: ['refund tuition', 'credit balance', '退学费', '退款'],
    relatedIds: ['student-account', 'deadline-2', 'spring-tuition-refunds'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/fees/refunds.html',
        'SFU — Refunds',
        'Tuition refunds; Credit balance refunds',
        moneyRead,
      ),
    ],
  }),
  define({
    id: 'scholarships-awards',
    title: 'Undergraduate scholarships and awards',
    category: 'money',
    topic: '12',
    provider: aid,
    campuses,
    audiences: undergraduate,
    summary:
      'Find SFU scholarships and awards, then check the criteria and application route for each opportunity.',
    access: [
      'Review the scholarship or award listing and its required supporting documents.',
      'Where an application is required, use goSFU → Financial Aid and Awards; some awards use departmental nominations.',
    ],
    eligibility: [
      'Canadian and international students may be eligible; academic, enrolment and opportunity-specific conditions differ.',
      'Scholarships and awards do not have one interchangeable set of eligibility rules.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      moneyRead,
      'Both program pages reviewed. No individual award amount, opening, cutoff or personal eligibility judgment published.',
    ),
    poster: poster(
      'Explore scholarships and awards',
      [
        'Check each opportunity’s criteria and required documents.',
        'Follow its application or departmental nomination route.',
      ],
      ['Eligibility and deadlines differ by opportunity.'],
    ),
    aliases: ['financial awards', 'scholarship application', '奖学金', '奖励金'],
    relatedIds: ['fall-aid-dates', 'spring-aid-dates', 'financial-aid-advising'],
    sources: [
      source(
        'https://www.sfu.ca/students/financial-aid/undergraduate/scholarships.html',
        'SFU — Undergraduate scholarships',
        'Eligibility; How to apply; application periods',
        moneyRead,
      ),
      source(
        'https://www.sfu.ca/students/financial-aid/undergraduate/awards.html',
        'SFU — Undergraduate awards',
        'Eligibility; How to apply; departmental nominations',
        moneyRead,
        ['summary', 'access.1', 'eligibility', 'poster.conditions'],
      ),
    ],
  }),
  define({
    id: 'bursaries',
    title: 'Undergraduate bursaries',
    category: 'money',
    topic: '12',
    provider: aid,
    campuses,
    audiences: undergraduate,
    summary:
      'Bursaries provide supplemental assistance based on financial need; awards and eligibility are assessed through SFU’s application process.',
    access: [
      'Check the current application window and eligibility requirements.',
      'Apply in goSFU using the Bursaries/Work-Study application.',
    ],
    eligibility: [
      'Domestic and international undergraduate applicants must meet the published financial-need, academic and enrolment conditions.',
      'Bursary funding is not guaranteed and is not intended as a primary funding source.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      moneyRead,
      'Need-based purpose, application and non-guarantee reviewed; no numeric eligibility thresholds published.',
    ),
    poster: poster(
      'Bursary applications',
      [
        'Apply through goSFU during the published application window.',
        'Funding is assessed using financial need and program conditions.',
      ],
      ['Supplemental support; funding is not guaranteed.'],
    ),
    aliases: ['need based aid', '助学金', '经济援助'],
    relatedIds: ['financial-aid-advising', 'fall-aid-dates', 'spring-aid-dates'],
    sources: [
      source(
        'https://www.sfu.ca/students/financial-aid/undergraduate/bursaries.html',
        'SFU — Undergraduate bursaries',
        'Bursaries; Eligibility; How to apply',
        moneyRead,
      ),
    ],
  }),
  define({
    id: 'work-study',
    title: 'Work-Study',
    category: 'money',
    topic: '12',
    provider: aid,
    campuses,
    audiences: undergraduate,
    summary:
      'Work-Study offers eligible students paid, supervised research-related work while they study.',
    access: [
      'Apply for Work-Study eligibility through goSFU during the term application period.',
      'If approved, follow the instructions to apply for available Work-Study positions.',
    ],
    eligibility: [
      'Financial need, academic and enrolment conditions apply.',
      'Apply again for each term; eligibility approval does not guarantee a position.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      moneyRead,
      'Term-by-term eligibility and position selection were distinguished. Wage, hours and individual job openings omitted.',
    ),
    poster: poster(
      'Explore Work-Study',
      [
        'Apply for eligibility through goSFU.',
        'Eligible students then apply for available positions.',
      ],
      ['Financial-need and enrolment conditions apply; a position is not guaranteed.'],
    ),
    aliases: ['workstudy', 'on campus research job', '勤工助学'],
    relatedIds: ['career-opportunities', 'fall-aid-dates', 'spring-aid-dates'],
    sources: [
      source(
        'https://www.sfu.ca/students/financial-aid/undergraduate/work-study.html',
        'SFU — Work-Study',
        'Work-Study program; Eligibility; How to apply; accepting positions',
        moneyRead,
      ),
    ],
  }),
  define({
    id: 'government-student-aid',
    title: 'Government student loans and grants',
    category: 'money',
    topic: '12',
    provider: aid,
    campuses,
    audiences: students,
    summary:
      'SFU explains where to apply for government student aid and how the route depends on your province, territory and circumstances.',
    access: [
      'Start with the SFU loans-and-grants guide.',
      'Use the responsible government aid program and ask Financial Aid and Awards about your circumstances.',
    ],
    eligibility: [
      'Citizenship or residency, province or territory, enrolment and other government program conditions apply.',
      'This directory does not determine entitlement to a loan or grant.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      moneyRead,
      'Official navigation reviewed; detailed government eligibility and benefit amounts are deliberately not restated.',
    ),
    poster: poster(
      'Find government student aid',
      [
        'Start with SFU’s loans-and-grants guide.',
        'Check the rules of the government program that applies to you.',
      ],
      ['Eligibility depends on your circumstances.'],
      'link',
    ),
    aliases: ['StudentAid BC', 'student loan', 'government grant', '学生贷款', '政府助学金'],
    relatedIds: ['financial-aid-advising', 'disability-funding'],
    sources: [
      source(
        'https://www.sfu.ca/students/financial-aid/undergraduate/loans-and-grants.html',
        'SFU — Loans and grants',
        'Government student loans and grants; province or territory of residence',
        moneyRead,
      ),
    ],
  }),
  define({
    id: 'international-funding',
    title: 'Funding guidance for international students',
    category: 'money',
    topic: '12',
    provider: sfu('SFU International Services for Students'),
    campuses,
    audiences: ['International', 'Exchange'],
    summary:
      'Find SFU’s financial-aid guidance for international students, including the distinction between degree students and visiting exchange arrangements.',
    access: [
      'Read the international financial-aid guidance and follow the relevant award or advising link.',
      'Exchange students should also ask their home institution about available funding.',
    ],
    eligibility: [
      'International degree students may qualify for some SFU assistance, subject to each program’s rules.',
      'Do not assume funding attached to admission or that degree-student funding applies to exchange students.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      moneyRead,
      'International-degree and exchange distinctions retained; no financial or immigration entitlement inferred.',
    ),
    poster: poster(
      'International student funding',
      [
        'Check the official guide for funding routes.',
        'Review the conditions for your student category.',
      ],
      ['Admission does not guarantee funding.'],
      'link',
    ),
    aliases: ['international financial aid', '留学生资助', '国际学生奖助学金'],
    relatedIds: ['financial-aid-advising', 'scholarships-awards', 'bursaries'],
    sources: [
      source(
        'https://www.sfu.ca/students/isap/explore/finances/financialaid.html',
        'SFU — Financial aid for international students',
        'Financial assistance; exchange and study abroad students',
        moneyRead,
      ),
    ],
  }),
  define({
    id: 'indigenous-funding',
    title: 'Indigenous student funding routes',
    category: 'money',
    topic: '12',
    provider: aid,
    campuses,
    audiences: students,
    summary:
      'SFU gathers scholarship, bursary, Work-Study, loan and sponsorship routes for Indigenous students.',
    access: [
      'Explore the Indigenous student financial-aid directory.',
      'Review each funding program or sponsorship arrangement with the responsible office.',
    ],
    eligibility: [
      'The directory addresses Canadian First Nations, Métis and Inuit students; each funding route has its own conditions.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'partial',
      moneyRead,
      'Directory scope and routing reviewed; individual Indigenous awards, sponsorship agreements and emergency-funding eligibility were not reviewed.',
    ),
    poster: poster(
      'Indigenous student funding',
      [
        'Explore SFU’s Indigenous financial-aid directory.',
        'Check the conditions for each award or sponsorship route.',
      ],
      ['Individual funding opportunities need a separate eligibility check.'],
      'link',
    ),
    aliases: ['First Nations funding', 'Métis funding', 'Inuit funding', '原住民学生资助'],
    relatedIds: ['financial-aid-advising'],
    sources: [
      source(
        'https://www.sfu.ca/students/financial-aid/indigenous/',
        'SFU — Indigenous student financial aid',
        'Scholarships and awards; financial aid; third-party sponsorship',
        moneyRead,
      ),
    ],
  }),
  define({
    id: 'disability-funding',
    title: 'Disability-related financial-aid guidance',
    category: 'money',
    topic: '12',
    provider: aid,
    campuses,
    audiences: students,
    summary:
      'Find financial-aid guidance for students with disabilities, including documented course-load exceptions and government support routes.',
    access: [
      'Review the financial-aid page for students with disabilities.',
      'Contact Financial Aid and Awards and the Centre for Accessible Learning about documentation and the relevant program.',
    ],
    eligibility: [
      'A reduced-load exception is not automatic; documentation and other program conditions still apply.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      moneyRead,
      'Documentation and remaining eligibility conditions retained; unit thresholds and equipment-funding entitlements omitted.',
    ),
    poster: poster(
      'Disability-related funding guidance',
      [
        'Ask about documented course-load exceptions.',
        'Check the relevant government or SFU program with the responsible office.',
      ],
      ['Documentation and other eligibility conditions apply.'],
      'link',
    ),
    aliases: ['accessible learning funding', 'disability grant', '残障学生资助'],
    relatedIds: ['financial-aid-advising', 'government-student-aid'],
    sources: [
      source(
        'https://www.sfu.ca/students/financial-aid/undergraduate/students-with-disabilities.html',
        'SFU — Students with disabilities: financial aid',
        'SFU financial aid; documentation; government student assistance',
        moneyRead,
      ),
    ],
  }),
  define({
    id: 'student-budget',
    title: 'Budgeting and estimated study costs',
    category: 'money',
    topic: '12',
    provider: aid,
    campuses,
    audiences: students,
    summary:
      'Use SFU’s cost estimates and calculator to plan tuition, housing and living expenses for your circumstances.',
    access: [
      'Choose the relevant student category and term in the official cost-estimate tools.',
      'Adjust your budget for your program, course load, living arrangements and other personal costs.',
    ],
    eligibility: [
      'Published estimates are planning guides, not an individual bill or a guarantee of expenses.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      moneyRead,
      'Estimate limitations reviewed. No dollar estimates are copied into the directory.',
    ),
    poster: poster(
      'Plan your student budget',
      [
        'Use SFU’s official cost-estimate tools.',
        'Adjust estimates for your program and living arrangements.',
      ],
      ['Estimates are not your final student-account charges.'],
    ),
    aliases: ['cost calculator', 'living expenses', '生活费', '学生预算'],
    relatedIds: ['student-account', 'financial-aid-advising'],
    sources: [
      source(
        'https://www.sfu.ca/students/financial-aid/plan/typical-costs.html',
        'SFU — Typical costs',
        'Cost calculator; undergraduate and graduate estimated expenses; estimate qualifications',
        moneyRead,
      ),
    ],
  }),
  define({
    id: 'financial-aid-advising',
    title: 'Financial Aid and Awards advising',
    category: 'money',
    topic: '12',
    provider: aid,
    campuses,
    audiences: students,
    summary:
      'Get advice about scholarships, bursaries, Work-Study and government student aid from Financial Aid and Awards.',
    access: [
      'Current students can use Advisor Link to book an appointment.',
      'Check the contact page for current drop-in options and the route for future students or alumni.',
    ],
    eligibility: [
      'Graduate awards may be handled by your department or Graduate Studies; tuition transactions go to Student Accounts.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      moneyRead,
      'Advising routes and office boundaries reviewed; no recurring hours published without a validity period.',
    ),
    poster: poster('Ask Financial Aid and Awards', [
      'Current students can book through Advisor Link.',
      'Check the official contact page for drop-in options.',
    ]),
    aliases: ['financial aid advisor', 'FAA', '助学金咨询', '财务援助咨询'],
    relatedIds: ['student-account'],
    sources: [
      source(
        'https://www.sfu.ca/students/financial-aid/contact.html',
        'SFU — Contact Financial Aid and Awards',
        'Book an appointment; drop-in advising; graduate funding; Student Accounts',
        moneyRead,
      ),
    ],
  }),
  define({
    id: 'campus-maps',
    title: 'Campus maps, buildings and room finder',
    category: 'transport',
    topic: '13',
    provider: sfu('SFU Facilities Services'),
    campuses,
    audiences: ['All students'],
    summary:
      'Find the three campus maps, building abbreviations and room-finding tools; Burnaby also has a published accessible-campus map.',
    access: [
      'Choose your campus map and use Room Finder for the room you need.',
      'Use the building directory for abbreviations and the Burnaby accessible map where applicable.',
    ],
    eligibility: [
      'Public map information; the accessible Burnaby map does not establish accessibility of every route at every campus.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      transportRead,
      'Map directory and building directory reviewed; no unverified route instructions or cross-campus accessibility claims published.',
    ),
    poster: poster(
      'Find your room',
      [
        'Choose your campus map and Room Finder.',
        'Check the building directory for abbreviations.',
      ],
      ['A separate accessible-campus map is available for Burnaby.'],
    ),
    aliases: ['classroom location', 'building code', 'AQ', 'MBC', '地图', '教室', '无障碍路线'],
    relatedIds: ['transit-planning', 'parking'],
    sources: [
      source(
        'https://www.sfu.ca/fs/campus-maps.html',
        'SFU — Campus maps',
        'Room Finder; Burnaby, Surrey and Vancouver maps; Accessible Campus Map',
        transportRead,
      ),
      source(
        'https://www.sfu.ca/fs/campus-maps/directory-of-buildings.html',
        'SFU — Directory of buildings',
        'Building directory; building acronyms across three campuses',
        transportRead,
        ['access.1', 'poster.facts.1'],
      ),
    ],
  }),
  define({
    id: 'upass',
    title: 'U-Pass BC and Compass Card',
    category: 'transport',
    topic: '13',
    provider: records,
    campuses,
    audiences: students,
    summary:
      'Check SFU U-Pass eligibility, link an Adult Compass Card and request access through the official monthly process.',
    access: [
      'Review SFU’s eligibility page before relying on U-Pass access.',
      'At the official U-Pass site, select SFU, sign in with your computing ID, link an Adult Compass Card and request your monthly pass.',
      'Use SFU’s U-Pass FAQ or contact the U-Pass office if enrolment, address or loading problems affect access.',
    ],
    eligibility: [
      'Enrolment, location, student-fee and exception rules apply; not every student is eligible.',
      'An SFU ID card and a Compass Card are different cards.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      transportRead,
      'Eligibility, loading and FAQ read together; numeric entitlement thresholds, fees and load-time promises omitted.',
    ),
    poster: poster(
      'Request your monthly U-Pass',
      [
        'Check SFU’s U-Pass eligibility rules.',
        'Link an Adult Compass Card and request access each month.',
      ],
      ['SFU ID and Compass Card are different; eligibility conditions apply.'],
    ),
    contacts: [{ label: 'SFU U-Pass office', kind: 'email', value: 'upass@sfu.ca' }],
    aliases: ['Compass', 'transit pass', '公交卡', '月票'],
    relatedIds: ['id-card', 'transit-planning'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/upass/eligibility.html',
        'SFU — U-Pass eligibility',
        'Eligibility criteria and exceptions',
        transportRead,
        [
          'summary',
          'provider',
          'audiences',
          'campuses',
          'access.0',
          'eligibility.0',
          'poster.facts.0',
          'poster.conditions',
        ],
      ),
      source(
        'https://www.sfu.ca/students/enrolment-services/upass/loading.html',
        'SFU — Load your U-Pass',
        'Adult Compass Card; linking; monthly request',
        transportRead,
        ['summary', 'access.1', 'eligibility.1', 'poster.facts.1', 'poster.conditions'],
      ),
      source(
        'https://www.sfu.ca/students/enrolment-services/upass/faq.html',
        'SFU — U-Pass FAQ',
        'Eligibility changes; contact U-Pass office',
        transportRead,
        ['access.2', 'contacts.0'],
      ),
    ],
  }),
  define({
    id: 'transit-planning',
    title: 'TransLink trip planning and service alerts',
    category: 'transport',
    topic: '13',
    provider: { name: 'TransLink', type: 'external-official' },
    campuses,
    audiences: ['All students'],
    summary:
      'Use TransLink’s official planning tools for routes, transfers, departures and transit alerts in Metro Vancouver.',
    access: [
      'Enter your origin and destination in an official trip-planning tool.',
      'Check route schedules and alerts before travelling; the Google Transit option opens results in Google Maps.',
    ],
    eligibility: [
      'Public trip-planning information; route availability does not establish fare or U-Pass entitlement.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      finalRead,
      'Tool purposes and external Google Maps handoff reviewed; no specific route or schedule copied.',
    ),
    poster: poster('Plan your transit trip', [
      'Use TransLink’s trip planner for routes and transfers.',
      'Check current departures and service alerts.',
    ]),
    aliases: ['bus routes', 'SkyTrain', '交通规划', '公交路线'],
    relatedIds: ['upass', 'campus-maps'],
    sources: [
      source(
        'https://www.translink.ca/trip-planner',
        'TransLink — Trip Planner',
        'Google Transit; TransLink Trip Planner; schedules and alerts',
        finalRead,
      ),
    ],
  }),
  define({
    id: 'parking',
    title: 'Student permits, visitor parking and parking maps',
    category: 'transport',
    topic: '13',
    provider: sfu('SFU Parking and Sustainable Mobility'),
    campuses,
    audiences: ['All students'],
    summary: 'Find campus-specific parking maps, student permits and visitor parking instructions.',
    access: [
      'Select the campus and parking type on SFU’s parking site.',
      'Check the official permit, visitor-parking and payment instructions before parking.',
    ],
    eligibility: [
      'Burnaby, Surrey and Vancouver have different parking arrangements.',
      'Permits may be subject to availability and waitlists.',
    ],
    cost: {
      status: 'published',
      details:
        'Parking charges and permit rates depend on the campus and parking type; check the official rate page.',
    },
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      transportRead,
      'Student and visitor pages reviewed; no rate, permit availability or free-parking entitlement inferred.',
    ),
    poster: poster(
      'Check campus parking rules',
      ['Choose the correct campus parking map.', 'Review permit or visitor-payment instructions.'],
      ['Rules, rates and permit availability vary.'],
    ),
    aliases: ['parking permit', 'visitor parking', '停车', '停车证'],
    relatedIds: ['campus-maps', 'transit-planning'],
    sources: [
      source(
        'https://www.sfu.ca/parking.html',
        'SFU — Parking and Sustainable Mobility',
        'Parking maps; parking categories; rates',
        transportRead,
      ),
      source(
        'https://www.sfu.ca/parking/Parking/students.html',
        'SFU — Student parking',
        'Student parking; campus differences; permits and availability',
        transportRead,
        ['eligibility', 'cost', 'access'],
      ),
      source(
        'https://www.sfu.ca/parking/Parking/visitors.html',
        'SFU — Visitor parking',
        'Visitor parking; campus differences',
        transportRead,
        ['access', 'cost', 'poster.conditions'],
      ),
    ],
  }),
  define({
    id: 'cycling',
    title: 'Cycling and bicycle facilities',
    category: 'transport',
    topic: '13',
    provider: sfu('SFU Parking and Sustainable Mobility'),
    campuses: ['Burnaby', 'Online'],
    audiences: ['All students'],
    summary:
      'Find Burnaby bicycle storage information, the bike-facilities map and the access route for the campus bike cage.',
    access: [
      'Open the official bicycle-facilities map.',
      'Contact Parking and Sustainable Mobility to request bike-cage access.',
    ],
    eligibility: [
      'The listed storage and bike-cage information is for Burnaby; other campus options need their own location check.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      transportRead,
      'Burnaby facilities and access request reviewed; no fee or guaranteed storage availability inferred.',
    ),
    poster: poster(
      'Bike to Burnaby campus',
      ['Check the bicycle-facilities map.', 'Ask Parking about access to the campus bike cage.'],
      ['Burnaby facilities; check access arrangements first.'],
    ),
    contacts: [
      { label: 'Parking and Sustainable Mobility', kind: 'email', value: 'parking@sfu.ca' },
    ],
    aliases: ['bike cage', 'bicycle storage', '骑车', '自行车存放'],
    relatedIds: ['campus-maps'],
    sources: [
      source(
        'https://www.sfu.ca/parking/alternative-transport/cycling.html',
        'SFU — Cycling',
        'Bicycle facilities; bike cage access request',
        transportRead,
        [...commonFields, 'contacts.0'],
      ),
    ],
  }),
  define({
    id: 'campus-shuttle',
    title: 'Burnaby campus shuttle',
    category: 'transport',
    topic: '13',
    provider: sfu('SFU Parking and Sustainable Mobility'),
    campuses: ['Burnaby', 'Online'],
    audiences: ['All students', 'FIC'],
    summary:
      'The campus shuttle connects designated stops within the Burnaby campus area; check its official route, service information and tracker.',
    access: [
      'Check the official shuttle page and live tracker before travelling.',
      'Use a stop shown on the published Burnaby route.',
    ],
    eligibility: [
      'The published shuttle is a Burnaby service, not a connection between the three SFU campuses.',
    ],
    cost: {
      status: 'published',
      details: 'The official page describes the Burnaby campus shuttle as free to use.',
    },
    reviewCadence: 'schedule',
    highImpact: false,
    verification: review(
      'reviewed',
      transportRead,
      'Service scope, no-charge description and tracker reviewed. Recurring times are omitted because the page provides no dated validity period.',
    ),
    poster: poster(
      'Burnaby campus shuttle',
      ['Check the official route and tracker.', 'Use a stop listed on the Burnaby shuttle route.'],
      ['Check current service information before travelling.'],
    ),
    aliases: ['campus bus', 'FIC shuttle', '校园接驳车'],
    relatedIds: ['campus-maps'],
    sources: [
      source(
        'https://www.sfu.ca/parking/alternative-transport/campus-shuttle.html',
        'SFU — Campus shuttle',
        'Free campus shuttle; route; live tracker',
        transportRead,
        [...commonFields, 'cost'],
      ),
    ],
  }),
  define({
    id: 'myinvolvement',
    title: 'myInvolvement and getting involved',
    category: 'involvement',
    topic: '16',
    provider: sfu('SFU Student Services'),
    campuses,
    audiences: students,
    summary:
      'Discover campus involvement, leadership and volunteer opportunities through SFU’s Get Involved directory and myInvolvement.',
    access: [
      'Explore the public Get Involved directory by program type.',
      'Use your SFU student login in myInvolvement for available opportunities and participation records.',
    ],
    eligibility: ['Recruitment, commitments and participation requirements vary by program.'],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      finalRead,
      'Directory categories and portal access reviewed; no specific role is represented as currently recruiting.',
    ),
    poster: poster(
      'Find your involvement opportunity',
      [
        'Explore leadership and volunteer programs.',
        'Check myInvolvement for opportunity details and applications.',
      ],
      ['Program requirements and recruitment periods vary.'],
    ),
    aliases: ['leadership', 'volunteering', 'student involvement', '校园活动', '志愿者', '领导力'],
    sources: [
      source(
        'https://www.sfu.ca/students/get-involved.html',
        'SFU — Get Involved',
        'Groups and programs; leadership; volunteering; student societies',
        finalRead,
      ),
      source(
        'https://myinvolvement.sfu.ca/home.htm',
        'SFU — myInvolvement',
        'Student login; opportunity platform; involvement contact',
        finalRead,
        ['access.1', 'poster.facts.1'],
      ),
    ],
  }),
  define({
    id: 'road-traffic-notices',
    title: 'Road conditions, traffic notices and weather routes',
    category: 'transport',
    topic: '13',
    provider: sfu('SFU Safety and Risk Services'),
    campuses,
    audiences: ['All students'],
    summary:
      'Check SFU’s Road Report and traffic notices for campus travel conditions, construction disruptions and weather-information links.',
    access: [
      'Open the Road Report and read its own update timestamp.',
      'Check the dated traffic notices and follow on-site signs and traffic-control directions.',
    ],
    eligibility: [
      'Notices apply to the campus, road and dates identified in each official notice.',
    ],
    cost: unknown,
    reviewCadence: 'schedule',
    highImpact: false,
    verification: review(
      'reviewed',
      '2026-10-04T15:55:38.847Z',
      'Live Road Report and traffic-notice bodies reviewed. Current weather, temporary closures and anticipated construction end dates are not copied into an evergreen card.',
    ),
    poster: poster(
      'Check before travelling to campus',
      [
        'Read SFU’s Road Report and its update time.',
        'Check dated roadwork notices before choosing a route.',
      ],
      ['Follow the campus and dates named in each notice.'],
      'link',
    ),
    aliases: ['roadworks', 'road report', 'traffic cameras', 'snow', '路况', '施工通知', '天气'],
    relatedIds: ['sfu-alerts', 'transit-planning', 'campus-maps'],
    sources: [
      source(
        'https://www.sfu.ca/srs/campus-safety-security/traffic-safety/road-report.html',
        'SFU — Road Report',
        'Timestamped Road Report; campus weather and traffic links; Know before you go',
        '2026-10-04T15:55:38.847Z',
      ),
      source(
        'https://www.sfu.ca/srs/campus-safety-security/traffic-safety/traffic-notices.html',
        'SFU — Traffic notices',
        'Notice dates, affected roads and construction/traffic-control instructions',
        '2026-10-04T15:55:38.729Z',
        ['summary', 'access.1', 'eligibility', 'poster.facts.1', 'poster.conditions'],
      ),
    ],
  }),
  define({
    id: 'co-curricular-record',
    title: 'Co-Curricular Record',
    category: 'involvement',
    topic: '16',
    provider: sfu('SFU Student Services'),
    campuses,
    audiences: students,
    summary:
      'The Co-Curricular Record documents eligible SFU involvement activities and is available through myInvolvement.',
    access: [
      'Open your Co-Curricular Record in myInvolvement.',
      'For missing participation credit, contact the program supervisor first and then the CCR administrator if needed.',
    ],
    eligibility: [
      'Only approved eligible activities appear on the record; participation in every activity does not automatically qualify.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'partial',
      finalRead,
      'Purpose and missing-credit route reviewed. The source’s timing description and term table conflict, so no update timetable is published.',
    ),
    poster: poster(
      'Your Co-Curricular Record',
      [
        'View eligible involvement activities in myInvolvement.',
        'Ask the program supervisor about missing participation credit.',
      ],
      ['Only eligible activities are included.'],
    ),
    contacts: [{ label: 'CCR administrator', kind: 'email', value: 'ccr-admin@sfu.ca' }],
    aliases: ['CCR', 'co curricular', '课外活动记录'],
    relatedIds: ['myinvolvement'],
    sources: [
      source(
        'https://www.sfu.ca/students/get-involved/recognition/co-curricular-record.html',
        'SFU — Co-Curricular Record',
        'About CCR; accessing your record; missing activity credit',
        finalRead,
        [...commonFields, 'contacts.0'],
      ),
    ],
  }),
  define({
    id: 'sfss-clubs',
    title: 'SFSS clubs and student unions',
    category: 'involvement',
    topic: '16',
    provider: { name: 'Simon Fraser Student Society (SFSS)', type: 'student-organization' },
    campuses,
    audiences: ['Undergraduate'],
    summary:
      'Browse the SFSS club directory and the separate student-union portal to find student communities and their contact information.',
    access: [
      'Browse clubs by category or alphabetically and open the club profile.',
      'Use the student-union portal on SFSS Go for departmental and faculty student-union information.',
    ],
    eligibility: [
      'Check the particular club or union for membership, participation and event requirements.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      finalRead,
      'Public club list and SFSS Go portal reviewed; individual club eligibility, dues and events were not certified.',
    ),
    poster: poster(
      'Find a club or student union',
      [
        'Browse SFSS clubs by interest or name.',
        'Open the club or union’s page for joining information.',
      ],
      ['Check the group’s own membership and event conditions.'],
    ),
    aliases: ['clubs', 'DSU', 'faculty student union', '社团', '学生会'],
    relatedIds: ['myinvolvement'],
    sources: [
      source(
        'https://go.sfss.ca/clubs/list',
        'SFSS — Club directory',
        'Category Search; Alphabetical Search; registered club profiles',
        finalRead,
      ),
      source('https://go.sfss.ca/', 'SFSS Go', 'Club portal; Student Union Portal', finalRead, [
        'summary',
        'access.1',
        'poster.facts.1',
      ]),
    ],
  }),
  define({
    id: 'graduate-student-society',
    title: 'Graduate Student Society resources',
    category: 'involvement',
    topic: '16',
    provider: { name: 'Graduate Student Society at SFU', type: 'student-organization' },
    campuses,
    audiences: ['Graduate'],
    summary:
      'Find graduate-student representation, advocacy and service information from the Graduate Student Society at SFU.',
    access: [
      'Open the GSS site and choose the relevant service or representation information.',
      'Check individual service conditions with the society.',
    ],
    eligibility: [
      'The GSS represents SFU graduate students across the three campuses; individual service conditions differ.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      '2026-10-04T15:53:32.949Z',
      'Public society identity and service-navigation scope reviewed through live HTTPS after web-reader failures. Individual financial/legal service terms are not reproduced.',
    ),
    poster: poster(
      'Graduate Student Society',
      [
        'Find graduate-student representation and service information.',
        'Check the relevant service’s current conditions with the society.',
      ],
      [],
      'link',
    ),
    aliases: ['GSS', 'graduate student caucus', '研究生会'],
    sources: [
      source(
        'https://sfugradsociety.ca/',
        'Graduate Student Society at SFU',
        'Who we are; Our mission; student support and representation',
        '2026-10-04T15:53:32.949Z',
      ),
      source(
        'https://www.sfu.ca/students/get-involved.html',
        'SFU — Get Involved',
        'Student societies: Graduate Student Society',
        finalRead,
        ['provider', 'audiences'],
      ),
    ],
  }),
  define({
    id: 'peer-programs',
    title: 'Peer mentorship and peer education',
    category: 'involvement',
    topic: '16',
    provider: sfu('SFU Student Services'),
    campuses,
    audiences: ['Undergraduate'],
    summary:
      'Explore faculty and program mentorship options and peer-education roles that help students support one another.',
    access: [
      'Choose a program in the peer-mentorship or peer-education directory.',
      'Check its student audience, campus, recruitment process and contact before joining or applying.',
    ],
    eligibility: [
      'Mentorship programs often serve a particular faculty, campus or incoming-student group; peer-education role requirements differ.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      finalRead,
      'Both directories and program differences reviewed. Undated recruitment wording is not treated as an open application.',
    ),
    poster: poster(
      'Connect through peer programs',
      [
        'Explore faculty mentorship and peer-education options.',
        'Check your chosen program’s audience and joining process.',
      ],
      ['Campus and program requirements vary.'],
    ),
    aliases: ['peer mentor', 'peer educator', '同伴导师', '朋辈辅导'],
    relatedIds: ['myinvolvement'],
    sources: [
      source(
        'https://www.sfu.ca/students/get-involved/groups/peer-mentorship.html',
        'SFU — Peer mentorship',
        'Peer mentorship program directory; faculty and campus columns',
        finalRead,
      ),
      source(
        'https://www.sfu.ca/students/get-involved/groups/peer-education.html',
        'SFU — Peer education',
        'Peer education role descriptions; myInvolvement application routes',
        finalRead,
        ['summary', 'access', 'eligibility', 'poster.facts'],
      ),
    ],
  }),
  define({
    id: 'sfu-event-discovery',
    title: 'SFU event calendars and arts events',
    category: 'involvement',
    topic: '16',
    provider: sfu('SFU event organizers'),
    campuses,
    audiences: ['All students'],
    summary:
      'Use SFU’s event calendar and Arts and Culture calendar to discover events, then check each organizer’s listing.',
    access: [
      'Open the official calendar and select an event listing.',
      'Confirm the event date, campus or online delivery, registration and admission conditions with the organizer.',
    ],
    eligibility: [
      'Conditions differ by event; this is a discovery directory, not a list of verified upcoming events.',
    ],
    cost: unknown,
    reviewCadence: 'schedule',
    highImpact: false,
    verification: review(
      'partial',
      finalRead,
      'Calendar identity and Arts and Culture calendar reviewed. Dynamic event listings were not available in the research reader; no individual event details published.',
    ),
    poster: poster(
      'Discover SFU events',
      [
        'Explore the official SFU and Arts and Culture calendars.',
        'Check each organizer’s date and registration details.',
      ],
      ['Individual events need their own current-detail check.'],
      'link',
    ),
    aliases: [
      'faculty events',
      'public lectures',
      'workshops',
      'arts culture',
      '活动日历',
      '讲座',
      '文化活动',
    ],
    sources: [
      source(
        'https://events.sfu.ca/',
        'SFU — Events calendar',
        'SFU Events calendar landing page; dynamic listings not reviewed',
        finalRead,
      ),
      source(
        'https://events.sfu.ca/arts-and-culture/all',
        'SFU — Arts and Culture events',
        'Event Calendar; Arts and Culture',
        finalRead,
        ['summary', 'access', 'poster.facts.0'],
      ),
    ],
  }),
  define({
    id: 'career-advising',
    title: 'Career advising and interview preparation',
    category: 'career',
    topic: '17',
    provider: career,
    campuses,
    audiences: students,
    summary:
      'Get help exploring careers, improving applications, preparing for interviews and building professional connections.',
    access: [
      'Book a general career appointment through myExperience or check current drop-in options.',
      'Mock interviews require a Career Educator referral and Front Desk booking; they cannot be booked in myExperience.',
    ],
    eligibility: [
      'The service page includes undergraduate and graduate students and recent alumni; alumni access has a published time limit.',
    ],
    cost: {
      status: 'published',
      details: 'Career advising is described as free on the official service page.',
    },
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      finalRead,
      'Advising topics, appointment route, free service and mock-interview referral condition reviewed; no drop-in hours copied.',
    ),
    poster: poster(
      'Talk with a career advisor',
      [
        'Book a general appointment through myExperience or check drop-ins.',
        'Get help with applications, interviews and career planning.',
      ],
      ['Mock interviews need a Career Educator referral and Front Desk booking.'],
    ),
    contacts: [{ label: 'Career and Volunteer Services', kind: 'email', value: 'careers@sfu.ca' }],
    aliases: ['career counselling', 'mock interview', '职业咨询', '模拟面试'],
    relatedIds: ['career-tools', 'career-opportunities'],
    sources: [
      source(
        'https://www.sfu.ca/students/career/advising.html',
        'SFU — Career advising',
        'Who can use our services; appointments; mock interviews; career topics',
        finalRead,
        [...commonFields, 'cost', 'contacts.0', 'poster.conditions'],
      ),
    ],
  }),
  define({
    id: 'career-tools',
    title: 'Résumé, cover letter, LinkedIn and portfolio tools',
    category: 'career',
    topic: '17',
    provider: career,
    campuses: ['Online'],
    audiences: students,
    summary:
      'Use SFU’s career-preparation resources to develop application documents, interview skills and an online professional presence.',
    access: [
      'Choose the résumé, cover letter, interview, LinkedIn or portfolio topic on the Prepare page.',
      'Bring questions or a draft to career advising for more support.',
    ],
    eligibility: ['Public preparation resources; these materials do not guarantee employment.'],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      finalRead,
      'Preparation topic directory reviewed; no third-party career service endorsed beyond the official directory.',
    ),
    poster: poster('Prepare your next application', [
      'Explore résumé, cover-letter and interview resources.',
      'Build your LinkedIn profile or portfolio with SFU’s guides.',
    ]),
    aliases: ['resume', 'CV', 'cover letter', 'LinkedIn', 'portfolio', '简历', '求职信', '作品集'],
    relatedIds: ['career-advising'],
    sources: [
      source(
        'https://www.sfu.ca/students/career/prepare.html',
        'SFU — Prepare for your career',
        'Résumé; cover letter; interviews; LinkedIn; portfolio',
        finalRead,
      ),
    ],
  }),
  define({
    id: 'career-opportunities',
    title: 'Jobs, campus employment and volunteer experience',
    category: 'career',
    topic: '17',
    provider: career,
    campuses,
    audiences: students,
    summary:
      'Find official routes to job and volunteer postings, including myExperience and campus employment sources.',
    access: [
      'Use the paid-work and volunteer-opportunities directory.',
      'Follow the relevant platform or department to review each role and its application requirements.',
    ],
    eligibility: [
      'Role qualifications, work authorization, deadlines and compensation depend on the posting; no personal eligibility decision is made here.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      finalRead,
      'Job-discovery and volunteer-discovery routes reviewed; no individual vacancy or employment eligibility represented as verified.',
    ),
    poster: poster('Find work and volunteer experience', [
      'Explore myExperience and official campus job routes.',
      'Read each posting’s qualifications and application instructions.',
    ]),
    aliases: [
      'myExperience',
      'campus jobs',
      'volunteer experience',
      '找工作',
      '校内工作',
      '志愿经历',
    ],
    relatedIds: ['work-study', 'career-advising', 'co-op'],
    sources: [
      source(
        'https://www.sfu.ca/students/career/paid-and-work-opportunities.html',
        'SFU — Paid work and volunteer opportunities',
        'myExperience; campus employment; Work-Study; volunteering',
        finalRead,
      ),
    ],
  }),
  define({
    id: 'career-events',
    title: 'Career workshops and employer events',
    category: 'career',
    topic: '17',
    provider: career,
    campuses,
    audiences: students,
    summary:
      'Find career workshops, self-paced career courses and employer or nonprofit events through Career and Volunteer Services.',
    access: [
      'Check the career workshops page and official career-event calendar.',
      'Use the individual listing for delivery, registration and audience details.',
    ],
    eligibility: ['Registration and eligibility vary by event or course.'],
    cost: unknown,
    reviewCadence: 'schedule',
    highImpact: false,
    verification: review(
      'reviewed',
      finalRead,
      'Permanent discovery pages reviewed; no dated fair or event is listed as upcoming without an individual review.',
    ),
    poster: poster('Explore career events', [
      'Check SFU’s career workshops and event calendar.',
      'Confirm registration and delivery in the event listing.',
    ]),
    aliases: ['career fair', 'employer visit', 'career workshop', '招聘会', '求职讲座'],
    relatedIds: ['career-advising'],
    sources: [
      source(
        'https://www.sfu.ca/students/career/workshops-and-event.html',
        'SFU — Career workshops and events',
        'Programs and Workshops; Career Canvas Courses',
        finalRead,
      ),
      source(
        'https://www.sfu.ca/students/career.html',
        'SFU — Career and Volunteer Services',
        'Events; employer and nonprofit engagement',
        finalRead,
        ['summary', 'access', 'poster.facts.0'],
      ),
    ],
  }),
  define({
    id: 'co-op',
    title: 'Find your faculty Co-op program',
    category: 'career',
    topic: '17',
    provider: sfu('SFU Co-operative Education'),
    campuses,
    audiences: students,
    summary:
      'Choose your faculty or program’s Co-op route, then review its preparation, eligibility, costs and application dates.',
    access: [
      'Choose your program in the Co-op program directory.',
      'Read the program-specific instructions and the costs-and-deadlines page before applying.',
    ],
    eligibility: [
      'Co-op requirements and preparation timelines differ by program and whether participation is mandatory or optional.',
      'An application or preparation term is not the same as a work term.',
    ],
    cost: {
      status: 'published',
      details:
        'Application and work-term tuition charges may apply; consult the official schedule for your Co-op program.',
    },
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      finalRead,
      'Program directory and cost/deadline distinctions reviewed; no universal GPA, course load, fee or application cutoff published.',
    ),
    poster: poster(
      'Plan Co-op with your program',
      [
        'Find your faculty’s Co-op program.',
        'Check its preparation steps, costs and application dates.',
      ],
      ['Requirements and term timelines vary by program.'],
    ),
    aliases: ['coop', 'cooperative education', '带薪实习', '合作教育'],
    relatedIds: ['career-advising', 'career-opportunities'],
    sources: [
      source(
        'https://www.sfu.ca/coop/programs.html',
        'SFU — Co-op programs',
        'Faculty and program directory',
        finalRead,
      ),
      source(
        'https://www.sfu.ca/coop/costs-and-deadlines.html',
        'SFU — Co-op costs and deadlines',
        'Mandatory and optional programs; preparation term and work term; fees',
        finalRead,
        ['summary', 'access.1', 'eligibility', 'cost', 'poster.facts.1', 'poster.conditions'],
      ),
    ],
  }),
  define({
    id: 'undergraduate-research',
    title: 'Undergraduate research and project opportunities',
    category: 'career',
    topic: '17',
    provider: sfu('SFU Research'),
    campuses,
    audiences: ['Undergraduate'],
    summary:
      'Explore research through courses, faculty projects, research participation and funding routes, with guidance from the Undergraduate Research Coordinator.',
    access: [
      'Read the ways to participate and explore faculty or department research pages.',
      'Contact the Undergraduate Research Coordinator for help getting started.',
    ],
    eligibility: [
      'Each project or funding opportunity has its own criteria; a directory listing does not guarantee a place or funding.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      finalRead,
      'General participation and coordinator route reviewed; individual USRA amounts, deadlines and selection criteria are not published.',
    ),
    poster: poster('Get involved in research', [
      'Explore faculty projects and course-based research.',
      'Ask the Undergraduate Research Coordinator how to start.',
    ]),
    contacts: [
      { label: 'Undergraduate Research Coordinator', kind: 'email', value: 'ugradres@sfu.ca' },
    ],
    aliases: ['research assistant', 'USRA', 'undergraduate project', '本科科研', '研究项目'],
    relatedIds: ['work-study'],
    sources: [
      source(
        'https://www.sfu.ca/research/for-students/participate-in-research.html',
        'SFU — Undergraduate research',
        'Ways to get involved; faculty research; Need help getting started?',
        finalRead,
        [...commonFields, 'contacts.0'],
      ),
    ],
  }),
  define({
    id: 'entrepreneurship',
    title: 'Chang Institute entrepreneurship support',
    category: 'career',
    topic: '17',
    provider: sfu('SFU Charles Chang Institute for Entrepreneurship'),
    campuses: ['Surrey', 'Online'],
    audiences: students,
    summary:
      'Explore SFU’s startup-support pathway, including SPARK, Mentor Meet and the selective early-stage Incubator.',
    access: [
      'Read the Incubator page and follow the SPARK and Mentor Meet links.',
      'Review prerequisites and the invitation/intake process before seeking Incubator admission.',
    ],
    eligibility: [
      'The Incubator serves eligible SFU-connected teams; ownership, venture, location and selection conditions apply.',
      'Admission is by invitation after the published preparation and intake process.',
    ],
    cost: {
      status: 'published',
      details:
        'The Incubator page says its services are provided at no charge to participants; admission conditions still apply.',
    },
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      finalRead,
      'Incubator selection process and no-charge participant condition reviewed. Individual ownership, revenue and investment thresholds omitted.',
    ),
    poster: poster(
      'Explore entrepreneurship support',
      [
        'Start with SPARK and Mentor Meet information.',
        'Review the Incubator’s prerequisites and intake process.',
      ],
      ['Incubator admission is selective and by invitation.'],
    ),
    aliases: ['Venture Connection', 'startup', 'entrepreneurship', '创业', '孵化器'],
    sources: [
      source(
        'https://www.sfu.ca/chang-institute/Programs/incubator.html',
        'SFU Chang Institute — Incubator',
        'Program description; Admission Requirements; Selection Process; no-charge participant services',
        finalRead,
        [...commonFields, 'cost', 'poster.conditions'],
      ),
    ],
  }),
  define({
    id: 'exchange-programs',
    title: 'Exchange programs, partners and applications',
    category: 'exchange',
    topic: '18',
    provider: abroad,
    campuses,
    audiences: students,
    summary:
      'Find exchange partners and prepare an application using SFU’s eligibility, selection and program-specific guidance.',
    access: [
      'Explore partner profiles in the Study Abroad system and check their restrictions.',
      'Read the exchange application guide, prepare the required study plan and supporting materials, and use the published application deadline for your intended term.',
      'Pre-arrange an SFU professor or instructor as a possible academic referee and confirm that conversation in the application, as required by the application guide.',
    ],
    eligibility: [
      'Undergraduate, graduate and partner-specific criteria differ; selection and host placement are not guaranteed.',
      'The initial SFU application requires referee preparation, but no reference letter; a host may later require the letter.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      finalRead,
      'Eligibility and full application guide reviewed, including reference-stage distinction; no future-term deadline inferred.',
    ),
    poster: poster(
      'Prepare for exchange',
      [
        'Compare partner profiles and their requirements.',
        'Follow SFU’s application checklist, including preparing an academic referee.',
      ],
      ['Selection is competitive; host and student-category conditions differ.'],
    ),
    aliases: ['exchange partner', 'study abroad application', '交换项目', '交换申请'],
    relatedIds: ['exchange-credit', 'study-abroad-advising', 'study-abroad-funding'],
    sources: [
      source(
        'https://www.sfu.ca/students/studyabroad/exchanges/application.html',
        'SFU — Exchange application',
        'Application steps; partner profiles; study plan; references',
        finalRead,
      ),
      source(
        'https://www.sfu.ca/students/studyabroad/exchanges/eligibility-and-selection.html',
        'SFU — Exchange eligibility and selection',
        'Undergraduate; graduate; partner criteria; selection',
        finalRead,
        ['summary', 'eligibility.0', 'poster.conditions'],
      ),
    ],
  }),
  define({
    id: 'exchange-credit',
    title: 'Exchange course planning and transfer credit',
    category: 'exchange',
    topic: '18',
    provider: abroad,
    campuses,
    audiences: students,
    summary:
      'Plan exchange courses with academic advising and follow the formal course-evaluation process for credit toward your SFU program.',
    access: [
      'Discuss your study plan and program requirements with the relevant academic advisor.',
      'After nomination, follow the course-evaluation and official host-transcript instructions.',
    ],
    eligibility: [
      'Prior evaluations and pre-assessments do not guarantee current credit.',
      'Credit requires the appropriate departmental confirmation and official host records; program-specific processes differ.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      finalRead,
      'Academic considerations reviewed; WQB/pre-assessment and formal-credit distinctions retained.',
    ),
    poster: poster(
      'Plan exchange credit early',
      [
        'Discuss courses with your academic advisor.',
        'Follow the formal evaluation and host-transcript process.',
      ],
      ['Previous course evaluations do not guarantee your credit.'],
    ),
    aliases: ['exchange transfer credit', 'study plan', '交换学分', '学分转换'],
    relatedIds: ['exchange-programs', 'letter-of-permission'],
    sources: [
      source(
        'https://www.sfu.ca/students/studyabroad/exchanges/academic-considerations.html',
        'SFU — Exchange academic considerations',
        'Study planning; course evaluation; transfer credit; official transcript',
        finalRead,
      ),
    ],
  }),
  define({
    id: 'short-term-study-abroad',
    title: 'Field schools, short-term and virtual study abroad',
    category: 'exchange',
    topic: '18',
    provider: abroad,
    campuses: ['Online'],
    audiences: students,
    summary:
      'Compare SFU field schools, short-term partner programs and virtual exchange routes before choosing a program.',
    access: [
      'Use the field-school page for SFU-led programs.',
      'Use the Study Abroad search filters and the short-term or virtual guidance for the relevant partner route.',
    ],
    eligibility: [
      'Academic, application, fee and funding rules differ across field schools, exchange-based short-term programs, direct-fee programs and virtual exchange.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      finalRead,
      'All three program-type pages reviewed; no individual program availability, date, cost or funding entitlement published.',
    ),
    poster: poster(
      'Compare study-abroad formats',
      [
        'Explore field schools, short-term and virtual options.',
        'Check the application route for your chosen program.',
      ],
      ['Fees, credits and eligibility differ by program type.'],
    ),
    aliases: [
      'field school',
      'summer abroad',
      'virtual exchange',
      '短期交流',
      '海外田野课程',
      '线上交换',
    ],
    relatedIds: ['study-abroad-advising', 'study-abroad-funding'],
    sources: [
      source(
        'https://www.sfu.ca/students/studyabroad/fieldschools.html',
        'SFU — Field schools',
        'Field-school description; program availability and fees',
        finalRead,
      ),
      source(
        'https://www.sfu.ca/students/studyabroad/summerprograms.html',
        'SFU — Short-term summer programs',
        'Exchange and direct-fee routes; program search; funding conditions',
        finalRead,
        ['summary', 'access.1', 'eligibility', 'poster.facts.0', 'poster.conditions'],
      ),
      source(
        'https://www.sfu.ca/students/studyabroad/virtualexchange.html',
        'SFU — Virtual exchange',
        'Virtual opportunities; program search; application and funding conditions',
        finalRead,
        ['summary', 'access.1', 'eligibility', 'poster.facts.0', 'poster.conditions'],
      ),
    ],
  }),
  define({
    id: 'study-abroad-funding',
    title: 'Study-abroad costs and funding planning',
    category: 'exchange',
    topic: '18',
    provider: abroad,
    campuses: ['Online'],
    audiences: students,
    summary:
      'Plan study-abroad expenses using SFU’s budget guidance and follow the relevant undergraduate or graduate funding route.',
    access: [
      'Use the study-abroad costs page and budget worksheet.',
      'Check program charges and ask the appropriate funding office about assistance.',
    ],
    eligibility: [
      'Costs depend on the program and destination; eligibility for existing student aid may change with the type of study abroad.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      finalRead,
      'Costs and undergraduate/graduate referral boundaries reviewed; no award amount or automatic aid portability promised.',
    ),
    poster: poster(
      'Budget for study abroad',
      [
        'Use SFU’s study-abroad budget guidance.',
        'Check program charges and the funding route that applies to you.',
      ],
      ['Costs and aid conditions vary by program.'],
    ),
    aliases: ['exchange fees', 'exchange funding', '交换费用', '海外学习资助'],
    relatedIds: ['financial-aid-advising', 'exchange-programs'],
    sources: [
      source(
        'https://www.sfu.ca/students/studyabroad/exchanges/costs.html',
        'SFU — Study-abroad costs',
        'Budget worksheet; program costs; undergraduate and graduate funding',
        finalRead,
      ),
    ],
  }),
  define({
    id: 'study-abroad-safety',
    title: 'Study-abroad travel preparation and safety',
    category: 'exchange',
    topic: '18',
    provider: abroad,
    campuses: ['Online'],
    audiences: students,
    summary:
      'Use SFU’s study-abroad preparation, travel-safety program and assistance guidance before departing.',
    access: [
      'Complete the pre-departure preparation required for your SFU study-abroad program.',
      'Review the official travel-safety and assistance instructions, including insurance arrangements.',
    ],
    eligibility: [
      'Program requirements and assistance arrangements depend on the travel context.',
      'International SOS assistance is not itself insurance coverage.',
    ],
    cost: unknown,
    reviewCadence: 'safety',
    highImpact: true,
    verification: review(
      'reviewed',
      finalRead,
      'Travel preparation and assistance-versus-insurance distinction reviewed. Old mental-health service wording and public membership/phone numbers omitted.',
    ),
    poster: poster(
      'Prepare before studying abroad',
      [
        'Follow SFU’s pre-departure and travel-safety steps.',
        'Review assistance and insurance arrangements separately.',
      ],
      ['Travel assistance is not the same as insurance coverage.'],
    ),
    aliases: ['travel safety', 'pre departure', 'International SOS', '出行安全', '行前准备'],
    relatedIds: ['study-abroad-advising', 'myssp'],
    sources: [
      source(
        'https://www.sfu.ca/students/studyabroad/safetyabroad.html',
        'SFU — Safety abroad',
        'Pre-departure preparation; SFU Travel Safety Program; International SOS and insurance',
        finalRead,
      ),
    ],
  }),
  define({
    id: 'study-abroad-advising',
    title: 'Study-abroad advising and information sessions',
    category: 'exchange',
    topic: '18',
    provider: abroad,
    campuses,
    audiences: students,
    summary:
      'Start with a study-abroad information session and then use the advising route for your student category or program.',
    access: [
      'Attend or watch an information session before requesting individual exchange advising.',
      'Undergraduates can use Advisor Link; graduate and field-school questions have separate contact routes on the official page.',
    ],
    eligibility: [
      'Use the contact route for your exchange region, degree level or field-school program.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      finalRead,
      'Information-session prerequisite and advising routes reviewed; current appointment availability is not promised.',
    ),
    poster: poster('Start your study-abroad plan', [
      'Attend or watch a study-abroad information session.',
      'Use the advising route for your program and student category.',
    ]),
    aliases: ['exchange advisor', 'study abroad info session', '交换咨询', '海外学习咨询'],
    relatedIds: ['exchange-programs', 'short-term-study-abroad'],
    sources: [
      source(
        'https://www.sfu.ca/students/studyabroad/contact.html',
        'SFU — Study-abroad contact and advising',
        'Information sessions; Advisor Link; graduate and field-school contacts',
        finalRead,
      ),
    ],
  }),
  define({
    id: 'id-card',
    title: 'SFU ID card: issuance and replacement',
    category: 'records',
    topic: '19',
    provider: records,
    campuses,
    audiences: students,
    summary:
      'Get or replace an SFU student ID using the official identification requirements and current Registrar service locations.',
    access: [
      'Check the issuance or replacement instructions and current service location.',
      'Bring your student number and the required physical government-issued photo identification; names must match the applicable official requirements.',
    ],
    eligibility: [
      'Student-card issuance depends on student status and enrolment.',
      'SFU ID and Compass Card are separate cards.',
    ],
    cost: {
      status: 'published',
      details:
        'Replacement charges may apply; consult the replacement policy and documented legal-name-change exception.',
    },
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Issuance, replacement and location pages compared. An expired Burnaby pop-up location was excluded; no fee amount copied.',
    ),
    poster: poster(
      'Get your SFU student ID',
      [
        'Check the official issuance or replacement instructions.',
        'Bring the required physical photo ID and student number.',
      ],
      ['SFU ID is separate from your Compass Card.'],
    ),
    aliases: ['student card', 'replace ID', '学生证', '补办学生证'],
    relatedIds: ['registrar-help', 'upass', 'student-name-contact'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/id-card/getting-your-id-card.html',
        'SFU — Get your ID card',
        'Required identification; student number; eligibility; name requirements',
        recordsRead,
      ),
      source(
        'https://www.sfu.ca/students/enrolment-services/id-card/replacement-and-maintenance.html',
        'SFU — ID replacement and maintenance',
        'Replacement requirements; charges; legal-name-change exception',
        recordsRead,
        ['access', 'cost'],
      ),
      source(
        'https://www.sfu.ca/students/enrolment-services/id-card.html',
        'SFU — ID card',
        'Student ID and U-Pass/Compass distinction',
        recordsRead,
        ['eligibility.1', 'poster.conditions'],
      ),
      source(
        'https://www.sfu.ca/students/enrolment-services/get-help/hours-and-location.html',
        'SFU — Registrar locations',
        'Visit us on campus; Burnaby, Surrey and Vancouver',
        finalRead,
        ['access.0'],
      ),
    ],
  }),
  define({
    id: 'student-name-contact',
    title: 'Chosen name, legal name and contact information',
    category: 'records',
    topic: '19',
    provider: records,
    campuses: ['Online'],
    audiences: students,
    summary:
      'Use the official procedures to update chosen or legal names and keep your student contact information current.',
    access: [
      'Follow the name-change page for chosen-name settings or the documented legal-name-change process.',
      'Use the goSFU guide’s personal-information section for addresses, phone numbers and emergency contacts.',
    ],
    eligibility: [
      'Chosen and legal names serve different purposes; official documents use the applicable legal-name rules.',
      'Send identity or supporting documents only through the official procedure, never through this Hub.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      finalRead,
      'Chosen/legal-name distinction and official personal-information route reviewed; the Hub collects no documents or personal details.',
    ),
    poster: poster('Keep your student record current', [
      'Use the correct chosen-name or legal-name procedure.',
      'Review your contact information in the official student systems.',
    ]),
    aliases: [
      'preferred name',
      'legal name',
      'address change',
      'emergency contact',
      '姓名变更',
      '联系信息',
    ],
    relatedIds: ['registrar-help', 'id-card'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/id-card/changing-your-name.html',
        'SFU — Change your name',
        'Chosen name; legal name; legal-name-change procedure',
        recordsRead,
      ),
      source(
        'https://www.sfu.ca/students/gosfu',
        'SFU — goSFU guide',
        'Official documents and personal settings → Update your personal information',
        finalRead,
        ['summary', 'access.1', 'poster.facts.1'],
      ),
    ],
  }),
  define({
    id: 'transcripts',
    title: 'Official, unofficial and advising transcripts',
    category: 'records',
    topic: '19',
    provider: records,
    campuses: ['Online'],
    audiences: students,
    summary:
      'Choose the transcript type needed for an application, personal reference or an advising appointment.',
    access: [
      'Open the transcript directory and choose official, unofficial or advising transcript instructions.',
      'Order or download through the official student route; check what the recipient requires.',
    ],
    eligibility: [
      'An unofficial transcript is for reference and lacks the official transcript’s seal and signature.',
      'An advising transcript serves advising purposes and is not interchangeable with every other transcript type.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Transcript-type distinctions and official directory routes reviewed; document fees and processing times not copied.',
    ),
    poster: poster('Choose the right transcript', [
      'Check whether you need an official, unofficial or advising transcript.',
      'Use SFU’s instructions for that document type.',
    ]),
    aliases: ['academic transcript', 'unofficial transcript', '成绩单', '非正式成绩单'],
    relatedIds: ['registrar-help'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/records/transcripts.html',
        'SFU — Transcripts',
        'Official transcripts; advising transcripts; unofficial transcripts',
        recordsRead,
      ),
    ],
  }),
  define({
    id: 'enrolment-letter',
    title: 'Confirmation of enrolment',
    category: 'records',
    topic: '19',
    provider: records,
    campuses: ['Online'],
    audiences: students,
    summary:
      'Request an official confirmation of enrolment through goSFU for the available term or terms.',
    access: [
      'In goSFU’s Academics menu, choose Confirmation of Enrolment and follow the request steps.',
      'The generated document is sent to your SFU email; use the official page for custom-letter or graduate routes.',
    ],
    eligibility: [
      'The student must request their own confirmation; third parties cannot request it on their behalf.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Self-service steps and student-only request condition reviewed; custom-letter fees and processing times omitted.',
    ),
    poster: poster(
      'Need proof of enrolment?',
      [
        'Request Confirmation of Enrolment through goSFU.',
        'Check your SFU email for the generated document.',
      ],
      ['Request your own document using the official process.'],
    ),
    aliases: ['proof of enrolment', 'confirmation letter', '在读证明'],
    relatedIds: ['completion-letter', 'registrar-help'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/records/confirmation-of-enrolment.html',
        'SFU — Confirmation of enrolment',
        'Requesting confirmation; goSFU steps; third-party requests; custom letters',
        recordsRead,
      ),
    ],
  }),
  define({
    id: 'completion-letter',
    title: 'Credential completion letter',
    category: 'records',
    topic: '19',
    provider: records,
    campuses: ['Online'],
    audiences: students,
    summary:
      'Find the letter confirming completion when graduation approval and the required record status make it available.',
    access: [
      'Check the eligibility and availability conditions on the completion-letter page.',
      'Use the goSFU Credential Completion Letter option when available; ask the responsible office if your status needs review.',
    ],
    eligibility: [
      'Availability depends on graduation application and approval; it is different from confirmation of current enrolment or a final degree verification.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Completion-letter conditions and distinct purpose reviewed; no availability date or guaranteed issuance claimed.',
    ),
    poster: poster(
      'Request a completion letter',
      [
        'Check graduation approval and letter availability.',
        'Use the official goSFU completion-letter process.',
      ],
      ['Availability depends on your graduation status.'],
    ),
    aliases: ['credential completion', 'graduation letter', '完成学业证明'],
    relatedIds: ['graduation-application', 'degree-verification', 'enrolment-letter'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/records/credential-completion-letter.html',
        'SFU — Credential completion letter',
        'Eligibility and availability; goSFU letter instructions',
        recordsRead,
      ),
    ],
  }),
  define({
    id: 'degree-verification',
    title: 'Degree verification through SFU’s partner',
    category: 'records',
    topic: '19',
    provider: records,
    campuses: ['Online'],
    audiences: ['All students'],
    summary:
      'SFU directs credential-verification requests to AuraData, with authorization requirements for releasing graduate information.',
    access: [
      'Read SFU’s degree-verification page before using the linked partner service.',
      'Follow the partner’s request and authorization process.',
    ],
    eligibility: [
      'The published verification process requires the graduate’s signed authorization.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'SFU partner referral and authorization requirement reviewed; the partner’s pricing and processing were not certified.',
    ),
    poster: poster('Verify an SFU credential', [
      'Use the partner linked by SFU’s degree-verification page.',
      'Follow the required graduate-authorization process.',
    ]),
    aliases: ['AuraData', 'credential verification', '学历核验'],
    relatedIds: ['completion-letter', 'transcripts'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/records/degree-verification.html',
        'SFU — Degree verification',
        'AuraData partnership; signed graduate authorization',
        recordsRead,
      ),
    ],
  }),
  define({
    id: 'letter-of-permission',
    title: 'Letter of Permission for study elsewhere',
    category: 'records',
    topic: '19',
    provider: records,
    campuses: ['Online'],
    audiences: ['Undergraduate'],
    summary:
      'Request advance permission when you want courses at another institution considered toward an SFU undergraduate credential.',
    access: [
      'Speak with an academic advisor and read the Letter of Permission criteria.',
      'Apply through the official process before taking the outside courses.',
    ],
    eligibility: [
      'Approval requires the applicable academic and program conditions and is not guaranteed.',
      'Exchange course evaluation uses its own process.',
    ],
    cost: {
      status: 'published',
      details:
        'An application charge is published on the official page; review the current terms before applying.',
    },
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Advance permission, academic review and application-charge basis reviewed; no transfer-credit entitlement or numeric rule copied.',
    ),
    poster: poster(
      'Plan outside courses in advance',
      [
        'Ask your academic advisor about a Letter of Permission.',
        'Apply before taking the outside courses.',
      ],
      ['Permission and transfer credit are subject to academic approval.'],
    ),
    aliases: ['LOP', 'study elsewhere', '外校修课许可'],
    relatedIds: ['exchange-credit', 'registrar-help'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/records/letter-of-permission.html',
        'SFU — Letter of Permission',
        'Before applying; eligibility; application procedure and charge',
        recordsRead,
        [...commonFields, 'cost'],
      ),
    ],
  }),
  define({
    id: 'tax-documents',
    title: 'Student tax receipts and forms',
    category: 'records',
    topic: '19',
    provider: records,
    campuses: ['Online'],
    audiences: students,
    summary:
      'Find official access instructions for T2202 tuition certificates and T4A forms related to student funding.',
    access: [
      'Choose the relevant T2202 or T4A instructions in SFU’s tax-document directory.',
      'Ask Student Accounts about student tax-document access or corrections.',
    ],
    eligibility: [
      'Document availability depends on the applicable record and tax year; this directory does not provide tax advice.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Document types and responsible office reviewed; no individual tax eligibility, amounts or tax deadline inferred.',
    ),
    poster: poster('Find your student tax documents', [
      'Use SFU’s T2202 or T4A access instructions.',
      'Ask Student Accounts about document access or corrections.',
    ]),
    aliases: ['T2202', 'T4A', 'tax receipt', '税务文件', '学费税单'],
    relatedIds: ['student-account'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/tax-receipts-and-forms.html',
        'SFU — Tax receipts and forms',
        'T2202; T4A; Student Accounts assistance',
        recordsRead,
      ),
    ],
  }),
  define({
    id: 'graduation-application',
    title: 'Apply for undergraduate graduation',
    category: 'records',
    topic: '19',
    provider: sfu('SFU Convocation and Enrolment Services'),
    campuses: ['Online'],
    audiences: ['Undergraduate'],
    summary:
      'Check degree requirements with your department and complete the graduation application for the appropriate term.',
    access: [
      'Ask your department for a graduation check covering general and program requirements.',
      'Use goSFU → Academics → Apply for Graduation during your final enrolled term and complete the application/payment steps.',
    ],
    eligibility: [
      'Completing courses does not replace the graduation application; requirements and the term’s application deadline still apply.',
      'Ceremony attendance arrangements are separate from approval to graduate.',
    ],
    cost: {
      status: 'published',
      details:
        'A graduation application fee applies; check the official checklist for the current amount and conditions.',
    },
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Undergraduate checklist, academic check, application and ceremony distinction reviewed; no graduate-program rule or cutoff inferred.',
    ),
    poster: poster(
      'Prepare to graduate',
      [
        'Confirm degree requirements with your department.',
        'Apply through goSFU using your term’s graduation deadline.',
      ],
      ['Graduation approval and ceremony attendance are separate steps.'],
    ),
    aliases: ['apply to graduate', 'convocation application', '申请毕业'],
    relatedIds: ['fall-graduation-dates', 'spring-graduation-dates', 'completion-letter'],
    sources: [
      source(
        'https://www.sfu.ca/convocation/checklist/undergraduate-checklist.html',
        'SFU — Undergraduate graduation checklist',
        'Graduation check; apply to graduate; application payment; ceremony arrangements',
        recordsRead,
        [...commonFields, 'cost'],
      ),
    ],
  }),
  define({
    id: 'undergraduate-reactivation',
    title: 'Returning to undergraduate studies: reactivation',
    category: 'records',
    topic: '19',
    provider: records,
    campuses: ['Online'],
    audiences: ['Undergraduate', 'International'],
    summary:
      'Check whether returning after an absence uses undergraduate reactivation or another admission process.',
    access: [
      'Read the reactivation criteria and term-specific application information.',
      'Use the domestic or international form that applies; graduate students should follow Graduate Studies’ return-to-study route.',
    ],
    eligibility: [
      'Reactivation and readmission have different conditions; do not assume every returning student uses the same form.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Returning-student routing and domestic/international forms reviewed; no personal eligibility decision or term deadline reproduced.',
    ),
    poster: poster('Returning after time away?', [
      'Check the reactivation and readmission conditions.',
      'Use the correct student-category and term instructions.',
    ]),
    aliases: ['readmission', 'return to studies', '复学', '恢复学籍'],
    relatedIds: ['registrar-help'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/undergraduate-reactivation-form.html',
        'SFU — Undergraduate reactivation',
        'Eligibility; reactivation versus readmission; forms; graduate route',
        recordsRead,
      ),
    ],
  }),
  define({
    id: 'registrar-help',
    title: 'Registrar and Enrolment Services help',
    category: 'records',
    topic: '19',
    provider: records,
    campuses,
    audiences: students,
    summary:
      'Get help with enrolment, student records, official documents, IDs, U-Pass and related student-service procedures.',
    access: [
      'Use the official help page, email or authenticated LiveHelp.',
      'Before an in-person visit, check the current campus location, hours and identity-verification requirements.',
    ],
    eligibility: [
      'Requests involving a personal record require the official identity-verification process.',
    ],
    cost: unknown,
    reviewCadence: 'evergreen',
    highImpact: false,
    verification: review(
      'reviewed',
      finalRead,
      'Service scope, LiveHelp, email and campus locations reviewed; recurring hours excluded because no validity period is published.',
    ),
    poster: poster('Ask Registrar and Enrolment Services', [
      'Use the official help page or LiveHelp.',
      'Check campus location and identification requirements before visiting.',
    ]),
    contacts: [
      { label: 'Registrar and Information Services', kind: 'email', value: 'reginfo@sfu.ca' },
    ],
    locations: [
      { campus: 'Burnaby', name: 'Maggie Benston Centre, MBC 3200' },
      { campus: 'Surrey', name: 'Mezzanine, top of the entrance staircase' },
      { campus: 'Vancouver', name: 'Harbour Centre, room 1100' },
    ],
    aliases: ['Registrar', 'RIS', 'LiveHelp', '注册处', '学籍咨询'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/get-help/hours-and-location.html',
        'SFU — Registrar help, locations and hours',
        'Need help?; LiveHelp; Visit us on campus; campus addresses; physical ID requirement',
        finalRead,
        [...commonFields, 'contacts.0', 'locations'],
      ),
    ],
  }),
  define({
    id: 'ombudsperson',
    title: 'Ombudsperson: fairness and navigating concerns',
    category: 'rights',
    topic: '20',
    provider: sfu('SFU Office of the Ombudsperson'),
    campuses,
    audiences: students,
    summary:
      'The Ombudsperson helps students understand fairness concerns, academic policies, appeals and options when they are unsure where to turn.',
    access: [
      'Read the Ombudsperson’s help topics and use the official contact route.',
      'Seek advice about your options before deciding how to proceed.',
    ],
    eligibility: [
      'Student concerns are considered individually; contacting the office does not guarantee a particular appeal outcome.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Office purpose and navigation reviewed; no legal advice, appeal outcome or exact procedural deadline inferred.',
    ),
    poster: poster('Unsure where to turn?', [
      'Ask the Ombudsperson about fairness and university processes.',
      'Explore your options for a concern or appeal.',
    ]),
    aliases: ['ombuds', 'fairness', 'appeal advice', '申诉专员', '公平处理'],
    relatedIds: ['grade-appeals', 'academic-concessions', 'student-support-rights'],
    sources: [
      source(
        'https://www.sfu.ca/ombudsperson.html',
        'SFU — Office of the Ombudsperson',
        'Office purpose; fairness concerns; policies and appeals; finding options',
        recordsRead,
      ),
    ],
  }),
  define({
    id: 'grade-appeals',
    title: 'Grade reconsideration and appeal guidance',
    category: 'rights',
    topic: '20',
    provider: sfu('SFU Office of the Ombudsperson'),
    campuses,
    audiences: students,
    summary:
      'Read the official sequence for discussing a grade concern and pursuing reconsideration or an appeal.',
    access: [
      'Begin with the instructor and review the official grade-appeal guidance.',
      'Ask the department about its procedure and required materials; the Ombudsperson can help you understand the process.',
    ],
    eligibility: [
      'Formal grounds, stages and time limits apply; read the current policy for your situation.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Grade-appeal sequence reviewed; exact time limits omitted to avoid an incomplete procedural summary.',
    ),
    poster: poster(
      'Understand grade-appeal steps',
      [
        'Start by discussing the concern with the instructor.',
        'Check the official process and department requirements.',
      ],
      ['Formal stages and time limits apply.'],
    ),
    aliases: ['grade reconsideration', 'mark appeal', '成绩申诉', '成绩复核'],
    relatedIds: ['ombudsperson'],
    sources: [
      source(
        'https://www.sfu.ca/ombudsperson/get-help/grade-appeal.html',
        'SFU Ombudsperson — Grade appeal',
        'Discuss with instructor; department procedure; written reconsideration; time limits',
        recordsRead,
      ),
    ],
  }),
  define({
    id: 'academic-concessions',
    title: 'Academic concessions for unexpected circumstances',
    category: 'rights',
    topic: '20',
    provider: records,
    campuses,
    audiences: students,
    summary:
      'Find the official process when unexpected circumstances affect coursework or examinations.',
    access: [
      'Contact the instructor promptly and read the academic-concessions guidance.',
      'Follow the relevant instructor, department or Registrar process and any applicable documentation requirements.',
    ],
    eligibility: [
      'Concessions are assessed under the applicable policy and are not automatic.',
      'Disability or other ongoing accommodations use their relevant support process.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Policy routing and distinction from ongoing accommodations reviewed; exact absence thresholds and documentation exceptions omitted.',
    ),
    poster: poster(
      'Unexpected circumstances affecting study?',
      [
        'Contact your instructor and check the concession process.',
        'Follow the required documentation and department steps.',
      ],
      ['A concession is subject to the applicable policy.'],
    ),
    aliases: [
      'missed exam',
      'missed assignment',
      'extenuating circumstances',
      '学业特殊安排',
      '考试困难',
    ],
    relatedIds: ['extenuating-withdrawal', 'ombudsperson', 'student-support-rights'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/policies-and-procedures/academic-concessions.html',
        'SFU — Academic concessions',
        'Unexpected circumstances; requesting concessions; accommodations; policy routes',
        recordsRead,
      ),
    ],
  }),
  define({
    id: 'extenuating-withdrawal',
    title: 'Withdrawal under extenuating circumstances',
    category: 'rights',
    topic: '20',
    provider: records,
    campuses,
    audiences: ['Undergraduate'],
    summary:
      'Read the official eligibility and application process when unexpected circumstances prevent course completion after the normal withdrawal period.',
    access: [
      'Review the official WE eligibility criteria and application instructions.',
      'Use the formal application route and required documentation; consult support offices if you need help navigating it.',
    ],
    eligibility: [
      'A WE request is assessed under the published criteria and is not automatically approved.',
      'An approved WE does not guarantee a tuition refund; refund review is separate.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'WE purpose, formal route and separate refund process reviewed; no successful outcome or exact cutoff inferred.',
    ),
    poster: poster(
      'Check the WE withdrawal process',
      [
        'Review eligibility and required application materials.',
        'Use the formal SFU application route.',
      ],
      ['WE approval does not guarantee a tuition refund.'],
    ),
    aliases: ['WE', 'extenuating withdrawal', '特殊情况退课'],
    relatedIds: ['academic-concessions', 'tuition-refunds', 'ombudsperson'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/appeals/withdrawals-extenuating-circumstances.html',
        'SFU — Withdrawal under extenuating circumstances',
        'Purpose; eligibility criteria and application links',
        recordsRead,
      ),
      source(
        'https://www.sfu.ca/students/enrolment-services/policies-and-procedures/academic-concessions.html',
        'SFU — Academic concessions',
        'Withdrawal under extenuating circumstances; tuition refunds are separate',
        recordsRead,
        ['eligibility.1', 'poster.conditions'],
      ),
    ],
  }),
  define({
    id: 'academic-integrity',
    title: 'Academic integrity and generative AI',
    category: 'rights',
    topic: '20',
    provider: records,
    campuses,
    audiences: students,
    summary:
      'Review SFU’s academic-integrity guidance and the requirement to follow the instructor’s explicit rules for generative AI in coursework.',
    access: [
      'Ask the instructor what tools and assistance are permitted for the specific course or assignment.',
      'Use SFU’s integrity and generative-AI guidance for attribution and responsible academic work.',
    ],
    eligibility: [
      'Permission to use generative AI must be explicit; do not assume permission from availability of a tool.',
      'When use is allowed, follow the applicable disclosure and citation instructions.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Integrity and GenAI pages read together; explicit instructor permission and citation conditions retained.',
    ),
    poster: poster(
      'Check academic-integrity expectations',
      [
        'Ask your instructor before using generative AI in coursework.',
        'Follow permission, attribution and citation requirements.',
      ],
      ['Tool availability does not mean coursework use is allowed.'],
    ),
    aliases: ['plagiarism', 'GenAI', 'ChatGPT coursework', '学术诚信', '生成式人工智能'],
    relatedIds: ['ombudsperson'],
    sources: [
      source(
        'https://www.sfu.ca/students/enrolment-services/academic-integrity/using-generative-ai.html',
        'SFU — Using generative AI',
        'Explicit instructor permission; acceptable use; citation and disclosure',
        recordsRead,
      ),
      source(
        'https://www.sfu.ca/students/enrolment-services/academic-integrity.html',
        'SFU — Academic integrity',
        'Own work; citation; getting clarification; academic-integrity support',
        recordsRead,
        ['summary', 'access', 'poster.facts.1'],
      ),
    ],
  }),
  define({
    id: 'student-support-rights',
    title: 'Student Support, Rights and Responsibilities',
    category: 'rights',
    topic: '20',
    provider: sfu('SFU Office of Student Support, Rights and Responsibilities'),
    campuses,
    audiences: students,
    summary:
      'Get guidance when challenges affect learning or when you need help navigating student conduct, rights and responsibilities.',
    access: [
      'Use the office’s current official contact page to request support.',
      'The office can help identify appropriate university services and processes.',
    ],
    eligibility: [
      'This is a support referral; emergencies require the relevant emergency service.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Current office name, purpose and email reviewed. Older email wording on the academic-concessions page was not reused.',
    ),
    poster: poster('Find support with student concerns', [
      'Contact Student Support, Rights and Responsibilities.',
      'Get help navigating university support and conduct processes.',
    ]),
    contacts: [
      {
        label: 'Office of Student Support, Rights and Responsibilities',
        kind: 'email',
        value: 'ssrr@sfu.ca',
      },
    ],
    aliases: ['OSSRR', 'student conduct', 'student support', '学生权利', '学生行为'],
    relatedIds: ['ombudsperson', 'academic-concessions'],
    sources: [
      source(
        'https://www.sfu.ca/students/studentsupport.html',
        'SFU — Student Support, Rights and Responsibilities',
        'Office purpose; support; conduct concerns; contact email',
        recordsRead,
        [...commonFields, 'contacts.0'],
      ),
    ],
  }),
  define({
    id: 'human-rights-support',
    title: 'Human Rights Office: discrimination and harassment',
    category: 'rights',
    topic: '20',
    provider: sfu('SFU Human Rights Office'),
    campuses,
    audiences: students,
    summary:
      'The Human Rights Office provides confidential and impartial advice about human-rights concerns, discrimination and discriminatory harassment.',
    access: [
      'Use the official consultation-booking route.',
      'Discuss the concern and the applicable options with the Human Rights Office.',
    ],
    eligibility: [
      'Available to the SFU community; the office determines how the relevant policy or process applies.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      recordsRead,
      'Office scope and confidential/impartial consultation description reviewed; no legal determination or guaranteed complaint outcome published.',
    ),
    poster: poster('Support for human-rights concerns', [
      'Request a confidential Human Rights Office consultation.',
      'Ask about discrimination or discriminatory harassment concerns.',
    ]),
    aliases: ['HRO', 'discrimination', 'harassment', '歧视', '骚扰', '人权'],
    relatedIds: ['ombudsperson', 'sexual-violence-support'],
    sources: [
      source(
        'https://www.sfu.ca/humanrights.html',
        'SFU — Human Rights Office',
        'Confidential and impartial advice; discrimination and harassment; Book a Consultation',
        recordsRead,
      ),
    ],
  }),
  define({
    id: 'sexual-violence-support',
    title: 'Sexual Violence Support and Prevention Office',
    category: 'rights',
    topic: '20',
    provider: sfu('SFU Sexual Violence Support and Prevention Office'),
    campuses,
    audiences: ['All students', 'FIC'],
    summary:
      'Access free, confidential support for SFU and FIC students and employees affected by sexualized violence, regardless of when or where it occurred.',
    access: [
      'Use the SVSPO contact page or email to connect with support.',
      'Check the current Zoom drop-in and appointment information.',
    ],
    eligibility: [
      'The office welcomes people of all gender identities and sexual orientations affected by sexualized violence.',
      'For urgent danger, use the relevant emergency service rather than waiting for an office reply.',
    ],
    cost: { status: 'published', details: 'The official SVSPO page describes support as free.' },
    reviewCadence: 'safety',
    highImpact: true,
    verification: review(
      'reviewed',
      finalRead,
      'Service audience, free/confidential description and contact route reviewed; no phone numbers, recurring hours or reporting outcome copied.',
    ),
    poster: poster(
      'Sexual-violence support',
      [
        'Free, confidential support for SFU and FIC students and employees.',
        'Connect with SVSPO through the official contact route.',
      ],
      ['Support is available regardless of when or where the violence occurred.'],
    ),
    contacts: [{ label: 'SVSPO support', kind: 'email', value: 'sv-support@sfu.ca' }],
    aliases: ['SVSPO', 'SVSP', 'sexual assault support', '性暴力支持', '性骚扰支持'],
    relatedIds: ['human-rights-support', 'student-support-rights'],
    sources: [
      source(
        'https://www.sfu.ca/sexual-violence.html',
        'SFU — Sexual Violence Support and Prevention Office',
        'Support description; SFU and FIC audience; How to connect with us',
        finalRead,
        [...commonFields, 'cost', 'contacts.0', 'poster.conditions'],
      ),
    ],
  }),
  define({
    id: 'peer-mentor-referral-guide',
    title: 'Peer Mentor Referral Guide — Hub summary',
    category: 'rights',
    topic: '20',
    provider: sfu('SFU support offices'),
    campuses,
    audiences: students,
    summary:
      'A Hub-written routing guide to official SFU support offices when a student is unsure where to start.',
    access: [
      'Choose the related service that matches the question and open its official contact route.',
      'If the route is unclear, ask the Ombudsperson or Student Support, Rights and Responsibilities about available options.',
    ],
    eligibility: [
      'This guide describes public services; each office assesses the applicable process and support options.',
    ],
    cost: unknown,
    reviewCadence: 'sensitive',
    highImpact: true,
    verification: review(
      'reviewed',
      finalRead,
      'Hub-authored navigation based on reviewed office descriptions. It is not an official SFU-authored referral policy or a case-management service.',
    ),
    details: [
      {
        heading: 'About this guide',
        body: 'This is a Hub-written routing summary, not an official SFU-authored guide. It stores no private incidents, student documents, communications or case notes. Use the related official service for personal support.',
      },
      {
        heading: 'Fairness, appeals or an unclear process',
        body: 'Start with the Ombudsperson for help understanding university processes and options. See the related Ombudsperson record.',
      },
      {
        heading: 'Challenges affecting learning or student conduct',
        body: 'Contact Student Support, Rights and Responsibilities. See the related office record for its current contact route.',
      },
      {
        heading: 'Discrimination or discriminatory harassment',
        body: 'Use the Human Rights Office consultation route in the related record.',
      },
      {
        heading: 'Sexualized violence',
        body: 'Use the Sexual Violence Support and Prevention Office record for its confidential support route.',
      },
      {
        heading: 'Enrolment, official documents or financial aid',
        body: 'Use Registrar help for student-record procedures, or Financial Aid and Awards for assistance programs. Tuition transactions go to Student Accounts.',
      },
    ],
    poster: poster(
      'Find the right support office',
      [
        'Use the Hub’s referral guide to explore official service routes.',
        'When unsure, ask the Ombudsperson or Student Support office.',
      ],
      ['Hub-written routing summary; each office confirms its process.'],
      'link',
    ),
    aliases: ['where to get help', 'mentor referral', '转介指南', '找哪个部门'],
    relatedIds: [
      'ombudsperson',
      'student-support-rights',
      'human-rights-support',
      'sexual-violence-support',
      'registrar-help',
      'financial-aid-advising',
      'student-account',
    ],
    sources: [
      {
        ...source(
          'https://www.sfu.ca/ombudsperson.html',
          'SFU — Office of the Ombudsperson',
          'Help navigating university processes and finding options',
          recordsRead,
          ['summary', 'access.0', 'access.1', 'eligibility.0', 'details.1', 'poster.facts.1'],
        ),
        note: 'Hub-written referral summary derived from the reviewed office scope; not an official SFU-authored guide.',
      },
      source(
        'https://www.sfu.ca/students/studentsupport.html',
        'SFU — Student Support, Rights and Responsibilities',
        'Office purpose; help navigating student support and conduct',
        recordsRead,
        ['access.1', 'details.2', 'poster.facts.1'],
      ),
      source(
        'https://www.sfu.ca/humanrights.html',
        'SFU — Human Rights Office',
        'Consultation for discrimination and discriminatory harassment',
        recordsRead,
        ['details.3'],
      ),
      source(
        'https://www.sfu.ca/sexual-violence.html',
        'SFU — Sexual Violence Support and Prevention Office',
        'Confidential support description; contact route',
        finalRead,
        ['details.4'],
      ),
      source(
        'https://www.sfu.ca/students/enrolment-services/get-help/hours-and-location.html',
        'SFU — Registrar help',
        'Service scope; official contact routes',
        finalRead,
        ['details.5'],
      ),
      source(
        'https://www.sfu.ca/students/financial-aid/contact.html',
        'SFU — Financial Aid and Awards contact',
        'Financial-aid advising; Student Accounts distinction',
        moneyRead,
        ['details.5'],
      ),
    ],
  }),
];
