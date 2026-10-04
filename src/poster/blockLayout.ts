import Konva from 'konva';
import { type PosterElement, resolveRecipient } from './posterTypes';
export type BlockPart = {
  kind: 'text' | 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fill: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  radius?: number;
  lines?: string[];
};
/** Shared measured layout for canvas, thumbnail and quality checks. */
export function blockParts(e: PosterElement, name = '') {
  const b = e.block!;
  const parts: BlockPart[] = [];
  const p = e.padding,
    w = Math.max(1, e.width - p * 2);
  let y = p;
  const addText = (
    text: string,
    x: number,
    top: number,
    width: number,
    size: number,
    color: string,
    bold = false,
    align = e.align,
  ) => {
    text = resolveRecipient(text, name);
    const node = new Konva.Text({
      text,
      width,
      fontSize: size,
      fontFamily: e.fontFamily,
      fontStyle: bold ? 'bold' : 'normal',
      lineHeight: e.lineHeight,
      letterSpacing: e.letterSpacing,
    });
    const height = node.height();
    const lines = node.textArr.map((l) => l.text);
    node.destroy();
    parts.push({
      kind: 'text',
      x,
      y: top,
      width,
      height,
      text,
      fill: color,
      fontSize: size,
      fontFamily: e.fontFamily,
      bold,
      align,
      lines,
    });
    return height;
  };
  const rect = (x: number, top: number, width: number, height: number, fill: string, radius = 0) =>
    parts.push({ kind: 'rect', x, y: top, width, height, fill, radius });
  if (['hero', 'image', 'qr', 'divider'].includes(b.kind)) return { parts, height: 0 };
  if (b.kind === 'title') {
    if (b.bannerStyle === 'underline') rect(p, e.height - 8, w, 5, b.accentColor);
    else rect(0, 0, e.width, e.height, b.accentColor, b.bannerStyle === 'brush' ? 0 : b.radius);
    if (b.bannerStyle === 'brush') {
      rect(5, 2, e.width - 15, 5, e.backgroundColor);
      rect(0, e.height - 5, e.width - 20, 5, e.backgroundColor);
    }
    y +=
      addText(
        b.title,
        p,
        y,
        w,
        e.fontSize,
        b.bannerStyle === 'underline' ? b.accentColor : e.color,
        true,
      ) + 4;
  } else if (['greeting', 'text', 'footer'].includes(b.kind)) {
    if (b.title) y += addText(b.title, p, y, w, e.fontSize + 3, e.color, true) + 8;
    y += addText(
      [b.icon, b.body].filter(Boolean).join(' '),
      p,
      y,
      w,
      e.fontSize,
      e.color,
      e.fontWeight === 'bold',
    );
  } else {
    rect(0, 0, 4, e.height, b.accentColor);
    if (b.title)
      y +=
        addText(
          [b.icon, b.title].filter(Boolean).join(' '),
          p,
          y,
          w,
          e.fontSize + 4,
          b.accentColor,
          true,
        ) + 8;
    if (b.subtitle) y += addText(b.subtitle, p, y, w, e.fontSize - 1, e.color, true) + 6;
    if (['table', 'schedule'].includes(b.kind)) {
      const cw = w / Math.max(1, b.columns.length);
      const drawRow = (cells: string[], header: boolean, index: number) => {
        const start = parts.length;
        const heights = cells
          .slice(0, b.columns.length)
          .map((c, i) =>
            addText(
              c,
              p + i * cw + 7,
              y + 8,
              cw - 14,
              e.fontSize,
              header ? '#ffffff' : e.color,
              header,
              b.columnAlign[i] || 'left',
            ),
          );
        const h = Math.max(e.fontSize * e.lineHeight, ...heights) + 16;
        parts.splice(start, 0, {
          kind: 'rect',
          x: p,
          y,
          width: w,
          height: h,
          fill: header ? b.headerColor : index % 2 === 0 ? b.rowColor : e.backgroundColor,
        });
        y += h;
      };
      drawRow(b.columns, true, 0);
      b.rows.forEach((r, i) => drawRow(r, false, i));
    } else if (['list', 'checklist'].includes(b.kind)) {
      b.items.forEach((item, i) => {
        y +=
          addText(`${b.kind === 'checklist' ? '☐' : '•'}  ${item}`, p, y, w, e.fontSize, e.color) +
          8;
        if (i === b.items.length - 1) y -= 8;
      });
    } else if (b.body) y += addText(b.body, p, y, w, e.fontSize, e.color);
  }
  return { parts, height: y + p };
}
