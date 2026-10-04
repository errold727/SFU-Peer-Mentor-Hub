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
