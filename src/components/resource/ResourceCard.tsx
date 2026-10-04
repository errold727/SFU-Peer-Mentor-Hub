import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Plus } from 'lucide-react';
import { categories, type SFUResource } from '../../data/resources/types';
import { usePosterBasket } from '../../store/posterBasketStore';
import { getRelativeDeadlineLabel, daysUntil } from '../../utils/dates';
import { getVerificationStatus, verificationLabels } from '../../utils/verification';
import { resourceStatus } from '../../utils/resourceStatus';
import { ResourceDetailBody } from './ResourceDetailBody';
import { resourceText } from '../../utils/search';
import { Modal } from '../ui/Modal';
export function ResourceCard({ resource: r }: { resource: SFUResource }) {
  const [detail, setDetail] = useState(false);
  const [copied, setCopied] = useState('');
  const basket = usePosterBasket();
  const added = basket.items.some((i) => i.id === r.id);
  const status = getVerificationStatus(r.lastVerified);
  const reviewed = resourceStatus(r);
  return (
    <article className="resource-card">
      <div className="eyebrow">
        <span>{categories[r.category]}</span>
        <span>{r.campuses?.join(' · ') ?? (r.campus === 'All' ? 'All campuses' : r.campus)}</span>
      </div>
      <h3>{r.title}</h3>
      {r.date && (
        <div className={`badge ${daysUntil(r.date) < 0 ? 'muted' : ''}`}>
          {r.date} · {getRelativeDeadlineLabel(r.date)}
        </div>
      )}
      <p>{r.summary}</p>
      {r.provider && (
        <p className="resource-provider">
          {r.provider.name}
          {r.provider.type === 'student-organization'
            ? ' · Student organization'
            : r.provider.type === 'external-official'
              ? ' · External provider'
              : ''}
        </p>
      )}
      {r.validUntil && daysUntil(r.validUntil) < 0 && (
        <p className="notice">Entry period ended — check the official source.</p>
      )}
      <div className="verification">
        <span className={status === 'fresh' ? '' : 'warning'}>
          {reviewed.label}
          {status === 'fresh' ? ` · ${r.lastVerified}` : ''}
        </span>
        {status !== 'fresh' && r.lastVerified && <span>Reviewed {r.lastVerified}</span>}
        {reviewed.freshness === 'due' && <span>Review due</span>}
        {reviewed.future && <span>Starts {r.validFrom}</span>}
      </div>
      <div className="card-actions">
        <button className="tertiary" onClick={() => setDetail(true)}>
          View Details
        </button>
        <a href={r.sourceUrl} target="_blank" rel="noreferrer" title={r.sourceName}>
          Official Source <ArrowUpRight size={15} />
        </a>
        <button
          className="tertiary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(resourceText(r));
              setCopied('Copied');
            } catch {
              setCopied('Copy unavailable — open details and select text.');
            }
          }}
        >
          <Copy size={15} />
          {copied || 'Copy'}
        </button>
        <button
          className={added ? 'added' : 'add-button'}
          disabled={added || !r.posterCompatible}
          onClick={() => basket.add(r)}
        >
          {added ? <Check size={16} /> : <Plus size={16} />} {added ? 'Added' : 'Add to Poster'}
        </button>
      </div>
      {detail && (
        <Modal title={r.title} onClose={() => setDetail(false)}>
          {r.schemaVersion === 2 ? (
            <ResourceDetailBody resource={r} />
          ) : (
            <>
              <p>{r.summary}</p>
              <p className={status === 'fresh' ? 'detail-meta' : 'notice'}>
                {verificationLabels[status]}
                {r.lastVerified &&
                  ` · ${status === 'fresh' ? '' : 'Verified '}${r.lastVerified}`} ·{' '}
                {r.campus === 'All' ? 'All campuses' : r.campus}
                {r.term && ` · ${r.term}`}
                {r.date && ` · ${r.date}`}
              </p>
              {status === 'unverified' && !r.verificationNote && (
                <p>
                  Source content could not be independently confirmed. Check the official page
                  before sharing.
                </p>
              )}
              {r.verificationNote && <p className="notice">{r.verificationNote}</p>}
              <dl className="fact-list">
                {r.facts?.map((f, i) => (
                  <div key={i}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                {r.sourceName} ↗
              </a>
            </>
          )}
          <button
            className="primary"
            onClick={() => basket.add(r)}
            disabled={added || !r.posterCompatible}
          >
            {added ? 'Added to basket' : 'Add to Poster'}
          </button>
        </Modal>
      )}
    </article>
  );
}
