import { describe, expect, it } from 'vitest';
import { arrangeBlocks } from '../poster/blockArrange';
import { makeBlock } from '../poster/blocks';
import type { PosterDocument } from '../poster/posterTypes';
import { intersects } from '../poster/layout';

function sixCardPoster(): PosterDocument {
  return {
    size: 'letter',
    template: 'blank',
    background: '#ffffff',
    elements: [
      makeBlock('title', { title: 'Weekly update' }, { x: 32, y: 32, width: 752, height: 268 }),
      ...Array.from({ length: 6 }, (_, index) =>
        makeBlock(
          index === 0 ? 'highlight' : 'info',
          { title: `Card ${index}`, body: `Complete wording for card ${index}` },
          { zIndex: index + 1, fontSize: 18 },
        ),
      ),
      makeBlock(
        'footer',
        { body: 'Contact details' },
        { x: 32, y: 982, width: 752, height: 42, zIndex: 8 },
      ),
    ],
  };
}
describe('measured alternative block rows', () => {
  it('fits six dense cards in three rows when a wide announcement would require four', () => {
    const original = sixCardPoster();
    const { document, warnings } = arrangeBlocks(original, '', () => 180);
    const cards = document.elements.filter((element) => element.block?.role === 'content');
    expect(warnings).toEqual([]);
    expect(new Set(cards.map((element) => element.y)).size).toBe(3);
    for (const [index, card] of cards.entries()) {
      expect(card.height).toBeGreaterThanOrEqual(180);
      expect(card.y).toBeGreaterThanOrEqual(314);
      expect(card.y + card.height).toBeLessThanOrEqual(968);
      expect(card.fontSize).toBe(18);
      expect(card.block).toEqual(original.elements[index + 1].block);
      for (const other of cards.slice(index + 1)) expect(intersects(card, other)).toBe(false);
    }
    expect(document.elements[0]).toEqual(original.elements[0]);
    expect(document.elements.at(-1)).toEqual(original.elements.at(-1));
  });
  it('retains the preferred full-width announcement when all content fits', () => {
    const { document, warnings } = arrangeBlocks(sixCardPoster(), '', () => 80);
    expect(warnings).toEqual([]);
    expect(document.elements[1].width).toBe(752);
  });
  it('keeps full wording and font sizes and warns when even the best rows cannot fit', () => {
    const original = sixCardPoster();
    const { document, warnings } = arrangeBlocks(original, '', () => 1000);
    expect(warnings).toHaveLength(1);
    for (const [index, element] of document.elements.entries()) {
      expect(element.block).toEqual(original.elements[index].block);
      expect(element.fontSize).toBe(original.elements[index].fontSize);
    }
  });
});

describe('reserved boundaries and minimum row space', () => {
  it('does not move existing content when a header reaches beyond the footer', () => {
    const original = sixCardPoster();
    original.elements[0] = { ...original.elements[0], y: 960, height: 72 };
    original.elements[1] = { ...original.elements[1], y: 420, height: 160 };
    original.elements.at(-1)!.y = 986;
    const result = arrangeBlocks(original, '', () => 180);
    expect(result.document).toBe(original);
    expect(result.document.elements[1]).toMatchObject({ y: 420, height: 160 });
    expect(result.warnings.join(' ')).toContain('No free area');
  });
  it('leaves the layout unchanged when positive space cannot hold minimum rows and gaps', () => {
    const original = sixCardPoster();
    original.elements[0] = { ...original.elements[0], y: 32, height: 740 };
    const result = arrangeBlocks(original, '', () => 180);
    expect(result.document).toBe(original);
    expect(result.warnings.join(' ')).toContain('readable rows');
  });
  it('clips off-page reserved bounds to the printable area', () => {
    const original = sixCardPoster();
    original.elements[0] = { ...original.elements[0], y: -300, height: 100 };
    original.elements.at(-1)!.y = 1400;
    const result = arrangeBlocks(original, '', () => 80);
    expect(result.warnings).toEqual([]);
    for (const element of result.document.elements.filter((e) => e.block?.role === 'content')) {
      expect(element.y).toBeGreaterThanOrEqual(32);
      expect(element.y + element.height).toBeLessThanOrEqual(1024);
    }
    expect(result.document.elements[0]).toEqual(original.elements[0]);
    expect(result.document.elements.at(-1)).toEqual(original.elements.at(-1));
  });
  it('keeps unequal compressed rows above their minimum and inside reserved bounds', () => {
    const original = sixCardPoster();
    original.elements = [
      original.elements[0],
      ...original.elements.slice(1, 5),
      original.elements.at(-1)!,
    ];
    original.elements[0].height = 690;
    original.elements[1].block!.kind = 'info';
    const result = arrangeBlocks(original, '', (element) =>
      ['Card 0', 'Card 1'].includes(element.block!.title) ? 2000 : 72,
    );
    const cards = result.document.elements.filter((e) => e.block?.role === 'content');
    expect(result.warnings).toHaveLength(1);
    expect(new Set(cards.map((element) => element.y)).size).toBe(2);
    for (const [index, element] of cards.entries()) {
      expect(element.height).toBeGreaterThanOrEqual(72);
      expect(element.y).toBeGreaterThanOrEqual(736);
      expect(element.y + element.height).toBeLessThanOrEqual(968.00001);
      for (const other of cards.slice(index + 1)) expect(intersects(element, other)).toBe(false);
    }
  });
});
