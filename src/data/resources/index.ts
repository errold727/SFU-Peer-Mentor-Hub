import type { DirectoryResource } from './types';
import { academicResources } from './catalog/academic';
import { lifeResources } from './catalog/life';
import { pathwaysResources } from './catalog/pathways';
import { dateResources, mergedResourceIds } from './catalog/dates';
import { safetyResources } from './catalog/safety';
import { withIndependentReview } from './catalog/independentReviews';
import { reconcileSlcFall2026 } from './slcFall2026';

const catalog = reconcileSlcFall2026([
  ...academicResources,
  ...lifeResources,
  ...pathwaysResources,
  ...dateResources,
  ...safetyResources,
]);
const familiar = [
  'bennett-library',
  'campus-safety',
  'safe-walk',
  'drop-in-recreation',
  'lost-found',
  'computing-id',
  'printing',
  'id-card',
  'upass',
  'advising',
  'slc',
  'writing',
  'research',
  'office-hours',
  'iss',
  'immigration',
  'insurance',
  'international-advising',
  'myinvolvement',
  'course-outlines',
];
export const resources: DirectoryResource[] = [
  ...familiar.flatMap((id) => catalog.filter((r) => r.id === id)),
  ...catalog.filter((r) => !familiar.includes(r.id)),
].map(withIndependentReview);
export function resolveResource(id: string) {
  return resources.find((r) => r.id === (mergedResourceIds[id] ?? id));
}
export { mergedResourceIds };
