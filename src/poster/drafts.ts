import { campusArt, blockNames } from './blocks';
import { posterSizes, type PosterDocument } from './posterTypes';
export const DRAFT_KEY = 'sfu-peer-mentor-hub:poster-drafts:v1';
export type LocalDraft = {
  id: string;
  savedAt: string;
  document: PosterDocument;
  recipientName?: string;
};
export function validPosterDocument(value: unknown): value is PosterDocument {
  if (!value || typeof value !== 'object') return false;
  const d = value as PosterDocument;
  if (
    !Object.hasOwn(posterSizes, d.size) ||
    typeof d.background !== 'string' ||
    !/^#[\da-f]{6}$/i.test(d.background) ||
    typeof d.template !== 'string' ||
    !Array.isArray(d.elements) ||
    d.elements.length > 200
  )
    return false;
  const ids = new Set<string>();
  return d.elements.every((e) => {
    if (!e || typeof e !== 'object' || typeof e.id !== 'string' || ids.has(e.id)) return false;
    ids.add(e.id);
    return (
      [
        'text',
        'image',
        'shape',
        'icon',
        'resource',
        'qrcode',
        'divider',
        'footer',
        'block',
      ].includes(e.type) &&
      [
        'x',
        'y',
        'width',
        'height',
        'rotation',
        'zIndex',
        'fontSize',
        'lineHeight',
        'letterSpacing',
        'padding',
        'borderWidth',
      ].every(
        (k) =>
          typeof e[k as keyof typeof e] === 'number' && Number.isFinite(e[k as keyof typeof e]),
      ) &&
      e.width > 0 &&
      e.height > 0 &&
      e.fontSize > 0 &&
      e.lineHeight > 0 &&
      e.padding >= 0 &&
      e.borderWidth >= 0 &&
      typeof e.visible === 'boolean' &&
      typeof e.locked === 'boolean' &&
      typeof e.text === 'string' &&
      e.text.length <= 100000 &&
      ['normal', 'bold'].includes(e.fontWeight) &&
      ['left', 'center', 'right'].includes(e.align) &&
      ['Arial', 'Georgia', 'Verdana', 'Courier New'].includes(e.fontFamily) &&
      /^#[\da-f]{6}$/i.test(e.color) &&
      /^#[\da-f]{6}$/i.test(e.borderColor) &&
      /^(transparent|#[\da-f]{6})$/i.test(e.backgroundColor) &&
      (e.sourceUrl === undefined ||
        (typeof e.sourceUrl === 'string' &&
          /^https:\/\//.test(e.sourceUrl) &&
          e.sourceUrl.length <= 2048)) &&
      (e.block === undefined || validBlock(e.block)) &&
      (e.src === undefined ||
        e.src === campusArt ||
        /^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i.test(e.src))
    );
  });
}
export function readDrafts(storage: Pick<Storage, 'getItem'>): LocalDraft[] {
  const raw = storage.getItem(DRAFT_KEY);
  if (!raw) return [];
  const items: unknown = JSON.parse(raw);
  if (
    !Array.isArray(items) ||
    items.length > 20 ||
    items.some(
      (d) =>
        !d ||
        typeof d.id !== 'string' ||
        typeof d.savedAt !== 'string' ||
        !validPosterDocument(d.document) ||
        (d.recipientName !== undefined && typeof d.recipientName !== 'string'),
    )
  )
    throw new Error('Saved drafts could not be read. You can delete local drafts and start again.');
  return items;
}
function writeDrafts(storage: Pick<Storage, 'setItem' | 'removeItem'>, drafts: LocalDraft[]) {
  if (!drafts.length) {
    storage.removeItem(DRAFT_KEY);
    return;
  }
  const data = JSON.stringify(drafts);
  if (data.length > 4_000_000 || drafts.length > 20)
    throw new Error('Local draft storage is full. Delete a draft or use smaller images.');
  storage.setItem(DRAFT_KEY, data);
}
export function saveDraft(
  storage: Storage,
  document: PosterDocument,
  recipientName: string,
  includeRecipient = false,
) {
  if (!validPosterDocument(document))
    throw new Error(
      'This poster cannot be saved. Check its content and use PNG, JPEG, GIF or WebP images.',
    );
  const draft: LocalDraft = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    document: structuredClone(document),
    ...(includeRecipient && recipientName.trim() ? { recipientName: recipientName.trim() } : {}),
  };
  writeDrafts(storage, [...readDrafts(storage), draft]);
  return draft;
}
export function deleteDraft(storage: Storage, id: string) {
  writeDrafts(
    storage,
    readDrafts(storage).filter((d) => d.id !== id),
  );
}
export function duplicateDraft(storage: Storage, id: string) {
  const draft = readDrafts(storage).find((d) => d.id === id);
  if (!draft) throw new Error('Draft not found. Refresh the draft list.');
  return saveDraft(
    storage,
    draft.document,
    draft.recipientName ?? '',
    Boolean(draft.recipientName),
  );
}

function validBlock(b: import('./posterTypes').BlockContent) {
  return (
    b &&
    typeof b === 'object' &&
    Object.hasOwn(blockNames, b.kind) &&
    ['header', 'content', 'footer'].includes(b.role) &&
    ['label', 'title', 'subtitle', 'body', 'icon'].every(
      (k) =>
        typeof b[k as keyof typeof b] === 'string' &&
        String(b[k as keyof typeof b]).length <= 100000,
    ) &&
    ['accentColor', 'headerColor', 'rowColor', 'overlayColor'].every((k) =>
      /^#[\da-f]{6}$/i.test(String(b[k as keyof typeof b])),
    ) &&
    ['radius', 'zoom', 'offsetX', 'offsetY', 'overlay'].every((k) =>
      Number.isFinite(b[k as keyof typeof b]),
    ) &&
    b.zoom >= 1 &&
    b.zoom <= 5 &&
    b.overlay >= 0 &&
    b.overlay <= 1 &&
    b.radius >= 0 &&
    ['solid', 'brush', 'underline'].includes(b.bannerStyle) &&
    ['cover', 'contain', 'fill'].includes(b.fitMode) &&
    Array.isArray(b.items) &&
    b.items.length <= 100 &&
    b.items.every((i) => typeof i === 'string') &&
    Array.isArray(b.columns) &&
    b.columns.length >= 1 &&
    b.columns.length <= 6 &&
    b.columns.every((c) => typeof c === 'string') &&
    Array.isArray(b.rows) &&
    b.rows.length <= 100 &&
    b.rows.every(
      (r) =>
        Array.isArray(r) && r.length === b.columns.length && r.every((c) => typeof c === 'string'),
    ) &&
    Array.isArray(b.columnAlign) &&
    b.columnAlign.every((a) => ['left', 'center', 'right'].includes(a))
  );
}
