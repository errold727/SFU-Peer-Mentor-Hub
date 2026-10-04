import { categories, type SFUResource } from '../data/resources/types';
import { auditResources, officialSource } from './resourceHealth';
import { validISODate } from './verification';

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
    if (
      !r.campuses?.length ||
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
    }
    if (!r.evidence?.length) fail('evidence required');
    for (const e of r.evidence ?? [])
      if (!sourceIds.has(e.sourceId) || !e.field || !e.locator) fail('broken evidence reference');
    const mapped = (field: string) =>
      r.evidence?.some(
        (e) =>
          (e.field === field || field.startsWith(e.field + '.')) &&
          r.sources?.some((s) => s.id === e.sourceId && instant(s.lastRetrievedAt)),
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
    r.poster?.facts.forEach((_, i) => {
      if (!mapped(`poster.facts.${i}`)) fail(`missing evidence for poster.facts.${i}`);
    });
    if (
      (r.highImpact ||
        r.cost?.status === 'published' ||
        r.contacts?.some((c) => c.kind === 'phone') ||
        !!r.dates?.length ||
        !!r.sessions?.length) &&
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
