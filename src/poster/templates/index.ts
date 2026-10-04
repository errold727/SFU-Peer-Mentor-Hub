import { makeElement, type PosterDocument } from '../posterTypes';
import { firstTemplates } from './packFirst';
import { secondTemplates } from './packSecond';
import { thirdTemplates } from './packThird';
import { createPackTemplate } from './packTypes';
export const importedTemplates = [...firstTemplates, ...secondTemplates, ...thirdTemplates];
export const templates = [
  {
    id: 'blank',
    name: 'Blank Poster',
    description: 'A clean canvas in your chosen size and style.',
    reference: '',
    category: 'Blank',
    theme: 'Blank',
    background: '#faf9f6',
    sections: [],
  },
  ...importedTemplates,
].map((t) => ({
  ...t,
  size: 'letter',
  preview: `${import.meta.env.BASE_URL}assets/template-previews/${t.id}.webp`,
}));
export function createTemplate(id = 'information'): PosterDocument {
  if (id === 'information') return legacyInformation();
  const template = importedTemplates.find((t) => t.id === (id === 'weekly' ? 'newsletter' : id));
  return template
    ? createPackTemplate(template)
    : { size: 'letter', background: '#faf9f6', template: 'blank', elements: [] };
}
// Compatibility for old direct-editor sessions. Existing saved documents keep their own elements.
function legacyInformation(): PosterDocument {
  return {
    size: 'letter',
    background: '#faf9f6',
    template: 'essentials',
    elements: [
      makeElement('shape', {
        x: 0,
        y: 0,
        width: 816,
        height: 22,
        shape: 'rectangle',
        text: '',
        color: '#a6192e',
      }),
      makeElement('text', {
        x: 48,
        y: 65,
        width: 720,
        height: 95,
        text: 'STUDENT ESSENTIALS',
        fontSize: 48,
        fontWeight: 'bold',
        color: '#a6192e',
        padding: 0,
      }),
      makeElement('text', {
        x: 48,
        y: 160,
        width: 720,
        height: 70,
        text: 'Your SFU resource collection',
        fontSize: 22,
        padding: 0,
      }),
      makeElement('footer', {
        x: 48,
        y: 984,
        width: 720,
        height: 44,
        text: 'Contact your Peer Mentor',
        fontSize: 14,
        padding: 0,
      }),
    ],
  };
}
