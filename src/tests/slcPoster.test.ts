import { describe, expect, it, vi, afterEach } from 'vitest';
import { resources } from '../data/resources';
import { resourcePosterText, resourceText } from '../utils/search';
import { programRegistrationUrl } from '../utils/resourceOccurrences';
import { makeBlock, resourceBlockPatch } from '../poster/blocks';
import { usePosterStore } from '../store/posterStore';

const now = new Date('2026-10-05T19:00:00Z');
const resource = (id: string) => resources.find((item) => item.id === id)!;
afterEach(() => {
  vi.useRealTimers();
  usePosterStore.getState().reset();
});

describe('SLC canonical resource poster integration', () => {
  it('inserts the next session as editable date, time, location and short description', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const r = resource('slc-public-speaking');
    const text = resourcePosterText(r, now);
    expect(text).toContain('2026-10-06');
    expect(text).toContain('12:30 PM–1:30 PM');
    expect(text).toContain('Hybrid');
    expect(text).toContain('AQ 3020');
    expect(text).not.toContain('2026-10-26');
    expect(text.length).toBeLessThan(650);
    expect(text.split('\n').length).toBeLessThanOrEqual(10);
    const patch = resourceBlockPatch(makeBlock('info'), r);
    expect(patch.block?.body).toContain('2026-10-06');
    expect(patch.provenance?.[0].id).toBe(r.id);
    expect(patch).not.toHaveProperty('src');
    usePosterStore.getState().importResources([r]);
    const element = usePosterStore.getState().document.elements.find((e) => e.resourceId === r.id)!;
    expect(element.type).toBe('resource');
    expect(element.text).toBe(text);
    usePosterStore.getState().update(element.id, { text: 'Mentor-edited workshop text' });
    expect(usePosterStore.getState().document.elements.find((e) => e.id === element.id)?.text).toBe(
      'Mentor-edited workshop text',
    );
  });
  it('advances within the same canonical program and qualifies completed offerings', () => {
    const r = resource('slc-public-speaking');
    const next = resourcePosterText(r, new Date('2026-10-07T19:00:00Z'));
    expect(next).toContain('2026-10-26');
    expect(next).not.toContain('2026-10-06');
    expect(next).toContain('11:30 AM–12:20 PM');
    const ended = resourcePosterText(r, new Date('2026-10-27T19:00:00Z'));
    expect(ended).toContain('This program has completed.');
    expect(ended).not.toContain('Next session:');
  });
  it('never substitutes questionable times or drops Indigenous-only conditions', () => {
    const r = resource('slc-drop-in-indigenous-surrey');
    const text = resourcePosterText(r, now);
    expect(text).toContain('For self-identified Indigenous students only.');
    expect(text).toContain('confirm with SLC');
    expect(text).not.toMatch(/11:00 (?:AM|PM)/);
    expect(resourceText(r)).toContain('Time not confirmed');
  });
  it.each([
    ['slc-conversation-partners', '2026-09-21–2026-12-04'],
    ['slc-neurolanguage-coaching', '2026-09-21–2026-12-10'],
  ])(
    'keeps the explicit service window in %s without invented appointment times or location',
    (id, window) => {
      const r = resource(id);
      const text = resourcePosterText(r, now);
      expect(text).toContain(`Guide service window: ${window}`);
      expect(text).not.toMatch(/\d{1,2}:\d{2}|Burnaby|Surrey|Vancouver|Hybrid|Online/);
      expect(text).not.toContain(r.program!.scheduleText!);
      expect(text.match(/Guide service window/g)).toHaveLength(1);
    },
  );
  it('qualifies the guide consultation end date without copying its questionable calendar claim', () => {
    const text = resourcePosterText(resource('writing'), now);
    expect(text).toContain(
      'Guide service window (confirm dates with provider): 2026-09-14–2026-12-12',
    );
    expect(text).toContain('SFU students taking credit courses');
    expect(text).not.toContain('last day of classes');
    expect(text).not.toMatch(/\d{1,2}:\d{2}/);
  });
  it('does not fabricate missing service bounds or retain expired windows as current', () => {
    const startOnly = resourcePosterText(resource('slc-writeaway'), now);
    expect(startOnly).toContain('Guide service window: from 2026-09-21; end date not published');
    const endOnly = structuredClone(resource('slc-writeaway'));
    endOnly.program!.startDate = undefined;
    endOnly.program!.endDate = '2026-10-10';
    expect(resourcePosterText(endOnly, now)).toContain(
      'Guide service window: through 2026-10-10; start date not published',
    );
    const ended = resourcePosterText(
      resource('slc-neurolanguage-coaching'),
      new Date('2026-12-11T20:00:00Z'),
    );
    expect(ended).toContain('This program has completed.');
    expect(ended).not.toContain('Guide service window:');
    expect(resourcePosterText(resource('slc-vowel'), now)).not.toContain('Guide service window');
  });
  it('offers only verified structured program URLs for QR generation', () => {
    const workshop = resource('slc-public-speaking');
    expect(workshop.sourceUrl).toContain('lib.sfu.ca');
    expect(programRegistrationUrl(workshop)).toBeUndefined();
    expect(programRegistrationUrl(resource('slc-soup-circles'))).toBeUndefined();
    expect(programRegistrationUrl(resource('slc-writeaway'))).toBe('https://writeaway.ca/');
    expect(
      programRegistrationUrl({
        ...workshop,
        program: {
          ...workshop.program!,
          registrationUrl: 'https://example.invalid',
          registrationStatus: 'verified',
        },
      }),
    ).toBeUndefined();
  });
});
