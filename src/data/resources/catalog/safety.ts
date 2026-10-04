import { defineResource, type CatalogInput, type SourceInput } from './define';
const checked = '2026-10-04T15:27:33Z';
const base = 'https://www.sfu.ca/srs/';
function source(path: string, title: string, locator: string, fields: string[]): SourceInput {
  return {
    url: base + path,
    title,
    locator,
    fields,
    lastRetrievalAttemptAt: checked,
    lastRetrievedAt: checked,
    retrievalStatus: 'retrieved',
  };
}
function safety(
  input: Pick<
    CatalogInput,
    'id' | 'title' | 'summary' | 'access' | 'eligibility' | 'sources' | 'poster'
  > &
    Partial<CatalogInput>,
) {
  return defineResource({
    category: 'safety',
    topic: '08',
    provider: { name: 'SFU Campus Public Safety', type: 'sfu' },
    audiences: ['All students'],
    campuses: ['Burnaby', 'Surrey', 'Vancouver'],
    cost: { status: 'unknown' },
    verification: {
      status: 'reviewed',
      verifiedAt: checked,
      reviewedAt: checked,
      reviewer: 'agent',
    },
    reviewCadence: 'safety',
    highImpact: true,
    ...input,
  });
}
export const safetyResources = [
  safety({
    id: 'campus-safety',
    title: 'Campus Public Safety',
    summary:
      'Emergency, urgent security, first aid and non-emergency contacts for all three campuses.',
    access: ['Call the number for the situation; use 911 in an emergency.'],
    eligibility: ['Burnaby, Surrey and Vancouver campuses.'],
    facts: [
      { label: 'Emergency', value: '911' },
      { label: 'Urgent security / first aid', value: '778-782-4500' },
      { label: 'Non-emergency', value: '778-782-7991' },
    ],
    contacts: [
      { label: 'Emergency', value: '911', kind: 'phone' },
      {
        label: 'Campus urgent security / first aid (all three campuses)',
        value: '778-782-4500',
        kind: 'phone',
      },
      { label: 'Campus non-emergency (all three campuses)', value: '778-782-7991', kind: 'phone' },
    ],
    details: [
      {
        heading: 'First aid',
        body: 'Campus Public Safety provides urgent assistance and first aid. The first-aid source lists campus facilities and procedures.',
      },
    ],
    sources: [
      source(
        'contact/report/report-incident.html',
        'SFU — Report an incident',
        'Emergency contacts (Burnaby, Surrey, Vancouver)',
        [
          'summary',
          'access',
          'eligibility',
          'facts.0',
          'facts.2',
          'contacts.0',
          'contacts.2',
          'poster',
        ],
      ),
      source(
        'campus-safety-security/public-safety/first-aid.html',
        'SFU — First aid',
        'Procedures / Major injuries',
        ['summary', 'facts.1', 'contacts.1', 'details', 'poster'],
      ),
    ],
    aliases: ['emergency', 'first aid', '急救', '安全'],
    tags: ['911', 'security', '778-782-4500'],
    poster: {
      title: 'Campus Public Safety',
      facts: [
        'Emergency: 911',
        'Urgent security / first aid: 778-782-4500',
        'Non-emergency: 778-782-7991',
      ],
      conditions: ['Burnaby · Surrey · Vancouver'],
      mode: 'facts',
    },
  }),
  safety({
    id: 'safe-walk',
    title: 'Safe Walk',
    summary:
      'Request a campus safety escort; coverage and Vancouver service limits vary by location.',
    access: [
      'Call 778-782-7991, use SFU Safe, or a campus direct-dial telephone.',
      'Tell the dispatcher your pickup point and destination.',
    ],
    eligibility: [
      'Campus-specific coverage applies. Vancouver service described on the source ends at 10:30 pm; 611 Alexander has a separate voucher arrangement.',
    ],
    facts: [{ label: 'Request a walk', value: '778-782-7991' }],
    contacts: [{ label: 'Safe Walk requests', value: '778-782-7991', kind: 'phone' }],
    locations: [
      { campus: 'Burnaby', name: 'SFU campus', details: 'On-campus destinations.' },
      {
        campus: 'Surrey',
        name: 'SC / SE buildings',
        details:
          'Nearby transit stops and adjacent parking; request at SC mezzanine or SE atrium security.',
      },
      {
        campus: 'Vancouver',
        name: 'Campus buildings',
        details:
          'Two-block radius, nearest bus stop or between buildings until 10:30 pm. Ask about the separate 611 Alexander arrangement.',
      },
    ],
    sources: [
      source(
        'campus-safety-security/public-safety/safe-walk.html',
        'SFU — Safe Walk',
        'Requesting a Safe Walk; Campus-specific information',
        ['summary', 'access', 'eligibility', 'facts', 'contacts', 'locations', 'poster'],
      ),
    ],
    aliases: ['safewalk', 'safe walk', '陪走'],
    poster: {
      title: 'Safe Walk',
      facts: ['Request: 778-782-7991', 'Tell dispatch your pickup point and destination.'],
      conditions: [
        'Coverage varies by campus. Vancouver service ends 10:30 pm; 611 Alexander differs.',
      ],
      mode: 'facts',
    },
  }),
  safety({
    id: 'lost-found',
    title: 'Lost & Found',
    summary: 'Find the correct lost-item contact for Burnaby, Surrey or Vancouver.',
    access: ['Contact the security location for the campus where the item was lost.'],
    eligibility: ['Use the campus-specific contact below.'],
    facts: [
      { label: 'Burnaby', value: 'Information kiosk: 778-782-5451; lost@sfu.ca' },
      { label: 'Surrey', value: 'Visit the mezzanine security desk.' },
      { label: 'Vancouver', value: 'Building security desk; 778-782-7991; grdsupv@sfu.ca' },
    ],
    contacts: [
      { label: 'Burnaby lost items', value: '778-782-5451', kind: 'phone' },
      { label: 'Burnaby lost items', value: 'lost@sfu.ca', kind: 'email' },
      { label: 'Vancouver lost items', value: '778-782-7991', kind: 'phone' },
      { label: 'Vancouver lost items', value: 'grdsupv@sfu.ca', kind: 'email' },
    ],
    locations: [
      { campus: 'Burnaby', name: 'Information kiosk' },
      { campus: 'Surrey', name: 'Mezzanine security desk' },
      { campus: 'Vancouver', name: 'Security desk in your building' },
    ],
    sources: [
      source(
        'campus-safety-security/public-safety/lost-found.html',
        'SFU — Lost & Found',
        'Lost something? / Burnaby, Surrey, Vancouver campus',
        ['summary', 'access', 'eligibility', 'facts', 'contacts', 'locations', 'poster'],
      ),
    ],
    aliases: ['lost wallet', 'lost phone', '失物招领', '丢钱包'],
    poster: {
      title: 'Lost & Found',
      facts: [
        'Burnaby: 778-782-5451 / lost@sfu.ca',
        'Surrey: mezzanine security desk',
        'Vancouver: building security / 778-782-7991',
      ],
      conditions: ['Choose the campus where the item was lost.'],
      mode: 'facts',
    },
  }),
  safety({
    id: 'report-incident',
    title: 'Report a health or safety incident',
    summary: 'Official reporting routes for injuries, near misses and other campus incidents.',
    access: ['Open the official incident page and select the route matching your role.'],
    eligibility: [
      'SFU directs graduate students and employees to the Employees route; undergraduate non-employees and visitors use Students/Visitors.',
      'For urgent help use Campus Public Safety; reporting forms are not emergency dispatch.',
    ],
    sources: [
      source(
        'contact/report/report-incident.html',
        'SFU — Report an incident',
        'Health & safety incidents; Employees / Students/visitors',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
    relatedIds: ['campus-safety'],
    poster: {
      title: 'Report a safety incident',
      facts: ['Use the official incident page.', 'Choose the reporting route for your role.'],
      conditions: ['Urgent situation? Contact Campus Public Safety first.'],
      mode: 'facts',
    },
  }),
  safety({
    id: 'report-hazard',
    title: 'Report a campus hazard',
    summary:
      'Find urgent and campus-specific routes for unsafe conditions in departments or public spaces.',
    access: [
      'Use the official hazard page to choose urgent, departmental or public-space reporting.',
    ],
    eligibility: ['The appropriate contact depends on location and urgency.'],
    sources: [
      source(
        'contact/report/report-hazard.html',
        'SFU — Report a hazard',
        'Urgent hazards; Hazards in your department; Hazards in public spaces',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
    relatedIds: ['campus-safety'],
    poster: {
      title: 'Report a campus hazard',
      facts: ['Choose the campus and type of hazard.', 'Use the official reporting contacts.'],
      conditions: ['Urgent hazards require urgent assistance.'],
      mode: 'facts',
    },
  }),
  safety({
    id: 'building-access',
    title: 'Building access assistance',
    summary: 'Find campus access arrangements and help with access requests.',
    access: [
      'Check your building on the official access page.',
      'Use the listed access-request contact when assistance is needed.',
    ],
    eligibility: ['Opening arrangements vary by building and campus; some spaces require a fob.'],
    sources: [
      source(
        'campus-safety-security/public-safety/building-access.html',
        'SFU — Building access',
        'Building access; campus sections',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
    highImpact: false,
    poster: {
      title: 'Building access',
      facts: ['Check your campus and building.', 'Use the access-request contact for assistance.'],
      conditions: ['Some spaces require a fob.'],
      mode: 'facts',
    },
  }),
  safety({
    id: 'theft-prevention',
    title: 'Prevent theft on campus',
    summary: 'Practical SFU guidance for looking after belongings and bicycles.',
    access: ['Read the theft-prevention guide before leaving belongings or locking a bicycle.'],
    eligibility: ['Guidance for people using campus spaces.'],
    sources: [
      source(
        'campus-safety-security/public-safety/safety-guides/theft-prevention.html',
        'SFU — Theft prevention',
        'Help prevent theft on campus; Bicycles',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
    highImpact: false,
    poster: {
      title: 'Protect your belongings',
      facts: ['Take valuables with you when you leave.', 'Use a properly installed bicycle rack.'],
      conditions: [],
      mode: 'facts',
    },
  }),
  safety({
    id: 'scams-fraud',
    title: 'Scams and fraud support',
    summary: 'Recognize warning signs and find official steps for reporting suspected fraud.',
    access: ['Read the prevention, warning-sign and victim-support sections.'],
    eligibility: [
      'This is general navigation; use the official reporting routes for your situation.',
    ],
    sources: [
      source(
        'campus-safety-security/public-safety/safety-guides/scams-fraud.html',
        'SFU — Scams & fraud',
        'Prevention; Warning Signs; What to do if you are a victim',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
    aliases: ['scam', 'fraud', '诈骗'],
    poster: {
      title: 'Scams and fraud',
      facts: [
        'Pause before sharing financial information.',
        'Use SFU’s guide to find reporting steps.',
      ],
      conditions: [],
      mode: 'facts',
    },
  }),
  safety({
    id: 'wildlife-safety',
    title: 'Wildlife on Burnaby Mountain',
    summary: 'SFU guidance for reducing wildlife encounters and finding reporting instructions.',
    campuses: ['Burnaby'],
    access: ['Read the wildlife guide and follow its reporting instructions.'],
    eligibility: ['Burnaby Mountain campus and trails.'],
    sources: [
      source(
        'campus-safety-security/public-safety/safety-guides/wildlife.html',
        'SFU — Wildlife',
        'How to prevent wildlife encounters',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
    poster: {
      title: 'Wildlife on campus',
      facts: ['Give wild animals space.', 'Keep food and garbage secured.'],
      conditions: ['Burnaby Mountain — consult the official encounter guidance.'],
      mode: 'facts',
    },
  }),
  safety({
    id: 'sfu-alerts',
    title: 'SFU Alerts and emergency closures',
    summary: 'Find official urgent notifications and severe-weather closure channels.',
    provider: { name: 'SFU Safety & Risk Services', type: 'sfu' },
    access: [
      'Open SFU Alerts for notification options.',
      'Enable SFU Safe app notifications if using the app.',
    ],
    eligibility: ['Alerts apply to the affected campus or area identified in each notice.'],
    sources: [
      source(
        'risk-emergency-planning/emergency-preparedness/sfu-alerts.html',
        'SFU — SFU Alerts',
        'What is SFU Alerts?; What’s an urgent notification?',
        ['summary', 'access', 'eligibility', 'poster'],
      ),
    ],
    aliases: ['snow', 'weather closure', '紧急通知'],
    poster: {
      title: 'SFU Alerts',
      facts: ['Check official campus notifications.', 'Use SFU Safe for mobile alerts.'],
      conditions: ['Follow the campus and area named in the notice.'],
      mode: 'facts',
    },
  }),
];
