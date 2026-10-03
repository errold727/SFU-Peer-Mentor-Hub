import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Plus } from 'lucide-react';
import { categories, type SFUResource } from '../../data/resources/types';
import { usePosterBasket } from '../../store/posterBasketStore';
import { getRelativeDeadlineLabel, daysUntil } from '../../utils/dates';
import { getVerificationStatus } from '../../utils/verification';
import { resourceText } from '../../utils/search';
import { Modal } from '../ui/Modal';
export function ResourceCard({ resource: r }: { resource: SFUResource }) {
  const [detail, setDetail] = useState(false);
  const [copied, setCopied] = useState('');
  const basket = usePosterBasket();
  const added = basket.items.some((i) => i.id === r.id);
  const status = getVerificationStatus(r.lastVerified);
  return (
    <article className="resource-card">
      <div className="eyebrow">
        <span>{categories[r.category]}</span>
        <span>{r.campus === 'All' ? 'All campuses' : r.campus}</span>
      </div>
      <h3>{r.title}</h3>
      {r.date && (
        <div className={`badge ${daysUntil(r.date) < 0 ? 'muted' : ''}`}>
          {r.date} · {getRelativeDeadlineLabel(r.date)}
        </div>
      )}
      <p>{r.summary}</p>
      {r.validUntil && daysUntil(r.validUntil) < 0 && (
        <p className="notice">Schedule expired — check the official source.</p>
      )}
      <div className="verification">
        Last verified: {r.lastVerified ?? 'Not yet verified'}
        {status !== 'fresh' && (
          <span className="warning">
            {status === 'unverified' ? 'Verification needed' : 'Review recommended'}
          </span>
        )}
      </div>
      <div className="card-actions">
        <button onClick={() => setDetail(true)}>View Details</button>
        <a href={r.sourceUrl} target="_blank" rel="noreferrer">
          Official Source <ArrowUpRight size={15} />
        </a>
      </div>
      <div className="card-actions bottom">
        <button
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
          <p>{r.summary}</p>
          {r.verificationNote && <p className="notice">{r.verificationNote}</p>}
          <dl className="fact-list">
            {r.facts?.map((f, i) => (
              <div key={i}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
          <p>Last verified: {r.lastVerified ?? 'Not yet verified'}</p>
          <a href={r.sourceUrl} target="_blank" rel="noreferrer">
            {r.sourceName} ↗
          </a>
          <button className="primary" onClick={() => basket.add(r)} disabled={added}>
            {added ? 'Added to basket' : 'Add to Poster'}
          </button>
        </Modal>
      )}
    </article>
  );
}
