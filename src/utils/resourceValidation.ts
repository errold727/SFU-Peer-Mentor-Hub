import { categories, type SFUResource } from '../data/resources/types';
import { auditResources, officialSource } from './resourceHealth';
import { validISODate } from './verification';

const objectValue = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const normalizedTime = (value: unknown): value is string =>
  typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const dateValue = (value: unknown): value is string =>
  typeof value === 'string' && validISODate(value);
const sourcePage = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

export function validateResourceDocument(value: unknown, now = new Date()): string[] {
  if (!objectValue(value)) return ['document receipt must be an object'];
  const issues: string[] = [];
  if (!nonempty(value.filename) || !/^[a-f0-9]{64}$/i.test(String(value.sha256 ?? '')))
    issues.push('document receipt needs filename and SHA-256');
  if (!Array.isArray(value.pages) || !value.pages.length || !value.pages.every(sourcePage))
    issues.push('document receipt needs positive source pages');
  if (
    typeof value.readAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T/.test(value.readAt) ||
    !Number.isFinite(Date.parse(value.readAt)) ||
    Date.parse(value.readAt) > now.valueOf()
  )
    issues.push('document receipt needs an actual past read timestamp');
  return issues;
}

// Public unknown-input guard shared by catalog validation and the offline audit.
export function validateResourceProgram(value: unknown): string[] {
  if (!objectValue(value)) return ['program must be an object'];
  const pages = value.sourcePages;
  const issues: string[] = [];
  const add = (path: string, message: string) => issues.push(`${path}: ${message}`);
  if (!['single', 'multiple', 'range', 'recurring', 'service'].includes(String(value.kind)))
    add('program.kind', 'invalid program kind');
  if (
    !Array.isArray(value.sourcePages) ||
    !value.sourcePages.length ||
    !value.sourcePages.every(sourcePage)
  )
    add('program.sourcePages', 'positive source pages required');
  if (value.sourceDocument !== undefined) {
    const document = value.sourceDocument;
    if (
      !objectValue(document) ||
      !nonempty(document.filename) ||
      !/^[a-f0-9]{64}$/i.test(String(document.sha256 ?? '')) ||
      (document.pages !== undefined && !sourcePage(document.pages))
    )
      add('program.sourceDocument', 'invalid document identity');
    else if (
      typeof document.pages === 'number' &&
      Array.isArray(pages) &&
      pages.some((page) => typeof page === 'number' && page > Number(document.pages))
    )
      add('program.sourcePages', 'page exceeds the document page count');
  }
  function registration(record: Record<string, unknown>, path: string) {
    if (
      record.registrationStatus !== undefined &&
      !['verified', 'unavailable', 'not-required'].includes(String(record.registrationStatus))
    )
      add(path, 'invalid registration status');
    if (
      record.registrationUrl !== undefined &&
      (typeof record.registrationUrl !== 'string' || !officialSource(record.registrationUrl))
    )
      add(path, 'unsafe or unrecognized registration URL');
    if (record.registrationStatus === 'verified' && !nonempty(record.registrationUrl))
      add(path, 'verified registration requires a URL');
    if (record.registrationNote !== undefined && !nonempty(record.registrationNote))
      add(path, 'registration note must be text');
  }
  function review(record: Record<string, unknown>, path: string) {
    if (
      record.manualReviewRequired !== undefined &&
      typeof record.manualReviewRequired !== 'boolean'
    )
      add(path, 'manual review flag must be boolean');
    if (record.manualReviewRequired === true && !nonempty(record.manualReviewNote))
      add(path, 'manual review needs a note');
    if (record.manualReviewNote !== undefined && !nonempty(record.manualReviewNote))
      add(path, 'manual review note must be text');
  }
  registration(value, 'program');
  review(value, 'program');
  for (const field of ['startDate', 'endDate'])
    if (value[field] !== undefined && !dateValue(value[field]))
      add(`program.${field}`, 'invalid date');
  if (dateValue(value.startDate) && dateValue(value.endDate) && value.startDate > value.endDate)
    add('program', 'reversed date range');
  if (value.scheduleText !== undefined && !nonempty(value.scheduleText))
    add('program.scheduleText', 'must be text');
  const ids = new Set<string>();
  function occurrence(record: unknown, path: string, recurring: boolean) {
    if (!objectValue(record)) {
      add(path, 'must be an object');
      return;
    }
    registration(record, path);
    review(record, path);
    if (!['in-person', 'online', 'hybrid', 'unknown'].includes(String(record.mode)))
      add(path, 'invalid delivery mode');
    if (
      record.campus !== undefined &&
      !['Burnaby', 'Surrey', 'Vancouver', 'Online'].includes(String(record.campus))
    )
      add(path, 'invalid campus');
    for (const field of ['building', 'room', 'locationDisplay'])
      if (record[field] !== undefined && !nonempty(record[field]))
        add(path, `${field} must be text`);
    if (!sourcePage(record.sourcePage)) add(path, 'positive source page required');
    else if (Array.isArray(pages) && !pages.includes(record.sourcePage))
      add(path, 'page absent from program source pages');
    if (
      record.rawSource !== undefined &&
      (!objectValue(record.rawSource) ||
        Object.entries(record.rawSource).some(
          ([key, item]) =>
            !['date', 'startTime', 'endTime', 'location', 'description'].includes(key) ||
            !nonempty(item),
        ))
    )
      add(path, 'raw source fields must be descriptive text');
    for (const field of ['startTime', 'endTime'])
      if (record[field] !== undefined && record[field] !== null && !normalizedTime(record[field]))
        add(path, 'invalid normalized time; preserve questionable source wording separately');
    if (
      normalizedTime(record.startTime) &&
      normalizedTime(record.endTime) &&
      record.endTime <= record.startTime
    )
      add(path, 'end time must follow start time');
    if (recurring) {
      if (
        !weekdays.has(String(record.weekday)) ||
        !dateValue(record.startDate) ||
        !dateValue(record.endDate) ||
        record.endDate < record.startDate ||
        !normalizedTime(record.startTime) ||
        !normalizedTime(record.endTime)
      )
        add(path, 'recurrence requires weekday, bounded dates and normalized times');
      if (
        record.excludeDates !== undefined &&
        (!Array.isArray(record.excludeDates) || !record.excludeDates.every(dateValue))
      )
        add(path, 'invalid recurrence exclusion dates');
      if (
        dateValue(record.startDate) &&
        dateValue(record.endDate) &&
        Date.parse(record.endDate) - Date.parse(record.startDate) > 3660 * 86_400_000
      )
        add(path, 'recurrence range exceeds supported publication bounds');
    } else {
      if (!nonempty(record.id) || ids.has(record.id))
        add(path, 'duplicate or missing occurrence ID');
      else ids.add(record.id);
      if (!dateValue(record.date)) add(path, 'invalid occurrence date');
    }
  }
  if (!Array.isArray(value.occurrences)) add('program.occurrences', 'must be an array');
  else
    value.occurrences.forEach((record, index) =>
      occurrence(record, `program.occurrences.${index}`, false),
    );
  if (value.recurrences !== undefined && !Array.isArray(value.recurrences))
    add('program.recurrences', 'must be an array');
  else if (Array.isArray(value.recurrences))
    value.recurrences.forEach((record, index) =>
      occurrence(record, `program.recurrences.${index}`, true),
    );
  return issues;
}

const weekdays = new Set([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]);
function sessionMinutes(value: string) {
  const match = /^(\d{1,2}):([0-5]\d)(?:\s*(AM|PM))?$/i.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]),
    minute = Number(match[2]);
  if (match[3])
    return hour < 1 || hour > 12
      ? null
      : ((hour % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + minute;
  return hour > 23 ? null : hour * 60 + minute;
}

export function validateResources(
  items: SFUResource[],
  now = new Date(),
  requireSecondReview = true,
) {
  const report = auditResources(items, now);
  const ids = new Set(items.map((r) => r.id));
  const services = new Set<string>();
  const instant = (value: unknown) =>
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    Date.parse(value) <= now.valueOf();
  for (const r of items) {
    const fail = (message: string) => report.errors.push(`${r.id}: ${message}`);
    if (r.schemaVersion !== 2) {
      fail('catalog record requires schemaVersion 2');
      continue;
    }
    if (!r.topic || !/^(0[1-9]|1[0-9]|20)$/.test(r.topic)) fail('invalid topic');
    if (
      !r.provider?.name ||
      !['sfu', 'student-organization', 'external-official'].includes(r.provider.type)
    )
      fail('provider missing or invalid');
    if (!(r.category in categories)) fail('invalid category');
    const programLocations = [
      ...(Array.isArray(r.program?.occurrences) ? r.program.occurrences : []),
      ...(Array.isArray(r.program?.recurrences) ? r.program.recurrences : []),
    ];
    if (
      !Array.isArray(r.campuses) ||
      (!r.campuses.length && (!r.program || programLocations.some((o) => !!o?.campus))) ||
      r.campuses.some((c) => !['Burnaby', 'Surrey', 'Vancouver', 'Online'].includes(c))
    )
      fail('invalid campus applicability');
    if (
      !r.audiences?.length ||
      r.audiences.some(
        (a) =>
          ![
            'Undergraduate',
            'Graduate',
            'International',
            'Exchange',
            'Visiting',
            'FIC',
            'Indigenous students',
            'All students',
          ].includes(a),
      )
    )
      fail('invalid audience');
    if (!r.access?.length || !r.eligibility?.length) fail('access and conditions required');
    if (
      !r.cost ||
      !['unknown', 'published'].includes(r.cost.status) ||
      (r.cost.status === 'published' && !r.cost.details)
    )
      fail('cost must be explicitly unknown or described');
    if (
      r.cost?.status === 'unknown' &&
      /^(?:free|no charges?|\$0(?:\.00)?)[.!]?$/i.test((r.cost.details ?? '').trim())
    )
      fail('unknown cost cannot mean free');
    if (!officialSource(r.actionUrl ?? '')) fail('unsafe or unrecognized action URL');
    if (!['active', 'historical', 'discontinued'].includes(r.lifecycle ?? ''))
      fail('invalid lifecycle');
    for (const value of [r.validFrom, r.validUntil, r.reviewDueAt])
      if (value && !validISODate(value)) fail('invalid date');
    if (r.validFrom && r.validUntil && r.validFrom > r.validUntil) fail('reversed validity range');
    if (
      !r.verification ||
      !['reviewed', 'partial', 'unresolved'].includes(r.verification.status) ||
      !instant(r.verification.reviewedAt)
    )
      fail('invalid review');
    if (r.verification?.status === 'reviewed') {
      if (
        !instant(r.verification.verifiedAt) ||
        r.lastVerified !== r.verification.verifiedAt?.slice(0, 10)
      )
        fail('reviewed record needs consistent verification date');
      if (!r.reviewDueAt || r.reviewDueAt < (r.lastVerified ?? ''))
        fail('review due date precedes verification');
    } else if (r.lastVerified || r.verification?.verifiedAt)
      fail('partial/unresolved is not verified');
    if (!['agent', 'human'].includes(r.verification?.reviewer ?? ''))
      fail('reviewer identity required');
    const sourceIds = new Set<string>();
    if (!r.sources?.length) fail('sources required');
    for (const s of r.sources ?? []) {
      if (!s.id || sourceIds.has(s.id)) fail('duplicate source reference');
      sourceIds.add(s.id);
      if (!officialSource(s.url) || !s.title) fail('invalid source');
      if (
        !instant(s.lastRetrievalAttemptAt) ||
        (s.lastRetrievedAt !== null && !instant(s.lastRetrievedAt))
      )
        fail('invalid retrieval date');
      if (s.retrievalStatus === 'retrieved' && !s.lastRetrievedAt)
        fail('retrieved source needs retrieval timestamp');
      for (const date of [s.sourcePublishedAt, s.sourceUpdatedAt])
        if (date && !validISODate(date)) fail('invalid source-supplied date');
      if (s.document !== undefined) validateResourceDocument(s.document, now).forEach(fail);
    }
    if (!r.evidence?.length) fail('evidence required');
    for (const e of r.evidence ?? [])
      if (!sourceIds.has(e.sourceId) || !e.field || !e.locator) fail('broken evidence reference');
    const mapped = (field: string) =>
      r.evidence?.some(
        (e) =>
          (e.field === field || field.startsWith(e.field + '.')) &&
          r.sources?.some(
            (s) =>
              s.id === e.sourceId &&
              (instant(s.lastRetrievedAt) ||
                (s.document !== undefined &&
                  validateResourceDocument(s.document, now).length === 0)),
          ),
      );
    if (!mapped('summary')) fail('missing retrieved evidence for summary');
    for (const field of ['access', 'eligibility'] as const)
      r[field]?.forEach((_, i) => {
        if (!mapped(`${field}.${i}`)) fail(`missing retrieved evidence for ${field}.${i}`);
      });
    for (const field of ['facts', 'contacts', 'sessions', 'dates'] as const)
      r[field]?.forEach((_, i) => {
        if (!mapped(`${field}.${i}`)) fail(`missing evidence for ${field}.${i}`);
      });
    if (r.cost?.status === 'published' && !mapped('cost'))
      fail('missing evidence for published cost');
    if (r.program !== undefined) {
      validateResourceProgram(r.program).forEach(fail);
      if (!mapped('program')) fail('missing received evidence for program');
      const document = r.program?.sourceDocument;
      if (
        document &&
        !r.sources?.some(
          (source) =>
            source.document &&
            validateResourceDocument(source.document, now).length === 0 &&
            source.document.sha256 === document.sha256 &&
            source.document.filename === document.filename &&
            Array.isArray(r.program!.sourcePages) &&
            r.program!.sourcePages.every((page) => source.document!.pages.includes(page)),
        )
      )
        fail('program document identity/pages need a matching received document');
    }
    r.poster?.facts.forEach((_, i) => {
      if (!mapped(`poster.facts.${i}`)) fail(`missing evidence for poster.facts.${i}`);
    });
    if (
      (r.highImpact ||
        r.cost?.status === 'published' ||
        r.contacts?.some((c) => c.kind === 'phone') ||
        !!r.dates?.length ||
        !!r.sessions?.length ||
        !!r.program?.occurrences?.length ||
        !!r.program?.recurrences?.length) &&
      requireSecondReview &&
      (!r.secondReview || !instant(r.secondReview.reviewedAt))
    )
      fail('high-impact or precise-claim resource needs a separate review');
    for (const id of r.relatedIds ?? [])
      if (!ids.has(id) || id === r.id) fail(`broken related ID ${id}`);
    const key = `${r.provider?.name}|${r.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${r.term ?? ''}`;
    if (services.has(key)) fail('duplicate canonical service');
    services.add(key);
    if (
      !r.poster ||
      (r.poster.mode === 'facts' && (r.poster.facts.length < 2 || r.poster.facts.length > 4))
    )
      fail('poster needs 2–4 facts or safe link mode');
    if (r.highImpact && r.verification?.status !== 'reviewed' && r.poster?.mode !== 'link')
      fail('unresolved high-impact poster must be a service link');
    for (const s of r.sessions ?? []) {
      const start = typeof s.start === 'string' ? sessionMinutes(s.start) : null;
      const end = typeof s.end === 'string' ? sessionMinutes(s.end) : null;
      if (!weekdays.has(s.day) || start === null || end === null || end <= start)
        fail('invalid recurring session time or weekday');
      if (
        !validISODate(s.validFrom) ||
        !validISODate(s.validUntil) ||
        s.validFrom > s.validUntil ||
        !s.day ||
        !s.start ||
        !s.end ||
        !s.location
      )
        fail('invalid recurring session');
      if (!s.exceptions.every(validISODate)) fail('invalid closure exception');
    }
    for (const d of r.dates ?? []) {
      const valid =
        d.kind === 'timestamp'
          ? Number.isFinite(Date.parse(d.start)) && !!d.timeZone
          : validISODate(d.start);
      if (!valid || (d.end && (!validISODate(d.end) || d.end < d.start)))
        fail('invalid date event');
    }
    const serialized = JSON.stringify(r);
    if (/<\/?[a-z][^>]*>|javascript:|data:text\/html/i.test(serialized))
      fail('unsafe HTML or URL content');
    if (
      /gh[pousr]_[a-z0-9]{20}|-----BEGIN .*PRIVATE KEY|"(?:recipientName|mentee|studentNumber|password|recoveryCode)"\s*:/i.test(
        serialized,
      )
    )
      fail('private information or credential field');
  }
  return report;
}
