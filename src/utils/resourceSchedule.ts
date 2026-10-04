import type { SFUResource } from '../data/resources/types';
import { resourceStatus } from './resourceStatus';

export function filteredScheduleResource(
  resource: SFUResource,
  sport = 'All',
  day = 'All',
  now = new Date(),
): SFUResource | undefined {
  if (resourceStatus(resource, now).lifecycle !== 'active' || !resource.sessions?.length) return;
  const sessions = resource.sessions.filter(
    (s) => (sport === 'All' || sport === s.sport) && (day === 'All' || day === s.day),
  );
  const title = `${sport === 'All' ? 'Drop-In Recreation' : sport} · ${day === 'All' ? 'Weekly schedule' : day}`;
  const facts = sessions.map((s) => ({
    label: `${s.day} · ${s.sport}`,
    value: `${s.start}–${s.end} · ${s.location}`,
  }));
  return {
    ...resource,
    id: `recreation:${sport}:${day}`,
    title,
    sessions,
    facts,
    poster: {
      title,
      facts:
        facts.length <= 4
          ? facts.map((f) => `${f.label}: ${f.value}`)
          : [
              'Multiple sessions match your filter.',
              'Open the official schedule for all times and locations.',
            ],
      conditions: resource.poster?.conditions ?? [
        'Membership conditions apply. Check closures before attending.',
      ],
      mode: 'facts',
    },
  };
}
