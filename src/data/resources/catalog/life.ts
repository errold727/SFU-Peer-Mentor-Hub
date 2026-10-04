import { defineResource, type SourceInput } from './define';
import type { Campus, ResourceReview } from '../types';
import { recreationSessions } from '../recreation';

// Public-page review session, 2026-10-04 15:19–15:34 UTC. These are agent reviews.
// A reviewed navigation record verifies its stated guidance, not individual eligibility.
const reviewedAt = '2026-10-04T15:33:06Z';
const reviewed: ResourceReview = {
  status: 'reviewed',
  verifiedAt: reviewedAt,
  reviewedAt,
  reviewer: 'agent',
};
const partial = (note: string): ResourceReview => ({
  status: 'partial',
  verifiedAt: null,
  reviewedAt,
  reviewer: 'agent',
  note,
});
const all: Campus[] = ['Burnaby', 'Surrey', 'Vancouver', 'Online'];
const sfu = (name: string) => ({ name, type: 'sfu' as const });
const society = (name: string) => ({ name, type: 'student-organization' as const });
const source = (url: string, title: string, locator: string, fields: string[]): SourceInput => ({
  url,
  title,
  locator,
  fields,
  lastRetrievalAttemptAt: reviewedAt,
  lastRetrievedAt: reviewedAt,
  retrievalStatus: 'retrieved',
});

export const lifeResources = [
  defineResource({
    id: 'recreation-membership',
    title: 'Recreation membership and waiver',
    category: 'recreation',
    topic: '07',
    summary:
      'Check student membership eligibility, complete the online waiver, and choose the appropriate campus arrangement.',
    provider: sfu('SFU Recreation'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: all,
    access: [
      'Complete the Athletics & Recreation waiver in goSFU.',
      'For Surrey or Vancouver city passes, follow that campus’s activation instructions after the waiver.',
    ],
    eligibility: [
      'Burnaby student coverage requires at least three credits in the term and assessment of the Recreation & Athletics fee.',
      'Surrey and Vancouver arrangements have their own course-location and transfer conditions. Ask Recreation if your eligibility is unclear.',
    ],
    cost: {
      status: 'published',
      details:
        'Eligible student membership is covered by the assessed fee. Ineligible students and some activities require a separate purchase.',
    },
    details: [
      {
        heading: 'Renewal',
        body: 'The online waiver is renewed each September; student memberships expire August 31.',
      },
      {
        heading: 'Campus arrangements',
        body: 'Surrey City Pass and Vancouver City Pass activation is separate. Only one SFU recreation membership may be held; review transfer requirements before choosing.',
      },
    ],
    verification: partial(
      'Burnaby activation and Surrey instructions reviewed. The Vancouver eligibility introduction says Surrey, while its criteria say Vancouver; confirm that pathway with Recreation.',
    ),
    reviewCadence: 'sensitive',
    highImpact: false,
    aliases: ['健身会员', 'recreation waiver', '体育会员'],
    relatedIds: ['drop-in-recreation', 'fitness-centre'],
    poster: {
      title: 'Activate recreation access',
      facts: [
        'Check your term’s membership eligibility.',
        'Complete the online waiver in goSFU.',
        'Surrey and Vancouver city passes need separate activation.',
      ],
      conditions: ['Membership and activity fees vary; confirm your campus pathway.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/recreation/memberships-and-passes/sfu-students/activate-membership.html',
        'SFU Recreation — Activate Your Membership',
        'Activate membership; Student eligibility; membership expiry',
        [
          'summary',
          'access.0',
          'eligibility.0',
          'cost',
          'details.0',
          'poster.facts.0',
          'poster.facts.1',
        ],
      ),
      source(
        'https://www.sfu.ca/recreation/memberships-and-passes/sfu-students/surrey-recreation.html',
        'SFU Recreation — Surrey Recreation',
        'Student eligibility; activate your pass',
        ['access.1', 'eligibility.1', 'details.1', 'poster.facts.2', 'poster.conditions'],
      ),
      source(
        'https://www.sfu.ca/recreation/memberships-and-passes/sfu-students/vancouver-recreation.html',
        'SFU Recreation — Vancouver Recreation',
        'Student eligibility and Vancouver City Pass instructions; conflicting introductory campus label',
        ['access.1', 'eligibility.1', 'details.1', 'verification.note'],
      ),
    ],
  }),
  defineResource({
    id: 'drop-in-recreation',
    title: 'Drop-In Recreation',
    category: 'recreation',
    topic: '07',
    summary:
      'Casual Burnaby sport sessions for different abilities, with a published Fall 2026 weekly schedule.',
    provider: sfu('SFU Recreation'),
    audiences: ['All students'],
    campuses: ['Burnaby'],
    access: ['Review the current schedule and registration link before attending.'],
    eligibility: [
      'A valid Burnaby Recreation membership is required; community participants need an eligible pass.',
    ],
    cost: {
      status: 'published',
      details:
        'Included with a valid Burnaby membership. Community participation requires at least a day pass.',
    },
    term: 'Fall 2026',
    validFrom: '2026-09-14',
    validUntil: '2026-12-04',
    sessions: recreationSessions.map((session) => ({
      ...session,
      validFrom: '2026-09-14',
      validUntil: '2026-12-04',
      exceptions: ['2026-09-30', '2026-10-12', '2026-11-11'],
    })),
    facts: [
      { label: 'Schedule validity', value: 'September 14–December 4, 2026; subject to change.' },
    ],
    details: [
      {
        heading: 'Closures and exceptions',
        body: 'The recurring display excludes September 30, October 12 and November 11 because the academic calendar identifies university closures. This is a conservative exclusion, not separate confirmation that each sport is cancelled. Check Recreation for facility-specific changes.',
      },
    ],
    verification: reviewed,
    reviewCadence: 'schedule',
    highImpact: false,
    aliases: [
      '羽毛球',
      '篮球',
      '排球',
      'badminton',
      'basketball',
      'volleyball',
      'pickleball',
      'futsal',
    ],
    poster: {
      title: 'Drop-in sports at Burnaby',
      facts: [
        'Fall schedule: September 14–December 4, 2026.',
        'Choose a sport and day in the weekly schedule.',
        'Check membership, registration and closures before attending.',
      ],
      conditions: [
        'Schedule subject to change; university closure dates are excluded from the recurring display.',
      ],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/recreation/sports/dropinsport/drop-in-schedule.html',
        'SFU Recreation — Drop-In Sports Schedule',
        'Fall 2026 heading and Monday–Friday schedule table',
        [
          'summary',
          'access',
          'term',
          'validFrom',
          'validUntil',
          'sessions',
          'facts.0',
          'poster.facts.0',
          'poster.facts.1',
        ],
      ),
      source(
        'https://www.sfu.ca/recreation/sports/dropinsport.html',
        'SFU Recreation — Drop-In Sports',
        'Who can participate; memberships and passes',
        ['eligibility', 'cost', 'poster.facts.2'],
      ),
      source(
        'https://www.sfu.ca/students/calendar/2026/fall/academic-dates/2026.html',
        'SFU Calendar — Fall 2026 Academic Dates',
        'September 30, October 12 and November 11 university closures; university-wide scope',
        ['sessions.exceptions', 'details.0', 'poster.conditions'],
      ),
    ],
  }),
  defineResource({
    id: 'fitness-centre',
    title: 'Fitness Centre access and orientation',
    category: 'recreation',
    topic: '07',
    summary: 'Use Burnaby’s Fitness Centre and ask about an orientation before your first workout.',
    provider: sfu('SFU Recreation'),
    audiences: ['All students'],
    campuses: ['Burnaby'],
    locations: [{ campus: 'Burnaby', name: 'Lorne Davies Complex, Fitness Centre, Room 088' }],
    access: [
      'Activate your membership and waiver, then check current facility hours and closure notices.',
      'Ask about a free Fitness Centre orientation.',
    ],
    eligibility: [
      'Valid Burnaby membership or eligible pass required. The centre is for ages 15 and older; ages 15–16 require adult supervision.',
    ],
    cost: {
      status: 'published',
      details:
        'Eligible student membership covers access; community passes and personal training have separate charges. Orientations are free.',
    },
    verification: reviewed,
    reviewCadence: 'schedule',
    highImpact: false,
    aliases: ['健身房', 'gym', 'weights'],
    poster: {
      title: 'Visit the Fitness Centre',
      facts: [
        'Burnaby: Lorne Davies Complex, Room 088.',
        'Free orientations are available.',
        'Check current hours and activate your membership first.',
      ],
      conditions: ['Membership/pass and age conditions apply.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/recreation/fitness.html',
        'SFU Recreation — Fitness Centre',
        'Hours and location; who can participate; services and orientation',
        ['summary', 'locations', 'access', 'eligibility', 'cost', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'climbing',
    title: 'Climbing wall: first visit',
    category: 'recreation',
    topic: '07',
    summary:
      'Prepare for a first climbing-wall visit, including orientation and pass requirements.',
    provider: sfu('SFU Recreation'),
    audiences: ['All students'],
    campuses: ['Burnaby'],
    access: [
      'Check the current climbing schedule and pass options.',
      'Complete the required facility orientation; ask staff about introductory climbing options.',
    ],
    eligibility: [
      'All participants need a facility orientation. Belaying requires the relevant skills check.',
      'Youth supervision and guardian-consent rules apply; review the first-visit page.',
    ],
    cost: {
      status: 'unknown',
      details:
        'Review climbing membership or multi-visit pass pricing; do not assume a general recreation membership covers climbing.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: false,
    aliases: ['攀岩', 'climbing wall'],
    poster: {
      title: 'Try the climbing wall',
      facts: [
        'Start with the required facility orientation.',
        'Check current climbing times and pass options.',
        'Ask staff about a first visit.',
      ],
      conditions: ['Belay checks and youth rules apply.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/recreation/climbing.html',
        'SFU Recreation — Climbing',
        'Climbing programs and membership links',
        ['summary', 'access.0', 'cost', 'poster.facts.1'],
      ),
      source(
        'https://www.sfu.ca/recreation/climbing/first-visit.html',
        'SFU Recreation — Your First Visit',
        'New climbers; orientations; belay checks; youth',
        ['access.1', 'eligibility', 'poster.facts.0', 'poster.facts.2', 'poster.conditions'],
      ),
    ],
  }),
  defineResource({
    id: 'intramurals',
    title: 'Intramural leagues',
    category: 'recreation',
    topic: '07',
    summary: 'Find recreational leagues, team registration and free-agent information.',
    provider: sfu('SFU Recreation'),
    audiences: ['All students'],
    campuses: ['Burnaby'],
    access: ['Choose a current league and review team or free-agent registration instructions.'],
    eligibility: [
      'Students need a valid Burnaby Recreation membership. Community participants require at least a one-month membership; a day pass is not accepted.',
    ],
    cost: {
      status: 'published',
      details:
        'Membership conditions apply. Registration also requires a credit card for potential fines; review league rules before joining.',
    },
    verification: reviewed,
    reviewCadence: 'schedule',
    highImpact: false,
    aliases: ['校内联赛', 'rec league', 'free agent'],
    poster: {
      title: 'Join an intramural league',
      facts: [
        'Find current team and free-agent options.',
        'A valid Burnaby membership is required.',
        'Check registration dates and league rules.',
      ],
      conditions: ['Membership and potential fine conditions apply.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/recreation/sports/intramurals.html',
        'SFU Recreation — Intramurals',
        'Who can participate; memberships; team registration',
        ['summary', 'access', 'eligibility', 'cost', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'fitness-programs',
    title: 'Fitness, yoga, dance and Trial Week',
    category: 'recreation',
    topic: '07',
    summary:
      'Browse instructor-led classes, pass choices and any currently advertised trial sessions.',
    provider: sfu('SFU Recreation'),
    audiences: ['All students'],
    campuses: ['Burnaby'],
    access: [
      'Review the current class schedule and purchase the appropriate pass or daily admission.',
      'Reservations are recommended; check each class’s access rules.',
    ],
    eligibility: [
      'Programs welcome different fitness levels; class, pass and waiver requirements apply.',
    ],
    cost: {
      status: 'published',
      details:
        'Regular fitness programs use paid passes or daily admission. Trial Week applies only to the advertised sessions and dates.',
    },
    details: [
      {
        heading: 'Trial Week',
        body: 'The reviewed Fall 2026 trial dates have passed. No Spring 2027 trial schedule was visible on the reviewed Trial Week page; check the official page for a new announcement.',
      },
    ],
    verification: reviewed,
    reviewCadence: 'schedule',
    highImpact: false,
    aliases: ['瑜伽', '舞蹈', 'pilates', 'trial week'],
    poster: {
      title: 'Find a fitness class',
      facts: [
        'Explore yoga, dance, Pilates and group fitness.',
        'Choose a pass and check the current schedule.',
        'Reserve a place when recommended.',
      ],
      conditions: ['Fees and access rules vary; past Trial Week dates are not current offers.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/recreation/instructional-programs/fitness-programs.html',
        'SFU Recreation — Fitness Programs',
        'Move passes; weekly classes; registration and drop-in',
        ['summary', 'access', 'eligibility', 'cost', 'poster'],
      ),
      source(
        'https://www.sfu.ca/recreation/instructional-programs/trial-week.html',
        'SFU Recreation — Trial Week',
        'Fall 2026 trial sessions and registration guidance',
        ['details.0', 'cost', 'poster.conditions'],
      ),
    ],
  }),
  defineResource({
    id: 'sport-clubs',
    title: 'Student sport clubs',
    category: 'recreation',
    topic: '07',
    summary: 'Find student-led clubs with competitive, recreational or instructional activities.',
    provider: sfu('SFU Recreation'),
    audiences: ['All students'],
    campuses: ['Burnaby'],
    access: ['Use the official club directory and contact the club about current participation.'],
    eligibility: ['Tryouts, membership and participation requirements differ by club.'],
    cost: { status: 'unknown', details: 'Ask the club about current dues and activity costs.' },
    verification: reviewed,
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['体育社团', 'badminton club', 'rowing', 'fencing'],
    poster: {
      title: 'Find a sport club',
      facts: [
        'Browse SFU Recreation’s student-led club directory.',
        'Ask the club about practices, tryouts and membership.',
      ],
      conditions: ['Club availability, fees and requirements vary.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/recreation/facility/SportsClubs.html',
        'SFU Recreation — Sports Clubs',
        'Student-led clubs introduction and current club directory',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'recreation-equipment-courts',
    title: 'Court reservations and sports equipment',
    category: 'recreation',
    topic: '07',
    summary: 'Find court-reservation access and equipment lending through Recreation.',
    provider: sfu('SFU Recreation'),
    audiences: ['All students'],
    campuses: ['Burnaby'],
    access: [
      'Use Recreation’s court-reservation link for current availability and booking conditions.',
      'Ask the Recreation Sports Office about equipment lending and bring identification.',
    ],
    eligibility: [
      'Court access depends on the applicable membership and booking rules. Equipment lending requires ID.',
    ],
    locations: [
      {
        campus: 'Burnaby',
        name: 'Recreation Sports Office, Lorne Davies Complex Central Gym lobby',
      },
    ],
    cost: {
      status: 'unknown',
      details: 'Confirm any booking or equipment charges with Recreation.',
    },
    details: [
      {
        heading: 'Between terms',
        body: 'The Sports Office equipment service is closed between semesters. Check current operation before making a trip.',
      },
    ],
    verification: partial(
      'Equipment guidance reviewed; the reservation portal’s detailed booking conditions were not accessible without entering its booking workflow.',
    ),
    reviewCadence: 'schedule',
    highImpact: false,
    aliases: ['球场预约', '借球', 'racquet', 'squash', 'tennis'],
    poster: {
      title: 'Book a court or borrow equipment',
      facts: [
        'Open Recreation’s current court reservations.',
        'Bring ID when borrowing sports equipment.',
      ],
      conditions: ['Check membership rules, charges and between-term closures.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/recreation.html',
        'SFU Recreation',
        'Registration shortcuts — court reservations',
        ['summary', 'access.0', 'poster.facts.0'],
      ),
      source(
        'https://www.sfu.ca/recreation/sports.html',
        'SFU Recreation — Sports',
        'Equipment lending and Sports Office location',
        [
          'access.1',
          'eligibility',
          'locations',
          'details.0',
          'poster.facts.1',
          'poster.conditions',
        ],
      ),
    ],
  }),
  defineResource({
    id: 'recreation-lockers-refunds',
    title: 'Recreation lockers, fees and refunds',
    category: 'recreation',
    topic: '07',
    summary:
      'Check locker rentals and the cancellation or refund conditions attached to a recreation purchase.',
    provider: sfu('SFU Recreation'),
    audiences: ['All students'],
    campuses: ['Burnaby', 'Surrey', 'Online'],
    access: [
      'Choose gym or book-locker information and review rental terms.',
      'Check the refund policy for the exact membership, program or pass before purchasing or cancelling.',
    ],
    eligibility: [
      'Book lockers are offered to active SFU students, staff and faculty. Refund eligibility differs by purchase type.',
    ],
    cost: {
      status: 'published',
      details:
        'Locker rentals and recreation purchases have applicable charges. Administration charges and non-refundable items may apply; the tuition-assessed Recreation & Athletics fee is not refundable under the Recreation purchase policy.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['储物柜', '退款', 'locker rental', 'cancellation'],
    poster: {
      title: 'Check before renting or cancelling',
      facts: [
        'Review the locker rental terms before choosing a locker.',
        'Use the refund policy for your exact purchase type.',
      ],
      conditions: ['Charges, deadlines and non-refundable items differ.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/recreation/info/locker-rentals.html',
        'SFU Recreation — Locker Rentals',
        'Gym and book locker eligibility; rental and renewal guidance',
        ['summary', 'access.0', 'eligibility', 'poster.facts.0'],
      ),
      source(
        'https://www.sfu.ca/recreation/info/refund-policy.html',
        'SFU Recreation — Refund Policy',
        'Memberships; program cancellations; non-refundable passes and assessed fees',
        ['access.1', 'eligibility', 'cost', 'poster.facts.1', 'poster.conditions'],
      ),
    ],
  }),
  defineResource({
    id: 'health-medical',
    title: 'Health & Counselling medical appointments',
    category: 'health',
    topic: '09',
    summary:
      'Book an SFU medical appointment or ask which service and appointment format fits your needs.',
    provider: sfu('SFU Health & Counselling'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: all,
    access: [
      'Contact Health & Counselling to ask about in-person, phone or virtual appointments.',
      'Review cancellation requirements when booking.',
    ],
    eligibility: [
      'Medical appointments are for students currently enrolled in SFU classes. Appointment availability varies.',
    ],
    locations: [
      { campus: 'Burnaby', name: 'Health & Counselling medical clinic' },
      { campus: 'Vancouver', name: 'Health & Counselling medical clinic' },
    ],
    cost: {
      status: 'unknown',
      details:
        'Ask the clinic about the service and your insurance coverage. Cancellation or no-show charges can apply.',
    },
    details: [
      {
        heading: 'Campus and referrals',
        body: 'Medical care is offered at Burnaby and Vancouver; Surrey offers counselling only. A clinician can assess needs and arrange appropriate referrals.',
      },
    ],
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['看医生', '医疗', 'HCS', 'clinic', 'medical referral'],
    relatedIds: ['insurance', 'counselling', 'myssp'],
    poster: {
      title: 'Book a medical appointment',
      facts: [
        'Currently enrolled SFU students can contact Health & Counselling.',
        'Medical clinics: Burnaby and Vancouver.',
        'Ask about available appointment formats and insurance.',
      ],
      conditions: ['Availability varies; cancellation and no-show conditions apply.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/health/see-a-doctor.html',
        'SFU Health & Counselling — See a Doctor',
        'Eligibility; appointment formats; clinical services and referrals',
        ['summary', 'access.0', 'eligibility', 'locations', 'details.0', 'poster.facts'],
      ),
      source(
        'https://www.sfu.ca/students/health.html',
        'SFU Health & Counselling',
        'Campus services and cancellation policy',
        ['access.1', 'cost', 'details.0', 'poster.conditions'],
      ),
    ],
  }),
  defineResource({
    id: 'counselling',
    title: 'Counselling and intake appointments',
    category: 'health',
    topic: '09',
    summary:
      'Ask Health & Counselling about confidential counselling, an initial assessment or community referrals.',
    provider: sfu('SFU Health & Counselling'),
    audiences: ['Undergraduate', 'Graduate', 'FIC'],
    campuses: all,
    access: [
      'Contact the clinic to book an initial or rapid-access counselling appointment.',
      'Discuss follow-up support or a community referral with the clinician.',
    ],
    eligibility: [
      'For SFU and FIC students enrolled in the current term; counselling is time-limited.',
    ],
    cost: {
      status: 'published',
      details:
        'SFU counselling is free for eligible enrolled SFU/FIC students. Ask about cancellation conditions; external services can have different costs.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['心理咨询', 'counseling', 'mental health'],
    relatedIds: ['myssp', 'wellbeing-groups-self-help'],
    poster: {
      title: 'Connect with counselling',
      facts: [
        'Confidential, time-limited support for currently enrolled SFU/FIC students.',
        'Contact Health & Counselling for an intake appointment.',
      ],
      conditions: ['Eligible counselling is free; availability and cancellation conditions apply.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/health/support-resources/counselling-services.html',
        'SFU Health & Counselling — Counselling Services',
        'Who can use counselling; initial appointments; time-limited support; referrals',
        ['summary', 'access', 'eligibility', 'cost', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'myssp',
    title: 'MySSP: 24/7 student support',
    category: 'health',
    topic: '09',
    summary:
      'Reach confidential phone or chat counselling through MySSP and the TELUS Health Student Support app.',
    provider: { name: 'TELUS Health Student Support through SFU', type: 'external-official' },
    audiences: ['Undergraduate', 'Graduate', 'FIC'],
    campuses: all,
    access: [
      'Follow the SFU MySSP page to phone/chat support or the TELUS Health Student Support app.',
      'Select Simon Fraser University in the app.',
    ],
    eligibility: [
      'SFU and FIC students can use the service; request language preferences through the provider.',
    ],
    cost: {
      status: 'published',
      details:
        'The support service is free for SFU/FIC students; phone or data charges may depend on your carrier and location.',
    },
    hours: 'Phone/chat support is available 24/7; scheduled counselling availability differs.',
    verification: reviewed,
    reviewCadence: 'safety',
    highImpact: true,
    aliases: ['My SSP', 'TELUS', '心理支持', '24小时'],
    poster: {
      title: 'MySSP student support',
      facts: [
        'Free confidential support for SFU and FIC students.',
        'Phone or chat support is available 24/7.',
        'Use the TELUS Health Student Support app and select SFU.',
      ],
      conditions: ['Carrier charges may apply; appointment and language availability vary.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/wellbeing-services/myssp.html',
        'SFU — My Student Support Program (MySSP)',
        '24/7 support; access the app; SFU/FIC eligibility; international use',
        ['summary', 'provider', 'access', 'eligibility', 'cost', 'hours', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'wellbeing-groups-self-help',
    title: 'Wellbeing groups and self-led resources',
    category: 'health',
    topic: '09',
    summary:
      'Explore support groups and self-paced wellbeing resources without choosing a diagnosis.',
    provider: sfu('SFU Health & Counselling'),
    audiences: ['All students'],
    campuses: all,
    access: [
      'Browse current groups and follow the listed sign-up, drop-in or referral process.',
      'Use the self-led directory for videos, audio and other learning resources.',
    ],
    eligibility: ['Each group has its own audience, availability and participation conditions.'],
    cost: {
      status: 'unknown',
      details:
        'Check the specific group or external tool; the directory does not establish that every linked service is free.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['自助资源', 'support group', 'mindfulness', 'stress'],
    relatedIds: ['counselling', 'myssp'],
    poster: {
      title: 'Explore wellbeing support',
      facts: [
        'Find current group-support options.',
        'Browse self-paced videos, audio and learning resources.',
      ],
      conditions: ['Group access varies; resources do not replace individual clinical advice.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/health/support-resources/group-support.html',
        'SFU Health & Counselling — Group Support',
        'Group directory and participation methods',
        ['summary', 'access.0', 'eligibility', 'poster.facts.0', 'poster.conditions'],
      ),
      source(
        'https://www.sfu.ca/students/health/support-resources/self-led.html',
        'SFU Health & Counselling — Self-Led Resources',
        'Self-led resource categories and external tools',
        ['access.1', 'poster.facts.1'],
      ),
    ],
  }),
  defineResource({
    id: 'sexual-health',
    title: 'Sexual-health appointments',
    category: 'health',
    topic: '09',
    summary:
      'Ask an SFU clinician about sexual-health appointments, testing and appropriate referrals.',
    provider: sfu('SFU Health & Counselling'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Burnaby', 'Vancouver', 'Online'],
    access: [
      'Contact Health & Counselling to discuss an appointment and whether an in-person or external laboratory visit is needed.',
    ],
    eligibility: [
      'Medical-service eligibility applies to students currently enrolled in SFU classes.',
    ],
    cost: {
      status: 'unknown',
      details: 'Confirm fees and coverage with the clinic or testing provider.',
    },
    details: [
      {
        heading: 'Testing arrangements',
        body: 'Some testing needs an in-person visit or an external laboratory. SFU clinics do not take blood samples.',
      },
    ],
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['性健康', 'STI testing', 'contraception'],
    relatedIds: ['health-medical', 'insurance'],
    poster: {
      title: 'Sexual-health support',
      facts: [
        'Ask Health & Counselling about appointments and testing.',
        'Some services require an in-person or external laboratory visit.',
      ],
      conditions: ['Enrolment, availability and insurance conditions apply.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/health/see-a-doctor/sexual-health.html',
        'SFU Health & Counselling — Sexual Health',
        'Appointments and testing; laboratory arrangements',
        ['summary', 'access', 'details.0', 'poster.facts'],
      ),
      source(
        'https://www.sfu.ca/students/health/see-a-doctor.html',
        'SFU Health & Counselling — See a Doctor',
        'Current enrolment eligibility and locations',
        ['eligibility', 'campuses', 'poster.conditions'],
      ),
    ],
  }),
  defineResource({
    id: 'vaccinations',
    title: 'Vaccination enquiries',
    category: 'health',
    topic: '09',
    summary:
      'Ask Health & Counselling which vaccines are currently offered and what coverage or fees apply.',
    provider: sfu('SFU Health & Counselling'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Burnaby', 'Vancouver', 'Online'],
    access: ['Contact the clinic before booking to confirm the vaccine, availability and cost.'],
    eligibility: ['Medical-service eligibility applies; a clinician determines appropriate care.'],
    cost: {
      status: 'unknown',
      details:
        'Vaccine fees and insurance coverage vary. Older seasonal prices have not been republished here.',
    },
    verification: partial(
      'The service page describes some nurse-administered vaccines, but includes 2025 influenza pricing. Current seasonal stock and prices were not confirmed.',
    ),
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['疫苗', 'flu shot', 'immunization'],
    relatedIds: ['health-medical', 'insurance'],
    poster: {
      title: 'Ask about vaccinations',
      facts: [
        'Contact Health & Counselling about currently offered vaccines.',
        'Confirm availability, fees and insurance before booking.',
      ],
      conditions: ['Current seasonal availability is not confirmed in this directory.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/health/see-a-doctor/vaccines.html',
        'SFU Health & Counselling — Vaccines',
        'Nurse appointments; vaccine-specific availability and fees; dated influenza section',
        ['summary', 'access', 'cost', 'verification.note', 'poster'],
      ),
      source(
        'https://www.sfu.ca/students/health/see-a-doctor.html',
        'SFU Health & Counselling — See a Doctor',
        'Medical appointment eligibility',
        ['eligibility', 'campuses'],
      ),
    ],
  }),
  defineResource({
    id: 'gender-affirming-care',
    title: 'Gender-affirming care navigation',
    category: 'health',
    topic: '09',
    summary: 'Talk with Health & Counselling about gender-affirming care questions and referrals.',
    provider: sfu('SFU Health & Counselling'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Burnaby', 'Vancouver', 'Online'],
    access: ['Ask Health & Counselling for a clinical appointment or referral discussion.'],
    eligibility: [
      'Medical-service eligibility applies to currently enrolled SFU students. Care options are discussed individually with a clinician.',
    ],
    cost: {
      status: 'unknown',
      details: 'Ask the clinic and any referral provider about coverage and charges.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['性别肯定', 'gender affirming', 'trans health'],
    relatedIds: ['health-medical', 'out-on-campus'],
    poster: {
      title: 'Gender-affirming care questions',
      facts: [
        'SFU clinicians can discuss care options and referrals.',
        'Contact Health & Counselling to arrange an appointment.',
      ],
      conditions: ['Individual care, eligibility and coverage require provider advice.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/health/see-a-doctor/gender-affirming-care.html',
        'SFU Health & Counselling — Gender-Affirming Care',
        'Support from doctors and nurses; referral information',
        ['summary', 'access', 'poster.facts'],
      ),
      source(
        'https://www.sfu.ca/students/health/see-a-doctor.html',
        'SFU Health & Counselling — See a Doctor',
        'Current enrolment eligibility and medical appointments',
        ['eligibility', 'campuses', 'poster.conditions'],
      ),
    ],
  }),
  defineResource({
    id: 'accessible-learning-registration',
    title: 'Register with the Centre for Accessible Learning',
    category: 'accessibility',
    topic: '10',
    summary:
      'Start a conversation about disability-related academic accommodations and required documentation.',
    provider: sfu('SFU Centre for Accessible Learning (CAL)'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: all,
    access: [
      'Complete the CAL application and review documentation guidance.',
      'Arrange an intake appointment with a Disability Access Advisor.',
      'Registration and exam-booking deadlines apply; check CAL before submitting.',
    ],
    eligibility: [
      'Enrolled SFU students with a documented or suspected disability can contact CAL. Accommodations are determined individually.',
    ],
    cost: {
      status: 'unknown',
      details:
        'Ask CAL about the process; external assessments or documentation may have separate costs.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['无障碍学习', '残障支持', 'CAL', 'accommodations'],
    relatedIds: ['accessible-learning-renewal-exams', 'accessible-learning-tools'],
    poster: {
      title: 'Connect with CAL',
      facts: [
        'Ask about disability-related academic accommodations.',
        'Review documentation and arrange an intake appointment.',
      ],
      conditions: [
        'Accommodations are determined individually. Registration and exam-booking deadlines apply; check CAL before submitting.',
      ],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/accessible-learning/establishing-accommodations.html',
        'SFU CAL — Registering with CAL',
        'Application, documentation, intake and individualized accommodations',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'accessible-learning-renewal-exams',
    title: 'Renew accommodations and arrange exams',
    category: 'accessibility',
    topic: '10',
    summary:
      'Renew approved accommodations for the term and complete the separate test or exam booking process.',
    provider: sfu('SFU Centre for Accessible Learning (CAL)'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: all,
    access: [
      'Use online renewal if your Disability Access Advisor has authorized it.',
      'After accommodations are established or renewed, follow the current test/exam booking instructions and deadlines.',
    ],
    eligibility: [
      'For students with CAL-approved accommodations. Changes to accommodations require an advisor appointment rather than the renewal module.',
    ],
    cost: { status: 'unknown' },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['考试安排', '续期', 'exam accommodations'],
    relatedIds: ['accessible-learning-registration'],
    poster: {
      title: 'Plan accommodation renewals',
      facts: [
        'Renew approved accommodations for the current term.',
        'Book tests/exams separately by CAL’s deadlines.',
      ],
      conditions: ['Changes require an advisor appointment; online renewal needs authorization.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/accessible-learning/utilizing-accommodations/online-accommodations-renewal.html',
        'SFU CAL — Online Accommodations Renewal',
        'Eligibility for online renewal; changes to accommodations',
        ['summary', 'access.0', 'eligibility', 'poster.facts.0', 'poster.conditions'],
      ),
      source(
        'https://www.sfu.ca/students/accessible-learning/utilizing-accommodations/online-test-exam-booking-for-students.html',
        'SFU CAL — Students: Online Test/Exam Booking',
        'Before booking; current-semester accommodations; booking deadlines',
        ['access.1', 'poster.facts.1'],
      ),
    ],
  }),
  defineResource({
    id: 'accessible-learning-tools',
    title: 'Note-taking and accessible campus support',
    category: 'accessibility',
    topic: '10',
    summary:
      'Ask CAL about note-taking barriers, accessibility resources and physical-access concerns.',
    provider: sfu('SFU Centre for Accessible Learning (CAL)'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: all,
    access: [
      'Ask a CAL advisor about note-taking support and suitable alternatives.',
      'Use the Physical Access directory for access guides, classroom relocation and reporting a barrier.',
    ],
    eligibility: [
      'Volunteer note-taking support is considered when a disability prevents taking notes and suitable alternatives are unavailable. Physical-access guidance is available to campus visitors too.',
    ],
    cost: {
      status: 'unknown',
      details: 'Confirm any external equipment or service charges with the provider.',
    },
    details: [
      {
        heading: 'Assistive technology',
        body: 'Ask CAL for an appropriate assistive-technology referral. Specific equipment entitlement and library borrowing rules have not been confirmed in this record.',
      },
    ],
    verification: partial(
      'Note-taking and physical-access guidance reviewed. Specific assistive-technology provision remains unverified; use CAL for a referral.',
    ),
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['记笔记支持', '辅助技术', 'accessible spaces'],
    relatedIds: ['accessible-learning-registration', 'accessible-residence'],
    poster: {
      title: 'Ask about access support',
      facts: [
        'CAL can discuss note-taking barriers and alternatives.',
        'Find physical-access guides and barrier-reporting routes.',
      ],
      conditions: [
        'Support is assessed individually; specific equipment access is not confirmed here.',
      ],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/accessible-learning/programs-and-services/notetaking.html',
        'SFU CAL — Note-Taking Program',
        'Eligibility and alternatives before volunteer note-taking',
        ['summary', 'access.0', 'eligibility', 'poster.facts.0'],
      ),
      source(
        'https://www.sfu.ca/students/accessible-learning/programs-and-services/physicalaccess.html',
        'SFU CAL — Physical Access',
        'Physical access introduction and guidance links',
        ['access.1', 'eligibility', 'poster.facts.1'],
      ),
    ],
  }),
  defineResource({
    id: 'indigenous-student-centre',
    title: 'Indigenous Student Centre',
    category: 'accessibility',
    topic: '10',
    summary: 'Connect with Indigenous student support, cultural programming and community at SFU.',
    provider: sfu('SFU Indigenous Student Centre'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: all,
    access: ['Use the centre’s service directory to contact staff or explore current programs.'],
    eligibility: [
      'Services support Indigenous undergraduate and graduate students; individual programs may have additional conditions.',
    ],
    cost: { status: 'unknown', details: 'Confirm any program-specific costs with the centre.' },
    details: [
      {
        heading: 'Support pathways',
        body: 'The centre links academic support, cultural programming, Elders, counselling and the Peer Cousins mentorship program. Check current program availability directly.',
      },
    ],
    verification: reviewed,
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['原住民学生', 'ISC', 'Peer Cousins'],
    poster: {
      title: 'Indigenous Student Centre',
      facts: [
        'Support for Indigenous undergraduate and graduate students.',
        'Explore academic, cultural and community programs.',
      ],
      conditions: ['Check individual program access and availability with the centre.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/indigenous.html',
        'SFU Indigenous Student Centre',
        'Student support introduction and program directory',
        ['summary', 'access', 'eligibility', 'details.0', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'black-student-centre',
    title: 'Black Student Centre',
    category: 'accessibility',
    topic: '10',
    summary:
      'Find community and academic, wellbeing and professional support for Black-identifying students.',
    provider: sfu('SFU Black Student Centre'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Burnaby', 'Online'],
    access: ['Connect with the centre for current in-person or virtual support and programs.'],
    eligibility: ['For Black-identifying SFU undergraduate and graduate students.'],
    locations: [{ campus: 'Burnaby', name: 'Maggie Benston Centre' }],
    cost: { status: 'unknown' },
    verification: reviewed,
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['黑人学生中心', 'BSC'],
    poster: {
      title: 'Black Student Centre',
      facts: [
        'Community and support for Black-identifying SFU students.',
        'Connect through in-person or virtual services.',
      ],
      conditions: ['Contact the centre for current program availability.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/black-student-centre.html',
        'SFU Black Student Centre',
        'Who we serve; support areas; in-person and virtual services',
        ['summary', 'provider', 'access', 'eligibility', 'locations', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'global-student-centre',
    title: 'Global Student Centre',
    category: 'accessibility',
    topic: '10',
    summary:
      'Find an intercultural student lounge, events and connections with international student support.',
    provider: sfu('SFU International Services for Students'),
    audiences: ['All students', 'International'],
    campuses: ['Burnaby'],
    locations: [{ campus: 'Burnaby', name: 'Academic Quadrangle, AQ 2013' }],
    access: ['Check the current term’s lounge hours and events on the centre page.'],
    eligibility: [
      'A space for international students and intercultural connections; service and event requirements vary.',
    ],
    cost: { status: 'unknown' },
    verification: reviewed,
    reviewCadence: 'schedule',
    highImpact: false,
    aliases: ['国际学生中心', 'GSC'],
    relatedIds: ['iss', 'international-advising'],
    poster: {
      title: 'Visit the Global Student Centre',
      facts: [
        'Find the lounge at Burnaby AQ 2013.',
        'Explore intercultural events and student connections.',
      ],
      conditions: ['Check the current term’s hours before visiting.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/isap/gsc.html',
        'SFU — Global Student Centre',
        'About the GSC; location; Fall 2026 hours and advising connections',
        ['summary', 'access', 'eligibility', 'locations', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'multifaith-centre',
    title: 'Multifaith Centre and prayer spaces',
    category: 'accessibility',
    topic: '10',
    summary:
      'Explore faith communities, chaplain connections and prayer-space information across campuses.',
    provider: sfu('SFU Multifaith Centre'),
    audiences: ['All students'],
    campuses: all,
    access: ['Use the Multifaith directory to find a chaplain, community or campus prayer space.'],
    eligibility: [
      'The centre serves students, staff and faculty; check specific space and event conditions.',
    ],
    cost: { status: 'unknown' },
    verification: reviewed,
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['多信仰中心', 'prayer room', '宗教'],
    poster: {
      title: 'Multifaith connections',
      facts: [
        'Find faith communities and chaplain contacts.',
        'Locate prayer-space information for all three campuses.',
      ],
      conditions: ['Check each space’s current access arrangements.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/multifaith.html',
        'SFU Multifaith Centre',
        'Centre services; chaplains; prayer spaces across three campuses',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'womens-centre',
    title: 'SFSS Women’s Centre',
    category: 'accessibility',
    topic: '10',
    summary:
      'Find peer support, resources and a community space with distinct access rules for its areas.',
    provider: society('Simon Fraser Student Society (SFSS), with GSS funding'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Burnaby'],
    access: ['Visit the centre’s current service page and check which space meets your needs.'],
    eligibility: [
      'The resource area welcomes all genders. The lounge is for women, including trans and intersex women, and non-binary people who feel it is appropriate for them.',
    ],
    cost: {
      status: 'published',
      details:
        'The centre lists free library and period/safer-sex supplies; supplies and other support depend on availability.',
    },
    verification: reviewed,
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['妇女中心', 'women support', 'period supplies'],
    poster: {
      title: 'SFSS Women’s Centre',
      facts: [
        'Explore peer support and community resources.',
        'The resource area welcomes all genders.',
      ],
      conditions: [
        'The lounge has distinct access guidelines; check availability of supplies and services.',
      ],
      mode: 'facts',
    },
    sources: [
      source(
        'https://sfss.ca/wctr/',
        'SFSS — Women’s Centre',
        'Our spaces; services and resources; provider and funding',
        ['summary', 'provider', 'access', 'eligibility', 'cost', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'out-on-campus',
    title: 'Out on Campus',
    category: 'accessibility',
    topic: '10',
    summary: 'Connect with the SFSS department supporting 2SLGBTQIA+ students and allies.',
    provider: society('Simon Fraser Student Society (SFSS), with GSS funding'),
    audiences: ['Undergraduate', 'Graduate', 'FIC'],
    campuses: ['Burnaby', 'Online'],
    access: ['Check current online and in-person programs, peer support and resource access.'],
    eligibility: [
      'Visitors must follow safer-space guidelines. Individual services can have specific eligibility, including garment support for SFU/FIC students.',
    ],
    cost: {
      status: 'published',
      details:
        'Some supplies and gender-affirming garments are offered free; check eligibility and availability for the specific service.',
    },
    verification: reviewed,
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['OOC', 'LGBTQ', '酷儿支持'],
    relatedIds: ['gender-affirming-care'],
    poster: {
      title: 'Connect with Out on Campus',
      facts: [
        'Support and resources for 2SLGBTQIA+ students and allies.',
        'Find current peer support and community programs.',
      ],
      conditions: ['Safer-space guidelines and service-specific eligibility apply.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://sfss.ca/ooc/',
        'SFSS — Out on Campus',
        'Department introduction; services; safer spaces; gender-affirming garments',
        ['summary', 'provider', 'access', 'eligibility', 'cost', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'iss',
    title: 'International student welcome and support',
    category: 'international',
    topic: '11',
    summary:
      'Choose the welcome pathway that matches your arrival route and find international student support.',
    provider: sfu('SFU International Services for Students'),
    audiences: ['International', 'Exchange', 'Visiting', 'Undergraduate', 'Graduate'],
    campuses: all,
    access: [
      'Open the welcome guide for your student pathway and review its before/after-arrival checklist.',
      'Find current orientation, advising and student-experience support through ISS.',
    ],
    eligibility: [
      'Guides differ for new undergraduate, graduate, transfer, exchange/study-abroad and refugee/newcomer students.',
    ],
    cost: {
      status: 'unknown',
      details: 'Check individual events and services for their conditions.',
    },
    verification: reviewed,
    reviewCadence: 'evergreen',
    highImpact: false,
    aliases: ['国际学生', 'ISS', 'ISAP', '新生指南', 'orientation'],
    relatedIds: ['international-advising', 'global-student-centre', 'immigration', 'insurance'],
    poster: {
      title: 'Start with your welcome guide',
      facts: [
        'Choose the guide for your student and arrival pathway.',
        'Find current orientation and international student support.',
      ],
      conditions: ['Requirements differ by student pathway.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/iss.html',
        'SFU — International Services for Students',
        'International support, advising and student-experience directory',
        ['summary', 'provider', 'access.1', 'poster.facts.1'],
      ),
      source(
        'https://www.sfu.ca/students/isap/welcome.html',
        'SFU — Welcome Guides for New International Students',
        'Student pathway selectors and pre/post-arrival guides',
        ['access.0', 'eligibility', 'poster.facts.0', 'poster.conditions'],
      ),
    ],
  }),
  defineResource({
    id: 'international-advising',
    title: 'International student advising',
    category: 'international',
    topic: '11',
    summary:
      'Contact qualified international student advisors about immigration, insurance and settling into SFU.',
    provider: sfu('SFU International Services for Students'),
    audiences: ['International', 'Exchange', 'Visiting'],
    campuses: all,
    access: [
      'Use the current contact page for email, drop-in and appointment options.',
      'Choose the appropriate appointment format and review the current calendar.',
    ],
    eligibility: [
      'For international student matters. Academic course/degree advising and permanent-residence applications require other appropriate services.',
    ],
    cost: { status: 'unknown' },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['国际学生顾问', 'immigration advisor', 'insurance advice'],
    relatedIds: ['iss', 'immigration', 'insurance'],
    poster: {
      title: 'Ask an international student advisor',
      facts: [
        'Get guidance on immigration, insurance and student transition.',
        'Find current email, drop-in and appointment access.',
      ],
      conditions: [
        'Academic advising and permanent-residence applications are outside this service’s scope.',
      ],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/isap/contact.html',
        'SFU — Contact International Student Advisors',
        'Advising scope; appointment and drop-in options; matters outside scope',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'immigration',
    title: 'Study permits, enrolment and travel guidance',
    category: 'international',
    topic: '11',
    summary:
      'Use official guidance and an international student advisor before decisions that could affect immigration status.',
    provider: sfu('SFU International Services for Students'),
    audiences: ['International', 'Exchange', 'Visiting'],
    campuses: all,
    access: [
      'Find the relevant official study-permit, visa or document pathway.',
      'Ask an advisor about enrolment changes, a term away, travel or returning to Canada.',
    ],
    eligibility: [
      'Rules depend on personal circumstances, documents and current policy. This directory does not determine immigration compliance.',
    ],
    cost: {
      status: 'unknown',
      details: 'Government application fees and other costs depend on the relevant application.',
    },
    details: [
      {
        heading: 'Enrolment and travel',
        body: 'SFU provides separate enrolment-requirement and trip-planning guidance. Follow current official instructions and consult an advisor before acting.',
      },
    ],
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['学签', '签证', 'study permit', 'TRV', 'return to Canada', '休学'],
    relatedIds: ['international-advising', 'international-employment'],
    poster: {
      title: 'Find official immigration guidance',
      facts: [
        'Use current study-permit, visa and document guidance.',
        'Ask an advisor before enrolment or travel decisions.',
      ],
      conditions: ['Individual immigration advice is required; rules can change.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/isap/explore/after.html',
        'SFU — Immigration Documents',
        'Study-permit extensions; temporary resident visas; document pathways',
        ['summary', 'access.0', 'eligibility', 'poster.facts.0', 'poster.conditions'],
      ),
      source(
        'https://www.sfu.ca/students/isap/explore/enrolment.html',
        'SFU — Enrolment Requirements',
        'Enrolment and immigration implications; contact an advisor',
        ['access.1', 'details.0', 'poster.facts.1'],
      ),
      source(
        'https://www.sfu.ca/students/isap/explore/tripplanning.html',
        'SFU — Planning Your Trip',
        'Travel to Canada and arrival planning directory',
        ['access.1', 'details.0'],
      ),
    ],
  }),
  defineResource({
    id: 'insurance',
    title: 'Medical, extended health and dental insurance',
    category: 'international',
    topic: '11',
    summary:
      'Choose your student pathway to find temporary, provincial and extended coverage information.',
    provider: sfu('SFU Medical Insurance information service'),
    audiences: ['Undergraduate', 'Graduate', 'International', 'Exchange', 'Visiting'],
    campuses: all,
    access: [
      'Select your student type in the SFU medical-insurance guide.',
      'Review the applicable provider’s enrolment, claims and opt-in/opt-out instructions before relying on coverage.',
    ],
    eligibility: [
      'Temporary guard.me, provincial MSP and SFSS/GSS extended plans have different conditions. Employment benefits may introduce another pathway.',
    ],
    cost: {
      status: 'unknown',
      details:
        'Premiums, covered services and out-of-pocket costs depend on the plan and individual eligibility; no personal coverage determination is made here.',
    },
    details: [
      {
        heading: 'Different providers',
        body: 'SFU’s guides distinguish temporary guard.me coverage, provincial MSP and student-society extended health/dental plans. Current plan administration links use Alumo; use the SFU pathway to reach the appropriate plan.',
      },
      {
        heading: 'Claims and medical care',
        body: 'Check policy dates, proof of coverage and the provider’s claim procedure. Ask the clinic and insurer about charges before a non-urgent service.',
      },
    ],
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: [
      '医保',
      '保险',
      'MSP',
      'guard.me',
      'guardme',
      'Alumo',
      'Studentcare',
      'dental',
      'opt out',
    ],
    relatedIds: ['health-medical', 'international-advising'],
    poster: {
      title: 'Check your insurance pathway',
      facts: [
        'Choose your student type in SFU’s insurance guide.',
        'Temporary, provincial and extended plans have different rules.',
        'Check claims and opt-in/opt-out instructions with the provider.',
      ],
      conditions: ['Coverage, fees and deadlines depend on the plan and your circumstances.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/medical-insurance.html',
        'SFU — Medical Insurance',
        'Student-type pathways',
        ['summary', 'access.0', 'audiences', 'poster.facts.0'],
      ),
      source(
        'https://www.sfu.ca/students/isap/explore/medical/medical.html',
        'SFU — Medical Services and Insurance',
        'Primary and secondary coverage; medical care; employment benefits',
        ['eligibility', 'details.1', 'poster.facts.1'],
      ),
      source(
        'https://www.sfu.ca/medical-insurance/international-us-students.html',
        'SFU — International Undergraduate Medical Insurance',
        'guard.me; MSP; extended insurance; claims and opt-out pathways',
        ['access.1', 'details.0', 'details.1', 'poster.facts.2', 'poster.conditions'],
      ),
      source(
        'https://alumo.ca/?lang=en',
        'Alumo — Student Plan Finder',
        'Institution and association plan selection',
        ['details.0'],
      ),
    ],
  }),
  defineResource({
    id: 'international-employment',
    title: 'International employment, Co-op and SIN guidance',
    category: 'international',
    topic: '11',
    summary:
      'Find official work, Co-op, post-graduation and Social Insurance Number guidance without assuming work eligibility.',
    provider: sfu('SFU International Services for Students'),
    audiences: ['International', 'Exchange', 'Visiting'],
    campuses: all,
    access: [
      'Choose the official on-campus, off-campus, Co-op or post-graduation employment pathway.',
      'Use SFU’s SIN guide to reach official application instructions and consult an advisor when unsure.',
    ],
    eligibility: [
      'Work eligibility is separate from having a Social Insurance Number and depends on current rules and individual circumstances.',
    ],
    cost: {
      status: 'unknown',
      details: 'Confirm any application-related charges through the relevant official process.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['工签', '校外工作', 'SIN', 'social insurance number', 'PGWP'],
    relatedIds: ['international-advising', 'immigration'],
    poster: {
      title: 'Check international work guidance',
      facts: [
        'Choose the official employment pathway for your situation.',
        'A SIN alone does not establish permission to work.',
      ],
      conditions: ['Confirm current eligibility with official guidance or a qualified advisor.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/isap/explore/employment.html',
        'SFU — Employment for International Students',
        'On/off-campus work, Co-op, post-graduation and SIN pathways',
        ['summary', 'access.0', 'poster.facts.0', 'poster.conditions'],
      ),
      source(
        'https://www.sfu.ca/students/isap/explore/employment/apply-for-sin.html',
        'SFU — Apply for a Social Insurance Number',
        'SIN application guidance; SIN does not establish work eligibility',
        ['access.1', 'eligibility', 'poster.facts.1'],
      ),
    ],
  }),
  defineResource({
    id: 'international-family',
    title: 'International students with families',
    category: 'international',
    topic: '11',
    summary: 'Find family-related information on childcare, schooling and community support.',
    provider: sfu('SFU International Services for Students'),
    audiences: ['International', 'Undergraduate', 'Graduate'],
    campuses: all,
    access: [
      'Browse the family resource directory and ask ISAP about appropriate support or referral routes.',
    ],
    eligibility: [
      'For international students and accompanying families; each external service has its own conditions.',
    ],
    cost: {
      status: 'unknown',
      details:
        'Childcare, schooling and community-service costs depend on the provider and circumstances.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['家属', 'children', 'childcare', 'family support'],
    relatedIds: ['international-advising', 'residence-applications'],
    poster: {
      title: 'Find family support information',
      facts: [
        'Explore childcare, schooling and community resources.',
        'Ask ISAP about relevant family support pathways.',
      ],
      conditions: ['Provider eligibility, availability and costs vary.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/isap/explore/family.html',
        'SFU — For Families',
        'Childcare; public education; personal and social support; advisor contact',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'residence-applications',
    title: 'Residence applications and housing types',
    category: 'housing',
    topic: '14',
    summary:
      'Compare undergraduate, graduate and family housing pathways and start a residence application.',
    provider: sfu('SFU Residence and Housing'),
    audiences: ['Undergraduate', 'Graduate', 'FIC'],
    campuses: ['Burnaby', 'Vancouver', 'Online'],
    access: [
      'Choose the appropriate housing pathway and review its eligibility and priority criteria.',
      'Apply through the official housing portal.',
    ],
    eligibility: [
      'Housing type and priority depend on student status. Applications can be started before admission, but offers require admission; spaces are limited.',
    ],
    cost: {
      status: 'unknown',
      details: 'Application, housing and meal-plan charges depend on the building and term.',
    },
    details: [
      {
        heading: 'Housing choices',
        body: 'Undergraduate housing is at Burnaby. Graduate options include Burnaby and Vancouver; graduate/family housing has a separate Burnaby pathway.',
      },
      {
        heading: 'Meal plans',
        body: 'Meal-plan requirements differ by building. Check the chosen housing type and its contract.',
      },
    ],
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['宿舍申请', 'family housing', 'graduate housing', 'housing priority'],
    relatedIds: ['residence-offers-contracts', 'accessible-residence', 'dining-meal-plans'],
    poster: {
      title: 'Explore residence options',
      facts: [
        'Choose the undergraduate, graduate or family housing pathway.',
        'Review eligibility, priorities and term-specific fees before applying.',
      ],
      conditions: ['Spaces are limited; offers and meal-plan requirements depend on the pathway.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/residences/apply.html',
        'SFU Residence and Housing — Apply',
        'Application timing; housing types; admission and limited spaces; meal-plan differences',
        ['summary', 'access', 'eligibility', 'details', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'residence-offers-contracts',
    title: 'Residence offers, fees and contracts',
    category: 'housing',
    topic: '14',
    summary:
      'Review the offer, current term’s charges and the contract for your housing type before accepting.',
    provider: sfu('SFU Residence and Housing'),
    audiences: ['Undergraduate', 'Graduate', 'FIC'],
    campuses: ['Burnaby', 'Vancouver', 'Online'],
    access: [
      'In MyPlace@SFU, open the application and term to review the offer and acceptance steps.',
      'Read the applicable contract/handbook and fee schedule before confirming.',
      'Acceptance requires a non-refundable confirmation payment, applied toward residence term fees.',
    ],
    eligibility: [
      'For residence applicants receiving an offer. Requirements differ for undergraduate, graduate and family housing.',
    ],
    cost: {
      status: 'published',
      details:
        'Official term/building fee tables and offer-confirmation payments apply. Consult the correct table rather than a different term’s prices.',
    },
    details: [
      {
        heading: 'Current terms',
        body: 'The reviewed site publishes Fall 2026 and Spring 2027 fee pages and 2026–27 contract documents. This record links the documents without interpreting contract clauses.',
      },
    ],
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['住宿费', '宿舍合同', 'housing offer', 'MyPlace'],
    relatedIds: ['residence-applications', 'residence-moving'],
    poster: {
      title: 'Review your residence offer',
      facts: [
        'Open the correct term’s offer in MyPlace@SFU.',
        'Read your housing contract, handbook and fee schedule.',
      ],
      conditions: [
        'Acceptance steps and charges differ by term and housing type.',
        'The confirmation payment is non-refundable and applies toward residence term fees.',
      ],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/residences/apply/accepting-your-offer.html',
        'SFU Residence — Accepting Your Offer',
        'MyPlace acceptance steps; offer and confirmation requirements',
        ['summary', 'access.0', 'access.2', 'eligibility', 'poster.facts.0', 'poster.conditions'],
      ),
      source(
        'https://www.sfu.ca/students/residences/community/contract-handbook.html',
        'SFU Residence — Contracts and Handbooks',
        '2026–27 documents by housing type',
        ['access.1', 'details.0', 'poster.facts.1'],
      ),
      source(
        'https://www.sfu.ca/students/residences/fees.html',
        'SFU Residence — Fees',
        'Fall 2026 and Spring 2027 term selectors',
        ['cost', 'details.0'],
      ),
      source(
        'https://www.sfu.ca/students/residences/fees/spring.html',
        'SFU Residence — Spring 2027 Fees',
        'Spring 2027 heading; term and housing-type limitations',
        ['cost', 'details.0'],
      ),
    ],
  }),
  defineResource({
    id: 'residence-moving',
    title: 'Residence move-in, packing and move-out',
    category: 'housing',
    topic: '14',
    summary: 'Follow the move-in or move-out checklist for your term and housing type.',
    provider: sfu('SFU Residence and Housing'),
    audiences: ['Undergraduate', 'Graduate', 'FIC'],
    campuses: ['Burnaby', 'Vancouver', 'Online'],
    access: [
      'Check your term’s move-in instructions, book the required arrival appointment and review what to bring.',
      'Use the move-out guide for cleaning, key return, mail and room-condition steps.',
    ],
    eligibility: ['For residence occupants; family housing and FIC instructions can differ.'],
    cost: {
      status: 'unknown',
      details: 'Check the applicable contract for cleaning, late departure or other charges.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['搬入', '搬出', 'packing list', 'tenant insurance'],
    relatedIds: ['residence-offers-contracts', 'residence-daily-services'],
    poster: {
      title: 'Prepare for your residence move',
      facts: [
        'Use the checklist for your term and housing type.',
        'Check arrival booking, packing, insurance and key-return steps.',
      ],
      conditions: ['Follow the dates and charges in your own residence instructions.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/residences/moving-in.html',
        'SFU Residence — Moving In',
        'Term-specific move-in information; appointments; pre-arrival and packing links',
        ['summary', 'access.0', 'eligibility', 'poster.facts.0', 'poster.facts.1'],
      ),
      source(
        'https://www.sfu.ca/students/residences/community/moving-out.html',
        'SFU Residence — Moving Out',
        'Move-out steps; key return; term and family-housing differences',
        ['access.1', 'eligibility', 'cost', 'poster.conditions'],
      ),
    ],
  }),
  defineResource({
    id: 'residence-daily-services',
    title: 'Residence maintenance, mail, laundry and lockouts',
    category: 'housing',
    topic: '14',
    summary:
      'Find the right residence service for a maintenance issue, parcel, laundry question or lockout.',
    provider: sfu('SFU Residence and Housing'),
    audiences: ['Undergraduate', 'Graduate', 'FIC'],
    campuses: ['Burnaby', 'Vancouver', 'Online'],
    access: [
      'Submit routine maintenance through MyPlace@SFU; contact the residence office for urgent issues or lockout assistance.',
      'Choose your building’s mail instructions and review current laundry payment guidance.',
    ],
    eligibility: ['For current residents. Mail, laundry and office arrangements vary by building.'],
    cost: {
      status: 'published',
      details:
        'Laundry requires payment. Other charges depend on the issue and applicable residence rules.',
    },
    details: [
      {
        heading: 'Mail and parcels',
        body: 'Select Burnaby residence, graduate/family housing or Vancouver residence for the correct mailing instructions. Update correspondents when leaving; residence does not accept mail for former residents.',
      },
    ],
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['宿舍维修', '快递', '洗衣', '锁门', 'lockout'],
    poster: {
      title: 'Find residence help',
      facts: [
        'Use MyPlace for routine maintenance requests.',
        'Contact the residence office for urgent issues or lockouts.',
        'Follow your building’s mail and laundry instructions.',
      ],
      conditions: ['Current residents only; building arrangements and charges vary.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/residences/community/maintenance-services/maintenance-request.html',
        'SFU Residence — Maintenance Requests',
        'MyPlace routine requests and urgent issue contact route',
        ['summary', 'access.0', 'poster.facts.0', 'poster.facts.1'],
      ),
      source(
        'https://www.sfu.ca/students/residences/contact.html',
        'SFU Residence — Contact Us',
        'Burnaby and Vancouver offices; after-hours and lockout assistance',
        ['access.0', 'poster.facts.1'],
      ),
      source(
        'https://www.sfu.ca/students/residences/contact/mail-service.html',
        'SFU Residence — Mail Services',
        'Building selector; mailing tips; moving out',
        ['access.1', 'eligibility', 'details.0', 'poster.facts.2'],
      ),
      source(
        'https://www.sfu.ca/students/residences/community/maintenance-services/laundry.html',
        'SFU Residence — Laundry',
        'Laundry locations and payment options',
        ['access.1', 'eligibility', 'cost', 'poster.conditions'],
      ),
    ],
  }),
  defineResource({
    id: 'residence-room-changes',
    title: 'Request a residence room change',
    category: 'housing',
    topic: '14',
    summary: 'Learn how room-change requests are submitted and assessed during the term.',
    provider: sfu('SFU Residence and Housing'),
    audiences: ['Undergraduate', 'Graduate', 'FIC'],
    campuses: ['Burnaby', 'Vancouver', 'Online'],
    access: [
      'Use the room-switch instructions and the My Room area in MyPlace@SFU.',
      'Review the current request window before submitting.',
    ],
    eligibility: [
      'For current residents. Residence Life reviews requests; approval and space are not guaranteed.',
    ],
    cost: {
      status: 'unknown',
      details:
        'Confirm any applicable charges or contract implications with Residence and Housing.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['换房', 'room switch', 'roommate issue'],
    poster: {
      title: 'Ask about a room change',
      facts: [
        'Find the current room-switch process in MyPlace@SFU.',
        'Check the request window before applying.',
      ],
      conditions: ['Requests are reviewed; a move is not guaranteed.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/residences/community/room-switch.html',
        'SFU Residence — Room Switch',
        'Request process; timing; Residence Life review and availability',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'accessible-residence',
    title: 'Accessible residence accommodation requests',
    category: 'housing',
    topic: '14',
    summary:
      'Find the official process for requesting housing that addresses disability-related functional needs.',
    provider: sfu('SFU Residence and Housing, with CAL or FIC support'),
    audiences: ['Undergraduate', 'Graduate', 'FIC'],
    campuses: ['Burnaby', 'Vancouver', 'Online'],
    access: [
      'Indicate your needs through the residence application process and review the required documentation route.',
      'SFU students work with CAL; FIC students use their designated advisor process.',
    ],
    eligibility: [
      'Requests are assessed individually and depend on documentation, housing eligibility and availability.',
    ],
    cost: {
      status: 'unknown',
      details:
        'Review housing charges and offer conditions with Residence and Housing before accepting an offer.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['无障碍宿舍', 'accessible housing', 'housing accommodation'],
    relatedIds: ['accessible-learning-registration', 'residence-applications'],
    poster: {
      title: 'Request accessible housing support',
      facts: [
        'Follow the residence accommodation-request process.',
        'Use CAL for SFU students or the designated FIC advisor route.',
      ],
      conditions: ['Documentation, assessment and housing availability apply.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/residences/housing-options/accessible-accommodation.html',
        'SFU Residence — Accessible Accommodation',
        'Functional requirements; documentation; CAL/FIC pathways; offers and availability',
        ['summary', 'access', 'eligibility', 'cost', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'off-campus-housing',
    title: 'Off-campus housing and rental guidance',
    category: 'housing',
    topic: '14',
    summary:
      'Use SFU’s housing guidance to find rental-search information, scam awareness and tenant-resource referrals.',
    provider: sfu('SFU Residence and Housing — Off-Campus Living'),
    audiences: ['Undergraduate', 'Graduate', 'FIC'],
    campuses: all,
    access: [
      'Browse the official guide and its rental-safety and tenant-resource links.',
      'Contact the Off-Campus Living Advisor for navigation support.',
    ],
    eligibility: [
      'The advisor offers navigation, not individual rental searches or residence application/waitlist processing. External providers set their own terms.',
    ],
    cost: {
      status: 'unknown',
      details:
        'Rent and external service costs vary by provider; no listing or landlord is endorsed by this Hub.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['校外租房', '租房骗局', 'tenant', 'landlord', 'TRAC'],
    poster: {
      title: 'Explore off-campus housing safely',
      facts: [
        'Use SFU’s rental-search and scam-awareness guide.',
        'Find tenant-resource links and navigation support.',
      ],
      conditions: [
        'Check each provider’s terms; the advisor does not conduct individual rental searches.',
      ],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/students/residences/housing-options/off-campus-housing.html',
        'SFU Residence — Off-Campus Housing',
        'Advisor scope; avoiding scams; tenant resources and listing-service guidance',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'campus-food-directory',
    title: 'Burnaby food directory',
    category: 'food',
    topic: '15',
    summary:
      'Find on-campus food, the MBC food court and nearby UniverCity options in SFU’s Burnaby directory.',
    provider: sfu('SFU Food'),
    audiences: ['All students'],
    campuses: ['Burnaby'],
    access: [
      'Open the directory and choose the outlet’s official listing for location and current hours.',
    ],
    eligibility: ['This directory covers Burnaby campus and nearby UniverCity.'],
    cost: { status: 'unknown', details: 'Prices are not reproduced; check the chosen outlet.' },
    verification: reviewed,
    reviewCadence: 'schedule',
    highImpact: false,
    aliases: ['吃饭', '餐厅', 'food court', 'UniverCity'],
    poster: {
      title: 'Find food at Burnaby',
      facts: [
        'Browse campus, MBC food court and UniverCity listings.',
        'Check your chosen outlet’s current hours before visiting.',
      ],
      conditions: ['Check the chosen outlet’s details before visiting.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/food/wheretoeat.html',
        'SFU Food — Where to Eat',
        'Burnaby scope and campus/MBC/UniverCity outlet directory',
        ['summary', 'access', 'eligibility.0', 'campuses', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'dining-meal-plans',
    title: 'Dining Commons and meal plans',
    category: 'food',
    topic: '15',
    summary: 'Compare paid walk-in dining and meal-plan choices at the Burnaby Dining Commons.',
    provider: sfu('SFU Food — Dining Commons'),
    audiences: ['All students'],
    campuses: ['Burnaby', 'Online'],
    access: [
      'Check current Dining Commons hours and walk-in rates.',
      'Compare the current meal plans and use MyPlace@SFU to purchase the appropriate option.',
    ],
    eligibility: [
      'Dining Commons welcomes students, staff and the public. Students living off campus can purchase meal plans; some residence buildings require one.',
    ],
    cost: {
      status: 'published',
      details:
        'Walk-in meals and meal plans are paid. Plan prices, days covered and residence requirements differ.',
    },
    locations: [{ campus: 'Burnaby', name: 'Dining Commons, near the residence buildings' }],
    verification: reviewed,
    reviewCadence: 'schedule',
    highImpact: false,
    aliases: ['食堂', 'meal plan', 'commuter meals', '餐饮计划'],
    relatedIds: ['dietary-allergen-enquiries', 'residence-applications'],
    poster: {
      title: 'Explore Dining Commons',
      facts: [
        'Paid walk-in dining is open to the wider community.',
        'Students living off campus can also buy meal plans.',
        'Compare current plans and opening information.',
      ],
      conditions: ['Plan coverage, prices and residence requirements vary.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.sfu.ca/food/dining-commons.html',
        'SFU Food — Dining Commons',
        'Access, location and current operating information',
        ['summary', 'access.0', 'eligibility', 'locations', 'poster.facts.0', 'poster.facts.2'],
      ),
      source(
        'https://www.sfu.ca/food/mealplans.html',
        'SFU Food — Meal Plans',
        'Who can purchase; plan options; purchase through MyPlace',
        ['access.1', 'eligibility', 'cost', 'poster.facts.1', 'poster.conditions'],
      ),
      source(
        'https://www.sfu.ca/students/residences/apply.html',
        'SFU Residence and Housing — Apply',
        'Housing-type meal-plan requirements',
        ['eligibility', 'poster.conditions'],
      ),
    ],
  }),
  defineResource({
    id: 'dietary-allergen-enquiries',
    title: 'Dietary needs and allergen enquiries',
    category: 'food',
    topic: '15',
    summary:
      'Contact Dining Commons staff to discuss dietary needs, ingredients and cross-contact concerns.',
    provider: sfu('SFU Food — Dining Commons'),
    audiences: ['All students'],
    campuses: ['Burnaby', 'Online'],
    access: [
      'Ask the on-shift manager or arrange a discussion with the dining team before relying on a food option.',
    ],
    eligibility: [
      'Dietary enquiries are welcome. Access to the made-without-gluten pantry requires approval and an eligible meal plan.',
    ],
    cost: {
      status: 'unknown',
      details:
        'Meal and plan charges still apply; confirm the appropriate arrangement with Dining Commons.',
    },
    details: [
      {
        heading: 'Allergen limits',
        body: 'Dining Commons is not a gluten-free facility. Menu labels or promotional images do not establish that an item is safe for an individual allergy.',
      },
    ],
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['过敏', '清真', '素食', 'gluten', 'halal', 'vegan'],
    relatedIds: ['dining-meal-plans'],
    poster: {
      title: 'Discuss dietary needs before dining',
      facts: [
        'Ask Dining Commons staff about ingredients and dietary needs.',
        'Dining Commons is not a gluten-free facility.',
      ],
      conditions: [
        'Confirm individual suitability with staff; cross-contact and pantry-access conditions apply.',
      ],
      mode: 'link',
    },
    sources: [
      source(
        'https://www.sfu.ca/food/mealplans/diets-wellness.html',
        'SFU Food — Dietary Needs and Wellness',
        'Dietary enquiries; made-without-gluten pantry; cross-contamination qualification',
        ['summary', 'access', 'eligibility', 'details.0', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'food-pantry',
    title: 'SFU Food Pantry: confirm current access',
    category: 'food',
    topic: '15',
    summary:
      'Find the SFSS-operated emergency food and hygiene top-up service and confirm current visit details.',
    provider: society('Simon Fraser Student Society (SFSS), with SFU partners'),
    audiences: ['All students'],
    campuses: ['Burnaby'],
    access: [
      'Read the current SFSS pantry page, complete its required intake form and confirm the visit location and hours with the provider.',
      'Bring reusable bags or containers as requested.',
    ],
    eligibility: [
      'For students seeking emergency food support; provider intake requirements and available supplies apply.',
    ],
    cost: {
      status: 'unknown',
      details:
        'Confirm current access conditions with the provider; this record does not guarantee a particular item or quantity.',
    },
    details: [
      {
        heading: 'Conflicting access information',
        body: 'The SFU food-security directory and SFSS pantry page list different distribution days. The SFSS page also contains inconsistent room descriptions. Exact times and rooms are withheld pending clarification.',
      },
    ],
    verification: partial(
      'Purpose and intake guidance reviewed. Official pages conflict on distribution day and location; confirm directly before visiting.',
    ),
    reviewCadence: 'schedule',
    highImpact: true,
    aliases: ['食物援助', '食品储藏室', 'food insecurity', 'pantry'],
    relatedIds: ['sfss-food-assistance', 'embark-food-rescue'],
    poster: {
      title: 'Find food-pantry support',
      facts: [
        'Check the SFSS pantry page for current intake instructions.',
        'Confirm the distribution location and time before visiting.',
      ],
      conditions: ['Published access details conflict; supplies and provider conditions apply.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://sfss.ca/sfu-food-pantry/',
        'SFSS — SFU Food Pantry',
        'Pantry purpose; intake form; visit preparation; inconsistent location descriptions',
        ['summary', 'provider', 'access', 'eligibility', 'details.0', 'poster'],
      ),
      source(
        'https://www.sfu.ca/food/programs/food-security.html',
        'SFU Food — Food Security',
        'Food Pantry distribution listing differs from direct provider',
        ['details.0', 'verification.note'],
      ),
    ],
  }),
  defineResource({
    id: 'sfss-food-assistance',
    title: 'Ask SFSS about current food assistance',
    category: 'food',
    topic: '15',
    summary:
      'Contact the SFSS Student Centre to confirm what food-bank assistance is currently available.',
    provider: society('Simon Fraser Student Society (SFSS)'),
    audiences: ['Undergraduate'],
    campuses: all,
    access: [
      'Use the SFSS Food Bank Program page to reach the Student Centre and confirm the current term’s process.',
    ],
    eligibility: [
      'The published program addresses SFU undergraduate students in need, but current voucher terms require confirmation.',
    ],
    cost: {
      status: 'unknown',
      details: 'No current benefit amount or voucher validity is confirmed here.',
    },
    verification: partial(
      'The provider page contains vouchers expiring April 30, 2026 and older collection information. Current amounts, application availability and collection details are not established.',
    ),
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['食品券', 'food bank', 'grocery voucher'],
    relatedIds: ['food-pantry', 'embark-food-rescue'],
    poster: {
      title: 'Ask about current food assistance',
      facts: [
        'Contact the SFSS Student Centre through its official program page.',
        'Confirm the current term’s application and collection process.',
      ],
      conditions: ['Published voucher details are dated; current benefits are not confirmed.'],
      mode: 'link',
    },
    sources: [
      source(
        'https://sfss.ca/services/food-bank-program/',
        'SFSS — Food Bank Program',
        'Undergraduate program; Student Centre contact; dated voucher and collection details',
        ['summary', 'provider', 'access', 'eligibility', 'verification.note', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'embark-food-rescue',
    title: 'Embark Food Rescue',
    category: 'food',
    topic: '15',
    summary:
      'Find student-led distribution of recovered produce and current opportunities to participate.',
    provider: society('Embark Sustainability Society'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: ['Burnaby'],
    access: [
      'Check Embark’s current Food Rescue event information before visiting or volunteering.',
    ],
    eligibility: [
      'Produce distribution serves SFU students and depends on donated supply. Distributions do not run during exams or semester breaks.',
    ],
    cost: { status: 'published', details: 'Recovered produce is offered free or by donation.' },
    verification: reviewed,
    reviewCadence: 'schedule',
    highImpact: false,
    aliases: ['食物回收', '免费蔬菜', 'produce', 'food sustainability'],
    relatedIds: ['food-pantry'],
    poster: {
      title: 'Explore Embark Food Rescue',
      facts: [
        'Recovered produce for SFU students, free or by donation.',
        'Check the current event schedule before visiting.',
      ],
      conditions: ['Supply varies; distributions pause during exams and semester breaks.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://www.embarksustainability.org/programs/food-rescue/',
        'Embark Sustainability — Food Rescue',
        'Student access; free/by-donation produce; distribution and term-break limits',
        ['summary', 'provider', 'access', 'eligibility', 'cost', 'poster'],
      ),
    ],
  }),
  defineResource({
    id: 'gss-food-support',
    title: 'Graduate student grocery support and Quest referrals',
    category: 'food',
    topic: '15',
    summary:
      'GSS offers limited emergency grocery assistance and a referral route to Quest’s reduced-cost food markets for graduate students facing financial hardship.',
    provider: society('Graduate Student Society at SFU'),
    audiences: ['Graduate'],
    campuses: all,
    access: [
      'Check the GSS Emergency Grocery Card page for the current application window and terms before applying.',
      'Use the GSS Quest referral route and read its information-sharing notice before submitting information directly to the provider.',
    ],
    eligibility: [
      'Emergency grocery assistance is limited, subject to program rules and available cards; it is not a long-term funding source.',
      'Quest referrals support people facing financial hardship; market supply varies and groceries are offered at reduced cost, not universally free.',
    ],
    cost: {
      status: 'published',
      details:
        'Quest uses reduced-cost markets. No current grocery-card amount or guaranteed benefit is reproduced.',
    },
    verification: {
      status: 'partial',
      verifiedAt: null,
      reviewedAt: '2026-10-04T16:00:11Z',
      reviewer: 'agent',
      note: 'Official page bodies were read through direct HTTPS after web-reader failure. The grocery page has a Fall 2026 application notice but retains Fall 2025 wording in its award terms; exact opening time, benefit amount and numeric limits are withheld. Current terms need GSS confirmation.',
    },
    reviewCadence: 'sensitive',
    highImpact: true,
    aliases: ['研究生食品援助', 'grocery card', 'Quest Food Exchange', 'GSS food'],
    relatedIds: ['graduate-student-society', 'food-pantry', 'sfss-food-assistance'],
    poster: {
      title: 'Graduate student food support',
      facts: [
        'Check GSS’s current emergency grocery application terms.',
        'Explore the GSS referral route to Quest food markets.',
      ],
      conditions: [
        'Graduate student route; assistance and supply are limited.',
        'Quest is reduced-cost shopping, not a promise of free groceries.',
      ],
      mode: 'link',
    },
    sources: [
      {
        url: 'https://sfugradsociety.ca/service/emergency-grocery-card-program/',
        title: 'GSS — Emergency Grocery Card Program',
        locator:
          'Program purpose and limited assistance; application route; Fall 2026 notice versus Fall 2025 EGC Information wording',
        fields: [
          'summary',
          'provider',
          'audiences',
          'access.0',
          'eligibility.0',
          'poster.facts.0',
          'poster.conditions.0',
        ],
        lastRetrievalAttemptAt: '2026-10-04T16:00:11Z',
        lastRetrievedAt: '2026-10-04T16:00:11Z',
        retrievalStatus: 'retrieved',
      },
      {
        url: 'https://sfugradsociety.ca/service/quest-food-exchange/',
        title: 'GSS — Quest Food Exchange',
        locator:
          'GSS referral and information sharing; financial hardship; reduced-cost markets; variable supply',
        fields: [
          'summary',
          'access.1',
          'eligibility.1',
          'cost',
          'poster.facts.1',
          'poster.conditions.1',
        ],
        lastRetrievalAttemptAt: '2026-10-04T16:00:11Z',
        lastRetrievedAt: '2026-10-04T16:00:11Z',
        retrievalStatus: 'retrieved',
      },
    ],
  }),
  defineResource({
    id: 'bookstore-course-materials',
    title: 'Bookstore and course materials',
    category: 'food',
    topic: '15',
    summary:
      'Find course-material lists, available formats and textbook help through the SFU Bookstore.',
    provider: sfu('SFU Bookstore & Spirit Shop'),
    audiences: ['Undergraduate', 'Graduate'],
    campuses: all,
    access: [
      'Use the personalized list or search by course on the Bookstore site.',
      'If materials are missing, check the instructor’s outline or Canvas announcements.',
    ],
    eligibility: [
      'Course requirements depend on the instructor. The site directs users to select Burnaby in its course-material search regardless of teaching campus.',
    ],
    cost: {
      status: 'unknown',
      details: 'Prices, formats, availability and return conditions vary; check before purchasing.',
    },
    verification: reviewed,
    reviewCadence: 'sensitive',
    highImpact: false,
    aliases: ['教材', '教科书', '书店', 'textbook', 'ebook'],
    poster: {
      title: 'Find your course materials',
      facts: [
        'Search the official Bookstore by course or personalized list.',
        'Check the course outline or Canvas if a listing is missing.',
      ],
      conditions: ['Required materials, prices, formats and return rules vary.'],
      mode: 'facts',
    },
    sources: [
      source(
        'https://shop.sfu.ca/course-materials/course-materials--faqs',
        'SFU Bookstore — Course Materials FAQs',
        'Find course materials; select Burnaby; missing material listings',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
  }),
];
