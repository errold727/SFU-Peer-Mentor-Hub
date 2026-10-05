import { describe, expect, it } from 'vitest';
import { resources } from '../data/resources';
import {
  defineResource,
  reviewCadenceDays,
  type CatalogInput,
} from '../data/resources/catalog/define';
import {
  auditCatalog,
  collectResourceUrls,
  resourceFreshness,
  resourceLifecycle,
  resourceSearchProbes,
  termApplicability,
} from '../../scripts/resource-audit/catalog';

const now = new Date('2026-10-05T18:00:00Z');
const reviewed = '2026-10-01T18:00:00Z';
const url = 'https://www.sfu.ca/students/example.html';
function fixture(extra: Partial<CatalogInput> = {}) {
  return defineResource({
    id: 'example',
    title: 'Synthetic student service',
    category: 'student-essential',
    topic: '01',
    summary: 'Synthetic service for deterministic offline audit tests.',
    provider: { name: 'SFU Example Service', type: 'sfu' },
    access: ['Read the official page.'],
    eligibility: ['Students can enquire.'],
    audiences: ['All students'],
    campuses: ['Burnaby'],
    cost: { status: 'unknown' },
    verification: {
      status: 'reviewed',
      reviewedAt: reviewed,
      verifiedAt: reviewed,
      reviewer: 'human',
    },
    reviewCadence: 'evergreen',
    highImpact: false,
    poster: {
      title: 'Student service',
      facts: ['Read the official page.', 'Ask the service about current access.'],
      conditions: ['Confirm access before visiting.'],
      mode: 'facts',
    },
    sources: [
      {
        title: 'Official example',
        url,
        locator: 'Synthetic fixture',
        fields: [
          'summary',
          'access',
          'eligibility',
          'poster',
          'facts',
          'contacts',
          'sessions',
          'dates',
          'cost',
        ],
        lastRetrievalAttemptAt: reviewed,
        lastRetrievedAt: reviewed,
        retrievalStatus: 'retrieved',
      },
    ],
    ...extra,
  });
}
const codes = (values: unknown[]) => auditCatalog(values, now).findings.map((f) => f.code);
function frozen<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) frozen(child);
    Object.freeze(value);
  }
  return value;
}

describe('weekly catalog freshness policy', () => {
  it.each(Object.entries(reviewCadenceDays))('reuses the %s cadence (%d days)', (key, days) => {
    const r = fixture({ reviewCadence: key as CatalogInput['reviewCadence'], reviewDueAt: null });
    const expected = new Date(reviewed);
    expected.setUTCDate(expected.getUTCDate() + days);
    expect(resourceFreshness(r, now).reviewDueAt).toBe(expected.toISOString().slice(0, 10));
  });
  it('has fresh, soon, due and stale states without changing the review stamp', () => {
    const r = fixture({ reviewDueAt: '2026-10-10', reviewCadence: 'schedule' });
    expect(resourceFreshness(r, new Date('2026-10-08T19:00:00Z')).freshness).toBe('fresh');
    expect(resourceFreshness(r, new Date('2026-10-09T19:00:00Z')).freshness).toBe('reviewSoon');
    expect(resourceFreshness(r, new Date('2026-10-10T19:00:00Z')).freshness).toBe('reviewDue');
    expect(resourceFreshness(r, new Date('2026-10-17T19:00:00Z')).freshness).toBe('reviewDue');
    expect(resourceFreshness(r, new Date('2026-10-18T19:00:00Z')).freshness).toBe('stale');
    expect(r.verification.verifiedAt).toBe(reviewed);
  });
  it('honors an explicit record override in defineResource and the audit', () => {
    const r = fixture({ reviewCadence: 'schedule', reviewDueAt: '2026-12-01' });
    expect(r.reviewDueAt).toBe('2026-12-01');
    expect(resourceFreshness(r, now)).toMatchObject({
      freshness: 'fresh',
      reviewDueAt: '2026-12-01',
    });
    expect(fixture({ reviewCadence: 'schedule' }).reviewDueAt).toBe('2026-10-08');
  });
  it('an unresolved or future verification cannot be made fresh by an override', () => {
    const unresolved = fixture({
      reviewDueAt: '2027-12-01',
      verification: {
        status: 'partial',
        reviewedAt: reviewed,
        verifiedAt: null,
        reviewer: 'agent',
      },
    });
    expect(resourceFreshness(unresolved, now)).toMatchObject({
      freshness: 'reviewDue',
      verifiedAt: null,
    });
    const future = fixture({
      verification: {
        status: 'reviewed',
        reviewedAt: reviewed,
        verifiedAt: '2027-01-01T00:00:00Z',
        reviewer: 'human',
      },
    });
    expect(resourceFreshness(future, now).freshness).toBe('reviewDue');
  });
  it('uses the Vancouver calendar date at the due-date boundary', () => {
    const r = fixture({ reviewDueAt: '2026-10-05' });
    expect(resourceFreshness(r, new Date('2026-10-05T06:59:59Z')).freshness).toBe('reviewSoon');
    expect(resourceFreshness(r, new Date('2026-10-05T07:00:00Z')).freshness).toBe('reviewDue');
  });
});

describe('published lifecycle and term applicability', () => {
  it('expires a past deadline before its broader term validity ends', () => {
    const r = fixture({ category: 'deadline', date: '2026-10-04', validUntil: '2026-12-31' });
    expect(resourceLifecycle(r, now)).toBe('expired');
    expect(codes([r])).toContain('POSTER_EXPIRED');
  });
  it('does not invent a time for date-only deadlines at Vancouver midnight', () => {
    const r = fixture({ date: '2026-10-04' });
    expect(resourceLifecycle(r, new Date('2026-10-04T06:59:59Z'))).toBe('upcoming');
    expect(resourceLifecycle(r, new Date('2026-10-05T06:59:59Z'))).toBe('active');
    expect(resourceLifecycle(r, new Date('2026-10-05T07:00:00Z'))).toBe('expired');
  });
  it('handles explicit timestamp events at their actual instant and rejects ambiguous timestamps', () => {
    const r = fixture({
      dates: [
        {
          label: 'Event',
          kind: 'timestamp',
          start: '2026-10-05T10:00:00-07:00',
          timeZone: 'America/Vancouver',
        },
      ],
    });
    expect(resourceLifecycle(r, new Date('2026-10-05T16:59:59Z'))).toBe('upcoming');
    expect(resourceLifecycle(r, new Date('2026-10-05T17:00:00Z'))).toBe('active');
    expect(resourceLifecycle(r, now)).toBe('expired');
    r.dates![0].start = '2026-10-05T10:00:00';
    expect(resourceLifecycle(r, now)).toBe('unknown');
  });
  it('handles active windows, future events, mixed periods and intentional history', () => {
    const range = fixture({
      dates: [
        { label: 'Application window', kind: 'range', start: '2026-10-01', end: '2026-10-10' },
      ],
    });
    expect(resourceLifecycle(range, now)).toBe('active');
    range.dates!.push({ label: 'Future closing date', kind: 'date', start: '2026-11-01' });
    expect(resourceLifecycle(range, new Date('2026-10-11T18:00:00Z'))).toBe('upcoming');
    expect(resourceLifecycle(range, new Date('2026-11-02T18:00:00Z'))).toBe('expired');
    expect(resourceLifecycle({ ...range, lifecycle: 'historical' }, now)).toBe('historical');
    expect(resourceLifecycle({ ...range, lifecycle: 'discontinued' }, now)).toBe('historical');
  });
  it('marks old recurring sessions expired even without parent validity metadata', () => {
    const r = fixture({
      reviewCadence: 'schedule',
      sessions: [
        {
          day: 'Monday',
          start: '09:00',
          end: '10:00',
          location: 'Example',
          validFrom: '2026-09-01',
          validUntil: '2026-09-30',
          exceptions: [],
        },
      ],
    });
    expect(resourceLifecycle(r, now)).toBe('expired');
    expect(codes([r])).toContain('SCHEDULE_EXPIRED');
    const stale = { ...r, reviewDueAt: '2026-09-01' };
    expect(codes([stale])).toContain('POSTER_SCHEDULE_REVIEW');
  });
  it('tracks term applicability without assigning an invented official semester end date', () => {
    expect(termApplicability('Fall 2026', now)).toBe('current');
    expect(termApplicability('Spring 2027', now)).toBe('future');
    expect(termApplicability('Summer 2026', now)).toBe('past');
    expect(termApplicability('Winter 2026', now)).toBe('unknown');
    expect(resourceLifecycle(fixture({ term: 'Summer 2026' }), now)).toBe('expired');
    expect(codes([fixture({ term: 'Summer 2026' })])).toContain('TERM_OUT_OF_SCOPE');
    expect(resourceLifecycle(fixture({ validFrom: '2026-10-10' }), now)).toBe('upcoming');
    expect(
      resourceLifecycle(fixture({ validFrom: '2026-11-01', validUntil: '2026-10-01' }), now),
    ).toBe('unknown');
  });
});

describe('canonical program audit', () => {
  const program = (): NonNullable<CatalogInput['program']> => ({
    kind: 'multiple',
    sourcePages: [8],
    startDate: '2026-10-06',
    endDate: '2026-10-26',
    occurrences: ['2026-10-06', '2026-10-26'].map((date) => ({
      id: `talk-${date}`,
      date,
      startTime: '12:30',
      endTime: '13:30',
      campus: 'Burnaby',
      mode: 'hybrid',
      locationDisplay: 'Arts Central, AQ 3020 & Zoom',
      sourcePage: 8,
    })),
  });
  it('keeps a series active after its first event and expires it only after its final event', () => {
    const r = fixture({ program: program(), reviewCadence: 'schedule' });
    const original = JSON.stringify(r);
    const active = auditCatalog([r], new Date('2026-10-07T19:00:00Z'));
    expect(active.records[0].lifecycle).toBe('active');
    expect(active.findings.map((f) => f.code)).toContain('EVENT_PASSED');
    expect(active.findings.map((f) => f.code)).not.toContain('SERIES_COMPLETED');
    const completed = auditCatalog([r], new Date('2026-10-26T21:00:00Z'));
    expect(completed.records[0].lifecycle).toBe('expired');
    expect(completed.findings.map((f) => f.code)).toEqual(
      expect.arrayContaining([
        'EVENT_PASSED',
        'SERIES_COMPLETED',
        'SCHEDULE_EXPIRED',
        'REVIEW_DUE',
      ]),
    );
    expect(JSON.stringify(r)).toBe(original);
  });
  it('does not infer the end of a service from its one published starting session', () => {
    const r = fixture({
      program: {
        ...program(),
        kind: 'service',
        endDate: undefined,
        occurrences: [program().occurrences[0]],
      },
    });
    expect(resourceLifecycle(r, new Date('2026-11-01T20:00:00Z'))).toBe('active');
  });
  it('accepts actual workshop dates and bounded recurrence rules without requiring duplicate parent bounds', () => {
    const workshops = resources.filter((resource) => resource.category === 'workshops-events');
    expect(workshops.length).toBeGreaterThan(0);
    expect(workshops.some((resource) => resource.program?.recurrences?.length)).toBe(true);
    const result = auditCatalog(workshops, now);
    expect(result.records).toHaveLength(workshops.length);
    expect(
      result.findings.filter((finding) => finding.code === 'SCHEDULE_VALIDITY_MISSING'),
    ).toEqual([]);
  });
  it('keeps unbounded services and undated programs flagged instead of guessing a final date', () => {
    const unbounded = fixture({
      program: {
        ...program(),
        kind: 'service',
        endDate: undefined,
        occurrences: [program().occurrences[0]],
      },
      reviewCadence: 'schedule',
    });
    expect(codes([unbounded])).toContain('SCHEDULE_VALIDITY_MISSING');
    const undated = fixture({
      program: { ...program(), startDate: undefined, endDate: undefined, occurrences: [] },
      reviewCadence: 'schedule',
    });
    expect(codes([undated])).toContain('SCHEDULE_VALIDITY_MISSING');
  });
  it('still rejects a recurrence with a missing end before auditing its lifecycle', () => {
    const value = fixture({ program: { ...program(), occurrences: [] } });
    Object.assign(value.program!, {
      recurrences: [
        {
          weekday: 'Tuesday',
          startDate: '2026-10-06',
          startTime: '12:30',
          endTime: '13:30',
          mode: 'online',
          sourcePage: 8,
        },
      ],
    });
    const result = auditCatalog([value], now);
    expect(result.findings.map((finding) => finding.code)).toContain('RESOURCE_SCHEMA_INVALID');
    expect(result.records[0].lifecycle).toBe('unknown');
    expect(result.findings.map((finding) => finding.code)).not.toContain('VALIDATION_CRASH');
  });
  it('collects program and occurrence registration URLs for existing link and QR checks', () => {
    const registrationUrl = 'https://www.sfu.ca/students/register.html';
    const occurrenceUrl = 'https://www.sfu.ca/students/session.html';
    const r = fixture({
      program: {
        ...program(),
        registrationUrl,
        registrationStatus: 'verified',
        occurrences: [
          {
            ...program().occurrences[0],
            registrationUrl: occurrenceUrl,
            registrationStatus: 'verified',
          },
        ],
      },
    });
    expect(collectResourceUrls(r)).toEqual(
      expect.arrayContaining([
        { url: registrationUrl, roles: ['action', 'qr'], sourceIds: [] },
        { url: occurrenceUrl, roles: ['action', 'qr'], sourceIds: [] },
      ]),
    );
  });
  it('retains source-review flags after questionable dated sessions have passed', () => {
    const r = fixture({
      program: {
        ...program(),
        occurrences: [
          {
            ...program().occurrences[0],
            startTime: null,
            endTime: null,
            manualReviewRequired: true,
            manualReviewNote: 'Source says 11pm to noon; confirm with provider.',
            rawSource: { startTime: '11:00pm', endTime: '12:00pm' },
          },
        ],
      },
    });
    const result = auditCatalog([r], new Date('2026-10-07T19:00:00Z'));
    expect(result.findings.map((f) => f.code)).toContain('PROGRAM_MANUAL_REVIEW_REQUIRED');
    expect(r.program!.occurrences[0].startTime).toBeNull();
  });
  it.each([
    null,
    { kind: 'multiple', occurrences: 'invalid' },
    { ...program(), occurrences: [null] },
  ])('reports malformed nested program data without crashing or fetching', (value) => {
    const result = auditCatalog([{ ...fixture(), program: value }], now);
    expect(result.findings.map((f) => f.code)).toContain('RESOURCE_SCHEMA_INVALID');
    expect(result.findings.map((f) => f.code)).not.toContain('VALIDATION_CRASH');
  });
  it('flags an Indigenous-only program accidentally labelled for all students', () => {
    const r = fixture({
      eligibility: ['For self-identified Indigenous students only.'],
      audiences: ['All students'],
    });
    expect(codes([r])).toContain('AUDIENCE_CONFLICT');
  });
});

describe('schema, source, poster and high-impact audit', () => {
  it('does not mutate any factual content or verification on frozen published resources', () => {
    const input = frozen(structuredClone(resources));
    const before = JSON.stringify(input);
    const result = auditCatalog(input, now);
    expect(result.totalRecords).toBe(resources.length);
    expect(result.records).toHaveLength(resources.length);
    expect(result.records.map((r) => r.id)).toEqual(resources.map((r) => r.id));
    expect(result.findings.filter((f) => f.severity === 'error')).toEqual([]);
    expect(JSON.stringify(input)).toBe(before);
  });
  it('retains every malformed record and continues to audit valid records', () => {
    const input = [
      null,
      { id: 'bad-tags', tags: 3 },
      { ...fixture(), id: 'bad-source', sources: [null] },
      { ...fixture(), id: 'bad-poster', poster: { facts: 'bad' } },
      { ...fixture(), id: 'bad-session', sessions: [{ exceptions: null }] },
      fixture(),
    ];
    const result = auditCatalog(input, now);
    expect(result.totalRecords).toBe(6);
    expect(result.records).toHaveLength(6);
    expect(result.records.at(-1)?.lifecycle).toBe('active');
    expect(result.findings.some((f) => f.code === 'RESOURCE_SCHEMA_INVALID')).toBe(true);
    expect(result.findings.some((f) => f.code === 'VALIDATION_CRASH')).toBe(false);
  });
  it('detects duplicate IDs even when one record cannot reach semantic validation', () => {
    const result = auditCatalog([fixture(), { id: 'example', tags: 3 }], now);
    expect(result.totalRecords).toBe(2);
    expect(result.records).toHaveLength(2);
    expect(result.findings.find((f) => f.code === 'DUPLICATE_RESOURCE_ID')).toMatchObject({
      resourceIds: ['example'],
      severity: 'error',
    });
  });
  it.each([
    { reviewCadence: 'weekly' },
    { reviewCadence: undefined },
    { poster: { title: 'Example', facts: ['One', 'Two'], conditions: [], mode: 'invented' } },
    { dates: [{ label: 'Event', kind: 'invented', start: '2026-10-05' }] },
    { dates: [{ label: 'Window', kind: 'range', start: '2026-10-05' }] },
    {
      dates: [
        {
          label: 'Event',
          kind: 'timestamp',
          start: '2026-10-05T12:00:00',
          timeZone: 'America/Vancouver',
        },
      ],
    },
    {
      dates: [
        {
          label: 'Event',
          kind: 'timestamp',
          start: '2026-02-31T12:00:00Z',
          timeZone: 'America/Vancouver',
        },
      ],
    },
    {
      dates: [
        {
          label: 'Event',
          kind: 'timestamp',
          start: '2026-10-05T12:00:00Z',
          timeZone: 'Europe/London',
        },
      ],
    },
  ])('rejects invalid audit publication metadata %j', (invalid) => {
    const result = auditCatalog([{ ...fixture(), ...invalid }], now);
    expect(
      result.findings.some((f) => f.code === 'RESOURCE_SCHEMA_INVALID' && f.severity === 'error'),
    ).toBe(true);
    expect(result.findings.some((f) => f.code === 'VALIDATION_CRASH')).toBe(false);
  });
  it('rejects an unrecognized source retrieval status', () => {
    const r = fixture();
    const result = auditCatalog(
      [{ ...r, sources: [{ ...r.sources[0], retrievalStatus: 'automatically-verified' }] }],
      now,
    );
    expect(
      result.findings.some((f) => f.message === 'Missing or invalid source retrieval status.'),
    ).toBe(true);
  });
  it('fails an unavailable registry and reports duplicate IDs/canonical records/invalid references using existing validation', () => {
    expect(auditCatalog(undefined, now).findings[0].code).toBe('REGISTRY_UNAVAILABLE');
    const r = fixture({ relatedIds: ['missing'] });
    const result = auditCatalog([r, { ...r }], now);
    expect(result.findings.map((f) => f.message).join('\n')).toMatch(/Duplicate or missing ID/);
    expect(result.findings.map((f) => f.message).join('\n')).toMatch(/duplicate canonical service/);
    expect(result.findings.map((f) => f.message).join('\n')).toMatch(/broken related ID missing/);
  });
  it('reports missing sources, evidence, invalid metadata and unexpected private fields', () => {
    const bad = {
      ...fixture(),
      sourceUrl: '',
      sources: [],
      evidence: [],
      category: 'invented',
      campus: 'Toronto',
      provider: { name: 'Example', type: 'made-up' },
      studentNumber: 'synthetic-value',
    };
    const result = auditCatalog([bad], now);
    const messages = result.findings.map((f) => f.message).join('\n');
    expect(messages).toMatch(/sources required/);
    expect(messages).toMatch(/invalid category/);
    expect(messages).toMatch(/provider missing or invalid/);
    expect(messages).toMatch(/private information or credential field/);
  });
  it('deduplicates source/action/QR URLs but retains roles and source references', () => {
    const r = {
      ...fixture(),
      qrUrl: url,
      poster: { ...fixture().poster, qr: { url: 'https://www.sfu.ca/students/other.html' } },
    };
    expect(collectResourceUrls(r)).toEqual([
      { url, roles: ['source', 'action', 'qr'], sourceIds: ['s1'] },
      { url: 'https://www.sfu.ca/students/other.html', roles: ['qr'], sourceIds: [] },
    ]);
    expect(collectResourceUrls(null)).toEqual([]);
  });
  it.each([
    'javascript:alert(1)',
    'data:text/html,test',
    'https://www.sfu.ca@evil.example/path',
    'http://127.0.0.1/private',
  ])('rejects unsafe QR %s without network activity', (qrUrl) => {
    const result = auditCatalog([{ ...fixture(), qrUrl }], now);
    expect(result.findings.find((f) => f.code === 'UNSAFE_QR_URL')?.severity).toBe('error');
  });
  it('keeps unknown costs unknown and identifies explicit audience contradictions', () => {
    expect(codes([{ ...fixture(), cost: 0 }])).toContain('UNKNOWN_COST_ZERO');
    expect(codes([{ ...fixture(), cost: { status: 'unknown', amount: 0 } }])).toContain(
      'UNKNOWN_COST_ZERO',
    );
    expect(codes([fixture({ cost: { status: 'unknown' } })])).not.toContain('UNKNOWN_COST_ZERO');
    expect(
      codes([fixture({ audiences: ['All students'], eligibility: ['Graduate students only.'] })]),
    ).toContain('AUDIENCE_CONFLICT');
  });
  it('escalates explicit and category-derived high-impact reviews without modifying facts', () => {
    for (const extra of [
      { highImpact: true },
      { category: 'deadline' as const },
      { title: 'Tuition refund procedure' },
      { title: 'Work authorization and immigration' },
      { category: 'health' as const },
      { category: 'rights' as const },
      { title: 'Campus emergency contacts', category: 'safety' as const },
    ]) {
      const r = fixture({ ...extra, reviewDueAt: '2026-10-01' });
      const result = auditCatalog([r], now);
      expect(result.records[0].highImpact).toBe(true);
      expect(result.records[0].highImpactReasons.length).toBeGreaterThan(0);
      expect(result.findings.find((f) => f.code === 'REVIEW_DUE')?.priority).toBe('high');
    }
  });
  it('audits actual rendered poster text and essential conditions without shortening it', () => {
    const r = fixture({
      poster: {
        title: 'Service',
        facts: ['x'.repeat(1000), 'https://www.sfu.ca/' + 'a'.repeat(100)],
        conditions: [],
        mode: 'facts',
      },
      eligibility: ['A valid membership is required.'],
    });
    const before = JSON.stringify(r);
    expect(codes([r])).toEqual(
      expect.arrayContaining(['POSTER_TOO_LONG', 'POSTER_RAW_URL', 'POSTER_QUALIFICATION_REVIEW']),
    );
    expect(JSON.stringify(r)).toBe(before);
    expect(
      codes([fixture({ poster: { title: '', facts: [], conditions: [], mode: 'facts' } })]),
    ).toContain('POSTER_EMPTY');
    expect(codes([{ ...fixture(), sources: [] }])).toContain('POSTER_SOURCE_REFERENCE');
  });
});

describe('real search engine probes', () => {
  it('covers the requested English and Mandarin queries against real IDs and current applicability', () => {
    const result = auditCatalog(resources, now);
    expect(result.search).toHaveLength(resourceSearchProbes.length);
    expect(
      resourceSearchProbes.every((probe) =>
        probe.expectedIds.every((id) => resources.some((r) => r.id === id)),
      ),
    ).toBe(true);
    for (const query of [
      'quiet study',
      'lost wallet',
      'safe walk',
      'computing ID',
      'U-Pass',
      '安静自习',
      '失物招领',
      '写作辅导',
      '学费',
      '退课退费',
      '羽毛球',
      '国际学生',
      '交换',
    ])
      expect(result.search.find((p) => p.query === query)?.status).toBe('passed');
    // This audit surfaces existing search gaps rather than rewriting factual aliases.
    expect(result.search.find((p) => p.query === 'floor 6')?.status).toBe('regression');
    expect(result.search.find((p) => p.query === '学业咨询')?.status).toBe('regression');
    expect(result.findings.filter((f) => f.code === 'SEARCH_REGRESSION')).toHaveLength(2);
  });
  it('a missing alias is a search warning, not invalid factual content', () => {
    const original = resources.find((r) => r.id === 'lost-found')!;
    const r = {
      ...original,
      title: 'Object collection',
      summary: 'Ask staff about collected property.',
      tags: [],
      aliases: [],
      facts: [],
      locations: [],
      provider: { name: 'SFU Example', type: 'sfu' as const },
    };
    const result = auditCatalog([r], now);
    expect(result.search.find((p) => p.query === '失物招领')?.status).toBe('regression');
    expect(result.findings.find((f) => f.code === 'SEARCH_REGRESSION')?.severity).toBe('warning');
    expect(r.aliases).toEqual([]);
  });
  it('does not invent a corresponding resource when the subset has none', () => {
    expect(auditCatalog([fixture()], now).search.every((p) => p.status === 'not-applicable')).toBe(
      true,
    );
  });
});
