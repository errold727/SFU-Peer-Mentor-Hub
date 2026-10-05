import { createHash } from 'node:crypto';
import type { SFUResource } from '../../src/data/resources/types';
import { reviewCadenceDays } from '../../src/data/resources/catalog/define';
import { currentTerm, daysUntil, localDate } from '../../src/utils/dates';
import { resourceStatus } from '../../src/utils/resourceStatus';
import {
  validateResources,
  validateResourceProgram,
  validateResourceDocument,
} from '../../src/utils/resourceValidation';
import { officialSource } from '../../src/utils/resourceHealth';
import { validISODate } from '../../src/utils/verification';
import { resourcePosterText, searchResources } from '../../src/utils/search';
import {
  programLifecycle,
  programOccurrences,
  splitProgramOccurrences,
} from '../../src/utils/resourceOccurrences';
import type { Finding } from './types';

export type Freshness = 'fresh' | 'reviewSoon' | 'reviewDue' | 'stale';
export type Lifecycle = 'upcoming' | 'active' | 'expired' | 'historical' | 'unknown';
export type TermApplicability = 'current' | 'future' | 'past' | 'unknown' | 'not-term-specific';
export type ResourceAuditUrl = {
  url: string;
  roles: ('source' | 'action' | 'qr')[];
  sourceIds: string[];
};
export type CatalogRecordAudit = {
  id: string;
  title: string;
  category: string;
  highImpact: boolean;
  highImpactReasons: string[];
  freshness: Freshness;
  reviewDueAt: string | null;
  verifiedAt: string | null;
  lifecycle: Lifecycle;
  termApplicability: TermApplicability;
  urls: ResourceAuditUrl[];
  posterCompatible: boolean;
};
export type SearchProbeResult = {
  query: string;
  expectedIds: string[];
  actualIds: string[];
  applicableIds: string[];
  status: 'passed' | 'regression' | 'not-applicable';
};
export type CatalogAuditResult = {
  totalRecords: number;
  records: CatalogRecordAudit[];
  findings: Finding[];
  search: SearchProbeResult[];
};

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown) => typeof value === 'string';
const strings = (value: unknown) => Array.isArray(value) && value.every(string);
const instant = (value: unknown): value is string =>
  typeof value === 'string' &&
  validISODate(value.slice(0, 10)) &&
  /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
  Number.isFinite(Date.parse(value));
const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** Shape guards protect the existing semantic validator from malformed nested values.
 * They do not supply defaults to, repair, or mutate the published registry. */
function shapeProblems(value: unknown, now = new Date()): string[] {
  if (!object(value)) return ['record must be an object'];
  const issues: string[] = [];
  if (value.program !== undefined)
    issues.push(...validateResourceProgram(value.program).map((issue) => `program: ${issue}`));
  for (const key of ['id', 'title', 'summary', 'sourceName', 'sourceUrl', 'category', 'campus'])
    if (!string(value[key])) issues.push(`${key} must be a string`);
  for (const key of [
    'shortTitle',
    'term',
    'date',
    'validFrom',
    'validUntil',
    'actionUrl',
    'hours',
    'posterContent',
    'lifecycle',
    'reviewCadence',
  ])
    if (value[key] !== undefined && !string(value[key])) issues.push(`${key} must be a string`);
  for (const key of ['lastVerified', 'reviewDueAt'])
    if (value[key] !== undefined && value[key] !== null && !string(value[key]))
      issues.push(`${key} must be a string or null`);
  for (const key of [
    'tags',
    'aliases',
    'relatedIds',
    'access',
    'eligibility',
    'audiences',
    'campuses',
  ])
    if ((key === 'tags' || value[key] !== undefined) && !strings(value[key]))
      issues.push(`${key} must be a string array`);
  for (const key of ['posterCompatible', 'highImpact'])
    if ((key === 'posterCompatible' || value[key] !== undefined) && typeof value[key] !== 'boolean')
      issues.push(`${key} must be boolean`);
  for (const [key, fields] of Object.entries({
    provider: ['name', 'type'],
    cost: ['status', 'details'],
    verification: ['status', 'reviewedAt', 'reviewer', 'note'],
    secondReview: ['reviewedAt', 'reviewer', 'note'],
  })) {
    if (value[key] === undefined) continue;
    const child = value[key];
    if (!object(child)) {
      issues.push(`${key} must be an object`);
      continue;
    }
    for (const field of fields)
      if (child[field] !== undefined && !string(child[field]))
        issues.push(`${key}.${field} must be a string`);
    if (
      key === 'verification' &&
      child.verifiedAt !== undefined &&
      child.verifiedAt !== null &&
      !string(child.verifiedAt)
    )
      issues.push('verification.verifiedAt must be a string or null');
  }
  const arrays: Record<string, string[]> = {
    facts: ['label', 'value'],
    details: ['heading', 'body'],
    contacts: ['label', 'value', 'kind'],
    locations: ['campus', 'name', 'details'],
    sources: [
      'id',
      'url',
      'title',
      'lastRetrievalAttemptAt',
      'retrievalStatus',
      'sourcePublishedAt',
      'sourceUpdatedAt',
    ],
    evidence: ['field', 'sourceId', 'locator', 'note'],
    dates: ['label', 'kind', 'start', 'end', 'timeZone'],
    sessions: ['day', 'sport', 'start', 'end', 'location', 'validFrom', 'validUntil'],
  };
  for (const [key, fields] of Object.entries(arrays)) {
    if (value[key] === undefined) continue;
    if (!Array.isArray(value[key])) {
      issues.push(`${key} must be an array`);
      continue;
    }
    for (const [i, child] of value[key].entries()) {
      if (!object(child)) {
        issues.push(`${key}.${i} must be an object`);
        continue;
      }
      for (const field of fields)
        if (child[field] !== undefined && !string(child[field]))
          issues.push(`${key}.${i}.${field} must be a string`);
      if (
        key === 'sources' &&
        child.lastRetrievedAt !== null &&
        child.lastRetrievedAt !== undefined &&
        !string(child.lastRetrievedAt)
      )
        issues.push(`${key}.${i}.lastRetrievedAt must be a string or null`);
      if (key === 'sessions' && !strings(child.exceptions))
        issues.push(`${key}.${i}.exceptions must be a string array`);
      if (key === 'sources' && child.document !== undefined)
        issues.push(
          ...validateResourceDocument(child.document, now).map(
            (issue) => `${key}.${i}.document: ${issue}`,
          ),
        );
    }
  }
  if (value.poster !== undefined) {
    if (!object(value.poster)) issues.push('poster must be an object');
    else {
      for (const key of ['title', 'mode'])
        if (!string(value.poster[key])) issues.push(`poster.${key} must be a string`);
      for (const key of ['facts', 'conditions'])
        if (!strings(value.poster[key])) issues.push(`poster.${key} must be a string array`);
    }
  }
  return issues;
}

/** Preserve URL roles while deduplicating a resource's literal URLs. Optional QR fields
 * are inspected defensively even though the current resource schema has no QR field. */
export function collectResourceUrls(value: unknown): ResourceAuditUrl[] {
  if (!object(value)) return [];
  const urls = new Map<string, ResourceAuditUrl>();
  const add = (url: unknown, role: ResourceAuditUrl['roles'][number], sourceId?: unknown) => {
    if (typeof url !== 'string' || !url.trim()) return;
    const entry = urls.get(url) ?? { url, roles: [], sourceIds: [] };
    if (!entry.roles.includes(role)) entry.roles.push(role);
    if (typeof sourceId === 'string' && !entry.sourceIds.includes(sourceId))
      entry.sourceIds.push(sourceId);
    urls.set(url, entry);
  };
  add(value.sourceUrl, 'source');
  add(value.actionUrl, 'action');
  if (object(value.program)) {
    add(value.program.registrationUrl, 'action');
    if (value.program.registrationStatus === 'verified') add(value.program.registrationUrl, 'qr');
    for (const key of ['occurrences', 'recurrences'])
      if (Array.isArray(value.program[key]))
        for (const occurrence of value.program[key])
          if (object(occurrence)) {
            add(occurrence.registrationUrl, 'action');
            if (occurrence.registrationStatus === 'verified') add(occurrence.registrationUrl, 'qr');
          }
  }
  if (Array.isArray(value.sources))
    for (const source of value.sources) if (object(source)) add(source.url, 'source', source.id);
  for (const item of [value, value.poster])
    if (object(item)) {
      for (const key of ['qrUrl', 'qrTarget', 'qrTargetUrl']) add(item[key], 'qr');
      if (object(item.qr)) add(item.qr.url ?? item.qr.target, 'qr');
    }
  return [...urls.values()];
}

function impactReasons(r: Record<string, unknown>): string[] {
  const reasons: string[] = r.highImpact === true ? ['Explicit resource high-impact flag'] : [];
  const identity = `${text(r.id)} ${text(r.title)} ${text(r.summary)}`;
  if (r.category === 'deadline') reasons.push('Formal deadlines');
  if (r.category === 'health' || /\b(?:medical|insurance|health coverage)\b/i.test(identity))
    reasons.push('Medical or insurance information');
  if (/\b(?:tuition|refunds?|student account|fee payment)\b/i.test(identity))
    reasons.push('Tuition or refunds');
  if (
    /\b(?:immigration|work authorization|study permits?|work permits?|PGWP|international employment)\b/i.test(
      identity,
    )
  )
    reasons.push('Immigration or work authorization');
  if (r.category === 'rights') reasons.push('Formal student-rights procedures');
  if (
    r.category === 'safety' &&
    /\b(?:emergency|security|public safety|safe walk|crisis)\b/i.test(identity)
  )
    reasons.push('Emergency or campus safety contacts');
  return reasons;
}

export function resourceFreshness(r: SFUResource, now = new Date()) {
  const cadence = reviewCadenceDays[r.reviewCadence ?? 'evergreen'] ?? reviewCadenceDays.evergreen;
  const verifiedAt =
    r.verification?.status === 'reviewed' &&
    instant(r.verification?.verifiedAt) &&
    Date.parse(r.verification.verifiedAt) <= now.valueOf()
      ? r.verification.verifiedAt
      : null;
  // An unresolved review cannot be made fresh by a future reviewDueAt override.
  if (r.verification?.status !== 'reviewed' || !verifiedAt)
    return {
      freshness: 'reviewDue' as Freshness,
      verifiedAt,
      reviewDueAt: validISODate(r.reviewDueAt) ? r.reviewDueAt! : null,
    };
  const due = new Date(verifiedAt);
  due.setUTCDate(due.getUTCDate() + cadence);
  const reviewDueAt = validISODate(r.reviewDueAt) ? r.reviewDueAt! : due.toISOString().slice(0, 10);
  const remaining = daysUntil(reviewDueAt, now);
  const freshness: Freshness =
    remaining < -cadence
      ? 'stale'
      : remaining <= 0
        ? 'reviewDue'
        : remaining <= Math.max(1, Math.min(7, Math.floor(cadence / 4)))
          ? 'reviewSoon'
          : 'fresh';
  return { freshness, reviewDueAt, verifiedAt };
}

export function termApplicability(term: string | undefined, now = new Date()): TermApplicability {
  if (!term) return 'not-term-specific';
  const index = (value: string) => {
    const match = /^(Spring|Summer|Fall) (\d{4})$/.exec(value);
    return match ? Number(match[2]) * 3 + ['Spring', 'Summer', 'Fall'].indexOf(match[1]) : null;
  };
  const resourceTerm = index(term),
    present = index(currentTerm(now))!;
  return resourceTerm === null
    ? 'unknown'
    : resourceTerm < present
      ? 'past'
      : resourceTerm > present
        ? 'future'
        : 'current';
}

/** Dates are interpreted as published: date-only values remain valid throughout their
 * Vancouver date; timestamps retain their explicit offset. No deadline time is invented. */
export function resourceLifecycle(r: SFUResource, now = new Date()): Lifecycle {
  const today = localDate(now);
  const ui = resourceStatus(r, now);
  if (ui.lifecycle === 'historical' || ui.lifecycle === 'discontinued') return 'historical';
  if (r.program) {
    const lifecycle = programLifecycle(r, now);
    return lifecycle === 'completed' ? 'expired' : lifecycle;
  }
  if ([r.date, r.validFrom, r.validUntil].some((date) => date !== undefined && !validISODate(date)))
    return 'unknown';
  if (r.validFrom && r.validUntil && r.validUntil < r.validFrom) return 'unknown';
  if (ui.lifecycle === 'expired') return 'expired';
  const periods: Lifecycle[] = [];
  const period = (start: string, end = start): Lifecycle =>
    end < today ? 'expired' : start > today ? 'upcoming' : 'active';
  for (const date of r.dates ?? []) {
    if (!['date', 'range', 'timestamp'].includes(date.kind) || (date.kind === 'range' && !date.end))
      return 'unknown';
    if (date.kind === 'timestamp') {
      if (!instant(date.start)) return 'unknown';
      periods.push(
        Date.parse(date.start) < now.valueOf()
          ? 'expired'
          : Date.parse(date.start) === now.valueOf()
            ? 'active'
            : 'upcoming',
      );
    } else {
      if (
        !validISODate(date.start) ||
        (date.end && (!validISODate(date.end) || date.end < date.start))
      )
        return 'unknown';
      periods.push(period(date.start, date.end));
    }
  }
  if (r.date && !periods.length) periods.push(period(r.date));
  for (const session of r.sessions ?? []) {
    if (
      !validISODate(session.validFrom) ||
      !validISODate(session.validUntil) ||
      session.validUntil < session.validFrom
    )
      return 'unknown';
    periods.push(period(session.validFrom, session.validUntil));
  }
  if (periods.length)
    return periods.includes('active')
      ? 'active'
      : periods.includes('upcoming')
        ? 'upcoming'
        : 'expired';
  if (r.validFrom && r.validFrom > today) return 'upcoming';
  if (r.validFrom || r.validUntil) return 'active';
  const term = termApplicability(r.term, now);
  if (term === 'past') return 'expired';
  if (term === 'future') return 'upcoming';
  return term === 'unknown' || !r.lifecycle ? 'unknown' : 'active';
}

const quiet = ['fraser-library', 'belzberg-library', 'bennett-library'];
const advising = ['advising', 'advising-fass', 'advising-fas', 'advising-science'];
const tuition = ['student-account', 'tuition-payment', 'tuition-refunds'];
const refund = ['tuition-refunds', 'deadline-2', 'spring-tuition-refunds'];
const international = ['iss', 'international-advising', 'immigration', 'international-employment'];
const exchange = ['exchange-programs', 'exchange-credit', 'study-abroad-advising'];
export const resourceSearchProbes: {
  query: string;
  expectedIds: string[];
  categories: string[];
}[] = [
  { query: 'quiet study', expectedIds: quiet, categories: ['library'] },
  { query: 'floor 6', expectedIds: ['bennett-library'], categories: ['library'] },
  { query: 'lost wallet', expectedIds: ['lost-found'], categories: ['safety'] },
  { query: 'safe walk', expectedIds: ['safe-walk'], categories: ['safety'] },
  {
    query: 'writing help',
    expectedIds: ['writing', 'slc', 'academic-english'],
    categories: ['academic-support'],
  },
  { query: 'academic advising', expectedIds: advising, categories: ['advising'] },
  { query: 'tuition', expectedIds: tuition, categories: ['money'] },
  { query: 'refund', expectedIds: refund, categories: ['money', 'deadline'] },
  { query: 'computing ID', expectedIds: ['computing-id'], categories: ['digital'] },
  { query: 'U-Pass', expectedIds: ['upass'], categories: ['transport', 'student-essential'] },
  {
    query: 'badminton',
    expectedIds: ['drop-in-recreation', 'sport-clubs'],
    categories: ['recreation'],
  },
  { query: 'international student', expectedIds: international, categories: ['international'] },
  { query: 'exchange', expectedIds: exchange, categories: ['exchange'] },
  {
    query: 'food support',
    expectedIds: ['food-pantry', 'sfss-food-assistance', 'gss-food-support'],
    categories: ['food'],
  },
  { query: '安静自习', expectedIds: quiet, categories: ['library'] },
  { query: '失物招领', expectedIds: ['lost-found'], categories: ['safety'] },
  {
    query: '写作辅导',
    expectedIds: ['writing', 'slc', 'academic-english'],
    categories: ['academic-support'],
  },
  { query: '学业咨询', expectedIds: advising, categories: ['advising'] },
  { query: '学费', expectedIds: tuition, categories: ['money'] },
  {
    query: '退课退费',
    expectedIds: [...refund, 'enrolment-changes'],
    categories: ['money', 'deadline', 'course-planning'],
  },
  {
    query: '羽毛球',
    expectedIds: ['drop-in-recreation', 'sport-clubs'],
    categories: ['recreation'],
  },
  { query: '国际学生', expectedIds: international, categories: ['international'] },
  { query: '交换', expectedIds: exchange, categories: ['exchange'] },
  ...[
    ['study skills', 'slc-study-skills'],
    ['学习技巧', 'slc-study-skills'],
    ['procrastination', 'slc-procrastination'],
    ['拖延', 'slc-procrastination'],
    ['public speaking', 'slc-public-speaking'],
    ['公开演讲', 'slc-public-speaking'],
    ['scientific writing', 'slc-scientific-writing'],
    ['exam anxiety', 'slc-exam-anxiety'],
    ['考试焦虑', 'slc-exam-anxiety'],
    ['quantitative exam', 'slc-quantitative-exams'],
    ['English conversation', 'slc-lifes-little-debates'],
    ['英语口语', 'slc-lifes-little-debates'],
    ['Soup Circles', 'slc-soup-circles'],
    ['AI rehearsal', 'slc-ai-rehearsal'],
    ['zine', 'slc-zine-making'],
    ['学习计划', 'slc-schedule-building'],
  ].map(([query, id]) => ({ query, expectedIds: [id], categories: ['workshops-events'] })),
  ...[
    ['conversation partner', 'slc-conversation-partners'],
    ['writing consultation', 'writing'],
    ['WriteAway', 'slc-writeaway'],
    ['VOWəL', 'slc-vowel'],
  ].map(([query, id]) => ({ query, expectedIds: [id], categories: ['academic-support'] })),
];

function searchAudit(
  resources: SFUResource[],
  records: CatalogRecordAudit[],
  now: Date,
): SearchProbeResult[] {
  const applicable = new Set(
    records
      .filter(
        (r) =>
          !['expired', 'historical', 'unknown'].includes(r.lifecycle) &&
          r.termApplicability !== 'past',
      )
      .map((r) => r.id),
  );
  return resourceSearchProbes.map((probe) => {
    const expected = resources.filter(
      (r) =>
        probe.expectedIds.includes(r.id) &&
        probe.categories.includes(r.category) &&
        applicable.has(r.id),
    );
    const actual = searchResources(
      resources,
      probe.query,
      'All',
      'All',
      'Current',
      'All',
      now,
    ).slice(0, 10);
    const applicableIds = actual
      .filter((r) => expected.some((e) => e.id === r.id))
      .map((r) => r.id);
    const currentExpected = expected.filter(
      (r) => !r.term || termApplicability(r.term, now) === 'current',
    );
    return {
      query: probe.query,
      expectedIds: probe.expectedIds,
      actualIds: actual.map((r) => r.id),
      applicableIds,
      status: !currentExpected.length
        ? 'not-applicable'
        : applicableIds.length
          ? 'passed'
          : 'regression',
    };
  });
}

export function auditCatalog(input: unknown, now = new Date()): CatalogAuditResult {
  const findings: Finding[] = [];
  const records: CatalogRecordAudit[] = [];
  const add = (
    code: string,
    resourceIds: string[],
    message: string,
    severity: Finding['severity'] = 'warning',
    priority: Finding['priority'] = 'normal',
    url?: string,
  ) => {
    const digest = createHash('sha256')
      .update(JSON.stringify([code, resourceIds, message, url]))
      .digest('hex')
      .slice(0, 12);
    findings.push({
      id: `catalog:${code}:${digest}`,
      code,
      resourceIds,
      message,
      severity,
      priority,
      ...(url ? { url } : {}),
    });
  };
  if (!Array.isArray(input) || input.length === 0) {
    add(
      'REGISTRY_UNAVAILABLE',
      [],
      'Resource registry must be a non-empty array; the audit cannot inspect the catalog.',
      'error',
      'high',
    );
    return { totalRecords: Array.isArray(input) ? input.length : 0, records, findings, search: [] };
  }
  if (!Number.isFinite(now.valueOf())) {
    add(
      'AUDIT_CLOCK_INVALID',
      [],
      'Audit time is invalid; freshness and lifecycle cannot be established.',
      'error',
      'high',
    );
    return { totalRecords: input.length, records, findings, search: [] };
  }
  const safe: SFUResource[] = [];
  const seenIds = new Set<string>();
  for (const [index, raw] of input.entries()) {
    const data = object(raw) ? raw : {};
    const id = text(data.id) || `[record-${index + 1}]`;
    const reasons = impactReasons(data);
    const high = reasons.length > 0;
    const priority = high ? 'high' : 'normal';
    if (text(data.id)) {
      if (seenIds.has(id))
        add(
          'DUPLICATE_RESOURCE_ID',
          [id],
          'Duplicate canonical resource ID, including malformed records.',
          'error',
          priority,
        );
      seenIds.add(id);
    }
    const urls = collectResourceUrls(raw);
    const issues = shapeProblems(raw, now);
    for (const issue of issues) add('RESOURCE_SCHEMA_INVALID', [id], issue, 'error', priority);
    for (const entry of urls)
      if (!officialSource(entry.url))
        add(
          entry.roles.includes('qr') ? 'UNSAFE_QR_URL' : 'UNSAFE_URL',
          [id],
          'URL is malformed, unsafe, or outside reviewed provider domains.',
          'error',
          priority,
          entry.url,
        );
    const cost = data.cost;
    if (
      cost === 0 ||
      (object(cost) &&
        cost.status === 'unknown' &&
        (cost.amount === 0 ||
          cost.value === 0 ||
          /^(?:0|free|no charges?|\$0(?:\.00)?)[.!]?$/i.test(text(cost.details).trim())))
    )
      add(
        'UNKNOWN_COST_ZERO',
        [id],
        'Unknown cost is represented as zero/free; unknown must not imply free.',
        'error',
        priority,
      );
    if (issues.length) {
      records.push({
        id,
        title: text(data.title),
        category: text(data.category),
        highImpact: high,
        highImpactReasons: reasons,
        freshness: 'reviewDue',
        reviewDueAt: null,
        verifiedAt: null,
        lifecycle: 'unknown',
        termApplicability: 'unknown',
        urls,
        posterCompatible: data.posterCompatible === true,
      });
      continue;
    }
    const r = raw as SFUResource;
    safe.push(r);
    // Reuse the existing validator below; these enums are publication fields it
    // currently does not validate, and must not silently become policy defaults.
    if (!r.reviewCadence || !Object.hasOwn(reviewCadenceDays, r.reviewCadence))
      add('RESOURCE_SCHEMA_INVALID', [id], 'Missing or invalid review cadence.', 'error', priority);
    if (r.poster && !['facts', 'link'].includes(r.poster.mode))
      add('RESOURCE_SCHEMA_INVALID', [id], 'Invalid poster mode.', 'error', priority);
    for (const source of r.sources ?? [])
      if (
        !['retrieved', 'blocked', 'unavailable', 'not-published'].includes(source.retrievalStatus)
      )
        add(
          'RESOURCE_SCHEMA_INVALID',
          [id],
          'Missing or invalid source retrieval status.',
          'error',
          priority,
        );
    for (const date of r.dates ?? []) {
      if (!['date', 'range', 'timestamp'].includes(date.kind))
        add(
          'RESOURCE_SCHEMA_INVALID',
          [id],
          'Missing or invalid date event kind.',
          'error',
          priority,
        );
      if (date.kind === 'range' && !date.end)
        add(
          'RESOURCE_SCHEMA_INVALID',
          [id],
          'A published date range needs an explicit end date.',
          'error',
          priority,
        );
      if (
        date.kind === 'timestamp' &&
        (!instant(date.start) || date.timeZone !== 'America/Vancouver')
      )
        add(
          'RESOURCE_SCHEMA_INVALID',
          [id],
          'Timestamp event needs a valid explicit offset and America/Vancouver timezone.',
          'error',
          priority,
        );
    }
    const freshness = resourceFreshness(r, now);
    const lifecycle = resourceLifecycle(r, now);
    const term = termApplicability(r.term, now);
    records.push({
      id,
      title: r.title,
      category: r.category,
      highImpact: high,
      highImpactReasons: reasons,
      ...freshness,
      lifecycle,
      termApplicability: term,
      urls,
      posterCompatible: r.posterCompatible,
    });
    if (freshness.freshness === 'reviewDue' || freshness.freshness === 'stale')
      add(
        freshness.verifiedAt ? 'REVIEW_DUE' : 'FACTUAL_REVIEW_REQUIRED',
        [id],
        freshness.verifiedAt
          ? `${freshness.freshness === 'stale' ? 'Stale: ' : ''}factual review due ${freshness.reviewDueAt}; source reachability cannot renew verification.`
          : 'No complete factual verification; manual content review is required.',
        'warning',
        priority,
      );
    if (lifecycle === 'expired')
      add(
        'RESOURCE_EXPIRED',
        [id],
        'Published event/deadline, validity period, recurring schedule, or term has ended; keep historical information but do not recommend it as current.',
        'warning',
        priority,
      );
    if (r.program) {
      const occurrences = programOccurrences(r);
      const { past, uncertain } = splitProgramOccurrences(r, now);
      if (past.length)
        add(
          'EVENT_PASSED',
          [id],
          `${past.length} published occurrence${past.length === 1 ? ' has' : 's have'} passed; exclude these from This Week and new poster session suggestions.`,
          'warning',
          priority,
        );
      if (programLifecycle(r, now) === 'completed' && occurrences.length > 1)
        add(
          'SERIES_COMPLETED',
          [id],
          'The final published occurrence has passed. Keep the canonical program and its history; do not treat earlier sessions as a current series.',
          'warning',
          priority,
        );
      if (
        r.program.manualReviewRequired ||
        uncertain.length ||
        occurrences.some((occurrence) => occurrence.manualReviewRequired) ||
        r.program.recurrences?.some((rule) => rule.manualReviewRequired)
      )
        add(
          'PROGRAM_MANUAL_REVIEW_REQUIRED',
          [id],
          r.program.manualReviewNote ??
            'One or more source schedule values need manual confirmation; do not normalize a guessed correction.',
          'warning',
          priority,
        );
    }
    if (term === 'past' && lifecycle !== 'historical')
      add(
        'TERM_OUT_OF_SCOPE',
        [id],
        `${r.term} is outside the current ${currentTerm(now)} browsing term.`,
        'warning',
        priority,
      );
    if (lifecycle === 'unknown')
      add(
        'LIFECYCLE_UNKNOWN',
        [id],
        'Available date/term metadata cannot establish current applicability.',
        'warning',
        priority,
      );
    const recurring =
      !!r.sessions?.length ||
      !!r.hours ||
      r.reviewCadence === 'schedule' ||
      !!r.program?.recurrences?.length;
    if (recurring) {
      // A dated workshop/list already supplies its publication bounds. Recurrence
      // rules reached here only after their explicit start/end dates passed the
      // shape guard. An ongoing service's first listed date is not its end date.
      const boundedProgramEvents =
        r.program &&
        r.program.kind !== 'service' &&
        (!!r.program.occurrences.length || !!r.program.recurrences?.length);
      if (
        (r.validUntil && r.validUntil < localDate(now)) ||
        r.sessions?.some((s) => s.validUntil < localDate(now)) ||
        (r.program && programLifecycle(r, now) === 'completed')
      )
        add(
          'SCHEDULE_EXPIRED',
          [id],
          'At least one published recurring schedule validity period has ended.',
          'warning',
          priority,
        );
      if (
        (!r.validFrom || !r.validUntil) &&
        !r.sessions?.length &&
        !(r.program?.startDate && r.program.endDate) &&
        !boundedProgramEvents
      )
        add(
          'SCHEDULE_VALIDITY_MISSING',
          [id],
          'Time-sensitive service has no bounded published schedule validity. Review the source; do not extrapolate current hours or closure operation.',
          'warning',
          priority,
        );
      if (!r.verification?.verifiedAt)
        add(
          'SCHEDULE_UNVERIFIED',
          [id],
          'Recurring/time-sensitive information lacks a complete factual verification.',
          'warning',
          priority,
        );
    }
    const audience = r.audiences ?? [];
    const eligibility = (r.eligibility ?? []).join(' ');
    const restricted = (group: string) =>
      new RegExp(
        `\\b${group}(?: students?)? only\\b|\\bonly (?:for )?${group}(?: students?)?\\b`,
        'i',
      ).test(eligibility);
    if (
      (restricted('graduate') &&
        (audience.includes('All students') || audience.includes('Undergraduate'))) ||
      (restricted('undergraduate') &&
        (audience.includes('All students') || audience.includes('Graduate'))) ||
      (r.eligibility?.some((condition) =>
        /^(?:For )?(?:self-identified )?Indigenous students only[.!]?$/i.test(condition.trim()),
      ) &&
        audience.includes('All students'))
    )
      add(
        'AUDIENCE_CONFLICT',
        [id],
        'Audience metadata conflicts with an explicit only-for eligibility condition.',
        'error',
        priority,
      );
    if (
      r.verification?.status !== 'reviewed' &&
      !/confirm|unavailable|unverified|incomplete|not confirmed|not independently|conflict|not retrieved|could not|not established|unknown/i.test(
        [r.summary, r.verification?.note, ...(r.details?.map((d) => d.body) ?? [])].join(' '),
      )
    )
      add(
        'INCOMPLETE_INFORMATION_UNQUALIFIED',
        [id],
        'Incomplete factual review should be qualified in the service description or review note.',
        'warning',
        priority,
      );
    if (r.posterCompatible) {
      const body = resourcePosterText(r, now);
      if (
        !body.trim() ||
        !r.poster ||
        !r.poster.title.trim() ||
        !r.poster.facts.some((f) => f.trim())
      )
        add(
          'POSTER_EMPTY',
          [id],
          'Poster-compatible resource has no usable structured poster content.',
          'error',
          priority,
        );
      if (body.length > 900 || body.split('\n').length > 16)
        add(
          'POSTER_TOO_LONG',
          [id],
          `Poster output is ${body.length} characters / ${body.split('\n').length} lines; review layout without automatically shortening qualifications.`,
          'warning',
          priority,
        );
      if (/https?:\/\/\S{60,}/i.test(body))
        add(
          'POSTER_RAW_URL',
          [id],
          'Visible poster text contains a long raw URL; keep provenance in a source/QR field.',
          'warning',
          priority,
        );
      if (!body.includes('Source:') || !r.sources?.some((s) => s.url === r.sourceUrl))
        add(
          'POSTER_SOURCE_REFERENCE',
          [id],
          'Poster provenance has a missing/broken source reference.',
          'error',
          priority,
        );
      if (r.poster?.conditions.some((c) => !body.includes(c)))
        add(
          'POSTER_CONDITION_MISSING',
          [id],
          'An explicit poster qualification is absent from rendered poster output.',
          'error',
          priority,
        );
      if (
        (high && r.poster?.mode === 'facts' && !r.poster.conditions.some((c) => c.trim())) ||
        (/non[- ]refundable/i.test(eligibility) && !/non[- ]refundable/i.test(body)) ||
        (/\bmembership\b.*\b(?:required|need)|\b(?:required|need)\b.*\bmembership\b/i.test(
          eligibility,
        ) &&
          !/\bmembership\b.*\b(?:required|need)|\b(?:required|need)\b.*\bmembership\b/i.test(body))
      )
        add(
          'POSTER_QUALIFICATION_REVIEW',
          [id],
          'Essential eligibility/financial qualifications may be missing from concise poster output; review wording without automatic edits.',
          'warning',
          priority,
        );
      if (lifecycle === 'expired' && r.poster?.mode !== 'link')
        add(
          'POSTER_EXPIRED',
          [id],
          'Poster facts describe an expired date, schedule or term; review before reuse.',
          'warning',
          priority,
        );
      if (recurring && ['reviewDue', 'stale'].includes(freshness.freshness))
        add(
          'POSTER_SCHEDULE_REVIEW',
          [id],
          'Poster uses time-sensitive schedule/service content that is due for factual review.',
          'warning',
          priority,
        );
    }
  }
  // Existing validator owns schema/evidence/canonical duplicates/related references.
  // Its older generic warnings use a different freshness policy, so only its errors
  // are merged; dated warnings above use the centralized cadence and Vancouver clock.
  try {
    for (const message of validateResources(safe, now).errors) {
      const ids = [
        ...new Set(
          safe
            .filter(
              (r) =>
                message.startsWith(`${r.id}:`) || message === `Duplicate or missing ID: ${r.id}`,
            )
            .map((r) => r.id),
        ),
      ];
      add(
        'RESOURCE_SCHEMA_INVALID',
        ids,
        message,
        'error',
        records.some((r) => ids.includes(r.id) && r.highImpact) ? 'high' : 'normal',
      );
    }
  } catch {
    add(
      'VALIDATION_CRASH',
      [],
      'The existing semantic resource validator could not complete; other per-record audit results are retained.',
      'error',
      'high',
    );
  }
  let search: SearchProbeResult[] = [];
  try {
    search = searchAudit(safe, records, now);
    for (const result of search)
      if (result.status === 'regression')
        add(
          'SEARCH_REGRESSION',
          result.expectedIds.filter((id) => records.some((r) => r.id === id)),
          `Search query “${result.query}” returned no plausible applicable expected resource in the first ten current-term results. This is a search regression, not proof that a resource is invalid.`,
        );
  } catch {
    add(
      'SEARCH_AUDIT_FAILED',
      [],
      'Search audit could not complete; inspect malformed searchable fields.',
      'error',
      'high',
    );
  }
  return { totalRecords: input.length, records, findings, search };
}
