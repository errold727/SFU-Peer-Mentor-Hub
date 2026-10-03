import { daysUntil } from './dates';
export function getVerificationStatus(date: string | null, now = new Date()) {
  if (!date || !validISODate(date)) return 'unverified';
  const age = -daysUntil(date, now);
  if (age < 0) return 'unverified';
  return age < 90 ? 'fresh' : age <= 180 ? 'reviewSoon' : 'stale';
}
export const verificationLabels = {
  fresh: 'Verified',
  reviewSoon: 'Review Soon',
  stale: 'Review Recommended / Stale',
  unverified: 'Unverified',
};
export function validISODate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
