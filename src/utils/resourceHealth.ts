import type { SFUResource } from '../data/resources/types';
import { getVerificationStatus, validISODate } from './verification';
export type LinkStatus = 'reachable' | 'redirect' | 'blocked' | 'unverified' | 'invalid';
export function officialSource(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      (url.hostname === 'sfu.ca' ||
        url.hostname.endsWith('.sfu.ca') ||
        url.hostname === 'sfu.teamdynamix.com')
    );
  } catch {
    return false;
  }
}
export function auditResources(items: SFUResource[], now = new Date()) {
  const ids = new Set<string>();
  const sources = new Map<string, string[]>();
  const errors: string[] = [],
    warnings: string[] = [];
  for (const r of items) {
    if (!r.id || ids.has(r.id)) errors.push(`Duplicate or missing ID: ${r.id}`);
    ids.add(r.id);
    if (!officialSource(r.sourceUrl))
      errors.push(`${r.id}: missing, malformed, or non-official source URL`);
    sources.set(r.sourceUrl, [...(sources.get(r.sourceUrl) ?? []), r.id]);
    if (r.lastVerified && !validISODate(r.lastVerified))
      errors.push(`${r.id}: invalid verification date`);
    const status = getVerificationStatus(r.lastVerified, now);
    if (status !== 'fresh') warnings.push(`${r.id}: ${status}`);
    if (r.validUntil && validISODate(r.validUntil) && r.validUntil < now.toISOString().slice(0, 10))
      warnings.push(`${r.id}: expired schedule`);
  }
  return {
    errors,
    warnings,
    sharedSources: [...sources].filter(([, ids]) => ids.length > 1),
    sources: [...sources.keys()],
  };
}
export function classifyResponse(status: number, redirected: boolean, body = ''): LinkStatus {
  if (
    [401, 403, 429].includes(status) ||
    /anubis|botstopper|captcha|verify you are human|making sure you're not a bot/i.test(body)
  )
    return 'blocked';
  if ([404, 410].includes(status)) return 'invalid';
  if (status >= 200 && status < 300) return redirected ? 'redirect' : 'reachable';
  return 'unverified';
}
