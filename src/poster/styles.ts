import type { PosterDocument } from './posterTypes';
export const posterStyles = {
  classic: {
    label: 'Classic SFU',
    background: '#faf9f6',
    accent: '#a6192e',
    text: '#262626',
    card: '#ffffff',
  },
  clean: {
    label: 'Clean',
    background: '#ffffff',
    accent: '#262626',
    text: '#262626',
    card: '#f1f3f5',
  },
  friendly: {
    label: 'Friendly',
    background: '#fff4e6',
    accent: '#8c3518',
    text: '#3b271c',
    card: '#ffffff',
  },
  mountain: {
    label: 'Mountain',
    background: '#eef4f2',
    accent: '#245447',
    text: '#193d34',
    card: '#ffffff',
  },
  dark: {
    label: 'Dark',
    background: '#172327',
    accent: '#f1bb91',
    text: '#f7f7f5',
    card: '#253b42',
  },
};
export function applyPosterStyle(
  doc: PosterDocument,
  id: keyof typeof posterStyles,
): PosterDocument {
  const style = posterStyles[id];
  return {
    ...doc,
    background: style.background,
    elements: doc.elements.map((e) =>
      e.locked
        ? e
        : {
            ...e,
            color: e.type === 'shape' || e.fontWeight === 'bold' ? style.accent : style.text,
            backgroundColor:
              e.type === 'shape'
                ? style.accent
                : e.backgroundColor === 'transparent'
                  ? 'transparent'
                  : style.card,
            borderColor: style.accent,
          },
    ),
  };
}
