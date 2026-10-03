import { posterSizes, resolveRecipient, type PosterDocument } from './posterTypes';
import { elementBounds, intersects, MIN_BODY_FONT, textHeight, type MeasureText } from './layout';
import { contrastRatio } from './contrast';
export type QualityIssue = { code: string; message: string; elementId?: string };
export function posterQuality(
  doc: PosterDocument,
  name = '',
  measure: MeasureText = textHeight,
): QualityIssue[] {
  const size = posterSizes[doc.size];
  if (!size)
    return [{ code: 'invalid', message: 'Unknown canvas size. Choose a supported format.' }];
  const issues: QualityIssue[] = [],
    visible = doc.elements.filter((e) => e.visible);
  for (const e of visible) {
    const label = e.text.slice(0, 35) || e.type;
    const add = (code: string, message: string) =>
      issues.push({ code, message: `${label}: ${message}`, elementId: e.id });
    if (
      [e.x, e.y, e.width, e.height, e.fontSize, e.rotation].some((n) => !Number.isFinite(n)) ||
      e.width <= 0 ||
      e.height <= 0
    ) {
      add('invalid', 'invalid position or size.');
      continue;
    }
    const b = elementBounds(e);
    if (b.x < -1 || b.y < -1 || b.x + b.width > size.width + 1 || b.y + b.height > size.height + 1)
      add('bounds', 'extends outside the canvas and will be cropped.');
    const text = ['text', 'resource', 'footer', 'icon'].includes(e.type);
    if (text) {
      if (!resolveRecipient(e.text, name).trim() && e.type !== 'footer')
        add('empty', 'empty text. Enter content or remove this element.');
      if (e.fontSize < (e.type === 'footer' ? 12 : MIN_BODY_FONT))
        add('small', 'text is small. Use at least 16 px for body text and 12 px for footers.');
      if (measure(e, name) > e.height + 1)
        add(
          'overflow',
          'text overflows its card. Increase height or reduce font within readable limits.',
        );
      if (
        contrastRatio(
          e.color,
          e.backgroundColor === 'transparent' ? doc.background : e.backgroundColor,
        ) < 4.5
      )
        add('contrast', 'low text contrast against the background.');
      if (e.text.match(/\[Add |\[Introduce |\[Share /))
        add('placeholder', 'replace template placeholders before sharing.');
      if (
        b.x < 16 ||
        b.y < 16 ||
        b.x + b.width > size.width - 16 ||
        b.y + b.height > size.height - 16
      )
        add('margin', 'text is close to a printable edge; allow safe margins.');
    }
    if (e.type === 'qrcode' && Math.min(e.width, e.height) < 100)
      add('qr', 'QR code is small; scan-test the exported poster.');
  }
  const major = visible.filter(
    (e) => e.type === 'resource' || (e.type === 'text' && e.height >= 100),
  );
  for (let i = 0; i < major.length; i++)
    for (let j = i + 1; j < major.length; j++)
      if (intersects(elementBounds(major[i]), elementBounds(major[j])))
        issues.push({
          code: 'overlap',
          message: 'Major content cards overlap. Use Auto Arrange or reposition them.',
          elementId: major[j].id,
        });
  if (
    visible.filter((e) => e.type === 'resource').length >= 5 &&
    issues.some((i) => ['overflow', 'overlap', 'small'].includes(i.code))
  )
    issues.push({
      code: 'density',
      message:
        'This poster contains too much content for this layout. Remove a section or use a larger format.',
    });
  return issues;
}
