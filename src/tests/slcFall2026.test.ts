import { describe, expect, it } from 'vitest';
import { resources, resolveResource } from '../data/resources';
import {
  slcCommunityResources,
  slcFall2026Document,
  slcFall2026Resources,
  slcServiceResources,
  slcWorkshopResources,
} from '../data/resources/slcFall2026';
import { validateResources } from '../utils/resourceValidation';
import {
  programLifecycle,
  programOccurrences,
  programRegistrationUrl,
  thisWeekOccurrences,
} from '../utils/resourceOccurrences';
import { resourcePosterText, searchResources } from '../utils/search';

const reviewedNow = new Date('2026-10-05T18:00:00Z');
const find = (id: string) => slcFall2026Resources.find((resource) => resource.id === id)!;
const occurrences = (id: string) => programOccurrences(find(id));

describe('Fall 2026 SLC guide transcription', () => {
  it('accounts for 18 canonical workshop programs, eight services and seven community locations', () => {
    expect(slcWorkshopResources).toHaveLength(18);
    expect(slcServiceResources).toHaveLength(8);
    expect(slcCommunityResources).toHaveLength(7);
    expect(new Set(slcFall2026Resources.map((resource) => resource.id)).size).toBe(33);
    expect(slcWorkshopResources.every((resource) => resource.category === 'workshops-events')).toBe(
      true,
    );
    expect(slcWorkshopResources.flatMap(programOccurrences)).toHaveLength(41);
    expect(slcCommunityResources.flatMap(programOccurrences)).toHaveLength(11);
  });

  it('reuses existing canonical consultation and overview IDs without duplicate occurrence cards', () => {
    expect(resources).toHaveLength(215);
    expect(new Set(resources.map((resource) => resource.id)).size).toBe(resources.length);
    for (const id of ['writing', 'slc', 'academic-english', 'co-curricular-record'])
      expect(resources.filter((resource) => resource.id === id)).toHaveLength(1);
    expect(resolveResource('writing')?.title).toBe('Writing and Learning Consultations');
    expect(resolveResource('slc-writeaway')?.title).toBe('WriteAway');
    expect(
      resolveResource('co-curricular-record')?.details.some(
        (detail) => detail.heading === 'SLC participation',
      ),
    ).toBe(true);
    for (const occurrence of occurrences('slc-public-speaking'))
      expect(resources.some((resource) => resource.id === occurrence.id)).toBe(false);
  });

  it('retains page-specific PDF evidence without claiming blocked websites were retrieved', () => {
    expect(slcFall2026Document).toEqual({
      filename: 'Program Guide Fall 2026_FINAL1.pdf',
      sha256: '14e98c0d7246c96c01e5c3f00cce3c4c82066b64ddfc6e9ee5021fa056f9af7b',
      pages: 11,
    });
    for (const resource of slcFall2026Resources) {
      expect(resource.program?.sourceDocument).toEqual(slcFall2026Document);
      const document = resource.sources[0].document!;
      expect(document.filename).toBe(slcFall2026Document.filename);
      expect(document.sha256).toBe(slcFall2026Document.sha256);
      expect(document.pages).toEqual(expect.arrayContaining(resource.program!.sourcePages));
      expect(
        resource.evidence.some(
          (evidence) =>
            evidence.field === 'program' && evidence.sourceId === resource.sources[0].id,
        ),
      ).toBe(true);
      if (new URL(resource.sourceUrl).hostname === 'www.lib.sfu.ca') {
        expect(resource.sources[0].retrievalStatus).toBe('blocked');
        expect(resource.sources[0].lastRetrievedAt).toBeNull();
        expect(resource.program?.registrationUrl).toBeUndefined();
      }
    }
    // Separate independent review metadata is verified by the full catalog gate.
    expect(validateResources(resources, reviewedNow, false).errors).toEqual([]);
  });

  it.each([
    ['slc-present-with-confidence', ['2026-09-15']],
    ['slc-schedule-building', ['2026-09-17', '2026-09-21']],
    ['slc-unlock-readings', ['2026-09-24']],
    ['slc-quantitative-exams', ['2026-09-25', '2026-12-02']],
    ['slc-study-skills', ['2026-09-28', '2026-11-25']],
    ['slc-ai-rehearsal', ['2026-09-29']],
    [
      'slc-workplace-english',
      ['2026-09-29', '2026-10-06', '2026-10-27', '2026-11-10', '2026-11-17'],
    ],
    ['slc-procrastination', ['2026-10-02', '2026-11-23']],
    ['slc-public-speaking', ['2026-10-06', '2026-10-26']],
    ['slc-soup-circles', ['2026-10-08', '2026-11-04', '2026-11-26', '2026-12-07']],
    ['slc-scientific-writing', ['2026-10-19']],
    ['slc-big-paper', ['2026-10-22']],
    ['slc-writer-becoming', ['2026-10-22']],
    ['slc-zine-making', ['2026-11-05']],
    ['slc-writing-walk', ['2026-11-19']],
    ['slc-exam-anxiety', ['2026-11-30']],
  ])('preserves all explicitly listed dates for %s', (id, dates) => {
    expect(occurrences(id as string).map((occurrence) => occurrence.date)).toEqual(dates);
  });

  it('expands only the two explicitly bounded weekly workshop series', () => {
    expect(occurrences('slc-lifes-little-debates').map((occurrence) => occurrence.date)).toEqual([
      '2026-09-22',
      '2026-09-29',
      '2026-10-06',
      '2026-10-13',
      '2026-10-20',
      '2026-10-27',
      '2026-11-03',
      '2026-11-10',
      '2026-11-17',
      '2026-11-24',
    ]);
    expect(occurrences('slc-photo-walk').map((occurrence) => occurrence.date)).toEqual([
      '2026-09-25',
      '2026-10-02',
      '2026-10-09',
    ]);
    expect(
      slcFall2026Resources
        .filter((resource) => resource.program?.recurrences?.length)
        .map((resource) => resource.id),
    ).toEqual(['slc-lifes-little-debates', 'slc-photo-walk']);
  });

  it('preserves different rooms, delivery modes and durations within canonical programs', () => {
    expect(occurrences('slc-public-speaking')).toEqual([
      expect.objectContaining({
        date: '2026-10-06',
        startTime: '12:30',
        endTime: '13:30',
        room: '3020',
        mode: 'hybrid',
        sourcePage: 8,
      }),
      expect.objectContaining({
        date: '2026-10-26',
        startTime: '11:30',
        endTime: '12:20',
        room: '3146',
        mode: 'hybrid',
        sourcePage: 8,
      }),
    ]);
    expect(occurrences('slc-scientific-writing')[0]).toMatchObject({
      startTime: '11:30',
      endTime: '13:30',
    });
    expect(occurrences('slc-soup-circles').map((occurrence) => occurrence.room)).toEqual([
      '3020',
      '3020',
      '2013',
      '3008',
    ]);
    expect(occurrences('slc-zine-making')[0]).toMatchObject({
      sourcePage: 10,
      startTime: '14:00',
      endTime: '16:00',
      room: '3100',
    });
  });

  it('keeps service ranges and unknown delivery separate from appointment occurrences', () => {
    expect(find('writing').program).toMatchObject({
      startDate: '2026-09-14',
      endDate: '2026-12-12',
      occurrences: [],
    });
    expect(find('slc-conversation-partners').program).toMatchObject({
      startDate: '2026-09-21',
      endDate: '2026-12-04',
      occurrences: [],
    });
    expect(find('slc-neurolanguage-coaching').program).toMatchObject({
      startDate: '2026-09-21',
      endDate: '2026-12-10',
      occurrences: [],
    });
    expect(find('slc-conversation-partners').campuses).toEqual([]);
    expect(find('slc-neurolanguage-coaching').campuses).toEqual([]);
    expect(find('writing').program?.manualReviewRequired).toBe(true);
    expect(resourcePosterText(find('writing'), reviewedNow)).not.toContain('last day of classes');
  });

  it('never generates dates from unbounded community or VOWəL schedules', () => {
    for (const id of [
      'slc-drop-in-out-on-campus',
      'slc-drop-in-womens-centre',
      'slc-drop-in-indigenous-burnaby',
      'slc-drop-in-disability-neurodiversity',
      'slc-vowel',
    ]) {
      expect(occurrences(id)).toEqual([]);
      expect(find(id).program?.endDate).toBeUndefined();
      expect(find(id).program?.recurrences).toBeUndefined();
    }
    expect(
      occurrences('slc-drop-in-black-student-centre').map((occurrence) => occurrence.date),
    ).toEqual(['2026-09-23']);
    expect(
      programLifecycle(find('slc-drop-in-black-student-centre'), new Date('2026-11-01T20:00:00Z')),
    ).toBe('active');
    expect(find('slc-vowel').program?.manualReviewNote).toMatch(/UTC-07.*UTC-08/);
  });

  it('retains the Indigenous-only restriction in searchable records and poster conditions', () => {
    for (const id of ['slc-drop-in-indigenous-burnaby', 'slc-drop-in-indigenous-surrey']) {
      const resource = find(id);
      expect(resource.audiences).toEqual(['Indigenous students']);
      expect(resource.eligibility).toContain('For self-identified Indigenous students only.');
      expect(resource.summary).toContain('self-identified Indigenous students only');
      expect(resource.poster.conditions).toContain('For self-identified Indigenous students only.');
      expect(resourcePosterText(resource, reviewedNow)).toContain(
        'For self-identified Indigenous students only.',
      );
    }
  });

  it('withholds the questionable Surrey times while retaining dates, raw text and the valid September session', () => {
    const sessions = occurrences('slc-drop-in-indigenous-surrey');
    expect(sessions[0]).toMatchObject({ date: '2026-09-29', startTime: '13:00', endTime: '14:00' });
    expect(sessions.slice(1).map((session) => session.date)).toEqual([
      '2026-10-07',
      '2026-10-21',
      '2026-11-04',
      '2026-11-18',
      '2026-12-02',
    ]);
    for (const session of sessions.slice(1)) {
      expect(session).toMatchObject({
        startTime: null,
        endTime: null,
        manualReviewRequired: true,
        rawSource: { startTime: '11:00pm', endTime: '12:00pm' },
      });
    }
    expect(thisWeekOccurrences([find('slc-drop-in-indigenous-surrey')], reviewedNow)).toEqual([]);
  });

  it('does not turn the mismatched Big Paper description into invented workshop facts', () => {
    const paper = find('slc-big-paper');
    expect(paper.program?.manualReviewRequired).toBe(true);
    expect(paper.program?.manualReviewNote).toContain('Description withheld');
    expect(occurrences(paper.id)[0].rawSource?.description).toContain('exam');
    expect(paper.details[0].body).toContain('pending confirmation');
    expect(occurrences(paper.id)[0].manualReviewRequired).toBeUndefined();
    expect(thisWeekOccurrences([paper], new Date('2026-10-20T18:00:00Z'))).toHaveLength(1);
  });

  it('uses only verified destinations for QR eligibility and retains no-registration conditions', () => {
    for (const resource of slcWorkshopResources)
      expect(programRegistrationUrl(resource)).toBeUndefined();
    expect(find('slc-soup-circles').program?.registrationStatus).toBe('not-required');
    expect(find('slc-soup-circles').poster.conditions.join(' ')).toMatch(
      /No registration required.*run out/,
    );
    expect(programRegistrationUrl(find('slc-writeaway'))).toBe('https://writeaway.ca/');
    expect(programRegistrationUrl(find('slc-vowel'))).toBe('https://vowel-writers.weebly.com/');
  });

  it('keeps program-specific participation conditions in poster-ready data', () => {
    expect(find('slc-present-with-confidence').poster.conditions.join(' ')).toContain(
      'multilingual',
    );
    expect(find('slc-workplace-english').poster.conditions.join(' ')).toContain(
      'first language is not English',
    );
    expect(find('slc-scientific-writing').poster.conditions.join(' ')).toContain('undergraduate');
  });

  it.each([
    ['学习技巧', 'slc-study-skills'],
    ['拖延', 'slc-procrastination'],
    ['公开演讲', 'slc-public-speaking'],
    ['考试焦虑', 'slc-exam-anxiety'],
    ['学习计划', 'slc-schedule-building'],
    ['conversation partner', 'slc-conversation-partners'],
    ['WriteAway', 'slc-writeaway'],
    ['VOWəL', 'slc-vowel'],
    ['zine', 'slc-zine-making'],
  ])('finds the guide resource for %s', (query, id) => {
    expect(
      searchResources(resources, query, 'All', 'All', 'All', 'All', reviewedNow)
        .slice(0, 5)
        .map((resource) => resource.id),
    ).toContain(id);
  });
});
