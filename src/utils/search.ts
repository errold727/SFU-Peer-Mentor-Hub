import Fuse from 'fuse.js';
import type { SFUResource } from '../data/resources/types';
import { currentTerm, daysUntil } from './dates';
export function searchResources(resources: SFUResource[], query: string, category = 'All', campus = 'All', term = 'All') {
 const selectedTerm = term === 'Current' ? currentTerm() : term;
 const filtered = resources.filter(r => (category === 'All' || r.category === category) && (campus === 'All' || r.campus === campus || r.campus === 'All') && (selectedTerm === 'All' || !r.term || r.term === selectedTerm));
 return query.trim() ? new Fuse(filtered, { keys:['title','summary','facts.value','tags'], threshold:0.35, ignoreLocation:true }).search(query.trim()).map(result => result.item) : filtered;
}
export function thisWeekResources(resources: SFUResource[], now = new Date()) { const timely = resources.filter(r => r.date && daysUntil(r.date, now) >= 0 && daysUntil(r.date, now) <= 7); return [...timely, ...resources.filter(r => !r.date && (!r.validUntil || daysUntil(r.validUntil, now) >= 0) && r.lastVerified)].slice(0,3); }
export function resourceText(r: SFUResource) { return [r.title, r.date, r.summary, ...(r.facts ?? []).map(f => `${f.label ? f.label + ': ' : ''}${f.value}`), `Source: ${r.sourceName}`, r.sourceUrl, `Last verified: ${r.lastVerified ?? 'Not yet verified'}`].filter(Boolean).join('\n'); }
