import { formatInTimeZone } from 'date-fns-tz';
import type {
  ResourceOccurrence,
  ResourceRecurrence,
  ResourceRegistration,
  SFUResource,
} from '../data/resources/types';
import { localDate, TIME_ZONE } from './dates';
import { officialSource } from './resourceHealth';
import { getVerificationStatus, validISODate } from './verification';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dateIsValid = (value: unknown): value is string =>
  typeof value === 'string' && validISODate(value);
const timeIsValid = (value: unknown): value is string =>
  typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

function requireNow(now: Date) {
  if (!Number.isFinite(now.valueOf())) throw new Error('A valid current time is required.');
}
function addCalendarDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
function compareOccurrences(a: ResourceOccurrence, b: ResourceOccurrence) {
  return (
    a.date.localeCompare(b.date) ||
    (a.startTime ?? '24:00').localeCompare(b.startTime ?? '24:00') ||
    a.id.localeCompare(b.id)
  );
}
export function occurrenceHasConfirmedTime(occurrence: ResourceOccurrence) {
  return (
    !occurrence.manualReviewRequired &&
    dateIsValid(occurrence.date) &&
    timeIsValid(occurrence.startTime) &&
    timeIsValid(occurrence.endTime) &&
    occurrence.endTime > occurrence.startTime
  );
}

// Calendar arithmetic never adds 24-hour instants across Vancouver DST boundaries.
// Incomplete/unbounded source schedules remain text and produce no inferred dates.
export function expandProgramRecurrence(
  rule: ResourceRecurrence,
  prefix = 'recurrence',
): ResourceOccurrence[] {
  if (
    !rule ||
    rule.manualReviewRequired ||
    !weekdays.includes(rule.weekday) ||
    !dateIsValid(rule.startDate) ||
    !dateIsValid(rule.endDate) ||
    rule.endDate < rule.startDate ||
    !timeIsValid(rule.startTime) ||
    !timeIsValid(rule.endTime) ||
    rule.endTime <= rule.startTime ||
    (rule.excludeDates !== undefined &&
      (!Array.isArray(rule.excludeDates) || !rule.excludeDates.every(dateIsValid)))
  )
    return [];
  const span =
    (Date.parse(`${rule.endDate}T12:00Z`) - Date.parse(`${rule.startDate}T12:00Z`)) / 86_400_000;
  // Reject implausible input rather than silently truncating a published range.
  if (span > 3660) return [];
  const { weekday, startDate, endDate, excludeDates = [], ...details } = rule;
  const result: ResourceOccurrence[] = [];
  for (let date = startDate; date <= endDate; date = addCalendarDays(date, 1)) {
    if (
      weekdays[new Date(`${date}T12:00Z`).getUTCDay()] === weekday &&
      !excludeDates.includes(date)
    )
      result.push({ ...details, id: `${prefix}-${date}`, date });
  }
  return result;
}

export function programOccurrences(resource: SFUResource): ResourceOccurrence[] {
  const program = resource.program;
  if (!program) return [];
  return [
    ...(Array.isArray(program.occurrences) ? program.occurrences : []),
    ...(Array.isArray(program.recurrences) ? program.recurrences : []).flatMap((rule, index) =>
      expandProgramRecurrence(rule, `${resource.id}-r${index + 1}`),
    ),
  ]
    .filter((occurrence) => occurrence && dateIsValid(occurrence.date))
    .sort(compareOccurrences);
}

function hasEnded(occurrence: ResourceOccurrence, today: string, time: string) {
  return (
    occurrence.date < today ||
    (occurrence.date === today &&
      occurrenceHasConfirmedTime(occurrence) &&
      occurrence.endTime! <= time)
  );
}

export function splitProgramOccurrences(resource: SFUResource, now = new Date()) {
  requireNow(now);
  const today = localDate(now),
    time = formatInTimeZone(now, TIME_ZONE, 'HH:mm');
  const upcoming: ResourceOccurrence[] = [],
    past: ResourceOccurrence[] = [],
    uncertain: ResourceOccurrence[] = [];
  for (const occurrence of programOccurrences(resource)) {
    if (hasEnded(occurrence, today, time)) past.push(occurrence);
    else if (!occurrenceHasConfirmedTime(occurrence)) uncertain.push(occurrence);
    else upcoming.push(occurrence);
  }
  return { upcoming, past, uncertain };
}

export type ProgramLifecycle = 'upcoming' | 'active' | 'completed' | 'unknown';
export function programLifecycle(resource: SFUResource, now = new Date()): ProgramLifecycle {
  requireNow(now);
  const program = resource.program;
  if (!program) return 'unknown';
  const today = localDate(now),
    time = formatInTimeZone(now, TIME_ZONE, 'HH:mm');
  // Service schedules may publish only a first occurrence. Never infer their final date.
  if (program.kind === 'service' || program.kind === 'range') {
    if (dateIsValid(program.startDate) && program.startDate > today) return 'upcoming';
    if (dateIsValid(program.endDate) && program.endDate < today) return 'completed';
    return program.kind === 'service' || dateIsValid(program.startDate) ? 'active' : 'unknown';
  }
  const occurrences = programOccurrences(resource);
  if (!occurrences.length) return 'unknown';
  const first = occurrences[0];
  if (
    first.date > today ||
    (first.date === today && occurrenceHasConfirmedTime(first) && first.startTime! > time)
  )
    return 'upcoming';
  // A questionable occurrence is retained through its date, never through a guessed time.
  if (occurrences.every((occurrence) => hasEnded(occurrence, today, time))) return 'completed';
  return 'active';
}

export function occurrenceTimeLabel(occurrence: ResourceOccurrence) {
  if (!occurrenceHasConfirmedTime(occurrence)) return 'Time not confirmed';
  const label = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
  };
  return `${label(occurrence.startTime!)}–${label(occurrence.endTime!)}`;
}
export function occurrenceLocationLabel(occurrence: ResourceOccurrence) {
  const location =
    occurrence.locationDisplay ||
    [occurrence.campus, occurrence.building, occurrence.room].filter(Boolean).join(' · ');
  if (occurrence.mode === 'hybrid') return location ? `Hybrid · ${location}` : 'Hybrid';
  if (occurrence.mode === 'online') return location || 'Online';
  return location || 'Location not confirmed';
}

export function programRegistrationUrl(resource: SFUResource, occurrence?: ResourceOccurrence) {
  const verified = (registration: ResourceRegistration | undefined) =>
    registration?.registrationStatus === 'verified' &&
    registration.registrationUrl &&
    officialSource(registration.registrationUrl)
      ? registration.registrationUrl
      : undefined;
  // An explicit unavailable/not-required occurrence overrides any series-level link.
  if (occurrence?.registrationStatus !== undefined || occurrence?.registrationUrl !== undefined)
    return verified(occurrence);
  return verified(resource.program);
}

export type ThisWeekItem = {
  resource: SFUResource;
  date: string;
  occurrence?: ResourceOccurrence;
  label?: string;
};
export function thisWeekOccurrences(resources: SFUResource[], now = new Date(), limit = 6) {
  return thisWeekItems(
    resources.filter((resource) => !!resource.program),
    now,
    limit,
  ).filter((item): item is ThisWeekItem & { occurrence: ResourceOccurrence } => !!item.occurrence);
}
export function thisWeekItems(
  resources: SFUResource[],
  now = new Date(),
  limit = 6,
): ThisWeekItem[] {
  requireNow(now);
  const today = localDate(now),
    lastDate = addCalendarDays(today, 7);
  const items: ThisWeekItem[] = [];
  const legacyTimes = new Map<ThisWeekItem, string>();
  for (const resource of resources) {
    if (resource.lifecycle === 'discontinued' || resource.lifecycle === 'historical') continue;
    if (resource.program) {
      if (programLifecycle(resource, now) === 'completed') continue;
      for (const occurrence of splitProgramOccurrences(resource, now).upcoming)
        if (occurrence.date <= lastDate)
          items.push({ resource, date: occurrence.date, occurrence });
      continue;
    }
    const reviewed = resource.verification
      ? resource.verification.status === 'reviewed' &&
        !!resource.verification.verifiedAt &&
        Date.parse(resource.verification.verifiedAt) <= now.valueOf()
      : getVerificationStatus(resource.lastVerified, now) === 'fresh';
    if (!reviewed || (resource.validUntil && resource.validUntil < today)) continue;
    const dates = [
      ...(resource.date
        ? [{ start: resource.date, end: undefined, label: undefined, kind: 'date' }]
        : []),
      ...(resource.dates ?? []),
    ];
    const seen = new Set<string>();
    for (const entry of dates)
      for (const value of [entry.start, entry.end]) {
        if (!value) continue;
        let date = value;
        let time = '24:00';
        if (entry.kind === 'timestamp') {
          const instant = new Date(value);
          if (!Number.isFinite(instant.valueOf()) || instant.valueOf() < now.valueOf()) continue;
          date = localDate(instant);
          time = formatInTimeZone(instant, TIME_ZONE, 'HH:mm');
        }
        if (!dateIsValid(date) || date < today || date > lastDate || seen.has(date)) continue;
        seen.add(date);
        const item = { resource, date, ...(entry.label ? { label: entry.label } : {}) };
        items.push(item);
        legacyTimes.set(item, time);
      }
  }
  return items
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.occurrence?.startTime ?? legacyTimes.get(a) ?? '24:00').localeCompare(
          b.occurrence?.startTime ?? legacyTimes.get(b) ?? '24:00',
        ) ||
        a.resource.title.localeCompare(b.resource.title) ||
        a.resource.id.localeCompare(b.resource.id) ||
        (a.occurrence?.id ?? '').localeCompare(b.occurrence?.id ?? ''),
    )
    .slice(0, Math.min(6, Math.max(0, Math.floor(Number.isFinite(limit) ? limit : 6))));
}
