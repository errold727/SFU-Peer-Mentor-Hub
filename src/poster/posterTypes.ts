export type ElementType =
  'text' | 'image' | 'shape' | 'icon' | 'resource' | 'qrcode' | 'divider' | 'footer';
export type PosterElement = {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontFamily: string;
  lineHeight: number;
  letterSpacing: number;
  align: 'left' | 'center' | 'right';
  color: string;
  backgroundColor: string;
  padding: number;
  borderColor: string;
  borderWidth: number;
  src?: string;
  shape?: string;
  resourceId?: string;
  sourceUrl?: string;
};
export type PosterDocument = {
  elements: PosterElement[];
  size: string;
  background: string;
  template: string;
};
export const posterSizes: Record<string, { width: number; height: number; label: string }> = {
  letter: { width: 816, height: 1056, label: 'Letter Portrait · 8.5 × 11 in' },
  portrait: { width: 1080, height: 1350, label: 'Instagram Portrait · 1080 × 1350' },
  square: { width: 1080, height: 1080, label: 'Instagram Square · 1080 × 1080' },
  story: { width: 1080, height: 1920, label: 'Instagram Story · 1080 × 1920' },
  screen: { width: 1920, height: 1080, label: 'Digital Screen · 1920 × 1080' },
};
export function makeElement(
  type: ElementType,
  overrides: Partial<PosterElement> = {},
): PosterElement {
  return {
    id: crypto.randomUUID(),
    type,
    x: 60,
    y: 250,
    width: 360,
    height: 130,
    rotation: 0,
    zIndex: 0,
    visible: true,
    locked: false,
    text: 'Your text here',
    fontSize: 24,
    fontWeight: 'normal',
    fontFamily: 'Arial',
    lineHeight: 1.25,
    letterSpacing: 0,
    align: 'left',
    color: '#262626',
    backgroundColor: 'transparent',
    padding: 16,
    borderColor: '#d8d8d8',
    borderWidth: 0,
    ...overrides,
  };
}
export const visibleElements = (elements: PosterElement[]) =>
  elements.filter((e) => e.visible).sort((a, b) => a.zIndex - b.zIndex);
export const resolveRecipient = (text: string, name: string) =>
  text.replaceAll('{{recipientName}}', name.trim());
