import Fuse from 'fuse.js';
import type { SFUResource } from '../data/resources/types';
import { currentTerm, daysUntil } from './dates';
import { resourceStatus } from './resourceStatus';
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
  audience = 'All',
  now = new Date(),
) {
  const selectedTerm = term === 'Current' ? currentTerm(now) : term;
  const filtered = resources.filter(
    (r) =>
      (category === 'All' || r.category === category) &&
      r.lifecycle !== 'discontinued' &&
      r.lifecycle !== 'historical' &&
      (campus === 'All' ||
        (r.campuses
          ? r.campuses.includes(campus as never)
          : r.campus === campus || r.campus === 'All')) &&
      (audience === 'All' ||
        !r.audiences ||
        r.audiences.includes('All students') ||
        r.audiences.includes(audience as never)) &&
      (selectedTerm === 'All' || !r.term || r.term === selectedTerm),
  );
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const effectiveQuery = filtered.some((r) =>
    r.aliases?.some((a) => a.toLowerCase() === normalized),
  )
    ? normalized
    : (aliases[normalized] ?? normalized);
  return normalized
    ? new Fuse(filtered, {
        keys: [
          { name: 'title', weight: 3 },
          { name: 'aliases', weight: 4 },
          { name: 'tags', weight: 2 },
          'summary',
          'facts.label',
          'facts.value',
          'provider.name',
          'locations.name',
          'locations.details',
        ],
        threshold: 0.35,
        ignoreLocation: true,
        includeScore: true,
      })
        .search(effectiveQuery)
        .sort(
          (a, b) =>
            rank(a.item, a.score, now, effectiveQuery) - rank(b.item, b.score, now, effectiveQuery),
        )
        .map((result) => result.item)
    : filtered;
}
function rank(r: SFUResource, score = 0, now: Date, query: string) {
  const status = resourceStatus(r, now);
  const indexed = [
    r.title,
    r.summary,
    ...r.tags,
    ...(r.aliases ?? []),
    ...(r.facts ?? []).map((f) => `${f.label ?? ''} ${f.value}`),
    r.provider?.name,
    ...(r.locations ?? []).map((l) => `${l.name} ${l.details ?? ''}`),
  ]
    .join(' ')
    .toLowerCase();
  const missing = query.split(' ').filter((token) => !indexed.includes(token)).length;
  return (
    score +
    missing +
    (!status.reviewed ? 0.5 : 0) +
    (status.freshness === 'due' ? 0.15 : 0) +
    (status.lifecycle !== 'active' ? 1 : 0) +
    (r.date && daysUntil(r.date, now) < 0 ? 0.5 : 0)
  );
}
export function thisWeekResources(resources: SFUResource[], now = new Date()) {
  const upcomingOffsets = (r: SFUResource) =>
    [r.date, ...(r.dates ?? []).flatMap((d) => [d.start, d.end])]
      .filter((date): date is string => !!date)
      .map((date) => daysUntil(date, now))
      .filter((offset) => offset >= 0 && offset <= 7);
  const timely = resources
    .filter(
      (r) =>
        resourceStatus(r, now).lifecycle === 'active' &&
        resourceStatus(r, now).reviewed &&
        upcomingOffsets(r).length > 0,
    )
    .sort((a, b) => Math.min(...upcomingOffsets(a)) - Math.min(...upcomingOffsets(b)));
  return [
    ...timely,
    ...resources.filter(
      (r) =>
        !r.date &&
        !r.dates?.length &&
        resourceStatus(r, now).lifecycle === 'active' &&
        !resourceStatus(r, now).future &&
        resourceStatus(r, now).reviewed,
    ),
  ].slice(0, 3);
}
export function resourceText(r: SFUResource) {
  return [
    r.title,
    r.date,
    r.summary,
    ...(r.facts ?? []).map((f) => `${f.label ? f.label + ': ' : ''}${f.value}`),
    ...(r.access ?? []).map((s) => `Access: ${s}`),
    ...(r.eligibility ?? []).map((s) => `Condition: ${s}`),
    ...(r.details ?? []).map((s) => `${s.heading}: ${s.body}`),
    `Source: ${r.sourceName}`,
    r.sourceUrl,
    `Last verified: ${r.lastVerified ?? 'Not yet verified'}`,
    r.verificationNote,
  ]
    .filter(Boolean)
    .join('\n');
}
// Full detail/copy keeps provenance. Poster body stays concise; the source can be added as a QR.
export function resourcePosterText(r: SFUResource) {
  if (r.poster) {
    const safeLink = r.highImpact && r.verification?.status !== 'reviewed';
    return [
      r.poster.title,
      ...(safeLink
        ? [r.summary, 'Check the official service page for current access and conditions.']
        : r.poster.facts),
      ...r.poster.conditions,
      r.term,
      r.topic !== '01' && (r.validFrom || r.validUntil)
        ? r.validFrom
          ? `Valid from ${r.validFrom}${r.validUntil ? ' through ' + r.validUntil : ''}`
          : `Valid through ${r.validUntil}`
        : undefined,
      `Source: ${r.provider?.name ?? r.sourceName}`,
      r.verification?.status !== 'reviewed' ? 'Confirm current details before sharing.' : undefined,
    ]
      .filter(Boolean)
      .join('\n');
  }
  return (
    r.posterContent ??
    [
      r.shortTitle ?? r.title,
      r.date,
      r.summary,
      ...((r.facts?.length ?? 0) <= 4
        ? (r.facts ?? []).map((f) => `${f.label ? f.label + ': ' : ''}${f.value}`)
        : ['See the official source for the full guide or schedule.']),
      `Source: ${r.sourceName}`,
      !r.lastVerified ? 'Confirm details with SFU before sharing.' : undefined,
    ]
      .filter(Boolean)
      .join('\n')
  );
}
