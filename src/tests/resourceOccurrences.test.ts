import { describe, expect, it } from 'vitest';
import { defineResource } from '../data/resources/catalog/define';
import type {
  ResourceOccurrence,
  ResourceProgram,
  ResourceRecurrence,
} from '../data/resources/types';
import {
  expandProgramRecurrence,
  occurrenceLocationLabel,
  occurrenceTimeLabel,
  programLifecycle,
  programOccurrences,
  programRegistrationUrl,
  splitProgramOccurrences,
  thisWeekItems,
  thisWeekOccurrences,
} from '../utils/resourceOccurrences';
import { resourceStatus } from '../utils/resourceStatus';
import { officialSource } from '../utils/resourceHealth';
import { searchResources, thisWeekResources } from '../utils/search';
import {
  validateResourceDocument,
  validateResourceProgram,
  validateResources,
} from '../utils/resourceValidation';

const now = new Date('2026-10-05T18:00:00Z'); // Monday 11:00 a.m. Vancouver.
const readAt = '2026-10-05T15:00:00Z';
const digest = 'a'.repeat(64);
const occurrence = (id = 'one', patch: Partial<ResourceOccurrence> = {}): ResourceOccurrence => ({
  id,
  date: '2026-10-06',
  startTime: '12:30',
  endTime: '13:30',
  mode: 'hybrid',
  campus: 'Burnaby',
  building: 'Example Building',
  room: '100',
  sourcePage: 5,
  ...patch,
});
const program = (patch: Partial<ResourceProgram> = {}): ResourceProgram => ({
  kind: 'single',
  occurrences: [occurrence()],
  sourcePages: [5],
  sourceDocument: { filename: 'synthetic-guide.pdf', sha256: digest, pages: 11 },
  registrationStatus: 'unavailable',
  ...patch,
});
const resource = (id = 'synthetic-workshop', p: ResourceProgram | null = program()) =>
  defineResource({
    id,
    title: `Synthetic ${id}`,
    category: 'workshops-events',
    topic: '06',
    summary: 'Synthetic learning workshop.',
    provider: { name: 'SFU Library', type: 'sfu' },
    access: ['Check the source.'],
    eligibility: ['SFU students.'],
    audiences: ['All students'],
    campuses: ['Burnaby'],
    cost: { status: 'unknown' },
    verification: { status: 'reviewed', reviewedAt: readAt, verifiedAt: readAt, reviewer: 'agent' },
    secondReview: { reviewedAt: readAt, reviewer: 'agent', note: 'Synthetic independent review.' },
    reviewCadence: 'schedule',
    highImpact: false,
    poster: {
      title: 'Synthetic workshop',
      facts: ['One workshop.', 'Source conditions apply.'],
      conditions: [],
      mode: 'facts',
    },
    ...(p ? { program: p } : {}),
    sources: [
      {
        title: 'Synthetic PDF evidence',
        url: 'https://www.lib.sfu.ca/',
        locator: 'Received PDF page 5',
        fields: ['summary', 'access', 'eligibility', 'poster', 'program'],
        retrievalStatus: 'blocked',
        lastRetrievalAttemptAt: readAt,
        lastRetrievedAt: null,
        document: { filename: 'synthetic-guide.pdf', sha256: digest, pages: [5], readAt },
      },
    ],
  });
const rule = (patch: Partial<ResourceRecurrence> = {}): ResourceRecurrence => ({
  weekday: 'Tuesday',
  startDate: '2026-09-22',
  endDate: '2026-11-24',
  startTime: '13:00',
  endTime: '14:00',
  mode: 'in-person',
  campus: 'Burnaby',
  sourcePage: 5,
  ...patch,
});

describe('bounded program occurrences', () => {
  it('expands only the source weekday inside both explicit bounds and respects exceptions', () => {
    const values = expandProgramRecurrence(rule({ excludeDates: ['2026-10-13'] }));
    expect(values).toHaveLength(9);
    expect(values[0].date).toBe('2026-09-22');
    expect(values.at(-1)?.date).toBe('2026-11-24');
    expect(values.some((entry) => entry.date === '2026-10-13')).toBe(false);
    expect(values.every((entry) => entry.startTime === '13:00' && entry.endTime === '14:00')).toBe(
      true,
    );
  });
  it('keeps published local wall times unchanged across daylight saving', () => {
    const values = expandProgramRecurrence(
      rule({ startDate: '2026-10-27', endDate: '2026-11-10' }),
    );
    expect(values.map((entry) => [entry.date, entry.startTime])).toEqual([
      ['2026-10-27', '13:00'],
      ['2026-11-03', '13:00'],
      ['2026-11-10', '13:00'],
    ]);
  });
  it.each([
    { endDate: undefined },
    { startDate: undefined },
    { startTime: undefined },
    { endTime: undefined },
    { weekday: undefined },
    { startDate: '2026-02-30' },
    { endDate: '2026-09-01' },
    { startTime: '23:00', endTime: '12:00' },
    { manualReviewRequired: true },
    { endDate: '2040-01-01' },
  ])('does not invent dates for an incomplete or questionable rule %j', (patch) => {
    expect(expandProgramRecurrence({ ...rule(), ...patch } as ResourceRecurrence)).toEqual([]);
  });
  it('keeps a canonical series while sorting explicit and recurring dates without mutating it', () => {
    const p = program({
      kind: 'recurring',
      occurrences: [occurrence('last', { date: '2026-12-01' })],
      recurrences: [rule({ startDate: '2026-11-24', endDate: '2026-11-24' })],
    });
    const r = resource('series', p),
      before = JSON.stringify(r);
    expect(programOccurrences(r).map((entry) => entry.date)).toEqual(['2026-11-24', '2026-12-01']);
    expect(JSON.stringify(r)).toBe(before);
  });
});

describe('Vancouver occurrence lifecycle and rolling feed', () => {
  it('includes today through exactly seven calendar days and excludes already-ended today', () => {
    const rows = [
      occurrence('past', { date: '2026-10-04' }),
      occurrence('ended', { date: '2026-10-05', startTime: '10:00', endTime: '11:00' }),
      occurrence('ongoing', { date: '2026-10-05', startTime: '10:30', endTime: '11:30' }),
      occurrence('later', { date: '2026-10-05', startTime: '14:00', endTime: '15:00' }),
      occurrence('boundary', { date: '2026-10-12' }),
      occurrence('outside', { date: '2026-10-13' }),
    ];
    expect(
      thisWeekOccurrences(
        [resource('range', program({ kind: 'multiple', occurrences: rows }))],
        now,
      ).map((entry) => entry.occurrence.id),
    ).toEqual(['ongoing', 'later', 'boundary']);
  });
  it('uses Vancouver today at UTC midnight and at both sides of DST fall-back', () => {
    const r = resource(
      'night',
      program({
        occurrences: [
          occurrence('night', { date: '2026-10-04', startTime: '19:00', endTime: '20:00' }),
        ],
      }),
    );
    expect(thisWeekOccurrences([r], new Date('2026-10-05T02:30Z'))).toHaveLength(1);
    const sunday = resource(
      'sunday',
      program({
        occurrences: [
          occurrence('early', { date: '2026-11-01', startTime: '09:00', endTime: '10:00' }),
        ],
      }),
    );
    for (const instant of ['2026-11-01T08:30Z', '2026-11-01T09:30Z'])
      expect(thisWeekOccurrences([sunday], new Date(instant))).toHaveLength(1);
  });
  it('never publishes ambiguous times and moves a known past date into history', () => {
    const uncertain = occurrence('unclear', {
      startTime: null,
      endTime: null,
      manualReviewRequired: true,
      manualReviewNote: 'Source says 11pm–12pm; confirm.',
      rawSource: { startTime: '11pm', endTime: '12pm' },
    });
    const r = resource('uncertain', program({ occurrences: [uncertain] }));
    expect(thisWeekOccurrences([r], now)).toEqual([]);
    expect(splitProgramOccurrences(r, now).uncertain).toEqual([uncertain]);
    expect(splitProgramOccurrences(r, new Date('2026-10-07T19:00Z')).past).toEqual([uncertain]);
    expect(occurrenceTimeLabel(uncertain)).toBe('Time not confirmed');
    expect(uncertain.rawSource).toEqual({ startTime: '11pm', endTime: '12pm' });
  });
  it('does not suppress a reliable date because the description needs review', () => {
    const r = resource(
      'description-review',
      program({
        manualReviewRequired: true,
        manualReviewNote: 'Description may belong to another workshop.',
      }),
    );
    r.verification.status = 'partial';
    r.verification.verifiedAt = null;
    r.lastVerified = null;
    expect(thisWeekOccurrences([r], now)).toHaveLength(1);
  });
  it('keeps a series active between events and completes only after its final event', () => {
    const r = resource(
      'series',
      program({
        kind: 'multiple',
        occurrences: [
          occurrence('early', { date: '2026-09-01' }),
          occurrence('late', { date: '2026-11-25' }),
        ],
      }),
    );
    expect(programLifecycle(r, new Date('2026-08-31T19:00Z'))).toBe('upcoming');
    expect(programLifecycle(r, now)).toBe('active');
    expect(resourceStatus(r, now).lifecycle).toBe('active');
    expect(programLifecycle(r, new Date('2026-11-25T21:30Z'))).toBe('completed');
    expect(resourceStatus(r, new Date('2026-11-25T21:30Z')).lifecycle).toBe('expired');
  });
  it('keeps a service active after its only known first occurrence without guessing an end', () => {
    const r = resource(
      'unbounded',
      program({
        kind: 'service',
        occurrences: [occurrence('first', { date: '2026-09-23' })],
        scheduleText: 'Every second Wednesday; end date not published.',
      }),
    );
    expect(programLifecycle(r, now)).toBe('active');
    expect(programOccurrences(r)).toHaveLength(1);
    expect(thisWeekOccurrences([r], now)).toEqual([]);
    r.program!.endDate = '2026-12-04';
    expect(programLifecycle(r, new Date('2026-12-05T20:00Z'))).toBe('completed');
  });
  it('supports source-bounded ranges and marks undated non-service programs unknown', () => {
    const r = resource(
      'bounded',
      program({ kind: 'range', occurrences: [], startDate: '2026-10-10', endDate: '2026-10-20' }),
    );
    expect(programLifecycle(r, now)).toBe('upcoming');
    expect(programLifecycle(r, new Date('2026-10-20T19:00Z'))).toBe('active');
    expect(programLifecycle(r, new Date('2026-10-21T19:00Z'))).toBe('completed');
    expect(programLifecycle(resource('undated', program({ occurrences: [] })), now)).toBe(
      'unknown',
    );
  });
  it('does not recommend a service beyond an explicit publication end date', () => {
    const r = resource('expired-service', program({ kind: 'service', endDate: '2026-10-04' }));
    expect(programLifecycle(r, now)).toBe('completed');
    expect(thisWeekItems([r], now)).toEqual([]);
  });
  it('combines dated legacy resources, range closing dates and occurrences; never fills with evergreen cards', () => {
    const deadline = resource('deadline', null);
    deadline.date = '2026-10-07';
    const closing = resource('closing', null);
    closing.dates = [
      { label: 'Application closes', kind: 'range', start: '2026-09-01', end: '2026-10-05' },
    ];
    const evergreen = resource('evergreen', null);
    const event = resource('event');
    const rows = thisWeekItems([deadline, evergreen, event, closing], now);
    expect(rows.map((entry) => entry.resource.id)).toEqual(['closing', 'event', 'deadline']);
    expect(rows[0]).toMatchObject({ date: '2026-10-05', label: 'Application closes' });
    expect(rows[0].occurrence).toBeUndefined();
    expect(thisWeekResources([deadline, event], now).map((entry) => entry.id)).toEqual([
      'event',
      'deadline',
    ]);
  });
  it('sorts explicit legacy timestamps by their actual local time and excludes elapsed ones', () => {
    const r = resource('timestamp', null);
    r.dates = [
      {
        label: 'Dated appointment',
        kind: 'timestamp',
        start: '2026-10-06T18:00:00Z',
        timeZone: 'America/Vancouver',
      },
    ];
    expect(thisWeekItems([resource('event'), r], now).map((entry) => entry.resource.id)).toEqual([
      'timestamp',
      'event',
    ]);
    expect(thisWeekItems([r], new Date('2026-10-06T18:01Z'))).toEqual([]);
  });
  it('caps at six chronologically, independent of input order or a larger requested limit', () => {
    const list = Array.from({ length: 9 }, (_, i) =>
      resource(
        `r${i}`,
        program({
          occurrences: [
            occurrence(`o${i}`, {
              date: '2026-10-06',
              startTime: `${String(9 + i).padStart(2, '0')}:00`,
              endTime: `${String(10 + i).padStart(2, '0')}:00`,
            }),
          ],
        }),
      ),
    );
    expect(thisWeekItems(list.reverse(), now, 50).map((entry) => entry.resource.id)).toEqual([
      'r0',
      'r1',
      'r2',
      'r3',
      'r4',
      'r5',
    ]);
    expect(thisWeekItems(list, now, 4)).toHaveLength(4);
    expect(thisWeekItems(list, now, 0)).toEqual([]);
    list[0].lifecycle = 'historical';
    expect(thisWeekItems([list[0]], now)).toEqual([]);
  });
  it('rejects an invalid injected clock without silently using the real date', () => {
    expect(() => thisWeekItems([], new Date('invalid'))).toThrow('valid current time');
  });
});

describe('program presentation, registration and received evidence', () => {
  it('formats times without converting them to the viewer timezone and retains hybrid location', () => {
    expect(occurrenceTimeLabel(occurrence())).toBe('12:30 PM–1:30 PM');
    expect(occurrenceLocationLabel(occurrence())).toBe('Hybrid · Burnaby · Example Building · 100');
    expect(occurrenceTimeLabel(occurrence('unknown', { endTime: null }))).toBe(
      'Time not confirmed',
    );
    expect(
      occurrenceTimeLabel(occurrence('reversed', { startTime: '23:00', endTime: '12:00' })),
    ).toBe('Time not confirmed');
  });
  it('never treats action/source links or an unverified registration URL as verified', () => {
    const r = resource();
    r.program!.registrationUrl = 'https://www.lib.sfu.ca/register';
    expect(programRegistrationUrl(r)).toBeUndefined();
    r.program!.registrationStatus = 'verified';
    expect(programRegistrationUrl(r)).toBe('https://www.lib.sfu.ca/register');
    expect(
      programRegistrationUrl(r, occurrence('override', { registrationStatus: 'unavailable' })),
    ).toBeUndefined();
    expect(
      programRegistrationUrl(
        r,
        occurrence('unreviewed-url', { registrationUrl: 'https://www.lib.sfu.ca/different' }),
      ),
    ).toBeUndefined();
    expect(
      programRegistrationUrl(
        r,
        occurrence('unsafe', {
          registrationStatus: 'verified',
          registrationUrl: 'javascript:alert(1)',
        }),
      ),
    ).toBeUndefined();
  });
  it('accepts a received PDF as primary evidence without falsifying web retrieval', () => {
    const r = resource();
    expect(validateResources([r], now).errors).toEqual([]);
    expect(r.sources[0]).toMatchObject({
      retrievalStatus: 'blocked',
      lastRetrievedAt: null,
      document: { sha256: digest, pages: [5] },
    });
    delete r.sources[0].document;
    expect(validateResources([r], now).errors.join(' ')).toContain(
      'missing retrieved evidence for summary',
    );
  });
  it('rejects future or incomplete document receipts and missing program evidence', () => {
    const r = resource();
    r.sources[0].document!.readAt = '2026-10-06T15:00Z';
    expect(validateResourceDocument(r.sources[0].document, now)).toContain(
      'document receipt needs an actual past read timestamp',
    );
    expect(
      validateResourceDocument({ filename: 'guide', sha256: 'bad', pages: [] }, now),
    ).toHaveLength(3);
    r.sources[0].document!.readAt = readAt;
    r.evidence = r.evidence.filter((entry) => entry.field !== 'program');
    expect(validateResources([r], now).errors.join(' ')).toContain(
      'missing received evidence for program',
    );
  });
  it('allows the specifically reviewed VOWəL host without trusting arbitrary Weebly sites', () => {
    expect(officialSource('https://vowel-writers.weebly.com/')).toBe(true);
    expect(officialSource('https://unrelated.weebly.com/')).toBe(false);
    expect(officialSource('https://vowel-writers.weebly.com.attacker.test/')).toBe(false);
  });
  it('keeps unpublished program locations explicitly empty without accepting missing or contradictory campuses', () => {
    const r = resource(
      'unknown-location',
      program({
        kind: 'service',
        occurrences: [],
        scheduleText: 'Contact the service for location.',
      }),
    );
    r.campuses = [];
    expect(validateResources([r], now).errors).toEqual([]);
    r.program!.occurrences = [occurrence()];
    expect(validateResources([r], now).errors.join(' ')).toContain('invalid campus applicability');
    r.program!.occurrences = [];
    delete (r as Partial<typeof r>).campuses;
    expect(validateResources([r], now).errors.join(' ')).toContain('invalid campus applicability');
  });
  it('requires received document identity and pages to match the program source', () => {
    const r = resource();
    r.sources[0].document!.pages = [6];
    expect(validateResources([r], now).errors.join(' ')).toContain('matching received document');
    const badPage = program({
      sourcePages: [12],
      occurrences: [occurrence('wrong-page', { sourcePage: 12 })],
    });
    expect(validateResourceProgram(badPage).join(' ')).toContain(
      'page exceeds the document page count',
    );
  });
  it('indexes occurrence locations and filters public audience conditions without collecting identity', () => {
    const r = resource();
    r.audiences = ['Indigenous students'];
    r.aliases = ['学习计划'];
    expect(
      searchResources(
        [r],
        '学习计划',
        'workshops-events',
        'Burnaby',
        'All',
        'Indigenous students',
        now,
      ),
    ).toEqual([r]);
    expect(searchResources([r], 'Example Building', 'All', 'All', 'All', 'All', now)).toEqual([r]);
    expect(validateResources([r], now).errors).toEqual([]);
  });
  it('rejects malformed shapes, duplicate IDs and impossible normalized data before helpers consume them', () => {
    expect(validateResourceProgram(null)).toEqual(['program must be an object']);
    const p = program({ occurrences: [occurrence(), occurrence()] });
    expect(validateResourceProgram(p).join(' ')).toContain('duplicate or missing occurrence ID');
    expect(
      validateResourceProgram({ ...p, occurrences: [null], recurrences: 'Tuesday' }).join(' '),
    ).toContain('must be an object');
    expect(
      validateResourceProgram(
        program({
          occurrences: [
            occurrence('bad', { date: '2026-02-30', startTime: '25:00', mode: 'unknown' }),
          ],
        }),
      ).join(' '),
    ).toMatch(/invalid normalized time.*invalid occurrence date/);
    expect(
      validateResourceProgram(
        program({
          recurrences: [{ ...rule(), endDate: undefined } as unknown as ResourceRecurrence],
        }),
      ).join(' '),
    ).toContain('bounded dates');
  });
});
