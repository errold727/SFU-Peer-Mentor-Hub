import { beforeEach, describe, it, expect } from 'vitest';
import { makeBlock, imagePlacement, resourceBlockPatch } from '../poster/blocks';
import { createTemplate, templates } from '../poster/templates';
import { arrangeBlocks } from '../poster/blockArrange';
import { usePosterStore } from '../store/posterStore';
import { intersects } from '../poster/layout';
import { validPosterDocument, saveDraft, readDrafts } from '../poster/drafts';
import { resources } from '../data/resources';
import { posterQuality } from '../poster/quality';
describe('structured poster sections', () => {
  beforeEach(() => {
    usePosterStore.getState().reset();
    localStorage.clear();
  });
  it('provides ten distinct valid documents and a ten-section newsletter', () => {
    expect(new Set(templates.map((t) => t.id)).size).toBe(10);
    for (const t of templates) expect(validPosterDocument(createTemplate(t.id)), t.name).toBe(true);
    const newsletter = createTemplate('newsletter');
    expect(newsletter.elements).toHaveLength(10);
    expect(newsletter.elements.map((e) => e.block?.kind)).toEqual([
      'hero',
      'title',
      'greeting',
      'text',
      'highlight',
      'info',
      'schedule',
      'table',
      'info',
      'footer',
    ]);
  });
  it('duplicates structured content independently and undoes delete, replacement and visibility', () => {
    const s = usePosterStore.getState();
    s.applyTemplate('newsletter');
    const e = usePosterStore.getState().document.elements[7];
    s.duplicate(e.id);
    const copy = usePosterStore.getState().document.elements.at(-1)!;
    expect(copy.block).toEqual(e.block);
    expect(copy.block).not.toBe(e.block);
    s.update(copy.id, { visible: false });
    s.undo();
    expect(usePosterStore.getState().document.elements.at(-1)?.visible).toBe(true);
    s.remove(copy.id);
    s.undo();
    expect(usePosterStore.getState().document.elements.some((v) => v.id === copy.id)).toBe(true);
    s.redo();
    expect(usePosterStore.getState().document.elements.some((v) => v.id === copy.id)).toBe(false);
  });
  it('keeps source provenance intact while display wording changes', () => {
    const e = makeBlock('info');
    const r = resources[0];
    const replaced = { ...e, ...resourceBlockPatch(e, r) };
    const edited = { ...replaced, block: { ...replaced.block!, body: 'Custom wording' } };
    expect(edited.provenance?.[0]).toEqual({
      id: r.id,
      title: r.title,
      sourceUrl: r.sourceUrl,
      lastVerified: r.lastVerified,
    });
    expect(edited.sourceUrl).toBe(r.sourceUrl);
  });
  it.each([1, 2, 3, 4, 5, 6])(
    'rebalances %s cards without overlaps, preserving header and footer',
    (count) => {
      const doc = createTemplate('newsletter');
      const fixed = doc.elements.filter((e) => e.block?.role !== 'content');
      doc.elements = [
        ...fixed,
        ...Array.from({ length: count }, (_, i) =>
          makeBlock('info', { title: `Card ${i}` }, { zIndex: 10 + i }),
        ),
      ];
      const result = arrangeBlocks(doc).document;
      for (const e of fixed) expect(result.elements.find((v) => v.id === e.id)).toEqual(e);
      const cards = result.elements.filter((e) => e.block?.role === 'content');
      cards.forEach((e, i) => {
        expect(e.fontSize).toBeGreaterThanOrEqual(16);
        expect(e.x).toBeGreaterThanOrEqual(32);
        expect(e.y + e.height).toBeLessThan(970);
        for (const other of cards.slice(i + 1)) expect(intersects(e, other)).toBe(false);
      });
    },
  );
  it('excludes hidden sections and respects locked obstacles', () => {
    const doc = createTemplate('newsletter');
    doc.elements[5].visible = false;
    doc.elements[8].locked = true;
    const result = arrangeBlocks(doc).document;
    expect(result.elements[5]).toEqual(doc.elements[5]);
    expect(result.elements[8]).toEqual(doc.elements[8]);
    for (const e of result.elements.filter(
      (e) => e.visible && !e.locked && e.block?.role === 'content',
    ))
      expect(intersects(e, result.elements[8])).toBe(false);
  });
  it('cover and contain preserve image aspect ratio; fill is explicit', () => {
    const settings = makeBlock('hero').block!;
    const cover = imagePlacement(400, 200, 100, 100, settings);
    expect(cover).toMatchObject({ width: 400, height: 400, y: -100 });
    expect(imagePlacement(400, 200, 100, 100, { ...settings, fitMode: 'contain' })).toMatchObject({
      width: 200,
      height: 200,
      x: 100,
    });
    expect(imagePlacement(400, 200, 100, 100, { ...settings, fitMode: 'fill' })).toMatchObject({
      width: 400,
      height: 200,
    });
    expect(imagePlacement(400, 200, 100, 100, { ...settings, zoom: 2, offsetX: 1 }).x).toBe(0);
  });
  it('rejects malformed block drafts and keeps explicit image drafts local', () => {
    const doc = createTemplate('newsletter');
    saveDraft(localStorage, doc, 'PrivateName');
    expect(readDrafts(localStorage)[0].document.elements[0].src).toBe(doc.elements[0].src);
    expect(JSON.stringify(localStorage)).not.toContain('PrivateName');
    doc.elements[7].block!.rows = [['mismatch']];
    expect(validPosterDocument(doc)).toBe(false);
  });
  it('quality catches empty cards, block overflow, overlap and invalid QR data', () => {
    const a = makeBlock('info', { title: '', body: '' }, { height: 10 });
    const b = makeBlock('qr', { body: 'bad' }, { text: 'bad' });
    const doc = { ...createTemplate('blank'), elements: [a, b] };
    const issues = posterQuality(doc, '', () => 500).map((i) => i.code);
    for (const code of ['empty', 'overflow', 'overlap', 'qr-data']) expect(issues).toContain(code);
  });
});
