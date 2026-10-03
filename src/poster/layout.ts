import Konva from 'konva';
import {
  posterSizes,
  resolveRecipient,
  type PosterDocument,
  type PosterElement,
} from './posterTypes';

export function textHeight(element: PosterElement, recipientName = '') {
  const measurement = new Konva.Text({
    text: resolveRecipient(element.text, recipientName),
    width: element.width,
    fontSize: element.fontSize,
    fontFamily: element.fontFamily,
    fontStyle: element.fontWeight,
    lineHeight: element.lineHeight,
    letterSpacing: element.letterSpacing,
    padding: element.padding,
  });
  const height = measurement.height();
  measurement.destroy();
  return height;
}

/** Lay out only unlocked resource cards; keep all source text editable and intact. */
export function fitResourceCards(document: PosterDocument): PosterDocument {
  const cards = document.elements.filter((e) => e.type === 'resource' && !e.locked);
  if (!cards.length) return document;
  const size = posterSizes[document.size];
  const columns = cards.length > 1 ? 2 : 1;
  const rows = Math.ceil(cards.length / columns);
  const width = (size.width - 96 - (columns - 1) * 20) / columns;
  const height = Math.max(60, (size.height - 330) / rows - 20);
  return {
    ...document,
    elements: document.elements.map((element) => {
      const index = cards.indexOf(element);
      if (index < 0) return element;
      const e = {
        ...element,
        x: 48 + (index % columns) * (width + 20),
        y: 250 + Math.floor(index / columns) * (height + 20),
        width,
        height,
        padding: 12,
        fontSize: 20,
      };
      while (e.fontSize > 6 && textHeight(e) > height) e.fontSize -= 0.5;
      return e;
    }),
  };
}
