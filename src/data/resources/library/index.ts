import type { SFUResource } from '../types';
export const libraryFloors = [
  { floor: 1, title: 'Closed storage', detail: 'Closed storage' },
  {
    floor: 2,
    title: 'Group / Social',
    detail:
      'Group study; social lounge; non-quiet; bookable study rooms for students with disabilities',
  },
  { floor: 3, title: 'Main Floor', detail: 'Service Desk; group study; social lounge' },
  { floor: 4, title: 'Quiet Study', detail: 'Call numbers A–HT' },
  {
    floor: 5,
    title: 'Quiet Study',
    detail:
      'Bookable individual/private study rooms; media collections; computer workstations; call numbers HV–Q 175 G',
  },
  { floor: 6, title: 'Silent Study', detail: 'Temporary book collections; call numbers Q 175 H–Z' },
  { floor: 7, title: 'Research Commons', detail: 'Quiet / silent study areas' },
];
export const library: SFUResource = {
  id: 'bennett-library',
  title: 'W.A.C. Bennett Library guide',
  category: 'library',
  summary: '2–3 GROUP / SOCIAL · 4–5 QUIET · 6 SILENT · 7 RESEARCH COMMONS',
  campus: 'Burnaby',
  facts: libraryFloors.map((f) => ({ label: `Floor ${f.floor} — ${f.title}`, value: f.detail })),
  sourceName: 'SFU Library — Bennett floor plans',
  sourceUrl: 'https://www.lib.sfu.ca/about/branches-depts/bennett/floor-plans',
  lastVerified: null,
  verificationNote:
    'User-supplied floor guide. Official Library pages could not be retrieved during verification; confirm details before sharing.',
  posterCompatible: true,
  tags: ['quiet floor', 'silent', 'study', 'library', 'books'],
};
