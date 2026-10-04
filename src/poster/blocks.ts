import { makeElement, type BlockKind, type BlockContent, type PosterElement } from './posterTypes';
import type { SFUResource } from '../data/resources/types';
import { resourcePosterText } from '../utils/search';
export const blockNames: Record<BlockKind, string> = {
  hero: 'Hero Image',
  title: 'Title Banner',
  greeting: 'Greeting',
  text: 'Text',
  highlight: 'Highlight Card',
  info: 'Info Card',
  list: 'List',
  checklist: 'Checklist',
  table: 'Table',
  schedule: 'Schedule',
  image: 'Image',
  qr: 'QR Code',
  divider: 'Divider',
  footer: 'Footer',
};
export function makeBlock(
  kind: BlockKind,
  content: Partial<BlockContent> = {},
  geometry: Partial<PosterElement> = {},
): PosterElement {
  const block: BlockContent = {
    kind,
    label: blockNames[kind],
    role: ['hero', 'title', 'greeting'].includes(kind)
      ? 'header'
      : kind === 'footer'
        ? 'footer'
        : 'content',
    title: ['hero', 'image', 'divider', 'greeting', 'text', 'footer', 'qr'].includes(kind)
      ? blockNames[kind] === 'Title Banner'
        ? 'YOUR TITLE'
        : ''
      : 'Resource Title',
    subtitle: '',
    body:
      kind === 'greeting'
        ? 'Hello, {{recipientName}}!'
        : kind === 'footer'
          ? 'Contact your Peer Mentor'
          : ['text', 'info', 'highlight'].includes(kind)
            ? 'Add your information here.'
            : '',
    icon: '',
    items: ['First item', 'Second item'],
    columns: ['Item', 'Details'],
    rows: [
      ['Resource', 'Add details'],
      ['Resource', 'Add details'],
    ],
    columnAlign: ['left', 'left'],
    accentColor: '#a6192e',
    headerColor: '#172d43',
    rowColor: '#f3f1ed',
    radius: 8,
    bannerStyle: 'solid',
    fitMode: 'cover',
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    overlay: 0,
    overlayColor: '#172d43',
    ...content,
  };
  return makeElement('block', {
    text: block.title || block.body || block.label,
    width: 350,
    height: 200,
    fontSize: 18,
    fontWeight: kind === 'title' ? 'bold' : 'normal',
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    block,
    ...geometry,
  });
}
export function blockText(e: PosterElement) {
  const b = e.block;
  if (!b) return e.text;
  return [
    b.title,
    b.subtitle,
    b.body,
    ...(['list', 'checklist'].includes(b.kind) ? b.items : []),
    ...(['table', 'schedule'].includes(b.kind)
      ? [b.columns.join(' · '), ...b.rows.map((r) => r.join(' · '))]
      : []),
  ]
    .filter(Boolean)
    .join('\n');
}
export function resourceBlockPatch(
  e: PosterElement,
  resource: SFUResource,
): Partial<PosterElement> {
  const b = e.block ?? makeBlock('info').block!;
  const full = resourcePosterText(resource);
  return {
    text: resource.title,
    resourceId: resource.id,
    sourceUrl: resource.sourceUrl,
    provenance: [
      {
        id: resource.id,
        title: resource.title,
        sourceUrl: resource.sourceUrl,
        lastVerified: resource.lastVerified,
      },
    ],
    block: {
      ...b,
      kind: 'info',
      label: resource.title,
      title: resource.title,
      subtitle: '',
      body: full.startsWith(resource.title) ? full.slice(resource.title.length).trim() : full,
      icon: '',
    },
  };
}
export function imagePlacement(
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number,
  b: Pick<BlockContent, 'fitMode' | 'zoom' | 'offsetX' | 'offsetY'>,
) {
  const ratio =
    b.fitMode === 'cover'
      ? Math.max(width / imageWidth, height / imageHeight)
      : Math.min(width / imageWidth, height / imageHeight);
  const w = (b.fitMode === 'fill' ? width : imageWidth * ratio) * b.zoom,
    h = (b.fitMode === 'fill' ? height : imageHeight * ratio) * b.zoom;
  return {
    width: w,
    height: h,
    x: (width - w) / 2 + (b.offsetX * Math.abs(width - w)) / 2,
    y: (height - h) / 2 + (b.offsetY * Math.abs(height - h)) / 2,
  };
}
export const isImageBlock = (e: PosterElement) =>
  e.block && ['hero', 'image'].includes(e.block.kind);
export const isQR = (e: PosterElement) => e.type === 'qrcode' || e.block?.kind === 'qr';
// Original campus-inspired vector illustration. No institutional logo or factual text.
export const campusArt =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400"><rect width="1200" height="400" fill="#d5e0dd"/><circle cx="1020" cy="72" r="45" fill="#f5e8c7"/><path d="M0 250L175 58 330 210 540 30 780 250 940 92 1200 255V400H0" fill="#809b98"/><path d="M0 292L290 126 430 248 680 114 965 290 1200 190V400H0" fill="#4c7172"/><path d="M100 400V235H1030V400" fill="#d7d0bc"/><path d="M65 225L1095 195V230L65 260Z" fill="#f7f0df"/><path d="M115 260H1030V305H115Z" fill="#183d48"/><path d="M150 230H174V400H150ZM315 224H339V400H315ZM480 220H504V400H480ZM645 213H669V400H645ZM810 209H834V400H810ZM975 202H999V400H975Z" fill="#f7f0df"/><path d="M0 400L460 324H740L1200 400" fill="#adc8c7"/><path d="M515 400L570 324H635L685 400" fill="#e7e2d5"/><rect x="0" y="388" width="1200" height="12" fill="#a6192e"/></svg>`,
  );

export function convertContent(b: BlockContent, kind: BlockKind): Partial<BlockContent> {
  const lines = ['list', 'checklist'].includes(b.kind)
    ? b.items
    : ['table', 'schedule'].includes(b.kind)
      ? b.rows.map((r) => r.join(' · '))
      : b.body.split('\n').filter(Boolean);
  return {
    kind,
    body: lines.join('\n'),
    items: lines.length ? lines : ['New item'],
    ...(['table', 'schedule'].includes(kind) && !['table', 'schedule'].includes(b.kind)
      ? {
          columns: ['Item', 'Details'],
          rows: (lines.length ? lines : ['New item']).map((line) => [line, '']),
          columnAlign: ['left', 'left'] as ('left' | 'right' | 'center')[],
        }
      : {}),
  };
}
