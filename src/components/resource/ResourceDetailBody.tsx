import { Link } from 'react-router-dom';
import type { SFUResource } from '../../data/resources/types';
import { resourceStatus } from '../../utils/resourceStatus';

export function ResourceDetailBody({ resource: r }: { resource: SFUResource }) {
  const state = resourceStatus(r);
  return (
    <div className="resource-details">
      <p>{r.summary}</p>
      <p className="detail-meta">
        {r.provider?.name} · {r.campuses?.join(' · ')}
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
      {r.details?.map((s) => (
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
