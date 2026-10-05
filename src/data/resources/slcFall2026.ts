import { defineResource, type CatalogInput, type SourceInput } from './catalog/define';
import type {
  Campus,
  DirectoryResource,
  ResourceOccurrence,
  ResourceOccurrenceDetails,
  ResourceProgram,
} from './types';

// All eleven pages were read as text and rendered images. This is a transcription
// of a supplied document, not evidence that its linked websites were retrieved.
export const slcFall2026Document = {
  filename: 'Program Guide Fall 2026_FINAL1.pdf',
  sha256: '14e98c0d7246c96c01e5c3f00cce3c4c82066b64ddfc6e9ee5021fa056f9af7b',
  pages: 11,
};
const reviewedAt = '2026-10-05T08:17:05Z';
const secondReview = {
  reviewer: 'agent' as const,
  reviewedAt: '2026-10-05T08:30:22Z',
  note: 'Independent coordinating-agent review of all 11 rendered guide pages, parsed text, normalized occurrences, audience conditions and link-check evidence. Four source ambiguities remain flagged; unbounded schedules and blocked registration links were not inferred.',
};
// Actual public-link checks by the coordinating reviewer; HTTP 200 bot challenges are blocked.
const linkChecks: Record<string, { at: string; retrieved: boolean }> = {
  'https://www.lib.sfu.ca/about/branches-depts/slc/eal/academic/39851': {
    at: '2026-10-05T08:17:32.766Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/time-management/39803': {
    at: '2026-10-05T08:17:32.768Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/eal/conversation/39910': {
    at: '2026-10-05T08:17:32.768Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/time-management/39813': {
    at: '2026-10-05T08:17:32.768Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/exam-prep/39821': {
    at: '2026-10-05T08:17:32.813Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/reading/unlock-your-readings-strategies-success':
    {
      at: '2026-10-05T08:17:32.814Z',
      retrieved: false,
    },
  'https://www.lib.sfu.ca/about/branches-depts/slc/eal/conversation/39912': {
    at: '2026-10-05T08:17:32.814Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/studying-reviewing/39823': {
    at: '2026-10-05T08:17:32.814Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/procrastination/39825': {
    at: '2026-10-05T08:17:32.858Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/eal/conversation/39908': {
    at: '2026-10-05T08:17:32.858Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/eal/conversation/39853': {
    at: '2026-10-05T08:17:32.858Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/presentations/public-speaking-skills': {
    at: '2026-10-05T08:17:32.869Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/study-groups/soup-circles': {
    at: '2026-10-05T08:17:32.901Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/writing/disciplines/39830': {
    at: '2026-10-05T08:17:32.901Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/time-management/big-paper-write-it-right':
    {
      at: '2026-10-05T08:17:32.901Z',
      retrieved: false,
    },
  'https://www.lib.sfu.ca/about/branches-depts/slc/writing/academic-writing/39892': {
    at: '2026-10-05T08:17:32.915Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/writing/academic-writing/39896': {
    at: '2026-10-05T08:17:32.945Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/presentations/39834': {
    at: '2026-10-05T08:17:32.945Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/writing/style/39894': {
    at: '2026-10-05T08:17:32.946Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/procrastination/39826': {
    at: '2026-10-05T08:17:32.963Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/exam-prep/39822': {
    at: '2026-10-05T08:17:32.988Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/exam-anxiety/39833': {
    at: '2026-10-05T08:17:32.989Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/studying-reviewing/39824': {
    at: '2026-10-05T08:17:32.990Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/': {
    at: '2026-10-05T08:17:33.006Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/offer/slc-workshops': {
    at: '2026-10-05T08:17:33.034Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/learning-strategy-videos': {
    at: '2026-10-05T08:17:33.035Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/writing/writing-videos': {
    at: '2026-10-05T08:17:33.035Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/offer/consultation-info': {
    at: '2026-10-05T08:17:33.070Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/eal/conversation/registration-form-eal-esl-students':
    {
      at: '2026-10-05T08:17:33.082Z',
      retrieved: false,
    },
  'https://www.lib.sfu.ca/about/branches-depts/slc/eal/academic': {
    at: '2026-10-05T08:17:33.082Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/eal/academic/': {
    at: '2026-10-05T08:17:33.107Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/offer/consultation-info/drop': {
    at: '2026-10-05T08:17:33.121Z',
    retrieved: false,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/time-management/schedule-building-0': {
    at: '2026-10-05T08:17:33.121Z',
    retrieved: false,
  },
  'https://www.sfu.ca/students/get-involved/recognition/co-curricular-record.html': {
    at: '2026-10-05T08:17:33.145Z',
    retrieved: true,
  },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/exam-prep/ace-numbers-game-quantitative-exams':
    {
      at: '2026-10-05T08:17:33.157Z',
      retrieved: false,
    },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/studying-reviewing/level-study-skills':
    {
      at: '2026-10-05T08:17:33.157Z',
      retrieved: false,
    },
  'https://www.lib.sfu.ca/about/branches-depts/slc/learning/procrastination/do-later-managing-procrastination':
    {
      at: '2026-10-05T08:17:33.177Z',
      retrieved: false,
    },
  'https://vowel-writers.weebly.com/': {
    at: '2026-10-05T08:17:33.421Z',
    retrieved: true,
  },
  'https://writeaway.ca/': {
    at: '2026-10-05T08:17:33.433Z',
    retrieved: true,
  },
  'https://vowel-writers.weebly.com/about.html': {
    at: '2026-10-05T08:17:33.435Z',
    retrieved: true,
  },
  'https://www.writeaway.ca/': {
    at: '2026-10-05T08:17:33.461Z',
    retrieved: true,
  },
};
const base = 'https://www.lib.sfu.ca/about/branches-depts/slc';
const workshopIndex = `${base}/offer/slc-workshops`;
const dropInUrl = `${base}/offer/consultation-info/drop`;
const provider = { name: 'SFU Library Student Learning Commons', type: 'sfu' as const };
const unavailableRegistration = {
  registrationStatus: 'unavailable' as const,
  registrationNote:
    'The guide links an official service page, but a working registration destination has not been confirmed. Check with SLC before attending.',
};
const notRequired = {
  registrationStatus: 'not-required' as const,
  registrationNote: 'The guide explicitly says no registration is required.',
};
type Place = Pick<
  ResourceOccurrenceDetails,
  'campus' | 'building' | 'room' | 'mode' | 'locationDisplay'
>;
const arts: Place = {
  campus: 'Burnaby',
  building: 'AQ',
  room: '3020',
  mode: 'hybrid',
  locationDisplay: 'Arts Central, AQ 3020, Burnaby & Zoom',
};
const science: Place = {
  campus: 'Burnaby',
  building: 'AQ',
  room: '3146',
  mode: 'hybrid',
  locationDisplay: 'Sci-Space, AQ 3146, Burnaby & Zoom',
};
const slcArea: Place = {
  campus: 'Burnaby',
  building: 'Bennett Library',
  room: '3020',
  mode: 'in-person',
  locationDisplay: 'Consultation Area at the SLC, Room 3020, Bennett Library, Burnaby',
};
const makers: Place = {
  campus: 'Burnaby',
  building: 'Bennett Library',
  room: '3100',
  mode: 'in-person',
  locationDisplay: 'Media Maker Commons (Rm 3100), Bennett Library, Burnaby',
};
const globalCentre: Place = {
  campus: 'Burnaby',
  building: 'AQ',
  room: '2013',
  mode: 'in-person',
  locationDisplay: 'Global Student Centre, AQ Rm 2013, Burnaby',
};
function at(
  date: string,
  startTime: string,
  endTime: string,
  place: Place,
  sourcePage: number,
): ResourceOccurrence {
  return { id: date, date, startTime, endTime, ...place, sourcePage };
}
function program(
  kind: ResourceProgram['kind'],
  sourcePages: number[],
  occurrences: ResourceOccurrence[] = [],
  extra: Partial<ResourceProgram> = {},
): ResourceProgram {
  return {
    kind,
    occurrences,
    sourcePages,
    sourceDocument: slcFall2026Document,
    ...unavailableRegistration,
    ...extra,
  };
}

type SlcInput = {
  id: string;
  title: string;
  summary: string;
  description: string;
  page: number[];
  url: string;
  program: ResourceProgram;
  tags: string[];
  aliases?: string[];
  eligibility?: string[];
  audiences?: CatalogInput['audiences'];
  campuses?: Campus[];
  locations?: CatalogInput['locations'];
  conditions?: string[];
  access?: string[];
  posterFacts?: string[];
  service?: boolean;
  free?: boolean;
  provider?: CatalogInput['provider'];
  relatedIds?: string[];
  additionalDetails?: CatalogInput['details'];
};

// Each resource maps its claims to the exact guide pages. Link reachability and
// registration validation are recorded separately from this document review.
function documentSource(url: string, pages: number[], title: string): SourceInput {
  const checked = linkChecks[url];
  if (!checked) throw new Error(`Missing source-link check: ${url}`);
  return {
    id: 'slc-guide',
    title: `${slcFall2026Document.filename} — ${title}`,
    url,
    locator: `User-supplied SFU Library SLC guide, pages ${pages.join(', ')}; text and rendered pages inspected`,
    note: `Primary evidence is the supplied PDF (SHA-256 ${slcFall2026Document.sha256}), not the linked website.`,
    fields: [
      'title',
      'summary',
      'details',
      'access',
      'eligibility',
      'audiences',
      'campuses',
      'locations',
      'cost',
      'poster',
      'program',
    ],
    lastRetrievalAttemptAt: checked.at,
    lastRetrievedAt: checked.retrieved ? checked.at : null,
    retrievalStatus: checked.retrieved ? 'retrieved' : 'blocked',
    document: {
      filename: slcFall2026Document.filename,
      sha256: slcFall2026Document.sha256,
      pages,
      readAt: reviewedAt,
    },
  };
}
function slc(input: SlcInput): DirectoryResource {
  const places = [...input.program.occurrences, ...(input.program.recurrences ?? [])];
  const campuses = input.campuses ?? [
    ...new Set(
      places.flatMap((item) =>
        item.mode === 'hybrid'
          ? [item.campus!, 'Online' as const]
          : item.campus
            ? [item.campus]
            : [],
      ),
    ),
  ];
  const conditions = input.conditions ?? [];
  const manual = input.program.manualReviewRequired;
  return defineResource({
    id: input.id,
    title: input.title,
    category: input.service ? 'academic-support' : 'workshops-events',
    topic: '06',
    summary: input.summary,
    provider: input.provider ?? provider,
    access: input.access ?? [
      input.program.registrationStatus === 'not-required'
        ? 'Drop in at a listed session; no registration is required.'
        : 'Use the linked SLC page to confirm attendance and registration arrangements.',
    ],
    eligibility: input.eligibility ?? [
      'For SFU students; confirm any activity-specific participation conditions with SLC.',
    ],
    audiences: input.audiences ?? ['All students'],
    campuses,
    locations: input.locations ?? [
      ...new Map(
        places
          .filter((p) => p.campus && p.locationDisplay)
          .map((p) => [p.locationDisplay!, { campus: p.campus!, name: p.locationDisplay! }]),
      ).values(),
    ],
    cost:
      !input.service || input.free
        ? {
            status: 'published',
            details: input.service
              ? 'The guide describes these consultations as free (page 2).'
              : 'The guide describes SLC workshops and events as free (page 2).',
          }
        : { status: 'unknown' },
    details: [
      { heading: 'About this program', body: input.description },
      ...(input.additionalDetails ?? []),
    ],
    term: 'Fall 2026',
    program: {
      ...input.program,
      occurrences: input.program.occurrences.map((occurrence) => ({
        ...occurrence,
        id: `${input.id}-${occurrence.id}`,
      })),
    },
    verification: {
      status: manual ? 'partial' : 'reviewed',
      reviewedAt,
      verifiedAt: manual ? null : reviewedAt,
      reviewer: 'agent',
      note: `Reviewed against supplied PDF pages ${input.page.join(', ')}. Registration status is recorded separately from document fact review.${manual ? ` ${input.program.manualReviewNote}` : ''}`,
    },
    reviewCadence: 'schedule',
    reviewDueAt: '2026-10-12',
    secondReview,
    highImpact: false,
    aliases: input.aliases ?? [],
    tags: ['SLC', 'Fall 2026', ...input.tags],
    relatedIds:
      input.relatedIds ?? ['slc', 'writing', 'academic-english'].filter((id) => id !== input.id),
    poster: {
      title: input.title,
      facts: input.posterFacts ?? [
        input.summary,
        `${(input.provider ?? provider).name} · Fall 2026 guide`,
      ],
      conditions,
      mode: 'facts',
    },
    sources: [
      documentSource(input.url, [...new Set([2, ...input.page])], input.title),
      ...(input.program.registrationUrl && input.program.registrationUrl !== input.url
        ? [
            {
              ...documentSource(
                input.program.registrationUrl,
                input.page,
                'Verified provider destination',
              ),
              id: 'slc-registration',
              fields: ['program.registrationUrl'],
            },
          ]
        : []),
    ],
  });
}

export const slcWorkshopResources: DirectoryResource[] = [
  slc({
    id: 'slc-present-with-confidence',
    title: 'Present with Confidence: Communication Skills for Academic and Professional Success',
    summary:
      'Practise presentation and communication strategies for academic and professional settings.',
    description:
      'An interactive workshop for multilingual students to develop presentation confidence and communication strategies for varied academic and professional contexts.',
    eligibility: ['For multilingual students developing presentation and communication skills.'],
    conditions: ['For multilingual students.'],
    page: [5],
    url: `${base}/eal/academic/39851`,
    program: program(
      'single',
      [5],
      [
        at(
          '2026-09-15',
          '12:30',
          '13:30',
          {
            campus: 'Burnaby',
            building: 'Bennett Library',
            room: '7200',
            mode: 'in-person',
            locationDisplay: 'Room 7200, Bennett Library, Burnaby',
          },
          5,
        ),
      ],
    ),
    tags: ['Public Speaking', 'English Language Support', 'EAL'],
    aliases: ['presentation confidence', '公开演讲'],
  }),
  slc({
    id: 'slc-schedule-building',
    title: 'Schedule-Building Workshop',
    summary: 'Build a weekly schedule or semester deadline calendar with guided planning support.',
    description:
      'Start with an introduction to scheduling tools, then work on your own planning with SLC support. Include study blocks, deadlines, exam dates, other responsibilities and leisure time. Bring your course outlines and questions.',
    eligibility: ['Open to all students, regardless of faculty.'],
    conditions: ['Bring your course outlines and questions.'],
    page: [5],
    url: `${base}/learning/time-management/schedule-building-0`,
    program: program(
      'multiple',
      [5],
      [at('2026-09-17', '12:30', '13:20', arts, 5), at('2026-09-21', '11:30', '12:20', science, 5)],
    ),
    tags: ['Study Skills', 'Time Management'],
    aliases: ['schedule building', 'study planning', '学习计划'],
  }),
  slc({
    id: 'slc-lifes-little-debates',
    title: 'Conversation Group: Life’s Little Debates',
    summary: 'Practise English conversation through relaxed discussions about everyday situations.',
    description:
      'Share opinions and hear different perspectives on everyday topics such as texting habits, punctuality, tipping, roommates and phone etiquette. The guide lists Tuesday sessions from September 22 through November 24.',
    page: [5],
    url: `${base}/eal/conversation/39910`,
    program: program('recurring', [5], [], {
      recurrences: [
        {
          weekday: 'Tuesday',
          startDate: '2026-09-22',
          endDate: '2026-11-24',
          startTime: '14:30',
          endTime: '15:30',
          ...slcArea,
          sourcePage: 5,
        },
      ],
    }),
    tags: ['English Language Support', 'EAL', 'Community'],
    aliases: ['English conversation', '英语口语', 'little debates'],
  }),
  slc({
    id: 'slc-unlock-readings',
    title: 'Unlock your Readings: Strategies for Success',
    summary:
      'Try strategies for retaining more from course readings and engaging with research sources.',
    description:
      'Learn reading strategies and practise them with an academic reading you bring to the session.',
    conditions: ['Bring an academic reading for hands-on practice.'],
    page: [6],
    url: `${base}/learning/reading/unlock-your-readings-strategies-success`,
    program: program('single', [6], [at('2026-09-24', '12:30', '13:20', arts, 6)]),
    tags: ['Study Skills', 'Reading'],
    aliases: ['academic reading', '阅读策略'],
  }),
  slc({
    id: 'slc-quantitative-exams',
    title: 'Ace the Numbers Game: Quantitative Exams',
    summary: 'Develop strategies for quantitative problem-solving exams and managing exam nerves.',
    description:
      'For students preparing for MATH, PHYS, CHEM or other quantitative problem-solving exams. The guide identifies Physics lecturer Dr. Sarah Johnson as a co-facilitator. Sessions cover unexpected problems, exam-writing skills and nerves.',
    eligibility: ['For students preparing for quantitative problem-solving exams.'],
    page: [6],
    url: `${base}/learning/exam-prep/ace-numbers-game-quantitative-exams`,
    program: program(
      'multiple',
      [6],
      [
        at('2026-09-25', '11:30', '12:20', science, 6),
        at('2026-12-02', '11:30', '12:20', science, 6),
      ],
    ),
    tags: ['Exam Preparation', 'Study Skills'],
    aliases: ['quantitative exam', 'math exam', '定量考试'],
  }),
  slc({
    id: 'slc-photo-walk',
    title: 'Conversation Group: Photo Walk — Exploring Campus Through Language',
    summary: 'Explore language and meaning on campus through photographs and shared reflection.',
    description:
      'Work individually or in pairs on an assigned word, concept or theme, take photographs around campus or the library, then share observations and reflections. The guide lists Friday sessions from September 25 through October 9.',
    page: [6],
    url: `${base}/eal/conversation/39912`,
    program: program('recurring', [6], [], {
      recurrences: [
        {
          weekday: 'Friday',
          startDate: '2026-09-25',
          endDate: '2026-10-09',
          startTime: '15:00',
          endTime: '16:00',
          ...slcArea,
          sourcePage: 6,
        },
      ],
    }),
    tags: ['English Language Support', 'EAL', 'Creative', 'Community'],
    aliases: ['photo walk', 'English conversation', '英语口语'],
  }),
  slc({
    id: 'slc-study-skills',
    title: 'Level Up Your Study Skills',
    summary: 'Explore effective study strategies to feel better prepared for exams.',
    description:
      'A workshop about studying more effectively and preparing for exams, with two published Fall 2026 dates.',
    page: [7],
    url: `${base}/learning/studying-reviewing/level-study-skills`,
    program: program(
      'multiple',
      [7],
      [
        at('2026-09-28', '11:30', '12:20', science, 7),
        at('2026-11-25', '11:30', '12:20', science, 7),
      ],
    ),
    tags: ['Study Skills', 'Exam Preparation'],
    aliases: ['study skills', '学习技巧'],
  }),
  slc({
    id: 'slc-ai-rehearsal',
    title: 'AI as a Rehearsal Space: Building Confidence Through Practice',
    summary:
      'Explore AI-supported rehearsal for presentations, interviews and other speaking tasks.',
    description:
      'Learn practical strategies for rehearsing academic and professional communication in a low-pressure environment, building confidence and preparing for speaking tasks.',
    page: [7],
    url: `${base}/eal/conversation/39853`,
    program: program(
      'single',
      [7],
      [
        at(
          '2026-09-29',
          '12:30',
          '13:30',
          {
            campus: 'Burnaby',
            building: 'Bennett Library',
            room: '7301',
            mode: 'in-person',
            locationDisplay: 'Room 7301, Bennett Library, Burnaby',
          },
          7,
        ),
      ],
    ),
    tags: ['AI Skills', 'Public Speaking', 'English Language Support'],
    aliases: ['AI rehearsal', '人工智能练习'],
  }),
  slc({
    id: 'slc-workplace-english',
    title: 'Conversational English for the Canadian Workplace',
    summary: 'Practise workplace English through peer-supported role plays and conversations.',
    description:
      'Sessions include interview and networking questions, small-group conversations and useful workplace expressions. Participants explore communication expectations, cultural norms, teamwork, feedback, professional boundaries and asking for help.',
    eligibility: ['For SFU students whose first language is not English.'],
    conditions: ['For SFU students whose first language is not English.'],
    page: [7],
    url: `${base}/eal/conversation/39908`,
    program: program(
      'multiple',
      [7],
      ['2026-09-29', '2026-10-06', '2026-10-27', '2026-11-10', '2026-11-17'].map((date) =>
        at(date, '12:30', '13:30', globalCentre, 7),
      ),
    ),
    tags: ['English Language Support', 'EAL', 'Career'],
    aliases: ['English conversation', 'workplace English', '英语口语'],
  }),
  slc({
    id: 'slc-procrastination',
    title: '“I’ll Do It Later”: Managing Procrastination',
    summary: 'Explore why procrastination happens and practical ways to break the cycle.',
    description:
      'Reflect on time management, gain confidence approaching your schedule and learn strategies for getting started when a to-do list feels stressful.',
    page: [8],
    url: `${base}/learning/procrastination/do-later-managing-procrastination`,
    program: program(
      'multiple',
      [8],
      [
        at('2026-10-02', '11:30', '12:20', science, 8),
        at('2026-11-23', '11:30', '12:20', science, 8),
      ],
    ),
    tags: ['Time Management', 'Study Skills'],
    aliases: ['procrastination', '拖延'],
  }),
  slc({
    id: 'slc-public-speaking',
    title: 'Public Speaking for Your Courses and Beyond',
    summary:
      'Practise speaking skills for class discussions, presentations and professional settings.',
    description:
      'Learn speaking tips and practise in a supportive setting. The guide connects these skills with presentations, interviews, team meetings and other professional communication.',
    page: [8],
    url: `${base}/learning/presentations/public-speaking-skills`,
    program: program(
      'multiple',
      [8],
      [at('2026-10-06', '12:30', '13:30', arts, 8), at('2026-10-26', '11:30', '12:20', science, 8)],
    ),
    tags: ['Public Speaking'],
    aliases: ['public speaking', '公开演讲'],
  }),
  slc({
    id: 'slc-soup-circles',
    title: 'Soup Circles',
    summary: 'Join relaxed conversations about learning, reflection, writing and student life.',
    description:
      'Four sessions have different conversation starters: Introspection, Extrospection, Navigating Uncertainties (think-pair-share), and Communo-spection. Conversations continue until 2pm, but soup may run out earlier.',
    page: [3, 4],
    url: `${base}/learning/study-groups/soup-circles`,
    program: program(
      'multiple',
      [3, 4],
      [
        at('2026-10-08', '12:00', '14:00', slcArea, 3),
        at('2026-11-04', '12:00', '14:00', slcArea, 3),
        at('2026-11-26', '12:00', '14:00', globalCentre, 4),
        at(
          '2026-12-07',
          '12:00',
          '14:00',
          {
            campus: 'Burnaby',
            building: 'Bennett Library',
            room: '3008',
            mode: 'in-person',
            locationDisplay: 'Room 3008 (inside Chill Lounge), Bennett Library, Burnaby',
          },
          4,
        ),
      ],
      notRequired,
    ),
    conditions: ['No registration required. Soup may run out before the conversation ends.'],
    tags: ['Community', 'Writing', 'Study Skills'],
    aliases: ['Soup Circles', 'soup circle'],
  }),
  slc({
    id: 'slc-scientific-writing',
    title: 'Scientific Writing Made Simple',
    summary: 'Build clear scientific writing using structure, flow and revision strategies.',
    description:
      'Explore scientific writing and IMRAD structure (Introduction, Methods, Results and Discussion), with examples and revision strategies. All undergraduate students are welcome, particularly those in science, health science, applied science and data-focused disciplines.',
    eligibility: [
      'All undergraduate students are welcome; particularly relevant to science, health science, applied science and data-focused disciplines.',
    ],
    audiences: ['Undergraduate'],
    conditions: ['For undergraduate students.'],
    page: [8],
    url: `${base}/writing/disciplines/39830`,
    program: program('single', [8], [at('2026-10-19', '11:30', '13:30', science, 8)]),
    tags: ['Writing', 'Science Writing'],
    aliases: ['scientific writing', 'science writing', '科学写作'],
  }),
  slc({
    id: 'slc-big-paper',
    title: 'Big Paper? Let’s Write it Right',
    summary:
      'A listed SLC workshop; its description needs confirmation because the guide repeats exam-anxiety text.',
    description:
      'The printed title, date, time and location are retained. A useful workshop description is pending confirmation; the guide’s paragraph appears to duplicate the Dealing with Exam Anxiety workshop.',
    page: [9],
    url: `${base}/learning/time-management/big-paper-write-it-right`,
    program: program(
      'single',
      [9],
      [
        {
          ...at('2026-10-22', '11:30', '12:30', arts, 9),
          rawSource: {
            description:
              'Have you ever frozen or panicked during an exam? You’re not alone. Check out this session for strategies to calm yourself during exam prep and refocus your mind if you freeze during an exam. Plus, you’ll gain some tips & tricks for answering different types of exam questions, including the dreaded multiple choice.',
          },
        },
      ],
      {
        manualReviewRequired: true,
        manualReviewNote:
          'Page 9 prints exam-anxiety description beneath Big Paper; page 10 repeats that description under Dealing with Exam Anxiety. Description withheld; ask SLC to confirm.',
      },
    ),
    conditions: ['Workshop description needs confirmation with SLC.'],
    tags: ['Writing'],
    aliases: ['Big Paper', 'writing paper'],
  }),
  slc({
    id: 'slc-writer-becoming',
    title: 'The Writer You Are Becoming',
    summary:
      'Explore creative self-reflection through writing, drawing, collage, photography or another medium.',
    description:
      'Create a self-portrait in a medium that suits you and reflect on your development as a learner and writer. The session supports generating ideas and moving through moments of feeling stuck. No artistic experience is needed; all materials are provided.',
    conditions: ['No artistic experience is needed; materials are provided.'],
    page: [9],
    url: `${base}/writing/academic-writing/39892`,
    program: program('single', [9], [at('2026-10-22', '12:30', '13:30', makers, 9)]),
    tags: ['Writing', 'Creative'],
    aliases: ['writer becoming', 'creative reflection'],
  }),
  slc({
    id: 'slc-zine-making',
    title: 'Go touch some paper: zine-making workshop',
    summary: 'Explore zines as a creative way to share stories, ideas and art.',
    description:
      'Learn about small DIY publications and ways to make them with text and images. The guide presents zines as a way to share knowledge and express yourself outside mainstream publishing.',
    page: [9, 10],
    url: `${base}/writing/style/39894`,
    program: program('single', [9, 10], [at('2026-11-05', '14:00', '16:00', makers, 10)]),
    tags: ['Writing', 'Creative', 'Community'],
    aliases: ['zine', 'zine making'],
  }),
  slc({
    id: 'slc-writing-walk',
    title: 'Take Your Writing for a Walk: Exploring Extrospection',
    summary: 'Take a gentle observation walk, pause to write, then share reflections at the SLC.',
    description:
      'Explore campus, or walk indoors depending on weather, before choosing a place to observe, reflect and write. Return to the SLC for conversation about how surroundings influence thinking. No writing experience is required.',
    conditions: ['Bring comfortable shoes. Walking may move indoors depending on weather.'],
    page: [10],
    url: `${base}/writing/academic-writing/39896`,
    program: program('single', [10], [at('2026-11-19', '12:30', '14:00', slcArea, 10)]),
    tags: ['Writing', 'Creative'],
    aliases: ['writing walk', 'extrospection'],
  }),
  slc({
    id: 'slc-exam-anxiety',
    title: '“I Know My Stuff But I Froze”: Dealing with Exam Anxiety',
    summary: 'Explore exam-preparation, refocusing and question-answering strategies.',
    description:
      'Learn strategies for calming and refocusing during exam preparation or an exam, and tips for different question types including multiple choice.',
    page: [10],
    url: `${base}/learning/exam-anxiety/39833`,
    program: program('single', [10], [at('2026-11-30', '11:30', '12:20', science, 10)]),
    tags: ['Exam Preparation', 'Study Skills'],
    aliases: ['exam anxiety', '考试焦虑'],
  }),
];

const communityIds = [
  'slc-drop-in-out-on-campus',
  'slc-drop-in-womens-centre',
  'slc-drop-in-indigenous-burnaby',
  'slc-drop-in-disability-neurodiversity',
  'slc-drop-in-black-student-centre',
  'slc-drop-in-global-student-centre',
  'slc-drop-in-indigenous-surrey',
];
export const slcServiceResources: DirectoryResource[] = [
  slc({
    id: 'writing',
    title: 'Writing and Learning Consultations',
    summary:
      'Free one-to-one writing feedback and study-strategy consultations for SFU students taking credit courses.',
    description:
      'Discuss writing at any stage of an assignment, time management, exam preparation, note-taking or presentation skills. Consultations are available on campus at Burnaby and Surrey and virtually. French consultations have designated hours; consult the booking schedule.',
    page: [2],
    url: `${base}/offer/consultation-info`,
    service: true,
    free: true,
    campuses: ['Burnaby', 'Surrey', 'Online'],
    eligibility: ['For SFU students taking credit courses.'],
    access: [
      'Follow the consultation page to view the schedule and book an appointment.',
      'Check designated hours for French consultations.',
    ],
    program: program('range', [2], [], {
      startDate: '2026-09-14',
      endDate: '2026-12-12',
      scheduleText:
        'Guide service window: September 14–December 12, 2026. Individual appointments require the booking schedule.',
      manualReviewRequired: true,
      manualReviewNote:
        'Page 2 calls December 12 the last day of classes. That calendar claim is not adopted; confirm the service end date with SLC.',
    }),
    conditions: ['SFU students taking credit courses; check appointment availability.'],
    additionalDetails: [
      {
        heading: 'Source clarification',
        body: 'The guide gives a September 14–December 12 service window. Its parenthetical claim about the last day of classes is not used as an academic-calendar fact.',
      },
    ],
    tags: ['Writing', 'Study Skills'],
    aliases: ['writing consultation', 'writing help', 'essay feedback', '写作', '写作辅导'],
    relatedIds: ['slc', 'academic-english', 'slc-writeaway', 'research'],
  }),
  slc({
    id: 'slc-conversation-partners',
    title: 'Conversation Partners',
    summary:
      'Practise conversational English with a student volunteer partner in weekly one-hour meetings.',
    description:
      'The program pairs participants with a student volunteer to practise English, build confidence, connect with others and work toward language goals. The guide supplies the program date range but no common meeting weekday or clock time.',
    page: [3],
    url: `${base}/eal/conversation/registration-form-eal-esl-students`,
    service: true,
    campuses: [],
    eligibility: [
      'For students looking to practise conversational English; confirm current program eligibility and registration with SLC.',
    ],
    program: program('range', [3], [], {
      startDate: '2026-09-21',
      endDate: '2026-12-04',
      scheduleText:
        'September 21–December 4, 2026; weekly one-hour meetings arranged with a partner. Campus and delivery mode are not stated in the guide.',
    }),
    tags: ['English Language Support', 'EAL', 'Community'],
    aliases: ['conversation partner', 'conversation partners', '英语口语'],
  }),
  slc({
    id: 'slc-neurolanguage-coaching',
    title: 'Neurolanguage Coaching',
    summary: 'Work with a certified coach on English-learning goals and confidence.',
    description:
      'The guide describes tailored language-learning sessions combining professional coaching and neuroscience. It gives a Fall 2026 service window; appointment details require confirmation with the service.',
    page: [3],
    url: `${base}/eal/academic`,
    service: true,
    campuses: [],
    eligibility: [
      'For students seeking English-language coaching; confirm service participation and appointment arrangements with SLC.',
    ],
    program: program('range', [3], [], {
      startDate: '2026-09-21',
      endDate: '2026-12-10',
      scheduleText:
        'September 21–December 10, 2026; appointment times, campus and delivery mode are not stated in the guide.',
    }),
    tags: ['English Language Support', 'EAL'],
    aliases: ['neurolanguage', 'English coaching', '英语辅导'],
  }),
  slc({
    id: 'slc-community-drop-in',
    title: 'Drop-in Writing and Learning Support',
    summary: 'Find SLC writing and learning support at seven listed community locations.',
    description:
      'The Fall 2026 guide lists six Burnaby spaces and the Surrey Indigenous Student Centre. Check each location’s schedule and audience conditions. Both Indigenous Student Centre offerings are for self-identified Indigenous students only.',
    page: [4],
    url: dropInUrl,
    service: true,
    campuses: ['Burnaby', 'Surrey'],
    eligibility: [
      'Participation conditions vary by community space. Both Indigenous Student Centre offerings are for self-identified Indigenous students only.',
    ],
    program: program('service', [4], [], {
      scheduleText:
        'See the seven linked location records. Unbounded weekly hours are not expanded into invented dates.',
    }),
    conditions: ['Check the location-specific schedule and audience restrictions.'],
    tags: ['Writing', 'Study Skills', 'Community'],
    aliases: ['drop-in writing', 'community writing help', '写作辅导'],
    relatedIds: communityIds,
  }),
  slc({
    id: 'slc-writeaway',
    title: 'WriteAway',
    summary:
      'Undergraduates can submit draft papers for online feedback from trained writing tutors.',
    description:
      'WriteAway offers feedback from tutors at participating institutions. The guide says the service aims for a 48-hour response and accepts up to three drafts of the same paper; the response time is a target, not a guarantee. It lists reopening for Fall 2026 submissions on September 21.',
    page: [11],
    url: 'https://writeaway.ca/',
    service: true,
    campuses: ['Online'],
    audiences: ['Undergraduate'],
    provider: { name: 'WriteAway', type: 'external-official' },
    eligibility: [
      'For undergraduate students at participating institutions; SFU identifies WriteAway as an approved writing-feedback option.',
    ],
    access: ['Open WriteAway and check current submission guidance before uploading a draft.'],
    program: program('service', [11], [], {
      startDate: '2026-09-21',
      scheduleText:
        'The guide lists September 21, 2026 as the Fall reopening date; no closing date is supplied.',
      registrationUrl: 'https://writeaway.ca/',
      registrationStatus: 'verified',
      registrationNote:
        'The PDF-embedded provider homepage was retrieved and reviewed; follow its submission instructions.',
    }),
    conditions: [
      'For undergraduates at participating institutions. Response times are a target, not guaranteed.',
    ],
    tags: ['Writing', 'Online Support'],
    aliases: ['WriteAway', 'online writing feedback', '写作辅导'],
    relatedIds: ['writing', 'slc'],
  }),
  slc({
    id: 'slc-vowel',
    title: 'VOWəL — Virtual Open Writing Lab',
    summary:
      'An online writing and accountability community; it does not provide writing feedback.',
    description:
      'A drop-in writing community for everyone. Participants can set goals, reserve writing time, build writing stamina and connect with other writers without attending every week or staying for a full session.',
    page: [11],
    url: 'https://vowel-writers.weebly.com/about.html',
    service: true,
    campuses: ['Online'],
    provider: { name: 'VOWəL writing community', type: 'external-official' },
    eligibility: ['The guide describes VOWəL as open to everyone.'],
    access: [
      'Open the provider’s information page to confirm current online joining details and time zone.',
    ],
    program: program('service', [11], [], {
      scheduleText:
        'Source wording: each Friday, 9:00am to noon (UTC-07:00/Pacific Daylight Time). No start or end date is supplied.',
      registrationUrl: 'https://vowel-writers.weebly.com/',
      registrationStatus: 'verified',
      registrationNote:
        'The PDF-embedded provider homepage and About page were retrieved; confirm timing directly before joining.',
      manualReviewRequired: true,
      manualReviewNote:
        'The PDF says UTC-07:00/Pacific Daylight Time, while the retrieved provider homepage says UTC-08:00/Pacific Standard Time. Neither supplies reliable date bounds for this guide. Preserve the discrepancy and confirm current timing; no time conversion or dated recurrence is generated.',
    }),
    conditions: [
      'Writing accountability, not writing feedback. Confirm current timing and joining details.',
    ],
    tags: ['Writing', 'Community'],
    aliases: ['VOWəL', 'VOWEL', 'virtual open writing lab'],
    relatedIds: ['writing', 'slc-writeaway'],
  }),
  slc({
    id: 'slc-learning-videos',
    title: 'Learning Strategy Videos',
    summary: 'Find SLC screencasts and recordings about learning strategies.',
    description:
      'The guide points to SLC Learning Strategy Videos for screencasts and recordings of live workshops. Check the linked collection for available topics.',
    page: [2],
    url: `${base}/learning/learning-strategy-videos`,
    service: true,
    campuses: ['Online'],
    program: program('service', [2]),
    access: ['Open the linked Learning Strategy Videos collection.'],
    tags: ['Study Skills', 'Videos'],
    aliases: ['learning strategy videos', 'study videos', '学习技巧'],
  }),
  slc({
    id: 'slc-writing-videos',
    title: 'Academic Writing Strategy Videos',
    summary: 'Find SLC screencasts and recordings about academic writing strategies.',
    description:
      'The guide points to Academic Writing Strategy Videos for screencasts and recordings of live workshops. Check the linked collection for available topics.',
    page: [2],
    url: `${base}/writing/writing-videos`,
    service: true,
    campuses: ['Online'],
    program: program('service', [2]),
    access: ['Open the linked Academic Writing Strategy Videos collection.'],
    tags: ['Writing', 'Videos'],
    aliases: ['academic writing strategy videos', 'writing videos'],
  }),
];

function community(
  id: string,
  name: string,
  place: Place,
  scheduleText: string,
  extra: Partial<SlcInput> & { program?: ResourceProgram } = {},
): DirectoryResource {
  return slc({
    id,
    title: `SLC drop-in support — ${name}`,
    summary: `Writing and learning support at ${name}; check the published schedule and participation conditions.`,
    description: `The Fall 2026 guide lists ${name} as a community location for SLC drop-in writing and learning support. ${scheduleText}`,
    page: [4],
    url: dropInUrl,
    service: true,
    campuses: [place.campus!],
    locations: [{ campus: place.campus!, name: place.locationDisplay! }],
    eligibility: [
      'Confirm the host community space’s participation conditions; the guide does not state a specific audience restriction for this location.',
    ],
    access: ['Check the listed room and current SLC drop-in information before attending.'],
    program: program('service', [4], [], { scheduleText }),
    tags: ['Writing', 'Study Skills', 'Community'],
    relatedIds: ['slc-community-drop-in'],
    posterFacts: [`SLC writing and learning support at ${name}.`, place.locationDisplay!],
    conditions: ['Confirm the current schedule and host-space participation conditions.'],
    ...extra,
  });
}
const indigenousOnly = 'For self-identified Indigenous students only.';
const surreyIndigenous: Place = {
  campus: 'Surrey',
  building: 'SFU Surrey',
  room: 'SRYC 5300',
  mode: 'in-person',
  locationDisplay: 'Indigenous Student Centre, SRYC 5300, SFU Surrey',
};
const unclearSurrey =
  'The printed Wednesday time is “11:00pm to 12:00pm”. Both normalized times are withheld; confirm the correct time with SLC.';
export const slcCommunityResources: DirectoryResource[] = [
  community(
    communityIds[0],
    'Out on Campus',
    {
      campus: 'Burnaby',
      building: 'SUB',
      room: '2230',
      mode: 'in-person',
      locationDisplay: 'Out on Campus, SUB Rm 2230, Burnaby',
    },
    'Thursdays, 11:00am–12:30pm. No explicit start or end date is supplied; confirm current dates.',
    { relatedIds: ['slc-community-drop-in', 'out-on-campus'] },
  ),
  community(
    communityIds[1],
    'Women’s Centre',
    {
      campus: 'Burnaby',
      building: 'SUB',
      room: '2220',
      mode: 'in-person',
      locationDisplay: 'Women’s Centre, SUB Rm 2220, Burnaby',
    },
    'Wednesdays, 11:00am–12:30pm. No explicit start or end date is supplied; confirm current dates.',
    { relatedIds: ['slc-community-drop-in', 'womens-centre'] },
  ),
  community(
    communityIds[2],
    'Indigenous Student Centre (Burnaby)',
    {
      campus: 'Burnaby',
      building: 'AQ',
      room: '2002',
      mode: 'in-person',
      locationDisplay: 'Indigenous Student Centre, AQ 2002, Burnaby',
    },
    'Tuesdays, 11:30am–1:30pm. No explicit start or end date is supplied; confirm current dates.',
    {
      summary:
        'Writing and learning support at Burnaby Indigenous Student Centre, for self-identified Indigenous students only.',
      audiences: ['Indigenous students'],
      eligibility: [indigenousOnly],
      conditions: [indigenousOnly, 'Confirm current drop-in dates.'],
    },
  ),
  community(
    communityIds[3],
    'Disability and Neurodiversity Alliance',
    {
      campus: 'Burnaby',
      building: 'SUB',
      room: '1300',
      mode: 'in-person',
      locationDisplay: 'Disability and Neurodiversity Alliance, SUB Rm 1300, Burnaby',
    },
    'Thursdays, 3:30pm–5:30pm; start date TBA. No dates are generated before the start is confirmed.',
  ),
  community(
    communityIds[4],
    'Black Student Centre',
    {
      campus: 'Burnaby',
      building: 'MBC',
      room: '2270',
      mode: 'in-person',
      locationDisplay: 'Black Student Centre, MBC Rm 2270, Burnaby',
    },
    'Every 2nd Wednesday, 2:00pm–3:00pm beginning September 23. No end date is supplied; later recurring dates are not generated.',
    {
      program: program(
        'service',
        [4],
        [
          at(
            '2026-09-23',
            '14:00',
            '15:00',
            {
              campus: 'Burnaby',
              building: 'MBC',
              room: '2270',
              mode: 'in-person',
              locationDisplay: 'Black Student Centre, MBC Rm 2270, Burnaby',
            },
            4,
          ),
        ],
        {
          scheduleText:
            'Every 2nd Wednesday, 2:00pm–3:00pm beginning September 23. No end date is supplied.',
        },
      ),
    },
  ),
  community(
    communityIds[5],
    'Global Student Centre',
    globalCentre,
    'September 22 and 29, 1:30pm–2:30pm; October 1 and 7, 2:30pm–3:30pm.',
    {
      program: program(
        'multiple',
        [4],
        [
          at('2026-09-22', '13:30', '14:30', globalCentre, 4),
          at('2026-09-29', '13:30', '14:30', globalCentre, 4),
          at('2026-10-01', '14:30', '15:30', globalCentre, 4),
          at('2026-10-07', '14:30', '15:30', globalCentre, 4),
        ],
      ),
      relatedIds: ['slc-community-drop-in', 'global-student-centre'],
    },
  ),
  community(
    communityIds[6],
    'Indigenous Student Centre (Surrey)',
    surreyIndigenous,
    'September 29, Tuesday, 1:00pm–2:00pm. October 7 and 21, November 4 and 18, December 2: Wednesday times require confirmation.',
    {
      summary:
        'Writing and learning support for self-identified Indigenous students only; Wednesday times need confirmation.',
      audiences: ['Indigenous students'],
      eligibility: [indigenousOnly],
      conditions: [indigenousOnly, 'Wednesday times are unclear in the guide; confirm with SLC.'],
      program: program(
        'multiple',
        [4],
        [
          at('2026-09-29', '13:00', '14:00', surreyIndigenous, 4),
          ...['2026-10-07', '2026-10-21', '2026-11-04', '2026-11-18', '2026-12-02'].map(
            (date): ResourceOccurrence => ({
              id: date,
              date,
              startTime: null,
              endTime: null,
              ...surreyIndigenous,
              sourcePage: 4,
              manualReviewRequired: true,
              manualReviewNote: unclearSurrey,
              rawSource: {
                date,
                startTime: '11:00pm',
                endTime: '12:00pm',
                location: 'SRYC 5300 – SFU Surrey',
              },
            }),
          ),
        ],
        { manualReviewRequired: true, manualReviewNote: unclearSurrey },
      ),
    },
  ),
];

export const slcFall2026Resources = [
  ...slcWorkshopResources,
  ...slcServiceResources,
  ...slcCommunityResources,
];

function enrichOverview(resource: DirectoryResource): DirectoryResource {
  const additions: Record<
    string,
    { heading: string; body: string; relatedIds: string[]; pages: number[]; url: string }
  > = {
    slc: {
      heading: 'Fall 2026 programs',
      body: 'The Fall 2026 SLC Program Guide lists free workshops and events, consultations, English-language support, community drop-ins and strategy videos. Workshop records retain their individual dates and source pages; consult registration notes before attending.',
      relatedIds: [
        'slc-community-drop-in',
        'slc-learning-videos',
        'slc-writing-videos',
        ...slcWorkshopResources.map((item) => item.id),
      ],
      pages: [1, 2],
      url: workshopIndex,
    },
    'academic-english': {
      heading: 'Fall 2026 English-language support',
      body: 'The guide lists Conversation Partners, Neurolanguage Coaching and conversation programs. See their individual date ranges and participation conditions; meeting arrangements are not inferred from service windows.',
      relatedIds: [
        'slc-conversation-partners',
        'slc-neurolanguage-coaching',
        'slc-lifes-little-debates',
        'slc-photo-walk',
        'slc-workplace-english',
      ],
      pages: [3, 5, 6, 7],
      url: `${base}/eal/academic`,
    },
    'co-curricular-record': {
      heading: 'SLC participation',
      body: 'The guide promotes CCR recognition for SLC participation. Confirm the particular program’s credit conditions and participation record with its supervisor; do not assume every activity automatically qualifies.',
      relatedIds: ['slc'],
      pages: [2],
      url: 'https://www.sfu.ca/students/get-involved/recognition/co-curricular-record.html',
    },
  };
  const addition = additions[resource.id];
  if (!addition) return resource;
  const received = documentSource(addition.url, addition.pages, addition.heading);
  const source = {
    id: received.id!,
    title: received.title,
    url: received.url,
    lastRetrievalAttemptAt: received.lastRetrievalAttemptAt,
    lastRetrievedAt: received.lastRetrievedAt,
    retrievalStatus: received.retrievalStatus,
    document: received.document,
  };
  // The received guide adds evidence without re-certifying earlier web-only claims.
  return {
    ...resource,
    secondReview,
    details: [...resource.details, { heading: addition.heading, body: addition.body }],
    relatedIds: [...new Set([...resource.relatedIds, ...addition.relatedIds])],
    sources: [...resource.sources, source],
    evidence: [
      ...resource.evidence,
      {
        field: `details.${resource.details.length}`,
        sourceId: source.id,
        locator: received.locator,
        note: received.note,
      },
    ],
    verification: {
      ...resource.verification,
      reviewedAt,
      note: `${resource.verification.note ?? ''} The supplied Fall 2026 guide was additionally reviewed for the separate program links in details; earlier web-only claims retain their existing verification status.`,
    },
  };
}

/** Preserve existing canonical IDs; workshop occurrences are never separate cards. */
export function reconcileSlcFall2026(existing: DirectoryResource[]): DirectoryResource[] {
  const replacements = new Map(slcFall2026Resources.map((resource) => [resource.id, resource]));
  const existingIds = new Set(existing.map((resource) => resource.id));
  return [
    ...existing.map((resource) => replacements.get(resource.id) ?? enrichOverview(resource)),
    ...slcFall2026Resources.filter((resource) => !existingIds.has(resource.id)),
  ];
}
