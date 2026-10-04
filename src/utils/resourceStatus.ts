import type { SFUResource, ResourceSession } from '../data/resources/types';
import { localDate } from './dates';
import { getVerificationStatus, verificationLabels } from './verification';

export function resourceStatus(r: SFUResource, now = new Date()) {
  const today = localDate(now);
  const lifecycle =
    r.lifecycle === 'discontinued'
      ? 'discontinued'
      : r.lifecycle === 'historical'
        ? 'historical'
        : r.validUntil && r.validUntil < today
          ? 'expired'
          : 'active';
  const future = !!r.validFrom && r.validFrom > today;
  const reviewed = r.verification
    ? r.verification.status === 'reviewed' &&
      !!r.verification.verifiedAt &&
      r.verification.verifiedAt.slice(0, 10) <= today
    : getVerificationStatus(r.lastVerified, now) === 'fresh';
  const freshness = !reviewed
    ? 'unknown'
    : r.reviewDueAt
      ? r.reviewDueAt < today
        ? 'due'
        : 'current'
      : getVerificationStatus(r.lastVerified, now) === 'fresh'
        ? 'current'
        : 'due';
  const label = !r.verification
    ? verificationLabels[getVerificationStatus(r.lastVerified, now)]
    : r.verification.status === 'partial'
      ? 'Partially reviewed'
      : !reviewed
        ? 'Unverified'
        : 'Source reviewed';
  return { lifecycle, future, reviewed, freshness, label };
}

// Recurrence is bounded by source validity. Known closures are date-only in Vancouver.
export function sessionOccursOn(session: ResourceSession, date: string) {
  if (date < session.validFrom || date > session.validUntil || session.exceptions.includes(date))
    return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) return false;
  return (
    new Intl.DateTimeFormat('en-CA', { weekday: 'long', timeZone: 'America/Vancouver' }).format(
      parsed,
    ) === session.day
  );
}
