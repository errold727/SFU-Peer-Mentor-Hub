import type { PosterDocument, PosterElement } from './posterTypes';
import { posterSizes } from './posterTypes';
export function arrangeBlocks(
  doc: PosterDocument,
  name = '',
  measure: (e: PosterElement, name?: string) => number = () => 80,
) {
  const size = posterSizes[doc.size],
    margin = 32,
    gap = 14;
  const headers = doc.elements.filter((e) => e.visible && e.block?.role === 'header');
  const footers = doc.elements.filter(
    (e) => e.visible && (e.block?.role === 'footer' || e.type === 'footer'),
  );
  const cards = doc.elements
    .filter((e) => e.visible && !e.locked && (e.block?.role === 'content' || e.type === 'resource'))
    .sort((a, b) => a.zIndex - b.zIndex);
  if (!cards.length) return { document: doc, warnings: ['Add unlocked sections to arrange.'] };
  const top = Math.max(margin, ...headers.map((e) => e.y + e.height + gap)),
    bottom = Math.min(size.height - margin, ...footers.map((e) => e.y - gap));
  let areas = [{ x: margin, y: top, width: size.width - 2 * margin, height: bottom - top }];
  for (const e of doc.elements.filter(
    (e) => e.visible && e.locked && e.y + e.height > top && e.y < bottom,
  )) {
    areas = areas.flatMap((a) =>
      e.x >= a.x + a.width || e.x + e.width <= a.x || e.y >= a.y + a.height || e.y + e.height <= a.y
        ? [a]
        : [
            { ...a, width: e.x - gap - a.x },
            { ...a, x: e.x + e.width + gap, width: a.x + a.width - e.x - e.width - gap },
            { ...a, height: e.y - gap - a.y },
            { ...a, y: e.y + e.height + gap, height: a.y + a.height - e.y - e.height - gap },
          ].filter((r) => r.width >= 180 && r.height >= 100),
    );
  }
  const area = areas.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (!area)
    return { document: doc, warnings: ['No free area. Unlock or move sections before arranging.'] };
  const measureRow = (group: PosterElement[]) => {
    const width = (area.width - gap * (group.length - 1)) / group.length;
    const elements = group.map((e) => ({ ...e, width, rotation: 0 }));
    return { elements, height: Math.max(72, ...elements.map((e) => measure(e, name) + 4)) };
  };
  const groups: PosterElement[][] = [];
  const remaining = [...cards];
  if (remaining[0].block?.kind === 'highlight' || remaining.length % 2 === 1)
    groups.push([remaining.shift()!]);
  while (remaining.length) groups.push(remaining.splice(0, 2));
  let rows = groups.map(measureRow);
  const totalHeight = (candidate: typeof rows) =>
    candidate.reduce((sum, row) => sum + row.height, 0) + gap * (candidate.length - 1);
  // Keep a leading full-width announcement when it fits. Otherwise measure alternate
  // rows before clipping content: pairing it may avoid a nearly empty final row.
  if (totalHeight(rows) > area.height) {
    const best: { rows: typeof rows; height: number }[] = Array(cards.length + 1);
    best[cards.length] = { rows: [], height: 0 };
    for (let index = cards.length - 1; index >= 0; index--) {
      for (let count = 1; count <= Math.min(2, cards.length - index); count++) {
        if ((area.width - gap * (count - 1)) / count < 180) continue;
        const row = measureRow(cards.slice(index, index + count));
        const next = best[index + count];
        const height = row.height + (next.rows.length ? gap : 0) + next.height;
        if (!best[index] || height < best[index].height)
          best[index] = { rows: [row, ...next.rows], height };
      }
    }
    if (best[0] && best[0].height < totalHeight(rows)) rows = best[0].rows;
  }
  const available = area.height - gap * (rows.length - 1),
    needed = rows.reduce((sum, r) => sum + r.height, 0);
  const extra = Math.max(0, available - needed) / rows.length;
  const arranged = new Map<string, PosterElement>();
  let y = area.y;
  for (const row of rows) {
    const height =
      needed > available ? Math.max(20, (row.height * available) / needed) : row.height + extra;
    row.elements.forEach((e, i) =>
      arranged.set(e.id, { ...e, x: area.x + i * (e.width + gap), y, height }),
    );
    y += height + gap;
  }
  return {
    document: { ...doc, elements: doc.elements.map((e) => arranged.get(e.id) ?? e) },
    warnings:
      needed > available
        ? [
            'This poster contains too much content for this layout. Remove a section or use a larger format. Text remains editable.',
          ]
        : [],
  };
}
