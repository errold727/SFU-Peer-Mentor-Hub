import { describe, expect, it } from 'vitest';
import { defineResource } from '../data/resources/catalog/define';
import { validateResources } from '../utils/resourceValidation';
import { resourceStatus, sessionOccursOn } from '../utils/resourceStatus';

const now = new Date('2026-10-04T18:00:00Z');
const checked = '2026-10-04T15:00:00Z';
export const fixture = () =>
  defineResource({
    id: 'synthetic-service',
    title: 'Synthetic service',
    category: 'library',
    topic: '05',
    summary: 'A test-only directory record.',
    provider: { name: 'SFU Library', type: 'sfu' },
    access: ['Open the official page.'],
    eligibility: ['Check the service conditions.'],
    audiences: ['All students'],
    campuses: ['Burnaby'],
    cost: { status: 'unknown' },
    verification: {
      status: 'reviewed',
      verifiedAt: checked,
      reviewedAt: checked,
      reviewer: 'agent',
    },
    reviewCadence: 'schedule',
    highImpact: false,
    poster: {
      title: 'Synthetic service',
      facts: ['Open the page.', 'Check access.'],
      conditions: [],
      mode: 'facts',
    },
    sources: [
      {
        title: 'SFU Library',
        url: 'https://www.lib.sfu.ca/',
        locator: 'Synthetic fixture',
        fields: ['summary', 'access', 'eligibility'],
        retrievalStatus: 'retrieved',
        lastRetrievalAttemptAt: checked,
        lastRetrievedAt: checked,
      },
    ],
  });
describe('resource evidence model', () => {
  it('derives compatibility fields without certifying partial reviews', () => {
    const r = fixture();
    expect(validateResources([r], now).errors).toEqual([]);
    expect(r.reviewDueAt).toBe('2026-10-11');
    const partial = defineResource({
      ...r,
      verification: { ...r.verification, status: 'partial', verifiedAt: null },
      sources: [
        { ...r.sources[0], locator: 'Identity only', fields: ['summary', 'access', 'eligibility'] },
      ],
    });
    expect(partial.lastVerified).toBeNull();
    expect(resourceStatus(partial, now).label).toBe('Partially reviewed');
  });
  it('keeps verification, freshness and lifecycle independent', () => {
    const r = fixture();
    expect(resourceStatus(r, new Date('2026-10-15T18:00Z'))).toMatchObject({
      reviewed: true,
      freshness: 'due',
      lifecycle: 'active',
    });
    expect(resourceStatus({ ...r, validUntil: '2026-10-03' }, now).lifecycle).toBe('expired');
    expect(resourceStatus({ ...r, lifecycle: 'discontinued' }, now).lifecycle).toBe('discontinued');
    expect(resourceStatus({ ...r, validFrom: '2026-10-05' }, now).future).toBe(true);
  });
  it('rejects unsupported facts, broken relationships and inconsistent verification', () => {
    const r = fixture();
    const result = validateResources(
      [
        {
          ...r,
          facts: [{ label: 'Fee', value: '$100' }],
          relatedIds: ['missing'],
          lastVerified: '2026-10-03',
        },
      ],
      now,
    );
    expect(result.errors.join(' ')).toMatch(/missing evidence for facts.0/);
    expect(result.errors.join(' ')).toMatch(/broken related ID/);
    expect(result.errors.join(' ')).toMatch(/consistent verification/);
  });
  it('requires high-impact second review and safe unresolved posters', () => {
    const r = { ...fixture(), highImpact: true };
    expect(validateResources([r], now).errors.join(' ')).toMatch(/separate review/);
    expect(
      validateResources(
        [
          {
            ...r,
            verification: { ...r.verification, status: 'partial', verifiedAt: null },
            lastVerified: null,
          },
        ],
        now,
      ).errors.join(' '),
    ).toMatch(/service link/);
  });
  it('rejects private fields, unsafe URLs, HTML and implied free costs', () => {
    const r = {
      ...fixture(),
      actionUrl: 'javascript:alert(1)',
      summary: '<script>x</script>',
      cost: { status: 'unknown' as const, details: 'free' },
      recipientName: 'Synthetic only',
    };
    const errors = validateResources([r], now).errors.join(' ');
    expect(errors).toMatch(/action URL/);
    expect(errors).toMatch(/unsafe HTML/);
    expect(errors).toMatch(/credential field/);
    expect(errors).toMatch(/cannot mean free/);
  });
  it('bounds recurring sessions and excludes known closures in Vancouver', () => {
    const session = {
      day: 'Monday',
      start: '11:30 AM',
      end: '1:30 PM',
      location: 'Test gym',
      validFrom: '2026-09-14',
      validUntil: '2026-12-04',
      exceptions: ['2026-10-12'],
    };
    expect(sessionOccursOn(session, '2026-10-05')).toBe(true);
    for (const date of ['2026-10-12', '2026-10-06', '2026-12-07', '2026-02-30'])
      expect(sessionOccursOn(session, date)).toBe(false);
  });
});
