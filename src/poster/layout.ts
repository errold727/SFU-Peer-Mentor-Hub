import { arrangeBlocks } from './blockArrange';
import { blockParts } from './blockLayout';
import Konva from 'konva';
import {
  posterSizes,
  resolveRecipient,
  type PosterDocument,
  type PosterElement,
} from './posterTypes';

export function textHeight(element: PosterElement, recipientName = '') {
  if (element.block) return blockParts(element, recipientName).height;
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

export const MIN_BODY_FONT = 16;
export type Bounds = { x: number; y: number; width: number; height: number };
export const intersects = (a: Bounds, b: Bounds) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
export function elementBounds(e: PosterElement): Bounds {
  const angle = (e.rotation * Math.PI) / 180,
    cos = Math.cos(angle),
    sin = Math.sin(angle);
  const points = [
    [0, 0],
    [e.width, 0],
    [0, e.height],
    [e.width, e.height],
  ].map(([x, y]) => [e.x + x * cos - y * sin, e.y + x * sin + y * cos]);
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}
export type MeasureText = (e: PosterElement, name?: string) => number;
/** Keep complete editable text. Dense layouts remain readable and visibly warn about overflow. */
export function autoArrange(
  document: PosterDocument,
  name = '',
  measure: MeasureText = textHeight,
) {
  if (document.elements.some((e) => e.block)) return arrangeBlocks(document, name, measure);
  const cards = document.elements.filter((e) => e.visible && e.type === 'resource' && !e.locked);
  if (!cards.length) return { document, warnings: ['Add unlocked resource cards to arrange.'] };
  const size = posterSizes[document.size],
    margin = Math.max(32, Math.min(size.width, size.height) * 0.045),
    gap = 20;
  const headers = document.elements.filter(
    (e) => e.visible && e.type === 'text' && e.y < size.height * 0.23,
  );
  const top = Math.max(
    size.height * 0.23,
    ...headers.map((e) => elementBounds(e).y + elementBounds(e).height + gap),
  );
  const bottom = Math.min(
    size.height - margin,
    ...document.elements.filter((e) => e.visible && e.type === 'footer').map((e) => e.y - gap),
  );
  let spaces: Bounds[] = [
    { x: margin, y: top, width: size.width - 2 * margin, height: bottom - top },
  ];
  const obstacles = document.elements.filter(
    (e) => e.visible && !cards.includes(e) && !headers.includes(e) && e.type !== 'footer',
  );
  for (const obstacle of obstacles) {
    const b = elementBounds(obstacle),
      padded = { x: b.x - gap, y: b.y - gap, width: b.width + 2 * gap, height: b.height + 2 * gap };
    spaces = spaces.flatMap((a) =>
      !intersects(a, padded)
        ? [a]
        : [
            { ...a, width: padded.x - a.x },
            { ...a, x: padded.x + padded.width, width: a.x + a.width - padded.x - padded.width },
            { ...a, height: padded.y - a.y },
            {
              ...a,
              y: padded.y + padded.height,
              height: a.y + a.height - padded.y - padded.height,
            },
          ].filter((r) => r.width >= 180 && r.height >= 100),
    );
  }
  const area = spaces.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (!area)
    return {
      document,
      warnings: [
        'No free area for resource cards. Move existing content or choose a resource template.',
      ],
    };
  let best: PosterElement[] = [],
    bestScore = Infinity;
  for (let columns = 1; columns <= Math.min(cards.length, size.width >= 1600 ? 3 : 2); columns++) {
    const rows = Math.ceil(cards.length / columns),
      width = (area.width - gap * (columns - 1)) / columns,
      height = (area.height - gap * (rows - 1)) / rows;
    if (width < 180 || height < 60) continue;
    const arranged = cards.map((e, i) => {
      const card = {
        ...e,
        x: area.x + (i % columns) * (width + gap),
        y: area.y + Math.floor(i / columns) * (height + gap),
        width,
        height,
        rotation: 0,
        padding: 12,
        fontSize: Math.max(MIN_BODY_FONT, Math.min(e.fontSize, 24)),
      };
      while (card.fontSize > MIN_BODY_FONT && measure(card, name) > height) card.fontSize -= 0.5;
      return card;
    });
    const score = arranged.reduce(
      (sum, e) => sum + Math.max(0, measure(e, name) - height) * 100 + (24 - e.fontSize),
      0,
    );
    if (score < bestScore) {
      bestScore = score;
      best = arranged;
    }
  }
  if (!best.length)
    return {
      document,
      warnings: ['Too many cards for a readable layout. Remove a section or use a larger format.'],
    };
  const warnings = best.some((e) => measure(e, name) > e.height + 1)
    ? [
        'This poster contains too much content for this layout. Remove a section or use a larger format. Text has not been removed or reduced below 16 px.',
      ]
    : [];
  return {
    document: {
      ...document,
      elements: document.elements.map((e) => best.find((b) => b.id === e.id) ?? e),
    },
    warnings,
  };
}
export const fitResourceCards = (document: PosterDocument) => autoArrange(document).document;
