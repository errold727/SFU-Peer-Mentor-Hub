import { describe, it, expect, beforeEach } from 'vitest';
import { resources } from '../data/resources';
import { libraryFloors } from '../data/resources/library';
import { filterRecreation } from '../data/resources/recreation';
import { searchResources, thisWeekResources } from '../utils/search';
import { getDeadlineStatus, getRelativeDeadlineLabel, localDate } from '../utils/dates';
import { getVerificationStatus } from '../utils/verification';
import { usePosterBasket } from '../store/posterBasketStore';
describe('resource discovery', () => {
  it('finds fuzzy titles and facts', () => {
    expect(searchResources(resources, 'libary').some((r) => r.id === 'bennett-library')).toBe(true);
    expect(searchResources(resources, '778-782-4500').some((r) => r.id === 'campus-safety')).toBe(
      true,
    );
  });
  it('filters categories', () =>
    expect(searchResources(resources, '', 'safety').every((r) => r.category === 'safety')).toBe(
      true,
    ));
  it('includes all-campus resources while excluding other campuses', () => {
    const r = searchResources(resources, '', 'All', 'Surrey');
    expect(r.some((x) => x.id === 'bennett-library')).toBe(false);
    expect(r.some((x) => x.id === 'campus-safety')).toBe(true);
  });
  it('filters the published Spring deadlines without borrowing Fall dates', () => {
    const matches = searchResources(resources, '', 'deadline', 'All', 'Spring 2027');
    expect(matches.some((r) => r.id === 'spring-tuition-refunds')).toBe(true);
    expect(matches.every((r) => !r.term || r.term === 'Spring 2027')).toBe(true);
    expect(matches.some((r) => r.id === 'deadline-2')).toBe(false);
  });
  it('keeps official links on every resource', () =>
    expect(resources.every((r) => r.sourceUrl.startsWith('https://') && r.sourceName)).toBe(true));
});
describe('Vancouver deadlines', () => {
  const now = new Date('2026-10-03T20:00:00Z');
  it.each([
    ['2026-10-02', 'past'],
    ['2026-10-03', 'today'],
    ['2026-10-04', 'tomorrow'],
    ['2026-10-06', 'thisWeek'],
    ['2026-11-03', 'upcoming'],
  ])('%s is %s', (date, status) => expect(getDeadlineStatus(date, now)).toBe(status));
  it('uses Vancouver at the UTC date boundary', () => {
    const edge = new Date('2026-10-04T02:00:00Z');
    expect(localDate(edge)).toBe('2026-10-03');
    expect(getDeadlineStatus('2026-10-03', edge)).toBe('today');
  });
  it('handles daylight saving boundaries', () =>
    expect(getDeadlineStatus('2026-11-02', new Date('2026-11-01T20:00:00Z'))).toBe('tomorrow'));
  it('labels relative dates', () =>
    expect(getRelativeDeadlineLabel('2026-10-06', now)).toBe('IN 3 DAYS'));
  it('never recommends past deadlines', () =>
    expect(thisWeekResources(resources, now).every((r) => !r.date || r.date >= '2026-10-03')).toBe(
      true,
    ));
  it('marks aging and unknown verification honestly', () => {
    expect(getVerificationStatus(null, now)).toBe('unverified');
    expect(getVerificationStatus('2026-01-01', now)).toBe('stale');
    expect(getVerificationStatus('2026-07-01', now)).toBe('reviewSoon');
  });
});
describe('source-backed accuracy', () => {
  it('withdraws the unsupported Bennett floor guide and keeps the supported directory', () => {
    expect(libraryFloors).toEqual([]);
    const library = resources.find((r) => r.id === 'bennett-library')!;
    expect(library.verification.status).toBe('partial');
    expect(library.facts).toEqual([]);
    expect(library.sources.some((s) => s.url.includes('lib.sfu.ca'))).toBe(true);
  });
  it('contains safety numbers', () =>
    expect(resources.find((r) => r.id === 'campus-safety')?.facts?.map((f) => f.value)).toEqual([
      '911',
      '778-782-4500',
      '778-782-7991',
    ]));
  it('filters recreation by sport', () => expect(filterRecreation('Badminton')).toHaveLength(5));
  it('filters recreation by day', () => expect(filterRecreation('All', 'Tuesday')).toHaveLength(2));
});
describe('basket', () => {
  beforeEach(() => usePosterBasket.getState().clear());
  it('adds, deduplicates, removes and clears resources', () => {
    const b = usePosterBasket.getState();
    b.add(resources[0]);
    b.add(resources[0]);
    expect(usePosterBasket.getState().items).toHaveLength(1);
    b.remove(resources[0].id);
    expect(usePosterBasket.getState().items).toHaveLength(0);
    b.add(resources[1]);
    b.clear();
    expect(usePosterBasket.getState().items).toHaveLength(0);
  });
});
