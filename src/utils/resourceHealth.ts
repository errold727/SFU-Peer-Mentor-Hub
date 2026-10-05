import type { SFUResource } from '../data/resources/types';
import { categories } from '../data/resources/types';
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
        url.hostname === 'vowel-writers.weebly.com' ||
        url.hostname === 'sfu.teamdynamix.com' ||
        [
          'sfss.ca',
          'sfugradsociety.ca',
          'studentcare.ca',
          'translink.ca',
          'compasscard.ca',
          'canada.ca',
          'gov.bc.ca',
          'studentaidbc.ca',
          'guard.me',
          'alumo.ca',
          'writeaway.ca',
          'embarksustainability.org',
        ].some((domain) => url.hostname === domain || url.hostname.endsWith('.' + domain)))
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
    if (
      !r.title?.trim() ||
      !r.summary?.trim() ||
      !r.sourceName?.trim() ||
      !(r.category in categories) ||
      !['All', 'Burnaby', 'Surrey', 'Vancouver'].includes(r.campus)
    )
      errors.push(`${r.id}: missing or invalid resource metadata`);
    for (const key of ['date', 'validUntil'] as const)
      if (r[key] !== undefined && !validISODate(r[key])) errors.push(`${r.id}: invalid ${key}`);
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
  for (const r of items)
    for (const s of r.sources ?? [])
      sources.set(s.url, [...new Set([...(sources.get(s.url) ?? []), r.id])]);
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
