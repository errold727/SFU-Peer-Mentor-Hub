import { Link } from 'react-router-dom';
import { resources } from '../../data/resources';
import type { ResourceOccurrence, SFUResource } from '../../data/resources/types';
import { resourceStatus } from '../../utils/resourceStatus';
import {
  occurrenceHasConfirmedTime,
  occurrenceLocationLabel,
  occurrenceTimeLabel,
  programLifecycle,
  programRegistrationUrl,
  splitProgramOccurrences,
} from '../../utils/resourceOccurrences';
import './resourcePrograms.css';

function ProgramDetails({ resource: r, now }: { resource: SFUResource; now: Date }) {
  const program = r.program!;
  const { upcoming, past, uncertain } = splitProgramOccurrences(r, now);
  const registration = programRegistrationUrl(r);
  const lifecycle = programLifecycle(r, now);
  const hasConfirmedOccurrenceTimes = [...upcoming, ...past].some(occurrenceHasConfirmedTime);
  const modeLabels = {
    'in-person': 'In person',
    online: 'Online',
    hybrid: 'Hybrid',
    unknown: 'Delivery mode unconfirmed',
  };
  const occurrenceList = (items: ResourceOccurrence[], historical = false) => (
    <ul className="program-occurrences">
      {items.map((occurrence) => {
        const url = programRegistrationUrl(r, occurrence);
        return (
          <li key={occurrence.id}>
            <strong>
              <time dateTime={occurrence.date}>{occurrence.date}</time> ·{' '}
              {occurrenceTimeLabel(occurrence)}
            </strong>
            <span>
              {occurrenceLocationLabel(occurrence)}
              {occurrence.mode !== 'hybrid' && ` · ${modeLabels[occurrence.mode]}`}
            </span>
            <small>Program guide page {occurrence.sourcePage}</small>
            {occurrence.manualReviewRequired && (
              <p className="notice">
                Review needed:{' '}
                {occurrence.manualReviewNote ??
                  'Confirm this occurrence with the official provider before making plans.'}
              </p>
            )}
            {!historical && url && (
              <a href={url} target="_blank" rel="noopener noreferrer">
                Register for this date ↗
              </a>
            )}
            {!historical && !url && occurrence.registrationStatus === 'unavailable' && (
              <small>Registration link unavailable. {occurrence.registrationNote}</small>
            )}
            {!historical && occurrence.registrationStatus === 'not-required' && (
              <small>Registration not required. {occurrence.registrationNote}</small>
            )}
          </li>
        );
      })}
    </ul>
  );
  return (
    <section className="program-details" aria-label="Program dates and registration">
      <h3>Dates and location</h3>
      <p className="detail-meta">
        {r.term ? `${r.term} · ` : ''}
        {lifecycle === 'completed'
          ? 'Completed'
          : lifecycle === 'upcoming'
            ? 'Upcoming'
            : lifecycle === 'active'
              ? 'Active'
              : 'Schedule needs confirmation'}
      </p>
      {hasConfirmedOccurrenceTimes && (
        <p className="detail-meta">Confirmed dated session times are in America/Vancouver.</p>
      )}
      {program.manualReviewRequired && (
        <p className="notice">
          Review needed:{' '}
          {program.manualReviewNote ??
            'Some program details need confirmation with the official provider.'}
        </p>
      )}
      {program.scheduleText && <p>{program.scheduleText}</p>}
      {upcoming.length > 0 && (
        <>
          <h4>Upcoming dates</h4>
          {occurrenceList(upcoming)}
        </>
      )}
      {upcoming.length === 0 && program.kind !== 'service' && <p>No confirmed upcoming dates.</p>}
      {uncertain.length > 0 && (
        <>
          <h4>Dates needing confirmation</h4>
          {occurrenceList(uncertain)}
        </>
      )}
      {past.length > 0 && (
        <details className="program-history">
          <summary tabIndex={0}>Past dates ({past.length})</summary>
          {occurrenceList(past, true)}
        </details>
      )}
      <h3>Registration</h3>
      {registration ? (
        <p>
          <a href={registration} target="_blank" rel="noopener noreferrer">
            Register with the official provider ↗
          </a>
        </p>
      ) : (
        <p>
          {program.registrationStatus === 'not-required'
            ? 'Registration not required.'
            : [...upcoming, ...uncertain].some((occurrence) =>
                  programRegistrationUrl(r, occurrence),
                )
              ? 'Use the registration link beside the relevant date.'
              : 'Registration link unavailable. Check the official program source for arrangements.'}
        </p>
      )}
      {program.registrationNote && <p>{program.registrationNote}</p>}
      <p className="detail-meta">
        Source: {program.sourceDocument?.filename ?? 'Program guide'} ·{' '}
        {program.sourcePages.length === 1 ? 'Page' : 'Pages'} {program.sourcePages.join(', ')}
      </p>
    </section>
  );
}

export function ResourceDetailBody({
  resource: r,
  now = new Date(),
}: {
  resource: SFUResource;
  now?: Date;
}) {
  const state = resourceStatus(r, now);
  const relatedResources = r.program
    ? [...new Set(r.relatedIds ?? [])].flatMap((id) => {
        const related = resources.find((resource) => resource.id === id && resource.id !== r.id);
        return related ? [related] : [];
      })
    : [];
  return (
    <div className="resource-details">
      <p>{r.summary}</p>
      <p className="detail-meta">
        {r.provider?.name} ·{' '}
        {r.campuses
          ? r.campuses.length
            ? r.campuses.join(' · ')
            : 'Location not specified'
          : r.campus === 'All'
            ? 'All campuses'
            : r.campus}
        {r.term && ` · ${r.term}`}
      </p>
      <p className={state.reviewed ? 'detail-meta' : 'notice'}>
        {state.label}
        {r.lastVerified &&
          ` · ${r.lastVerified} (${r.verification?.reviewer ?? 'agent'} source review)`}
        {state.freshness === 'due' && ' · Review due'}
        {state.lifecycle === 'expired' && ' · Expired — check the official source'}
      </p>
      {r.verification?.status !== 'reviewed' && (
        <p className="notice">
          Some details remain unconfirmed. Use the official service page for current arrangements.
        </p>
      )}
      {r.verification?.note && <p className="detail-meta">{r.verification.note}</p>}
      <h3>Who can use it</h3>
      <p>{r.audiences?.join(' · ')}</p>
      <ul>
        {r.eligibility?.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      {r.program &&
        r.details?.map((s) => (
          <section key={s.heading}>
            <h3>{s.heading}</h3>
            <p>{s.body}</p>
          </section>
        ))}
      {r.program && <ProgramDetails resource={r} now={now} />}
      {relatedResources.length > 0 && (
        <section aria-label="Related resources">
          <h3>Related resources</h3>
          <ul>
            {relatedResources.map((related) => (
              <li key={related.id}>
                <Link
                  to={`/resources?category=${encodeURIComponent(related.category)}&resource=${encodeURIComponent(related.id)}`}
                >
                  {related.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <h3>How to access</h3>
      <ol>
        {r.access?.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <a
        className="button tertiary"
        href={r.actionUrl ?? r.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        Open official service ↗
      </a>
      {r.category === 'course-planning' && (
        <p>
          <Link to="/course-planner">Open Course Planner →</Link>
        </p>
      )}
      {!!r.facts?.length && (
        <dl className="fact-list">
          {r.facts.map((f, i) => (
            <div key={i}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {!r.program &&
        r.details?.map((s) => (
          <section key={s.heading}>
            <h3>{s.heading}</h3>
            <p>{s.body}</p>
          </section>
        ))}
      {!!r.locations?.length && (
        <section>
          <h3>Where</h3>
          <ul>
            {r.locations.map((l, i) => (
              <li key={i}>
                <strong>
                  {l.campus}: {l.name}
                </strong>
                {l.details && ` — ${l.details}`}
              </li>
            ))}
          </ul>
        </section>
      )}
      {r.hours && (
        <section>
          <h3>Hours</h3>
          <p>{r.hours}</p>
        </section>
      )}
      {(r.validFrom || r.validUntil) && (
        <p>
          {r.topic === '01'
            ? 'Directory retention window (not a university deadline): '
            : 'Validity: '}
          {r.validFrom
            ? `${r.validFrom}${r.validUntil ? ' through ' + r.validUntil : ''}`
            : `Through ${r.validUntil}`}
        </p>
      )}
      <section>
        <h3>Cost</h3>
        <p>
          {r.cost?.status === 'published'
            ? r.cost.details
            : (r.cost?.details ??
              'Not confirmed here. Check the official service page for charges and coverage.')}
        </p>
      </section>
      {!!r.contacts?.length && (
        <section>
          <h3>Service contacts</h3>
          <ul>
            {r.contacts.map((c, i) => (
              <li key={i}>
                {c.label}:{' '}
                {c.kind === 'phone' ? (
                  <a href={`tel:${c.value.replace(/[^+\d]/g, '')}`}>{c.value}</a>
                ) : c.kind === 'email' ? (
                  <a href={`mailto:${c.value}`}>{c.value}</a>
                ) : (
                  c.value
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h3>Sources and review</h3>
        <ul>
          {r.sources?.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title} ↗
              </a>
              {s.retrievalStatus === 'blocked' && ' · Source access blocked during review'}
            </li>
          ))}
        </ul>
        <p className="detail-meta">
          {r.verification?.reviewer === 'human' ? 'Human' : 'Agent'} source review
          {r.verification?.reviewedAt && ` · ${r.verification.reviewedAt.slice(0, 10)}`}
          {r.reviewDueAt && ` · Next review target ${r.reviewDueAt}`}
        </p>
      </section>
    </div>
  );
}
