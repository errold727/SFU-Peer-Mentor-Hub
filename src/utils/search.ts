import Fuse from 'fuse.js';
import type { SFUResource } from '../data/resources/types';
import { currentTerm, daysUntil } from './dates';
const aliases: Record<string, string> = {
  'quiet study': 'bennett library',
  'silent floor': 'bennett library',
  'safe walk': 'safe walk',
  safewalk: 'safe walk',
  'drop course': 'drop',
  'computing id': 'computing id',
  'u pass': 'u-pass',
};
export function searchResources(
  resources: SFUResource[],
  query: string,
  category = 'All',
  campus = 'All',
  term = 'All',
) {
  const selectedTerm = term === 'Current' ? currentTerm() : term;
  const filtered = resources.filter(
    (r) =>
      (category === 'All' || r.category === category) &&
      (campus === 'All' || r.campus === campus || r.campus === 'All') &&
      (selectedTerm === 'All' || !r.term || r.term === selectedTerm),
  );
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalized
    ? new Fuse(filtered, {
        keys: [{ name: 'title', weight: 3 }, { name: 'tags', weight: 2 }, 'summary', 'facts.value'],
        threshold: 0.35,
        ignoreLocation: true,
      })
        .search(aliases[normalized] ?? normalized)
        .map((result) => result.item)
    : filtered;
}
export function thisWeekResources(resources: SFUResource[], now = new Date()) {
  const timely = resources.filter(
    (r) => r.date && daysUntil(r.date, now) >= 0 && daysUntil(r.date, now) <= 7,
  );
  return [
    ...timely,
    ...resources.filter(
      (r) => !r.date && (!r.validUntil || daysUntil(r.validUntil, now) >= 0) && r.lastVerified,
    ),
  ].slice(0, 3);
}
export function resourceText(r: SFUResource) {
  return [
    r.title,
    r.date,
    r.summary,
    ...(r.facts ?? []).map((f) => `${f.label ? f.label + ': ' : ''}${f.value}`),
    `Source: ${r.sourceName}`,
    r.sourceUrl,
    `Last verified: ${r.lastVerified ?? 'Not yet verified'}`,
    r.verificationNote,
  ]
    .filter(Boolean)
    .join('\n');
}
