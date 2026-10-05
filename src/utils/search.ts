import Fuse from 'fuse.js';
import type { SFUResource } from '../data/resources/types';
import { currentTerm, daysUntil } from './dates';
import { resourceStatus } from './resourceStatus';
import { thisWeekItems } from './resourceOccurrences';
import {
  occurrenceLocationLabel,
  occurrenceTimeLabel,
  programLifecycle,
  programOccurrences,
  splitProgramOccurrences,
} from './resourceOccurrences';
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
          'program.scheduleText',
          'program.occurrences.locationDisplay',
          'program.occurrences.building',
          'program.occurrences.room',
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
    r.program?.scheduleText,
    ...(r.program?.occurrences ?? []).map(
      (o) => `${o.locationDisplay ?? ''} ${o.building ?? ''} ${o.room ?? ''}`,
    ),
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
  // Preserve the legacy resource-list adapter; occurrence-aware UI uses thisWeekItems.
  if (resources.some((resource) => resource.program)) {
    const seen = new Set<string>();
    return thisWeekItems(resources, now).flatMap(({ resource }) => {
      if (seen.has(resource.id)) return [];
      seen.add(resource.id);
      return [resource];
    });
  }
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
    ...(r.program
      ? [
          r.program.scheduleText,
          ...programOccurrences(r).map((o) =>
            [o.date, occurrenceTimeLabel(o), occurrenceLocationLabel(o), o.manualReviewNote]
              .filter(Boolean)
              .join(' · '),
          ),
          r.program.manualReviewNote,
          `${r.program.sourceDocument?.filename ?? 'Program guide'} · pages ${r.program.sourcePages.join(', ')}`,
        ]
      : []),
    `Source: ${r.sourceName}`,
    r.sourceUrl,
    `Last verified: ${r.lastVerified ?? 'Not yet verified'}`,
    r.verificationNote,
  ]
    .filter(Boolean)
    .join('\n');
}
// Full detail/copy keeps provenance. Poster body stays concise; the source can be added as a QR.
export function resourcePosterText(r: SFUResource, now = new Date()) {
  if (r.program) {
    // Reuse the canonical schedule. A poster starts with the next reliable
    // session, never a stale first occurrence or an invented time.
    const next = splitProgramOccurrences(r, now).upcoming.find(
      (o) => !o.manualReviewRequired && o.startTime && o.endTime,
    );
    const lifecycle = programLifecycle(r, now);
    const date = next
      ? `${r.program.occurrences.length > 1 || r.program.recurrences?.length ? 'Next session: ' : ''}${next.date}`
      : lifecycle === 'completed'
        ? 'This program has completed. Confirm future offerings with the provider.'
        : undefined;
    const { startDate, endDate } = r.program;
    const serviceWindow =
      !next &&
      lifecycle !== 'completed' &&
      ['range', 'service'].includes(r.program.kind) &&
      (startDate || endDate)
        ? `Guide service window${r.program.manualReviewRequired ? ' (confirm dates with provider)' : ''}: ${
            startDate && endDate
              ? `${startDate}–${endDate}`
              : startDate
                ? `from ${startDate}; end date not published`
                : `through ${endDate}; start date not published`
          }`
        : undefined;
    return [
      r.poster?.title ?? r.shortTitle ?? r.title,
      date,
      serviceWindow,
      next ? `${occurrenceTimeLabel(next)} · Pacific time` : undefined,
      next ? occurrenceLocationLabel(next) : undefined,
      r.summary,
      ...(!next && lifecycle !== 'completed' ? (r.poster?.facts ?? []) : []),
      ...(r.poster?.conditions ?? []),
      r.program.manualReviewRequired && !serviceWindow
        ? 'Some source details need confirmation.'
        : undefined,
      r.term,
      `Source: ${r.provider?.name ?? r.sourceName}`,
    ]
      .filter((value, index, values) => value && values.indexOf(value) === index)
      .join('\n');
  }
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
