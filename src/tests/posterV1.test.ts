import { beforeEach, describe, expect, it } from 'vitest';
import { autoArrange, elementBounds, intersects } from '../poster/layout';
import { posterQuality } from '../poster/quality';
import { createTemplate } from '../poster/templates';
import { makeElement, posterSizes, type PosterElement } from '../poster/posterTypes';
import {
  DRAFT_KEY,
  deleteDraft,
  duplicateDraft,
  readDrafts,
  saveDraft,
  validPosterDocument,
} from '../poster/drafts';
import { applyPosterStyle, posterStyles } from '../poster/styles';
import { usePosterStore } from '../store/posterStore';
const measure = (e: PosterElement) =>
  Math.ceil(e.text.length / Math.max(1, (e.width - 2 * e.padding) / (e.fontSize * 0.55))) *
    e.fontSize *
    e.lineHeight +
  e.padding * 2;
describe('readable automatic poster layout', () => {
  it.each([1, 2, 3, 4, 5, 6, 8])(
    'arranges %s cards without overlap or unreadable text',
    (count) => {
      for (const size of Object.keys(posterSizes)) {
        const base = createTemplate();
        base.size = size;
        // Template resized to each format, just as in the editor.
        const ratio = posterSizes[size].height / 1056;
        base.elements = base.elements.map((e) => ({
          ...e,
          y: e.y * ratio,
          height: e.height * ratio,
          width: (e.width * posterSizes[size].width) / 816,
        }));
        base.elements.push(
          ...Array.from({ length: count }, () =>
            makeElement('resource', { text: 'A concise sourced resource', fontSize: 20 }),
          ),
        );
        const result = autoArrange(base, '', measure);
        const cards = result.document.elements.filter((e) => e.type === 'resource');
        for (const [i, c] of cards.entries()) {
          expect(c.fontSize).toBeGreaterThanOrEqual(16);
          expect(c.x).toBeGreaterThanOrEqual(0);
          expect(c.y + c.height).toBeLessThan(posterSizes[size].height);
          for (const other of cards.slice(i + 1)) expect(intersects(c, other)).toBe(false);
        }
      }
    },
  );
  it('warns about density while preserving full text', () => {
    const doc = createTemplate();
    const text = 'Very long factual content '.repeat(500);
    doc.elements.push(makeElement('resource', { text }));
    const result = autoArrange(doc, '', measure);
    expect(result.warnings[0]).toContain('too much content');
    expect(result.document.elements.at(-1)?.text).toBe(text);
    expect(result.document.elements.at(-1)?.fontSize).toBe(16);
  });
  it('preserves hidden and locked cards and avoids existing body content', () => {
    const doc = createTemplate('welcome');
    const locked = makeElement('resource', { locked: true }),
      hidden = makeElement('resource', { visible: false });
    doc.elements.push(locked, hidden, makeElement('resource'));
    const result = autoArrange(doc, '', measure);
    expect(result.document.elements.find((e) => e.id === locked.id)).toEqual(locked);
    expect(result.document.elements.find((e) => e.id === hidden.id)).toEqual(hidden);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
  it('accounts for rotated bounds', () =>
    expect(
      elementBounds(makeElement('text', { x: 0, y: 0, rotation: 90, width: 100, height: 50 })).x,
    ).toBeCloseTo(-50));
});
describe('poster quality', () => {
  it('reports overflow, overlap, small text, contrast, bounds and empty content', () => {
    const doc = createTemplate();
    doc.elements.push(
      makeElement('resource', {
        x: -10,
        text: 'overflow '.repeat(100),
        width: 200,
        height: 100,
        fontSize: 8,
        color: '#ffffff',
        backgroundColor: '#ffffff',
      }),
      makeElement('resource', { x: 10, text: '' }),
    );
    const codes = posterQuality(doc, '', measure).map((i) => i.code);
    for (const code of ['overflow', 'overlap', 'small', 'contrast', 'bounds', 'empty', 'margin'])
      expect(codes).toContain(code);
  });
  it('does not report hidden text as exported content', () => {
    const doc = createTemplate();
    doc.elements.push(makeElement('resource', { visible: false, x: -500, fontSize: 1 }));
    expect(posterQuality(doc, '', measure).some((i) => i.code === 'bounds')).toBe(false);
  });
  it.each(Object.keys(posterStyles) as (keyof typeof posterStyles)[])(
    '%s style retains editable text and readable contrast',
    (id) => {
      const doc = createTemplate();
      const styled = applyPosterStyle(doc, id);
      expect(styled.elements.map((e) => e.text)).toEqual(doc.elements.map((e) => e.text));
      expect(posterQuality(styled, '', measure).some((i) => i.code === 'contrast')).toBe(false);
    },
  );
});
describe('explicit local draft privacy', () => {
  beforeEach(() => {
    localStorage.clear();
    usePosterStore.getState().reset();
  });
  it('never saves editor changes or recipient fields automatically', () => {
    const s = usePosterStore.getState();
    s.setRecipientName('PrivateSample');
    s.update(s.document.elements[1].id, { text: 'Changed' });
    expect(localStorage.length).toBe(0);
    saveDraft(localStorage, s.document, 'PrivateSample');
    expect(localStorage.getItem(DRAFT_KEY)).not.toContain('PrivateSample');
  });
  it('saves personalized drafts only with explicit inclusion and supports duplicate/delete', () => {
    const draft = saveDraft(localStorage, createTemplate('welcome'), 'PrivateSample', true);
    expect(readDrafts(localStorage)[0].recipientName).toBe('PrivateSample');
    duplicateDraft(localStorage, draft.id);
    expect(readDrafts(localStorage)).toHaveLength(2);
    deleteDraft(localStorage, draft.id);
    expect(readDrafts(localStorage)).toHaveLength(1);
    deleteDraft(localStorage, readDrafts(localStorage)[0].id);
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });
  it('rejects corrupted storage and unsafe remote images', () => {
    localStorage.setItem(DRAFT_KEY, 'broken');
    expect(() => readDrafts(localStorage)).toThrow();
    const doc = createTemplate();
    doc.elements.push(makeElement('image', { src: 'https://tracking.example/private' }));
    expect(validPosterDocument(doc)).toBe(false);
    expect(validPosterDocument({ ...doc, size: 'unknown' })).toBe(false);
  });
  it('reports quota failure without modifying the in-memory editor', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('Full', 'QuotaExceededError');
      },
    } as unknown as Storage;
    const doc = createTemplate();
    expect(() => saveDraft(storage, doc, '')).toThrow();
    expect(doc.elements).toHaveLength(4);
  });
});
