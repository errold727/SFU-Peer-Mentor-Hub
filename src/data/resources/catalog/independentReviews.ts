import type { DirectoryResource } from '../types';

// Completed comparisons by an agent other than each record's author. These do not
// promote partial records to reviewed or refresh the original evidence timestamps.
const lifeIds = new Set([
  'recreation-membership',
  'drop-in-recreation',
  'fitness-centre',
  'intramurals',
  'fitness-programs',
  'recreation-equipment-courts',
  'recreation-lockers-refunds',
  'health-medical',
  'counselling',
  'myssp',
  'wellbeing-groups-self-help',
  'sexual-health',
  'vaccinations',
  'gender-affirming-care',
  'accessible-learning-registration',
  'accessible-learning-renewal-exams',
  'accessible-learning-tools',
  'global-student-centre',
  'womens-centre',
  'out-on-campus',
  'international-advising',
  'immigration',
  'insurance',
  'international-employment',
  'international-family',
  'residence-applications',
  'residence-offers-contracts',
  'residence-moving',
  'residence-daily-services',
  'residence-room-changes',
  'accessible-residence',
  'off-campus-housing',
  'dining-meal-plans',
  'dietary-allergen-enquiries',
  'food-pantry',
  'sfss-food-assistance',
  'embark-food-rescue',
  'gss-food-support',
]);
export function withIndependentReview(r: DirectoryResource): DirectoryResource {
  if (r.topic === '01' || r.topic === '08')
    return {
      ...r,
      secondReview: {
        reviewer: 'agent',
        reviewedAt: '2026-10-04T15:41:58.430Z',
        note: 'Separate source comparison: docs/resources/review-dates-safety.md. Closure evidence mapping corrected.',
      },
    };
  if (lifeIds.has(r.id))
    return {
      ...r,
      secondReview: {
        reviewer: 'agent',
        reviewedAt: '2026-10-04T16:02:15.499Z',
        note: 'Separate source comparison: docs/resources/review-life.md. Partial claims remain partial; CAL deadlines and non-refundable offer payment retained.',
      },
    };
  return r;
}
