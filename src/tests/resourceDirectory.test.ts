import { describe, expect, it } from 'vitest';
import { resources, resolveResource, mergedResourceIds } from '../data/resources';
import { searchResources, resourcePosterText, thisWeekResources } from '../utils/search';
import { validateResources } from '../utils/resourceValidation';
import { filteredScheduleResource } from '../utils/resourceSchedule';
import { resourceBlockPatch, makeBlock } from '../poster/blocks';

const now = new Date('2026-10-05T18:00:00Z');
const find = (id: string) => resources.find((r) => r.id === id)!;
describe('published directory integration', () => {
  it('validates the complete catalog with all high-impact publication gates', () => {
    expect(validateResources(resources, now).errors).toEqual([]);
    expect(new Set(resources.map((r) => r.topic)).size).toBe(20);
  });
  it.each([
    ['失物招领', 'lost-found'],
    ['助学金', 'bursaries'],
    ['图书馆', 'fraser-library'],
    ['国际学生', 'international-advising'],
    ['写作', 'writing'],
    ['Badminton', 'drop-in-recreation'],
  ])('finds a relevant English or Mandarin result for %s', (query, id) => {
    expect(
      searchResources(resources, query, 'All', 'All', 'All', 'All', now)
        .slice(0, 5)
        .map((r) => r.id),
    ).toContain(id);
  });
  it('combines campus, audience and published term filters', () => {
    const matches = searchResources(
      resources,
      '',
      'deadline',
      'Vancouver',
      'Spring 2027',
      'Undergraduate',
      now,
    );
    expect(matches.some((r) => r.id === 'spring-withdrawal')).toBe(true);
    expect(
      matches.every(
        (r) => r.campuses?.includes('Vancouver') && (!r.term || r.term === 'Spring 2027'),
      ),
    ).toBe(true);
    expect(
      searchResources(resources, 'gss food', 'food', 'All', 'All', 'Undergraduate', now).some(
        (r) => r.id === 'gss-food-support',
      ),
    ).toBe(false);
  });
  it('ranks source-reviewed applicable results ahead of an unreviewed exact title', () => {
    const checked = {
      ...find('belzberg-library'),
      title: 'Quiet study information',
      aliases: ['quiet study'],
    };
    const unchecked = {
      ...checked,
      id: 'unknown',
      title: 'Quiet study',
      verification: { ...checked.verification, status: 'unresolved' as const, verifiedAt: null },
      lastVerified: null,
    };
    expect(
      searchResources([unchecked, checked], 'quiet study', 'All', 'All', 'All', 'All', now)[0].id,
    ).toBe(checked.id);
  });
  it('excludes historical/discontinued results and past deadlines from current recommendations', () => {
    const old = { ...find('deadline-3'), lifecycle: 'historical' as const };
    expect(searchResources([old], 'withdrawal')).toEqual([]);
    const expired = { ...find('drop-in-recreation'), validUntil: '2026-09-30' };
    expect(thisWeekResources([expired], now)).toEqual([]);
    expect(filteredScheduleResource(expired, 'All', 'All', now)).toBeUndefined();
  });
  it('resolves merged public IDs and preserves essential editable poster conditions', () => {
    for (const [old, canonical] of Object.entries(mergedResourceIds))
      expect(resolveResource(old)?.id).toBe(canonical);
    const r = find('residence-offers-contracts');
    const body = resourcePosterText(r);
    expect(body).toMatch(/non-refundable/i);
    const patch = resourceBlockPatch(makeBlock('info'), r);
    expect(patch.block?.body).toContain('non-refundable');
    expect(patch.provenance?.[0].sourceUrl).toBe(r.sourceUrl);
    expect(resourcePosterText(find('accessible-learning-registration'))).toMatch(/deadlines/);
    expect(resourcePosterText(find('deadline-2'))).toMatch(/separate.*academic-record/);
  });
  it('keeps unconfirmed high-impact posters to qualified service navigation', () => {
    const r = find('food-pantry');
    expect(r.lastVerified).toBeNull();
    expect(resourcePosterText(r)).toContain('Published access details conflict');
    expect(resourcePosterText(r)).not.toMatch(/12:30|Wednesday|Friday|1330/);
  });
});
