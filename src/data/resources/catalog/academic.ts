import { defineResource, type CatalogInput, type SourceInput } from './define';
import type { Campus, ResourceReview } from '../types';

// Public pages were read in the research pass below, not certified by an HTTP check.
// See docs/resources/research-academic.md for source conflicts and omitted claims.
const reviewedAt = '2026-10-04T15:32:03Z';
const reviewed = (): ResourceReview => ({
  status: 'reviewed',
  verifiedAt: reviewedAt,
  reviewedAt,
  reviewer: 'agent',
});
const partial = (note: string): ResourceReview => ({
  status: 'partial',
  verifiedAt: null,
  reviewedAt,
  reviewer: 'agent',
  note,
});
const sfu = (name: string) => ({ name, type: 'sfu' as const });
const online: Campus[] = ['Online'];
const allCampuses: Campus[] = ['Burnaby', 'Surrey', 'Vancouver', 'Online'];
const unknownCost = { status: 'unknown' as const };
const enrol = 'https://www.sfu.ca/students/enrolment-services/';
const advisors = 'https://www.sfu.ca/students/academicadvising/';
const directory = `${advisors}contact/departmental-advisors/`;
const it = 'https://sfu.teamdynamix.com/TDClient/255/ITServices/';
const learningUrl = `${enrol}academic-integrity/support-and-resources.html`;
const belzbergUrl = 'https://www.sfu.ca/vancouver/campus-services/belzberg-library.html';
const vancouverSpaces = 'https://www.sfu.ca/vancouver/students/study-spaces.html';
function source(
  url: string,
  title: string,
  at: string,
  locator: string,
  fields: string[],
): SourceInput {
  return {
    url,
    title,
    locator,
    fields,
    lastRetrievalAttemptAt: at,
    lastRetrievedAt: at,
    retrievalStatus: 'retrieved',
  };
}
function blocked(
  url: string,
  title: string,
  at: string,
  status: 'blocked' | 'unavailable' = 'blocked',
): SourceInput {
  return {
    url,
    title,
    locator:
      status === 'blocked'
        ? 'Access challenge; no service facts retrieved'
        : 'Page returned 404; no service facts retrieved',
    fields: [],
    lastRetrievalAttemptAt: at,
    lastRetrievedAt: null,
    retrievalStatus: status,
  };
}
const before = (locator: string, fields: string[]) =>
  source(
    `${enrol}enrolment/before-you-enrol.html`,
    'SFU: Before you enrol',
    '2026-10-04T15:29:26.503Z',
    locator,
    fields,
  );
const learning = (locator: string, fields: string[]) =>
  source(
    learningUrl,
    'SFU: Academic support and resources',
    '2026-10-04T15:26:37.895Z',
    locator,
    fields,
  );
const belzberg = (locator: string, fields: string[]) =>
  source(
    belzbergUrl,
    'SFU Vancouver: Belzberg Library',
    '2026-10-04T15:31:01.016Z',
    locator,
    fields,
  );
const poster = (
  title: string,
  facts: string[],
  conditions: string[] = [],
  mode: 'facts' | 'link' = 'facts',
) => ({ title, facts, conditions, mode });

const planning: CatalogInput[] = [
  {
    id: 'gosfu-enrolment',
    title: 'goSFU: enrol in courses',
    category: 'course-planning',
    topic: '02',
    summary: 'Find your personal enrolment appointment and complete registration in goSFU.',
    provider: sfu('SFU Enrolment Services'),
    access: [
      'Sign in to goSFU with your Computing ID and open Student Centre.',
      'Check Enrolment Dates, choose the correct term, and enrol on or after your appointment.',
    ],
    eligibility: [
      'Enrolment depends on your student status, prerequisites and course restrictions.',
    ],
    audiences: ['Undergraduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    details: [
      {
        heading: 'Plan, then enrol',
        body: 'Use this hub’s Course Planner to compare offerings. Confirm current availability and complete registration in goSFU; a local planner selection does not enrol you.',
      },
    ],
    aliases: ['选课', 'enrollment', 'course registration', 'enrolment appointment'],
    relatedIds: ['myschedule', 'enrolment-troubleshooting'],
    poster: poster(
      'Course enrolment',
      [
        'Check your appointment in goSFU → Student Centre → Enrolment Dates.',
        'Complete enrolment on or after your personal appointment.',
      ],
      ['Course prerequisites and restrictions still apply.'],
    ),
    sources: [
      source(
        `${enrol}enrolment/how-to-enrol.html`,
        'SFU: How to enrol',
        '2026-10-04T15:31:46.340Z',
        'Follow these enrolment steps',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  },
  {
    id: 'myschedule',
    title: 'mySchedule: build a timetable',
    category: 'course-planning',
    topic: '02',
    summary: 'Explore visual timetable options and check meeting conflicts through goSFU.',
    provider: sfu('SFU Enrolment Services'),
    access: [
      'Open goSFU, sign in, then choose My Schedule.',
      'Review every meeting and exam time; use goSFU for swap and edit actions.',
    ],
    eligibility: [
      'For SFU students planning enrolment. Cart validation checks prerequisites, not reserves or all other restrictions.',
    ],
    audiences: ['Undergraduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['timetable', '课表', 'schedule conflict', 'validate course cart'],
    relatedIds: ['gosfu-enrolment', 'enrolment-sections'],
    poster: poster(
      'Plan your timetable',
      ['Open My Schedule in goSFU to compare timetable options.', 'Use goSFU for swaps and edits.'],
      ['Cart validation does not check every enrolment restriction.'],
    ),
    sources: [
      before('Use mySchedule to plan and enrol → Important notes', [
        'summary',
        'access',
        'eligibility',
        'poster',
      ]),
    ],
  },
  {
    id: 'coursys',
    title: 'CourSys: offerings and course tools',
    category: 'course-planning',
    topic: '02',
    summary:
      'Browse course offerings publicly and use instructor-assigned CourSys tools when required.',
    provider: sfu('SFU CourSys'),
    access: [
      'Use Browse Course Offerings to filter by term, subject, campus and section.',
      'Sign in only on the official SFU site for course activities assigned by your instructor.',
    ],
    eligibility: [
      'Public offering search is available without login; course activities depend on instructor use and access.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    details: [
      {
        heading: 'Existing Course Planner',
        body: 'The hub’s Course Planner uses published CourSys snapshots for comparisons. Check official course systems for changes and use goSFU to enrol.',
      },
    ],
    aliases: ['course offerings', '课程查询'],
    relatedIds: ['gosfu-enrolment', 'course-outlines'],
    poster: poster('Find course offerings', [
      'CourSys offers public term, subject and campus filters.',
      'Follow your instructor’s directions for CourSys course activities.',
    ]),
    sources: [
      source(
        'https://coursys.sfu.ca/browse/',
        'SFU CourSys: Browse Course Offerings',
        '2026-10-04T15:29:26.229Z',
        'Public browse form: Semester, Subject, Campus and Section',
        ['summary', 'access.0', 'eligibility', 'poster.facts.0'],
      ),
      source(
        'https://coursys.sfu.ca/docs/students',
        'SFU CourSys: Student documentation',
        '2026-10-04T15:30:39.786Z',
        'Forming Groups and Submitting as a Group',
        ['access.1', 'poster.facts.1'],
      ),
    ],
  },
  {
    id: 'course-outlines',
    title: 'SFU Course Outlines',
    category: 'course-planning',
    topic: '02',
    summary:
      'Look up a published outline for a specific year, term, department, course and section.',
    provider: sfu('Simon Fraser University'),
    access: ['Use the outline search or browse by year, term, department, number and section.'],
    eligibility: ['Public course-outline search; select the relevant term and section.'],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['syllabus', '课程大纲', 'outline'],
    relatedIds: ['coursys'],
    poster: poster('Check the course outline', [
      'Choose the exact year, term and section.',
      'Use SFU’s Course Outlines search for published outlines.',
    ]),
    sources: [
      source(
        'https://www.sfu.ca/outlines.html',
        'SFU Course Outlines',
        '2026-10-04T15:28:53.387Z',
        'Search and Browse selectors; archive link',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  },
  {
    id: 'enrolment-sections',
    title: 'Course codes, lectures, labs and prerequisites',
    category: 'course-planning',
    topic: '02',
    summary:
      'Understand section labels and select the linked lecture and tutorial or lab your course requires.',
    provider: sfu('SFU Enrolment Services'),
    access: [
      'Check the class numbers and linked sections in goSFU.',
      'Read prerequisite and corequisite requirements before choosing a course.',
    ],
    eligibility: [
      'A prerequisite is completed before a course; a corequisite may be completed before or alongside it. This directory does not decide individual eligibility.',
    ],
    audiences: ['Undergraduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    facts: [
      { label: 'Meeting types', value: 'Lec = lecture; Tut = tutorial; Lab = laboratory.' },
      { label: 'Section codes', value: 'D = day; E = evening; B = blended; OL = online.' },
    ],
    aliases: ['corequisite', '先修课', 'lab tutorial', 'section type', 'class number'],
    relatedIds: ['myschedule', 'enrolment-changes'],
    poster: poster(
      'Choose linked sections',
      [
        'Courses with a lecture and tutorial/lab require both class numbers.',
        'Both required sections need available space.',
      ],
      ['Check prerequisite and corequisite requirements in the official listing.'],
    ),
    sources: [
      before('Tip: Write down the class numbers; Understand key terminology', [
        'summary',
        'access',
        'eligibility',
        'facts',
        'poster',
      ]),
    ],
  },
  {
    id: 'enrolment-changes',
    title: 'Add, drop, swap and manage waitlists',
    category: 'course-planning',
    topic: '02',
    summary: 'Follow goSFU procedures for course changes and check that each change succeeded.',
    provider: sfu('SFU Enrolment Services'),
    access: [
      'Use the official add/drop/waitlist instructions and confirm your Student Centre class schedule afterward.',
      'For a full course with a lab or tutorial, follow the specific lab/tutorial waitlist instructions.',
    ],
    eligibility: [
      'Waitlisting does not guarantee enrolment. Course restrictions and time conflicts still apply.',
    ],
    audiences: ['Undergraduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'sensitive',
    highImpact: true,
    details: [
      {
        heading: 'Academic record and money are separate',
        body: 'Check the term’s academic withdrawal dates and tuition-refund rules separately before changing enrolment. Remove an unwanted waitlist entry yourself; check your SFU email for enrolment notices.',
      },
    ],
    aliases: ['waitlist', 'drop course', 'swap', '退课', '退课退费', '候补'],
    relatedIds: ['gosfu-enrolment', 'enrolment-troubleshooting'],
    poster: poster(
      'Changing courses?',
      [
        'Confirm every add, drop or swap in Student Centre.',
        'A waitlist is not a guaranteed seat.',
      ],
      ['Check academic-record and refund deadlines separately.'],
    ),
    sources: [
      source(
        `${enrol}enrolment/add-drop-waitlist.html`,
        'SFU: Add/drop/waitlist',
        '2026-10-04T15:27:40.916Z',
        'Add, swap, or drop courses; What is a waitlist?; Waitlist FAQs',
        ['summary', 'access', 'eligibility', 'details', 'poster'],
      ),
    ],
  },
  {
    id: 'enrolment-troubleshooting',
    title: 'Enrolment holds, restrictions and errors',
    category: 'course-planning',
    topic: '02',
    summary:
      'Identify where to ask about a hold, reserved seat, prerequisite or timetable conflict.',
    provider: sfu('SFU Enrolment Services'),
    access: [
      'Check the Holds box in Student Centre and the error for the specific class.',
      'Ask the offering department about consent or reserved-seat issues.',
    ],
    eligibility: [
      'Permission depends on the department and course; an error does not establish eligibility for an override.',
    ],
    audiences: ['Undergraduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    facts: [
      {
        label: 'Common causes',
        value:
          'Full class, prerequisites, conflicts including midterms, consent, reserved seats or faculty course-load limits.',
      },
    ],
    aliases: ['cannot enrol', 'reserved seats', 'hold', '选课失败', '时间冲突'],
    relatedIds: ['advising', 'gosfu-enrolment'],
    poster: poster('Trouble enrolling?', [
      'Check the class error and the Holds box in goSFU.',
      'Contact the offering department for reserved-seat or consent questions.',
    ]),
    sources: [
      source(
        `${enrol}enrolment/faq.html`,
        'SFU: Enrolment FAQs',
        '2026-10-04T15:31:46.527Z',
        'Why don’t I have the option to add classes?; Why can’t I get into a specific class?',
        ['summary', 'access', 'eligibility', 'facts', 'poster'],
      ),
    ],
  },
  {
    id: 'exam-schedules',
    title: 'Find and confirm your examination schedule',
    category: 'course-planning',
    topic: '02',
    summary:
      'Check goSFU for current exam details and verify changes with your instructor or department.',
    provider: sfu('SFU Enrolment Services'),
    access: [
      'Check your exams in goSFU. Use the official examinations page for published schedules.',
      'Ask the instructor or department to verify an unexpected change.',
    ],
    eligibility: ['For students with scheduled final examinations.'],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: allCampuses,
    cost: unknownCost,
    verification: partial(
      'The public download page still labels Summer 2026. Fall 2026 and Spring 2027 exam downloads were not confirmed; no dates or rooms are copied here.',
    ),
    reviewCadence: 'schedule',
    highImpact: true,
    aliases: ['final exam', '考试时间', 'exam timetable'],
    relatedIds: ['exam-hardship'],
    poster: poster(
      'Check your exam schedule',
      [
        'Use goSFU for current exam details.',
        'Verify unexpected changes with your instructor or department.',
      ],
      ['Confirm your own term and section.'],
      'link',
    ),
    sources: [
      source(
        `${enrol}exams/student-responsibilities.html`,
        'SFU: Examination student responsibilities',
        '2026-10-04T15:30:40.004Z',
        'Check goSFU for the most current information; verify changes',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
      source(
        `${enrol}exams.html`,
        'SFU: Examinations',
        '2026-10-04T15:27:40.712Z',
        'DOWNLOAD EXAM SCHEDULE says Summer 2026',
        [],
      ),
    ],
  },
  {
    id: 'exam-hardship',
    title: 'Examination hardship and location conflicts',
    category: 'course-planning',
    topic: '02',
    summary:
      'Contact your instructors and department about qualifying exam clusters or consecutive exams at different locations.',
    provider: sfu('SFU Enrolment Services'),
    access: [
      'Read the official hardship definition and notify your instructor(s) and department one month before the exam date.',
    ],
    eligibility: [
      'The official definition includes three or more end-of-term exams within 24 hours, measured from the first exam’s start to the last exam’s end, or immediately consecutive exams at different locations.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: allCampuses,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'sensitive',
    highImpact: true,
    details: [
      {
        heading: 'Arrangements',
        body: 'For a qualifying cluster, the instructor or department arranges a new date for the second exam within the exam period. For qualifying location conflicts, arrangements are made to write both at one location. Ask the responsible staff to assess your situation.',
      },
    ],
    aliases: ['exam conflict', '考试冲突', 'examination hardship'],
    relatedIds: ['exam-schedules'],
    poster: poster(
      'Exam hardship?',
      [
        'Review the official exam-cluster and location-conflict rules.',
        'Notify your instructor(s) and department one month before the exam.',
      ],
      ['The instructor or department confirms the arrangements.'],
    ),
    sources: [
      source(
        `${enrol}exams/exam-hardship.html`,
        'SFU: Exam hardship',
        '2026-10-04T15:30:40.182Z',
        'Definition bullets, arrangements and final notification paragraph',
        ['summary', 'access', 'eligibility', 'details', 'poster'],
      ),
    ],
  },
  {
    id: 'academic-progress-report',
    title: 'Academic Progress Report (APR)',
    category: 'course-planning',
    topic: '02',
    summary:
      'Review completed and remaining program requirements alongside advice from your academic advisor.',
    provider: sfu('SFU Enrolment Services'),
    access: ['In goSFU Student Centre, open Academic Progress → View my academic progress report.'],
    eligibility: [
      'Current undergraduates in supported programs. APR excludes graduate programs, post-baccalaureate diplomas, second degrees and programs before Fall 2006.',
    ],
    audiences: ['Undergraduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    details: [
      {
        heading: 'Graduation checks',
        body: 'APR does not replace advisor-assisted course planning, degree planning or graduation checks. Discuss a possible transfer to another program with your advisor.',
      },
    ],
    aliases: ['degree audit', '毕业要求', 'APR'],
    relatedIds: ['advising', 'degree-planning'],
    poster: poster(
      'Review your degree progress',
      [
        'Open your APR through goSFU Academic Progress.',
        'Review requirements with your academic advisor.',
      ],
      [
        'APR is available for supported undergraduate programs and does not replace a graduation check.',
      ],
    ),
    sources: [
      source(
        `${enrol}apr.html`,
        'SFU: Academic Progress Report',
        '2026-10-04T15:30:40.371Z',
        'APR overview, excluded programs and note',
        ['summary', 'eligibility', 'details', 'poster'],
      ),
      source(
        `${enrol}apr/how-to-access.html`,
        'SFU: How to access APR',
        '2026-10-04T15:30:40.552Z',
        'My Academic Requirements',
        ['access', 'poster.facts.0'],
      ),
    ],
  },
];

// Faculty records intentionally preserve different contact and appointment routes.
const facultyAdvising: CatalogInput[] = [
  [
    'fas',
    'Applied Sciences',
    'advising-fas',
    '2026-10-04T15:30:02.750Z',
    'Computing Science, Engineering Science, General Studies, Mechatronics, Software Systems and Sustainable Energy Engineering.',
    'Use the FAS appointment link in the official directory or email asadvise@sfu.ca.',
    ['Online'],
    ['FAS', '工程学院', 'computing advising'],
  ],
  [
    'fass',
    'Arts and Social Sciences',
    'advising-fass',
    '2026-10-04T15:30:02.907Z',
    'Arts Central supports undeclared/intended students, BA Two Minor and students considering FASS; departmental advisors support specific programs.',
    'Choose Arts Central, the first/second-year team, a designated cohort advisor or your department using the official directory.',
    ['Online'],
    ['FASS', 'Arts Central', '文科咨询'],
  ],
  [
    'business',
    'Beedie School of Business',
    'advising-beedie',
    '2026-10-04T15:30:03.013Z',
    'Undergraduate business course planning, program declaration and graduation-requirement questions.',
    'Email sfubeedie_undergrad@sfu.ca or follow the directory link for Burnaby and Surrey drop-in sessions.',
    ['Burnaby', 'Surrey', 'Online'],
    ['Beedie', 'business advising', '商学院'],
  ],
  [
    'fcat',
    'Communication, Art and Technology',
    'advising-fcat',
    '2026-10-04T15:30:03.166Z',
    'FCAT general/double-minor/undeclared advice and program contacts for Communication, Contemporary Arts, SIAT and Publishing.',
    'Select your program and year in the directory; general FCAT enquiries go to fcatadv@sfu.ca.',
    ['Online'],
    ['FCAT', 'SIAT advising', '艺术传播'],
  ],
  [
    'education',
    'Education',
    'advising-education',
    '2026-10-04T15:30:03.301Z',
    'Education undergraduate advising and recruitment contacts.',
    'Contact one of the Undergraduate Advisor & Recruiter roles listed in the directory; both are located at Burnaby EDB 8630.',
    ['Burnaby', 'Online'],
    ['education advising', '教育学院'],
  ],
  [
    'environment',
    'Environment',
    'advising-environment',
    '2026-10-04T15:30:03.408Z',
    'Program-specific contacts for Archaeology, Environmental Science, Geography, REM and sustainability programs.',
    'Select your exact major, minor, joint program or certificate in the directory; contact the corresponding advisor.',
    ['Online'],
    ['environment advising', 'REM', '环境学院'],
  ],
  [
    'health-sciences',
    'Health Sciences',
    'advising-health-sciences',
    '2026-10-04T15:30:03.548Z',
    'Health Sciences advisors support program planning and graduation-requirement questions.',
    'Use the faculty directory contacts fhs_advising@sfu.ca or fhs_advising2@sfu.ca to ask about access.',
    ['Burnaby', 'Online'],
    ['FHS', 'HSCI advising', '健康科学'],
  ],
  [
    'faculty-of-science',
    'Science',
    'advising-science',
    '2026-10-04T15:30:03.703Z',
    'Science faculty and departmental advising, including General Science and internal transfers.',
    'Undergraduate Science students can book in Advisor Link; use the directory to identify the faculty or department advisor.',
    ['Online'],
    ['science advising', '理学院', 'math advisor'],
  ],
].map(([path, name, id, at, scope, access, campuses, aliases]) => ({
  id: id as string,
  title: `${name as string} academic advising`,
  category: 'advising',
  topic: '03',
  summary: scope as string,
  provider: sfu(`SFU ${name as string}`),
  access: [access as string],
  eligibility: [
    'Undergraduate program questions; choose the advisor whose program and student scope match your situation.',
  ],
  audiences: ['Undergraduate'],
  campuses: campuses as Campus[],
  cost: unknownCost,
  verification: reviewed(),
  reviewCadence: 'evergreen',
  highImpact: false,
  aliases: aliases as string[],
  relatedIds: ['advising', 'degree-planning'],
  poster: poster(
    `${name as string} advising`,
    [scope as string, access as string],
    ['Use the contact for your program and stage of study.'],
  ),
  sources: [
    source(
      `${directory}${path as string}.html`,
      `SFU departmental advisors: ${name as string}`,
      at as string,
      `${name as string} directory table and access instructions`,
      ['summary', 'provider', 'access', 'eligibility', 'poster'],
    ),
  ],
}));

const advisingResources: CatalogInput[] = [
  {
    id: 'advising',
    title: 'Which academic advisor should I contact?',
    category: 'advising',
    topic: '03',
    summary:
      'Choose faculty or departmental advising for program planning, and Student Services for academic difficulty.',
    provider: sfu('SFU Academic Advising'),
    access: [
      'For course planning, declarations, internal transfers and graduation checks, use the faculty/department directory.',
      'For academic standing, GPA concerns or withdrawal difficulties, use Student Services drop-in advising or Advisor Link.',
    ],
    eligibility: [
      'Admitted and current undergraduates. Prospective admission questions go to Admissions.',
    ],
    audiences: ['Undergraduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['academic advisor', '学业顾问', 'academic probation', 'RTW', '学业困难'],
    relatedIds: ['back-on-track', 'degree-planning', 'academic-progress-report'],
    poster: poster(
      'Find your academic advisor',
      [
        'Course/program planning: faculty or department advising.',
        'Academic difficulty: Student Services Academic Advising.',
      ],
      ['Check the relevant team’s appointment or drop-in access.'],
    ),
    sources: [
      source(
        `${advisors}contact.html`,
        'SFU: Student Services Academic Advising',
        '2026-10-04T15:30:02.536Z',
        'Academic difficulty; Prospective students; Admitted and Current Students',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
      source(
        'https://www.sfu.ca/students/academicadvising.html',
        'SFU: Academic Advising',
        '2026-10-04T15:27:40.301Z',
        'How do I connect with Academic Advisors?',
        ['access.0'],
      ),
    ],
  },
  ...facultyAdvising,
  {
    id: 'degree-planning',
    title: 'Choose, declare or change your program',
    category: 'advising',
    topic: '03',
    summary:
      'Explore degree options, check the applicable Calendar requirements and plan a declaration or internal transfer with an advisor.',
    provider: sfu('SFU Academic Advising'),
    access: [
      'Explore programs in the Academic Calendar, including majors, minors, joint programs and certificates.',
      'Read the intended program’s admission requirements and contact its departmental advisor before declaring or changing programs.',
    ],
    eligibility: [
      'Program requirements and admission processes differ. A completed course or planner selection does not itself admit you to a program.',
    ],
    audiences: ['Undergraduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    details: [
      {
        heading: 'Graduation requirements',
        body: 'Discuss degree, program and Writing/Quantitative/Breadth requirements with your advisor. When changing majors, ask about deactivating the former declared program.',
      },
    ],
    aliases: [
      'declare major',
      'minor',
      'joint major',
      'certificate',
      'internal transfer',
      '转专业',
      '毕业检查',
    ],
    relatedIds: ['advising', 'academic-progress-report'],
    poster: poster(
      'Plan your program',
      [
        'Read the intended program’s Calendar requirements.',
        'Contact the program advisor to discuss declaration or internal transfer.',
      ],
      ['Requirements and processes vary by program.'],
    ),
    sources: [
      source(
        `${advisors}choosing-major.html`,
        'SFU: Choosing a major',
        '2026-10-04T15:28:35.880Z',
        'Selecting, declaring and changing your major',
        ['summary', 'access', 'eligibility', 'details', 'poster'],
      ),
      source(
        `${advisors}degreeplanner.html`,
        'SFU: Degree planning and requirements',
        '2026-10-04T15:28:35.734Z',
        'Degree Program Planning; Find a program; Degree Requirements',
        ['summary', 'access.0', 'details'],
      ),
    ],
  },
  {
    id: 'back-on-track',
    title: 'Back on Track academic support',
    category: 'advising',
    topic: '03',
    summary:
      'Explore the structured support program for students facing academic difficulty and Required to Withdraw standing.',
    provider: sfu('SFU Back on Track Program'),
    access: [
      'Prospective participants must first attend the Required to Withdraw Information Session.',
      'Current participants book mandatory sessions and appointments through Advisor Link; use their dedicated BOT advisor for enquiries.',
    ],
    eligibility: [
      'Participation depends on program eligibility and successful application; the information session explains current requirements.',
    ],
    audiences: ['Undergraduate'],
    campuses: ['Burnaby', 'Online'],
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['BOT', 'required to withdraw', '学业恢复'],
    relatedIds: ['advising'],
    poster: poster(
      'Back on Track',
      [
        'Academic support for students facing academic difficulty.',
        'Start with the required RTW Information Session.',
      ],
      ['Eligibility and application requirements apply.'],
    ),
    sources: [
      source(
        'https://www.sfu.ca/students/bot/program-overview.html',
        'SFU: Back on Track overview',
        '2026-10-04T15:27:40.441Z',
        'What is the Back on Track Program?',
        ['summary', 'eligibility', 'poster'],
      ),
      source(
        'https://www.sfu.ca/students/bot/contact-us.html',
        'SFU: Back on Track contact',
        '2026-10-04T15:27:40.579Z',
        'Prospective and Current Back on Track Students; Program Office',
        ['access', 'campuses', 'poster.facts.1'],
      ),
    ],
  },
];

const digital: CatalogInput[] = [
  {
    id: 'computing-id',
    title: 'Activate your SFU Computing ID',
    category: 'digital',
    topic: '04',
    summary:
      'Activate the account used for SFU Mail, goSFU, Canvas, Wi-Fi and other university systems.',
    provider: sfu('SFU IT Services'),
    access: ['Use Activate Your Computing ID on the official Computing Account service page.'],
    eligibility: [
      'For people issued an SFU Computing ID; access to individual services depends on your SFU role.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    facts: [
      {
        label: 'Login identity',
        value:
          'Your Computing ID is the username in computingID@sfu.ca, not your nine-digit student number or a name-based email alias.',
      },
    ],
    aliases: ['account activation', 'SFU ID', '账号激活'],
    relatedIds: ['password-reset', 'mfa', 'sfu-mail'],
    poster: poster('Activate your Computing ID', [
      'Use SFU’s official account activation link.',
      'Your Computing ID is different from your student number.',
    ]),
    sources: [
      source(
        `${it}Requests/Service/2440/Computing-Account`,
        'SFU IT: Computing Account',
        '2026-10-04T15:31:46.031Z',
        'One person, one Computing ID; Activate Your Computing ID; FAQ',
        ['summary', 'access', 'eligibility', 'facts', 'poster'],
      ),
    ],
  },
  {
    id: 'password-reset',
    title: 'Recover or reset your Computing ID password',
    category: 'digital',
    topic: '04',
    summary:
      'Use SFU’s official recovery process or the IT Service Desk when self-service recovery is unavailable.',
    provider: sfu('SFU IT Services'),
    access: [
      'Follow the official password-reset guide to my.sfu.ca/ForgotPassword.',
      'If recovery email or security-question recovery is unavailable, contact the IT Service Desk.',
    ],
    eligibility: [
      'Account holders must complete SFU’s identity-verification process on its official site.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'sensitive',
    highImpact: true,
    facts: [
      {
        label: 'Username field',
        value:
          'Use the Computing ID without @sfu.ca; the SFU ID field is your student/employee number.',
      },
    ],
    aliases: ['forgot password', '密码', 'account recovery', '登录不了'],
    relatedIds: ['computing-id', 'it-help', 'mfa'],
    poster: poster('Forgot your password?', [
      'Use the official SFU password-reset guide.',
      'If self-service fails, contact the IT Service Desk.',
    ]),
    sources: [
      source(
        `${it}KB/Article/12702/Resetting-your-Computing-ID-password`,
        'SFU IT: Resetting your Computing ID password',
        '2026-10-04T15:28:12.004Z',
        'Overview; Reset your Computing ID password; Unable to reset password',
        ['summary', 'access', 'eligibility', 'facts', 'poster'],
      ),
    ],
  },
  {
    id: 'mfa',
    title: 'Multi-factor authentication: setup and recovery',
    category: 'digital',
    topic: '04',
    summary:
      'Set up MFA, manage devices and use official login help when you cannot access your codes.',
    provider: sfu('SFU IT Services'),
    access: [
      'Follow the official Set Up MFA guide; manage enrolled devices through the SFU MFA Management App.',
      'Use Get Help with Log in if you cannot access your MFA codes.',
    ],
    eligibility: [
      'Requirements vary by account and service; some services require MFA as a condition of access.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['MFA recovery', 'two factor', '验证码', '双重认证'],
    relatedIds: ['password-reset', 'it-help'],
    poster: poster(
      'Set up and manage MFA',
      [
        'Use SFU’s MFA setup and device-management guides.',
        'Lost access to codes? Choose Get Help with Log in.',
      ],
      ['Keep recovery codes private.'],
    ),
    sources: [
      source(
        `${it}Requests/Service/2547/Multi-Factor-Authentication-MFA`,
        'SFU IT: Multi-Factor Authentication',
        '2026-10-04T15:27:18.837Z',
        'Who needs to set up MFA?; Set Up MFA; Manage MFA Settings; Get Help with Log in',
        ['summary', 'access', 'eligibility', 'poster.facts'],
      ),
    ],
  },
  {
    id: 'sfu-mail',
    title: 'SFU Mail in your browser',
    category: 'digital',
    topic: '04',
    summary:
      'Open SFU’s email and calendar through Outlook on the web using your Computing ID email address.',
    provider: sfu('SFU IT Services'),
    access: [
      'Go to outlook.office.com and enter ComputingID@sfu.ca.',
      'At SFU’s sign-in page, use your Computing ID and password, then complete MFA if prompted.',
    ],
    eligibility: ['SFU account holders with mail access.'],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['email', '邮箱', 'Outlook'],
    relatedIds: ['computing-id', 'phishing'],
    poster: poster('Check your SFU Mail', [
      'Open Outlook on the web.',
      'Start with your ComputingID@sfu.ca address.',
    ]),
    sources: [
      source(
        `${it}KB/Article/6838/Sign-into-SFU-Mail-on-Web-Browser`,
        'SFU IT: Sign into SFU Mail on Web Browser',
        '2026-10-04T15:28:35.200Z',
        'Sign In steps',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  },
  {
    id: 'canvas',
    title: 'Canvas: course materials and assignments',
    category: 'digital',
    topic: '04',
    summary:
      'Access instructor-published course materials, discussions and assignments in SFU Canvas.',
    provider: sfu('SFU IT Services'),
    access: [
      'Use canvas.sfu.ca for Spring 2026 courses and later.',
      'Use the official student help guides or Request Help with Canvas for access problems.',
    ],
    eligibility: ['Access depends on the course and instructor-published materials.'],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    details: [
      {
        heading: 'Older courses',
        body: 'The service page distinguishes the old on-premise system for 2025 and earlier. Off-campus access to that old system requires SFU VPN.',
      },
    ],
    aliases: ['learning management', '作业', '课程资料'],
    relatedIds: ['computing-id', 'it-help'],
    poster: poster('Open your course in Canvas', [
      'Use canvas.sfu.ca for Spring 2026 and later courses.',
      'Follow the instructor’s published materials and assignment instructions.',
    ]),
    sources: [
      source(
        `${it}Requests/Service/2441/Canvas`,
        'SFU IT: Canvas',
        '2026-10-04T15:28:11.483Z',
        'About this service; Log In; restricted on-premise access notice',
        ['summary', 'access', 'eligibility', 'details', 'poster'],
      ),
    ],
  },
  {
    id: 'wifi',
    title: 'Campus Wi-Fi and eduroam',
    category: 'digital',
    topic: '04',
    summary:
      'Use SFUNET-SECURE at SFU and official setup instructions for eduroam at participating institutions.',
    provider: sfu('SFU IT Services'),
    access: [
      'Choose the official setup instructions for your device from SFU’s Wireless Connectivity service.',
      'Use the documented computingID@sfu.ca username format for eduroam setup.',
    ],
    eligibility: ['SFU students with an active account; guest access follows a separate process.'],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Burnaby', 'Surrey', 'Vancouver'],
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['Wi-Fi', 'wifi login', 'eduroam', '无线网', '校园网'],
    relatedIds: ['computing-id', 'it-help'],
    poster: poster(
      'Connect to campus Wi-Fi',
      ['Use SFUNET-SECURE at SFU.', 'Follow SFU’s device-specific setup guide for eduroam.'],
      ['An active account is required; guest access is separate.'],
    ),
    sources: [
      source(
        `${it}Requests/Service/2554/Wireless-Connectivity-Wi-Fi`,
        'SFU IT: Wireless Connectivity',
        '2026-10-04T15:28:10.981Z',
        'Wi-Fi Service at SFU; Connect to Wi-Fi',
        ['summary', 'access.0', 'eligibility', 'poster'],
      ),
      source(
        `${it}KB/Article/3956/Connecting-to-Wireless-Networks-Using-Automatic-Setup-all-devices`,
        'SFU IT: Wireless setup',
        '2026-10-04T15:28:35.571Z',
        'Other Devices and Operating Systems → username',
        ['access.1'],
      ),
    ],
  },
  {
    id: 'microsoft-365',
    title: 'Microsoft 365 student access',
    category: 'digital',
    topic: '04',
    summary:
      'Use the official SFU Microsoft 365 sign-in and installation guide; application eligibility varies.',
    provider: sfu('SFU IT Services'),
    access: [
      'Open the Microsoft 365 portal and enter ComputingID@sfu.ca, then sign in through SFU.',
      'Follow the official installation instructions for personal devices.',
    ],
    eligibility: [
      'Current SFU students qualify for Microsoft 365 installations; individual apps have separate access conditions.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: online,
    cost: {
      status: 'published',
      details:
        'The official getting-started guide says current SFU students can install Microsoft 365 for free on up to five individual-use devices; individual app eligibility varies.',
    },
    verification: reviewed(),
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['Office', 'Word', 'Excel', 'PowerPoint', '办公软件'],
    relatedIds: ['student-software'],
    poster: poster(
      'Microsoft 365 for students',
      [
        'Sign in through the official SFU Microsoft 365 guide.',
        'Current students can install on up to five personal-use devices.',
      ],
      ['Individual application eligibility varies.'],
    ),
    sources: [
      source(
        `${it}KB/Article/3816/Getting-Started-with-Microsoft-365`,
        'SFU IT: Getting Started with Microsoft 365',
        '2026-10-04T15:28:51.833Z',
        'Log in; Install Microsoft 365 apps; Who can use Microsoft 365?',
        ['summary', 'access', 'eligibility', 'cost', 'poster'],
      ),
    ],
  },
  {
    id: 'computer-labs',
    title: 'Student computer labs',
    category: 'digital',
    topic: '04',
    summary:
      'Find general-purpose computer labs at all three SFU campuses and role-specific remote-access instructions.',
    provider: sfu('SFU IT Services'),
    access: [
      'Use the official campus location list for facilities and current hours.',
      'Follow the undergraduate or graduate remote-access guide if accessing lab computers off campus.',
    ],
    eligibility: [
      'Student lab access; MFA is required for remote access. Individual spaces may have additional entry conditions.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: allCampuses,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    details: [
      {
        heading: 'Software and printing',
        body: 'General-purpose labs provide standard software and printing. Check the specific lab listing; do not assume every application or device is available everywhere. Hours may change for exams, reading breaks and holidays.',
      },
    ],
    aliases: ['computer lab', '电脑机房', 'remote lab'],
    relatedIds: ['printing', 'student-software'],
    poster: poster(
      'Find a student computer lab',
      [
        'General-purpose labs are available at all three campuses.',
        'Check the official location and hours list before visiting.',
      ],
      ['Remote access requires MFA.'],
    ),
    sources: [
      source(
        `${it}KB/Article/9359/Student-Computer-Labs`,
        'SFU IT: Student Computer Labs',
        '2026-10-04T15:29:25.543Z',
        'Overview; Access Remote Computer Labs',
        ['summary', 'access', 'eligibility', 'details', 'poster'],
      ),
      source(
        `${it}KB/Article/4308/Student-Computer-Labs-Locations`,
        'SFU IT: Student Computer Labs Locations',
        '2026-10-04T15:29:25.846Z',
        'Campus tables and hours exception note',
        ['details', 'access.0'],
      ),
    ],
  },
  {
    id: 'printing',
    title: 'PaperCut student printing',
    category: 'digital',
    topic: '04',
    summary:
      'Use PaperCut for student printing in computer labs and libraries across the three campuses.',
    provider: sfu('SFU IT Services'),
    access: [
      'Activate your Computing ID, then follow the PaperCut service page and How to Print guide.',
      'The service page says the PaperCut login portal is accessible on campus only.',
    ],
    eligibility: [
      'SFU and FIC students. Printing needs sufficient funds in the account recognised by the release station.',
    ],
    audiences: ['Undergraduate', 'Graduate', 'FIC'],
    campuses: ['Burnaby', 'Surrey', 'Vancouver'],
    cost: {
      status: 'published',
      details:
        'Printing uses an account balance. Rates are not reproduced here; check the current official printing instructions before paying.',
    },
    verification: reviewed(),
    reviewCadence: 'sensitive',
    highImpact: true,
    details: [
      {
        heading: 'Balance troubleshooting',
        body: 'A release station may display a combined balance while recognising only Cash funds for a job. Check the PaperCut troubleshooting instructions if a job will not release.',
      },
    ],
    aliases: ['print', 'printer', 'PaperCut', '打印'],
    relatedIds: ['computer-labs', 'computing-id'],
    poster: poster(
      'Student printing',
      [
        'PaperCut serves SFU and FIC students in campus labs and libraries.',
        'Use your activated Computing ID and check your printing funds.',
      ],
      ['The PaperCut portal is currently on-campus only.'],
    ),
    sources: [
      source(
        `${it}Requests/Service/2380/Papercut`,
        'SFU IT: PaperCut',
        '2026-10-04T15:28:11.727Z',
        'About this service; trouble printing with money in account',
        ['summary', 'access', 'eligibility', 'cost', 'details', 'poster'],
      ),
    ],
  },
  {
    id: 'student-software',
    title: 'Student software catalogue and licence eligibility',
    category: 'digital',
    topic: '04',
    summary:
      'Check official software availability by product, device and university role before downloading.',
    provider: sfu('SFU IT Services'),
    access: [
      'Open the SFU Software Catalogue and follow the selected product’s installation and eligibility information.',
    ],
    eligibility: [
      'Student availability is product-specific; an SFU listing does not mean every licence is included for every student or device.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['software download', 'Matlab', 'Adobe', '软件下载'],
    relatedIds: ['microsoft-365', 'computer-labs'],
    poster: poster('Find student software', [
      'Start with SFU’s official software catalogue.',
      'Check the product’s role and device restrictions before downloading.',
    ]),
    sources: [
      source(
        'https://www.sfu.ca/information-systems/services/software.html',
        'SFU IT: Software Catalogue',
        '2026-10-04T15:28:52.035Z',
        'Software at SFU; Major software & availability; availability note',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  },
  {
    id: 'it-help',
    title: 'IT Service Desk and login help',
    category: 'digital',
    topic: '04',
    summary:
      'Get technical support, submit a service request or use the dedicated login/MFA help route.',
    provider: sfu('SFU IT Services'),
    access: [
      'Choose Get Help on the Service Desk page.',
      'If you cannot log in, use Login or MFA Help; check the page for campus desks and current hours.',
    ],
    eligibility: [
      'SFU students, faculty and staff; the login-help route is also intended for people unable to access an account.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: allCampuses,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['tech support', 'help desk', 'IT支持', '无法登录'],
    relatedIds: ['password-reset', 'mfa', 'it-outages'],
    poster: poster('Need IT help?', [
      'Use Get Help for technical support and service requests.',
      'Cannot sign in? Choose Login or MFA Help.',
    ]),
    sources: [
      source(
        `${it}Requests/Service/2190/Service-Desk`,
        'SFU IT: Service Desk',
        '2026-10-04T15:27:19.286Z',
        'About this service; See us in person; Service Offerings',
        ['summary', 'access', 'eligibility', 'campuses', 'poster'],
      ),
    ],
  },
  {
    id: 'it-outages',
    title: 'IT service outage announcements',
    category: 'digital',
    topic: '04',
    summary: 'Check SFU IT’s outage calendar for planned service interruptions.',
    provider: sfu('SFU IT Services'),
    access: [
      'Open the official service-outage page and load its calendar in your browser.',
      'Contact IT support when your issue is not explained by a notice.',
    ],
    eligibility: ['Public notices for users of SFU information systems.'],
    audiences: ['All students'],
    campuses: online,
    cost: unknownCost,
    verification: partial(
      'The page identifies the official planned-outage calendar, but current calendar entries require browser JavaScript and were not reviewed. No live status is asserted.',
    ),
    reviewCadence: 'schedule',
    highImpact: false,
    aliases: ['system status', 'outage', '系统故障'],
    relatedIds: ['it-help'],
    poster: poster(
      'Check IT outage notices',
      [
        'Open SFU’s official service-outage calendar.',
        'Ask IT support about unexplained service problems.',
      ],
      [],
      'link',
    ),
    sources: [
      source(
        'https://www.sfu.ca/information-systems/announcements-alerts/service-outages.html',
        'SFU IT: Service outages',
        '2026-10-04T15:29:26.082Z',
        'Planned outages notice; JavaScript calendar placeholder',
        ['summary', 'access.0', 'eligibility', 'poster.facts.0'],
      ),
      source(
        `${it}Requests/Service/2190/Service-Desk`,
        'SFU IT: Service Desk',
        '2026-10-04T15:27:19.286Z',
        'About this service',
        ['access.1', 'poster.facts.1'],
      ),
    ],
  },
  {
    id: 'phishing',
    title: 'Report suspicious SFU email',
    category: 'digital',
    topic: '04',
    summary:
      'Use the official Report Phishing route and account-security help if you shared credentials.',
    provider: sfu('SFU IT Services'),
    access: [
      'In Outlook on the web, select the suspicious message, then Report → Report Phishing.',
      'If you entered your password on a suspicious site, change it immediately and contact SFU IT security through the official guidance.',
    ],
    eligibility: ['SFU Mail users with the suspicious message available in Outlook.'],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: online,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'safety',
    highImpact: true,
    facts: [
      {
        label: 'Password requests',
        value:
          'SFU says it will never ask you to provide or confirm your Computing ID password by email.',
      },
    ],
    aliases: ['phishing', 'scam email', '钓鱼邮件', '诈骗邮件'],
    relatedIds: ['password-reset', 'mfa', 'sfu-mail'],
    poster: poster('Report phishing', [
      'Use Outlook on the web → Report → Report Phishing.',
      'Do not reply to suspicious messages or provide your password.',
    ]),
    sources: [
      source(
        `${it}KB/Article/11121/SFU-Mail-Identify-and-Report-Phishing-Emails`,
        'SFU IT: Identify and Report Phishing Emails',
        '2026-10-04T15:28:12.273Z',
        'Overview; Steps to protect yourself; Steps to report phishing; If something goes wrong',
        ['summary', 'access', 'eligibility', 'facts', 'poster'],
      ),
    ],
  },
];

const libraryResources: CatalogInput[] = [
  {
    id: 'bennett-library',
    title: 'W.A.C. Bennett Library — Burnaby',
    category: 'library',
    topic: '05',
    summary:
      'Find Burnaby’s Bennett Library and check its official branch information before visiting.',
    provider: sfu('SFU Library'),
    access: [
      'Follow the Library Hours of Operation link from SFU’s campus page; ask the library about study-space access.',
    ],
    eligibility: [
      'The Indigenous study rooms described below have audience restrictions; general room eligibility is not confirmed here.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Burnaby'],
    cost: unknownCost,
    verification: partial(
      'Branch content is blocked by an access challenge. SFU’s campus service pages confirm identity and computers; general quiet/silent floor zoning and hours are not verified.',
    ),
    reviewCadence: 'evergreen',
    highImpact: false,
    details: [
      {
        heading: 'Study-room conditions',
        body: 'The Indigenous Student Centre lists LIB 2114 for Indigenous students, and bookable accessible Indigenous Reading Room LIB 5079 for Indigenous students, staff and faculty. These are not general-access rooms.',
      },
      {
        heading: 'Floor information',
        body: 'General floor plans and silent-study zoning, including queries about floor 6, could not be verified. Check the current library source rather than relying on a previous poster.',
      },
    ],
    locations: [{ campus: 'Burnaby', name: 'W.A.C. Bennett Library (LIB)' }],
    aliases: ['Bennett', 'Burnaby library', '本拿比图书馆'],
    relatedIds: ['computer-labs', 'printing', 'research'],
    poster: poster(
      'Bennett Library',
      [
        'Burnaby campus library.',
        'Follow SFU’s Library Hours of Operation link before visiting.',
      ],
      [],
      'link',
    ),
    sources: [
      source(
        'https://www.sfu.ca/students/indigenous/about-us/student-spaces.html',
        'SFU Indigenous Student Centre: Student spaces',
        '2026-10-04T15:31:00.894Z',
        'Library Space; Indigenous Reading Room; Library Hours of Operation links',
        ['summary', 'access', 'eligibility', 'locations', 'details.0', 'poster.facts'],
      ),
      source(
        `${it}KB/Article/4308/Student-Computer-Labs-Locations`,
        'SFU IT: Student Computer Labs Locations',
        '2026-10-04T15:29:25.846Z',
        'Burnaby campus → Bennett Library',
        ['summary'],
      ),
      blocked(
        'https://www.lib.sfu.ca/about/branches-depts/bennett',
        'SFU Library: Bennett branch',
        '2026-10-04T15:31:00.510Z',
      ),
    ],
    actionUrl: 'https://www.lib.sfu.ca/about/branches-depts/bennett',
  },
  {
    id: 'fraser-library',
    title: 'Fraser Library — Surrey quiet and silent study',
    category: 'library',
    topic: '05',
    summary: 'Find Surrey’s Fraser Valley Real Estate Board Academic Library on SRYC Podium 3.',
    provider: sfu('SFU Library'),
    access: ['Visit the library on Podium 3 and follow its branch link for current opening hours.'],
    eligibility: [
      'The campus page lists study and borrowing services; it does not specify complete loan or room-booking eligibility.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Surrey'],
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    facts: [
      { label: 'Quiet study', value: 'Podium 3 has quiet individual study carrels.' },
      { label: 'Silent study', value: 'Silent individual study is listed in room 3650.' },
      {
        label: 'Equipment',
        value:
          'The campus library page lists borrowing of equipment such as laptops and phone chargers.',
      },
    ],
    locations: [
      { campus: 'Surrey', name: 'Fraser Valley Real Estate Board Academic Library, SRYC Podium 3' },
    ],
    aliases: ['silent study', 'quiet study', '安静自习', '素里图书馆', 'Fraser'],
    relatedIds: ['printing', 'science-peer-support'],
    poster: poster(
      'Quiet study at Surrey',
      [
        'Fraser Library is on SRYC Podium 3.',
        'Choose quiet carrels or silent individual study in room 3650.',
      ],
      ['Check current branch hours before visiting.'],
    ),
    sources: [
      source(
        'https://www.sfu.ca/surrey/campus-services/library.html',
        'SFU Surrey: Fraser Library',
        '2026-10-04T15:25:59.599Z',
        'Library description; Hours of operation link',
        ['summary', 'access', 'eligibility', 'locations', 'facts.2', 'poster.facts.0'],
      ),
      source(
        'https://www.sfu.ca/surrey/students/campus-space/study-spaces-.html',
        'SFU Surrey: Study spaces',
        '2026-10-04T15:26:38.027Z',
        'Podium 3',
        ['facts.0', 'facts.1', 'poster.facts.1'],
      ),
    ],
  },
  {
    id: 'belzberg-library',
    title: 'Belzberg Library — Vancouver quiet study',
    category: 'library',
    topic: '05',
    summary: 'Find the Samuel and Frances Belzberg Library on the main floor of Harbour Centre.',
    provider: sfu('SFU Library'),
    access: ['Visit HC 1000; use the official branch-hours link before travelling.'],
    eligibility: [
      'Students, faculty and staff can use library computers and equipment; non-credit and community access has separate conditions.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Vancouver'],
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    facts: [
      {
        label: 'Quiet study',
        value: 'The library’s mezzanine includes an individual quiet-study area (HC 1060).',
      },
      {
        label: 'Facilities',
        value:
          'Computers, print/copy/scan facilities and equipment lending are described on the campus page.',
      },
    ],
    locations: [{ campus: 'Vancouver', name: 'Belzberg Library, HC 1000, Harbour Centre' }],
    aliases: ['quiet study', '安静自习', '温哥华图书馆', 'Harbour Centre library'],
    relatedIds: ['library-rooms', 'research-commons', 'printing'],
    poster: poster(
      'Quiet study at Vancouver',
      [
        'Belzberg Library: HC 1000, Harbour Centre.',
        'Quiet individual study is available in the mezzanine area.',
      ],
      ['Check current branch hours before visiting.'],
    ),
    sources: [
      belzberg('Library overview; Computers and Equipment; Quiet Study Area', [
        'summary',
        'access',
        'eligibility',
        'facts',
        'locations',
        'poster',
      ]),
      source(
        vancouverSpaces,
        'SFU Vancouver: Study and Lounge Spaces',
        '2026-10-04T15:25:59.440Z',
        'First Floor → HC 1060 Mezzanine Study Area',
        ['facts.0'],
      ),
    ],
  },
  {
    id: 'library-collections',
    title: 'Library books, ebooks, databases and equipment',
    category: 'library',
    topic: '05',
    summary:
      'Find library collections and ask about borrowing conditions before checking out materials or equipment.',
    provider: sfu('SFU Library'),
    access: [
      'Use the Library Catalogue link on the official branch page for books, ebooks, journals and databases.',
      'The Vancouver campus page describes holds for pickup at Harbour Centre and digital chapter delivery.',
    ],
    eligibility: [
      'The campus page lists equipment access for SFU students, faculty and staff; full electronic-resource and borrowing conditions must be confirmed with the library.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: allCampuses,
    cost: unknownCost,
    verification: partial(
      'Collection access, holds and equipment identity are supported by SFU campus pages. Full loan, renewal, returns, reserves and off-campus licence conditions remain blocked; no loan periods or fines are published here.',
    ),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: [
      'borrow books',
      'ebooks',
      'database',
      'equipment lending',
      '借书',
      '电子书',
      'course reserves',
      'assigned readings',
      'renewals',
    ],
    relatedIds: ['research', 'bennett-library', 'fraser-library', 'belzberg-library'],
    poster: poster(
      'Find library resources',
      [
        'Search SFU Library’s catalogue for books, ebooks and databases.',
        'Ask the library about holds, equipment and borrowing conditions.',
      ],
      ['Access and loan conditions vary.'],
      'link',
    ),
    sources: [
      belzberg('Library Services and Collections; Computers and Equipment', [
        'summary',
        'access',
        'eligibility',
        'poster',
      ]),
      blocked(
        'https://www.lib.sfu.ca/borrow',
        'SFU Library: Borrowing',
        '2026-10-04T15:31:00.612Z',
      ),
    ],
  },
  {
    id: 'library-rooms',
    title: 'Library group study room booking — Vancouver',
    category: 'library',
    topic: '05',
    summary: 'Use the official library booking link for Vancouver group study rooms.',
    provider: sfu('SFU Library'),
    access: ['Follow Book a Study Space at SFU Vancouver on the campus library page.'],
    eligibility: [
      'The campus page identifies SFU Vancouver students as users of bookable group study spaces; check the booking page for limits and current availability.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Vancouver'],
    cost: unknownCost,
    verification: partial(
      'The official campus page confirms booking and student scope, but the booking-policy page is blocked. Duration, group-size limits and accessible room availability are not reproduced.',
    ),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['group study', 'room booking', '小组自习', '预约学习室'],
    relatedIds: ['belzberg-library', 'research-commons'],
    poster: poster(
      'Book group study space',
      [
        'SFU Vancouver students can follow the official library booking link.',
        'Check current room availability and booking conditions.',
      ],
      [],
      'link',
    ),
    sources: [
      belzberg('Book a Study Space', ['summary', 'access', 'eligibility', 'poster']),
      blocked(
        'https://www.lib.sfu.ca/facilities/rooms-spaces/group-study-rooms',
        'SFU Library: Group study rooms',
        '2026-10-04T15:31:00.581Z',
      ),
    ],
  },
  {
    id: 'research-commons',
    title: 'Research Commons for graduate researchers',
    category: 'library',
    topic: '05',
    summary:
      'Find SFU Library research support for graduate students, postdoctoral fellows and faculty across the three campuses.',
    provider: sfu('SFU Library Research Commons'),
    access: [
      'Follow the Graduate Research Commons link on the official Vancouver library page.',
      'For the Harbour Centre study space, check current access and room-booking arrangements.',
    ],
    eligibility: [
      'Graduate students, postdoctoral fellows and faculty; the Harbour Centre student space requires a passcode.',
    ],
    audiences: ['Graduate'],
    campuses: allCampuses,
    cost: unknownCost,
    verification: partial(
      'Service audience and Vancouver location are confirmed on SFU campus pages. Detailed workshop, consultation and booking arrangements were not retrieved from the protected Library site.',
    ),
    reviewCadence: 'evergreen',
    highImpact: false,
    locations: [{ campus: 'Vancouver', name: 'Vancouver Research Commons, HC 7050' }],
    aliases: ['graduate study', '研究生支持', 'research commons'],
    relatedIds: ['research', 'belzberg-library'],
    poster: poster(
      'Graduate Research Commons',
      [
        'Library research support for graduate students.',
        'Vancouver study and meeting spaces are in HC 7050.',
      ],
      ['Check access and booking conditions; the student space requires a passcode.'],
      'link',
    ),
    sources: [
      belzberg('Graduate Research Commons', [
        'summary',
        'access',
        'eligibility',
        'locations',
        'poster',
      ]),
      source(
        vancouverSpaces,
        'SFU Vancouver: Study and Lounge Spaces',
        '2026-10-04T15:25:59.440Z',
        'Seventh Floor → Graduate Research Commons',
        ['eligibility', 'poster.conditions'],
      ),
    ],
  },
  {
    id: 'pub-lab',
    title: 'Pub Lab: podcast and publishing maker space',
    category: 'library',
    topic: '05',
    summary:
      'Find Harbour Centre’s creative space for audio, book arts, DIY publishing and printmaking.',
    provider: sfu('SFU Publishing'),
    access: [
      'Follow the Podcast Studio and Publishing Maker Space booking link on the Vancouver study-spaces page.',
    ],
    eligibility: ['Current SFU students, faculty and staff; check booking conditions before use.'],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Vancouver'],
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    locations: [
      { campus: 'Vancouver', name: 'Podcast Studio and Publishing Maker Space, HC 2960' },
    ],
    aliases: ['maker space', 'podcast studio', 'bookbinding', '播客', '创客'],
    poster: poster(
      'Create at the Pub Lab',
      [
        'Audio production, book arts and publishing tools at HC 2960.',
        'Use the official booking link before your visit.',
      ],
      ['For current SFU students, faculty and staff.'],
    ),
    sources: [
      source(
        vancouverSpaces,
        'SFU Vancouver: Study and Lounge Spaces',
        '2026-10-04T15:25:59.440Z',
        'Second Floor → Podcast Studio and Publishing Maker Space, HC 2960',
        ['summary', 'access', 'eligibility', 'locations', 'poster'],
      ),
    ],
  },
];

const learningResources: CatalogInput[] = [
  {
    id: 'slc',
    title: 'Student Learning Commons: study skills',
    category: 'academic-support',
    topic: '06',
    summary:
      'Find learning support for reading, note-taking, time management and study strategies.',
    provider: sfu('SFU Library Student Learning Commons'),
    access: [
      'Follow Study skills and strategies from Student Learning Commons on SFU’s academic-support page.',
    ],
    eligibility: [
      'SFU student learning support; check current activity registration and availability with SLC.',
    ],
    audiences: ['Undergraduate'],
    campuses: online,
    cost: {
      status: 'published',
      details:
        'SFU’s support directory describes these study-skills workshops as free; check the specific activity’s conditions.',
    },
    verification: partial(
      'Study-skills service identity and free workshop description are verified on SFU’s directory. Detailed workshop dates, exam-preparation materials and booking rules are blocked on the Library site.',
    ),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: [
      'study skills',
      'note taking',
      'time management',
      'exam preparation',
      '阅读',
      '笔记',
      '学习方法',
    ],
    relatedIds: ['writing', 'academic-english', 'office-hours'],
    poster: poster(
      'Build your study skills',
      [
        'Find SLC support for reading, note-taking and time management.',
        'Check the current activity listing for registration and delivery.',
      ],
      [],
      'link',
    ),
    sources: [
      learning('Study skills and strategies from Student Learning Commons', [
        'summary',
        'access',
        'eligibility',
        'cost',
        'poster',
      ]),
      blocked(
        'https://www.lib.sfu.ca/about/branches-depts/slc',
        'SFU Library: Student Learning Commons',
        '2026-10-04T15:21:58.950Z',
      ),
    ],
  },
  {
    id: 'writing',
    title: 'Writing consultations and WriteAway',
    category: 'academic-support',
    topic: '06',
    summary:
      'Find writing feedback through SFU’s Student Learning Commons or the linked WriteAway service.',
    provider: sfu('SFU Library Student Learning Commons'),
    access: [
      'Use the official support page links for in-person or online writing consultations.',
      'For undergraduate assignment feedback, follow the WriteAway link and read its submission guidance.',
    ],
    eligibility: [
      'WriteAway supports undergraduates at participating institutions; SFU links it as a student writing service. Consultation availability and booking conditions must be checked.',
    ],
    audiences: ['Undergraduate'],
    campuses: allCampuses,
    cost: {
      status: 'published',
      details:
        'SFU’s academic-support directory identifies free writing support and the free WriteAway service.',
    },
    verification: partial(
      'SFU’s directory and the WriteAway provider page support service identity and scope. Detailed SLC appointment availability and consultation policy are blocked.',
    ),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['writing help', 'essay feedback', '写作辅导', 'WriteAway'],
    relatedIds: ['slc', 'academic-english', 'research'],
    poster: poster(
      'Get writing feedback',
      [
        'Find SLC in-person and online writing consultations.',
        'Undergraduate assignment feedback is also available through WriteAway.',
      ],
      ['Check booking or submission conditions.'],
      'link',
    ),
    sources: [
      learning('Writing support; Online tools → WriteAway', [
        'summary',
        'access',
        'cost',
        'poster',
      ]),
      source(
        'https://writeaway.ca/',
        'WriteAway: provider service overview',
        '2026-10-04T15:30:40.811Z',
        'Welcome to WriteAway → undergraduate students at participating institutions',
        ['eligibility', 'poster.facts.1'],
      ),
      blocked(
        'https://www.lib.sfu.ca/about/branches-depts/slc/offer/consultation-info',
        'SFU Library: Writing consultations',
        '2026-10-04T15:31:00.547Z',
      ),
    ],
  },
  {
    id: 'academic-english',
    title: 'Academic English and EAL support',
    category: 'academic-support',
    topic: '06',
    summary:
      'Find SLC academic English coaching, grammar/writing learning and conversation opportunities.',
    provider: sfu('SFU Library Student Learning Commons'),
    access: [
      'Follow English as an Additional Language services or Conversation Partners from the official SFU support directory.',
    ],
    eligibility: [
      'SFU students seeking academic English support; check current activity registration and availability with SLC.',
    ],
    audiences: ['Undergraduate'],
    campuses: online,
    cost: {
      status: 'published',
      details:
        'SFU’s support directory describes academic English coaching and non-credit grammar/writing courses as free.',
    },
    verification: partial(
      'The official support directory confirms the service types. Current registration, delivery and term dates on the Library site are not verified.',
    ),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['EAL', 'ESL', 'English conversation', '学术英语', '英语辅导'],
    relatedIds: ['writing', 'slc'],
    poster: poster(
      'Academic English support',
      [
        'Explore SLC academic English and conversation support.',
        'Check the current service page for eligibility and registration.',
      ],
      [],
      'link',
    ),
    sources: [
      learning('English as an Additional Language services', [
        'summary',
        'access',
        'eligibility',
        'cost',
        'poster',
      ]),
    ],
  },
  {
    id: 'research',
    title: 'Library research and citation help',
    category: 'academic-support',
    topic: '06',
    summary: 'Ask a librarian about research searches, sources and citation questions.',
    provider: sfu('SFU Library'),
    access: [
      'Use Ask a Librarian, email/chat or the branch research help desk.',
      'For deeper subject questions, request a subject-librarian consultation; follow the linked citation guides for APA, MLA and Chicago/Turabian.',
    ],
    eligibility: [
      'For students seeking research or citation guidance; confirm service hours and consultation availability with the library.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: allCampuses,
    cost: unknownCost,
    verification: partial(
      'Research help and citation-guide routes are supported on SFU pages. Library pages are protected; current chat hours and reference-management software support are not verified.',
    ),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: [
      'research search',
      'citation help',
      'reference management',
      '文献检索',
      '引用格式',
      'AskAway',
    ],
    relatedIds: ['writing', 'library-collections', 'research-commons'],
    poster: poster(
      'Ask a librarian',
      [
        'Get help finding research sources and using subject guides.',
        'Use the official citation guides or ask a librarian a citation question.',
      ],
      [],
      'link',
    ),
    sources: [
      belzberg(
        'Library Services and Collections → Ask a Librarian; subject librarian; research guides',
        ['summary', 'access.0', 'access.1', 'poster.facts.0'],
      ),
      learning('All students introduction; Online tools → AskAway; Citation Tools', [
        'access.1',
        'eligibility',
        'poster.facts.1',
      ]),
      blocked(
        'https://www.lib.sfu.ca/help/cite-write/citation-style-guides',
        'SFU Library: Citation style guides',
        '2026-10-04T15:31:00.645Z',
      ),
    ],
  },
  {
    id: 'office-hours',
    title: 'Use instructor and TA office hours',
    category: 'academic-support',
    topic: '06',
    summary: 'Contact your instructor or teaching assistant for guidance about your own course.',
    provider: sfu('SFU course instructors and teaching assistants'),
    access: ['Check your course outline or Canvas instructions for office-hour access.'],
    eligibility: [
      'Students seeking guidance from their own course instructor or teaching assistant.',
    ],
    audiences: ['Undergraduate', 'Graduate'],
    campuses: allCampuses,
    cost: unknownCost,
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    details: [
      {
        heading: 'Prepare for the conversation',
        body: 'Mentor tip: identify what you tried and where you became stuck, and write a short list of questions. This is planning guidance, not a university attendance requirement.',
      },
    ],
    aliases: ['professor', 'TA', 'office hours', '答疑时间'],
    relatedIds: ['course-outlines', 'canvas'],
    poster: poster('Visit office hours', [
      'Ask your instructor or TA for course guidance.',
      'Check the course’s instructions for times and access.',
    ]),
    evidence: [
      {
        field: 'poster.facts.1',
        sourceId: 's2',
        locator: 'About this service → instructor-published course materials',
        note: 'Hub-written navigation advice to consult the instructor’s course materials. The source establishes the Canvas course-material route; it does not establish uniform office-hour times or access.',
      },
    ],
    sources: [
      learning('Instructor Support', ['summary', 'eligibility', 'poster.facts.0']),
      source(
        `${it}Requests/Service/2441/Canvas`,
        'SFU IT: Canvas',
        '2026-10-04T15:28:11.483Z',
        'About this service → instructor course materials',
        ['access.0'],
      ),
    ],
  },
  {
    id: 'cs-peer-tutoring',
    title: 'Computing Science peer tutoring — Fall 2026',
    category: 'academic-support',
    topic: '06',
    summary:
      'Get free in-person peer support for the Computing Science and MACM courses listed for Fall 2026.',
    provider: sfu('SFU School of Computing Science'),
    access: [
      'Use the current schedule linked from the official CS Peer Tutoring page and visit ASB 9820 inside CSIL.',
    ],
    eligibility: ['Fall 2026 support is listed for CMPT 120, 125, 210, 225, 295 and MACM 101.'],
    audiences: ['Undergraduate'],
    campuses: ['Burnaby'],
    cost: { status: 'published', details: 'The department describes CS peer tutoring as free.' },
    verification: reviewed(),
    reviewCadence: 'schedule',
    highImpact: false,
    term: 'Fall 2026',
    validFrom: '2026-09-28',
    validUntil: '2026-12-07',
    locations: [
      { campus: 'Burnaby', name: 'ASB 9820, Computing Science Instructional Lab (CSIL)' },
    ],
    details: [
      {
        heading: 'Schedule',
        body: 'The department links a Fall 2026 tutor schedule. Confirm the session for your supported course before visiting; this card does not promise that every tutor covers every course.',
      },
    ],
    aliases: ['CS tutoring', 'CMPT help', 'MACM 101', '计算机辅导'],
    relatedIds: ['science-peer-support', 'office-hours'],
    poster: poster(
      'CS peer tutoring',
      ['Free in-person support in ASB 9820, inside CSIL.', 'Fall 2026: September 28–December 7.'],
      ['Listed courses: CMPT 120/125/210/225/295 and MACM 101. Check the official tutor schedule.'],
    ),
    sources: [
      source(
        'https://www.sfu.ca/fas/computing/current-students/undergraduates/student-resources/CSPeerTutoring.html',
        'SFU Computing Science: Peer Tutoring',
        '2026-10-04T15:27:00.035Z',
        'Courses; Location; Updates; Click here for Schedule',
        [
          'summary',
          'access',
          'eligibility',
          'cost',
          'locations',
          'term',
          'validFrom',
          'validUntil',
          'details',
          'poster',
        ],
      ),
    ],
  },
  {
    id: 'science-peer-support',
    title: 'Science and Math Peer Academic Support — Fall 2026',
    category: 'academic-support',
    topic: '06',
    summary:
      'Get free peer support in listed science and mathematics areas online, at Burnaby or at Surrey.',
    provider: sfu('SFU Faculty of Science'),
    access: [
      'Enrol in the linked Canvas support course for schedule changes and cancellations, even if attending in person.',
      'Choose a course-specific session from the published timetable; use Zoom or the listed campus location.',
    ],
    eligibility: [
      'Support depends on the listed subject and level: Biology, Chemistry, Calculus, MBB, Physics and BPK have published sessions.',
    ],
    audiences: ['Undergraduate'],
    campuses: ['Burnaby', 'Surrey', 'Online'],
    cost: {
      status: 'published',
      details: 'The faculty describes the peer academic support as free and drop-in.',
    },
    verification: reviewed(),
    reviewCadence: 'schedule',
    highImpact: false,
    term: 'Fall 2026',
    validFrom: '2026-09-16',
    validUntil: '2026-12-07',
    locations: [
      { campus: 'Burnaby', name: 'SSB 7109' },
      { campus: 'Surrey', name: 'Fraser Library Student Learning Commons, room 3695' },
      { campus: 'Online', name: 'Zoom through the linked Canvas course' },
    ],
    aliases: ['science tutoring', 'biology help', 'chemistry help', 'physics help', '理科辅导'],
    relatedIds: ['math-workshops', 'cs-peer-tutoring', 'fraser-library'],
    poster: poster(
      'Science and Math peer support',
      [
        'Free subject-specific drop-in support, September 16–December 7, 2026.',
        'Find in-person and Zoom sessions on the faculty timetable.',
      ],
      ['Join the Canvas course and check cancellations before attending.'],
    ),
    sources: [
      source(
        'https://www.sfu.ca/science/undergraduate-students/current-students/student-support/PeerAcademicSupport.html',
        'SFU Science: Science & Math Peer Academic Support',
        '2026-10-04T15:26:59.855Z',
        'Fall 2026 General Information; Locations; Fall 2026 Schedule; Courses Offered',
        [
          'summary',
          'access',
          'eligibility',
          'cost',
          'locations',
          'term',
          'validFrom',
          'validUntil',
          'poster',
        ],
      ),
    ],
  },
  {
    id: 'math-workshops',
    title: 'Mathematics workshops and open labs',
    category: 'academic-support',
    topic: '06',
    summary:
      'Use course-specific drop-in support for mathematics, calculus, algebra and quantitative courses.',
    provider: sfu('SFU Department of Mathematics'),
    access: [
      'Find your course in the Burnaby or Surrey workshop list.',
      'Use your course Canvas container for workshop hours, delivery and exam-period exceptions.',
    ],
    eligibility: [
      'Workshop course lists differ by campus. Burnaby lists Applied Calculus, Calculus, Algebra and Q Support; Surrey lists Applied Calculus/Algebra, Pure Calculus and Introductory Math.',
    ],
    audiences: ['Undergraduate'],
    campuses: ['Burnaby', 'Surrey', 'Online'],
    cost: {
      status: 'published',
      details:
        'SFU’s academic-support directory describes the departmental mathematics workshops as free.',
    },
    verification: reviewed(),
    reviewCadence: 'evergreen',
    highImpact: false,
    details: [
      {
        heading: 'Supported courses',
        body: 'The current department page lists MATH 154/155/157/158 for Burnaby Applied Calculus; MATH 150/151/152/251 for Calculus; MACM 201 and MATH 100/232/240 for Algebra; FAN X99 and MATH 190 for Q Support. Surrey lists have differences; use the campus-specific source.',
      },
    ],
    aliases: ['math help', 'calculus', 'MACM', '数学辅导', 'workshops'],
    relatedIds: ['science-peer-support', 'office-hours'],
    poster: poster(
      'Math workshops',
      [
        'Find the workshop that lists your course and campus.',
        'Check course Canvas for hours, delivery and exceptions.',
      ],
      ['Workshop access and support are course-specific.'],
    ),
    sources: [
      source(
        'https://www.sfu.ca/math/undergraduate/current-students/workshops.html',
        'SFU Mathematics: Workshops and Open Labs',
        '2026-10-04T15:28:36.004Z',
        'Burnaby Campus Workshops; Surrey Campus Open labs; FAQ',
        ['summary', 'access', 'eligibility', 'details', 'poster'],
      ),
      learning('Department of Mathematics', ['cost']),
    ],
  },
  {
    id: 'economics-workshops',
    title: 'Economics writing workshop — Fall 2026',
    category: 'academic-support',
    topic: '06',
    summary: 'Get writing support if you are enrolled in an Economics writing course this term.',
    provider: sfu('SFU Department of Economics'),
    access: [
      'Use the Writing Workshop Canvas link on the department page and check its Fall 2026 timetable.',
      'For individual coaching, request a meeting through the listed Canvas contact route at least 72 hours ahead.',
    ],
    eligibility: [
      'Fall 2026 writing workshops are for students enrolled in an Economics writing course. Course-specific grading, assignment rules and due dates go to your own instructor or TA.',
    ],
    audiences: ['Undergraduate'],
    campuses: ['Burnaby'],
    cost: {
      status: 'published',
      details: 'The department describes its student workshops as free.',
    },
    verification: reviewed(),
    reviewCadence: 'schedule',
    highImpact: false,
    term: 'Fall 2026',
    details: [
      {
        heading: 'Current availability',
        body: 'The page explicitly says the Technical Workshop is not offered in Fall 2026. Its general introduction must not be used to promise technical support this term. Use the official writing timetable and Canvas announcements to confirm sessions. The page does not state an exact validity range for its recurring hours, so they are not copied here.',
      },
    ],
    aliases: ['ECON help', 'economics writing', '经济学写作'],
    relatedIds: ['writing', 'office-hours'],
    poster: poster(
      'Economics writing support',
      [
        'Free Fall 2026 writing support for Economics writing-course students.',
        'Find the current timetable and Canvas access on the department page.',
      ],
      ['Technical Workshop is not offered in Fall 2026.'],
    ),
    sources: [
      source(
        'https://www.sfu.ca/economics/undergraduate/workshops.html',
        'SFU Economics: Drop-in Workshops',
        '2026-10-04T15:26:00.880Z',
        'Technical Workshop → Fall 2026; Writing Workshop → Fall 2026; Weekly Individual Coaching',
        ['summary', 'access', 'eligibility', 'cost', 'term', 'details', 'poster'],
      ),
    ],
  },
  {
    id: 'french-tutorat',
    title: 'French Tutorat: check current availability',
    category: 'academic-support',
    topic: '06',
    summary:
      'Find the department’s French-language question service and confirm whether sessions are currently running.',
    provider: sfu('SFU Department of French'),
    access: [
      'Open the official Tutorat page and ask the department about the current term before attending.',
    ],
    eligibility: [
      'The service is described for French students with language and course-content questions; it does not proofread assignments.',
    ],
    audiences: ['Undergraduate'],
    campuses: ['Online'],
    cost: {
      status: 'published',
      details:
        'The page describes Tutorat as a free drop-in service; current-term availability remains unconfirmed.',
    },
    verification: partial(
      'Only the expired Spring 2026 timetable was published on the page reviewed. Fall 2026 and Spring 2027 session times are not verified; old hours are not republished.',
    ),
    reviewCadence: 'schedule',
    highImpact: false,
    aliases: ['French tutoring', 'FREN', '法语辅导'],
    relatedIds: ['office-hours'],
    poster: poster(
      'French-language questions',
      [
        'Check the Department of French Tutorat page for current availability.',
        'Prepare specific language questions; assignment proofreading is excluded.',
      ],
      ['Current-term sessions must be confirmed.'],
      'link',
    ),
    sources: [
      source(
        'https://www.sfu.ca/french/student-resources/tutorat.html',
        'SFU French: Tutorat',
        '2026-10-04T15:27:00.156Z',
        'Tutorat service description; proofreading note; Spring 2026 timetable',
        ['summary', 'access', 'eligibility', 'cost', 'poster'],
      ),
    ],
  },
  {
    id: 'linguistics-writing',
    title: 'Linguistics and Cognitive Science writing support',
    category: 'academic-support',
    topic: '06',
    summary:
      'SFU’s support directory lists departmental writing tutoring; confirm its current access route with Linguistics.',
    provider: sfu('SFU Department of Linguistics'),
    access: [
      'Use the official academic-support directory and contact the Linguistics department if the linked Writing Centre page is unavailable.',
    ],
    eligibility: [
      'The directory lists students needing support with a Linguistics or Cognitive Science course; current booking arrangements remain unconfirmed.',
    ],
    audiences: ['Undergraduate'],
    campuses: ['Online'],
    cost: {
      status: 'published',
      details:
        'The SFU support directory describes the departmental tutoring as free; current availability is unconfirmed.',
    },
    verification: partial(
      'The central SFU directory lists the service, but its linked departmental Writing Centre page returned 404. No current appointment, location or hours are asserted.',
    ),
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['LING', 'COGS', 'linguistics tutoring', '语言学写作'],
    relatedIds: ['writing', 'advising-fass'],
    poster: poster(
      'Linguistics writing support',
      [
        'SFU lists writing help for Linguistics and Cognitive Science courses.',
        'Confirm the current route with the department.',
      ],
      ['Current appointments and delivery are unconfirmed.'],
      'link',
    ),
    sources: [
      learning('Department specific support → Department of Linguistics', [
        'summary',
        'access',
        'eligibility',
        'cost',
        'poster',
      ]),
    ],
  },
];

// An independent reviewer reopened sources for these specific records after the author's pass.
// Partial records remain partial: the second pass checks the bounded wording, not missing facts.
const secondPassIds = new Set([
  'enrolment-changes',
  'exam-hardship',
  'exam-schedules',
  'academic-progress-report',
  'advising',
  'back-on-track',
  'password-reset',
  'mfa',
  'canvas',
  'microsoft-365',
  'printing',
  'phishing',
  'it-outages',
  'bennett-library',
  'fraser-library',
  'belzberg-library',
  'library-collections',
  'library-rooms',
  'research-commons',
  'pub-lab',
  'slc',
  'writing',
  'academic-english',
  'research',
  'office-hours',
  'cs-peer-tutoring',
  'science-peer-support',
  'math-workshops',
  'economics-workshops',
  'french-tutorat',
  'linguistics-writing',
]);

export const academicResources = [
  ...planning,
  ...advisingResources,
  ...digital,
  ...libraryResources,
  ...learningResources,
].map((input) =>
  defineResource({
    ...input,
    ...(secondPassIds.has(input.id)
      ? {
          secondReview: {
            reviewedAt: '2026-10-04T16:04:54Z',
            reviewer: 'agent' as const,
            note: 'Independent pathways-agent source reopening and card/details/poster comparison. Live HTTPS resolved stale CS/Economics search-reader content; recurring Economics times without validity dates were removed. Partial records remain partial. See review-academic.md.',
          },
        }
      : {}),
  }),
);
