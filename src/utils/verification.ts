import { daysUntil } from './dates';
export function getVerificationStatus(date: string | null, now = new Date()) { if (!date) return 'unverified'; const age = -daysUntil(date, now); return age < 90 ? 'fresh' : age <= 180 ? 'reviewSoon' : 'stale'; }
