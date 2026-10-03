import { useState } from 'react';
import { usePosterStore } from '../store/posterStore';
import {
  DRAFT_KEY,
  readDrafts,
  saveDraft,
  deleteDraft,
  duplicateDraft,
  type LocalDraft,
} from './drafts';
import { Modal } from '../components/ui/Modal';
export function LocalDrafts() {
  const [drafts, setDrafts] = useState<LocalDraft[]>([]),
    [message, setMessage] = useState(''),
    [includeName, setIncludeName] = useState(false),
    [pending, setPending] = useState<LocalDraft | null>(null);
  function refresh() {
    try {
      setDrafts(readDrafts(localStorage));
      setMessage('Browser-local only. No automatic saving.');
    } catch {
      setMessage('Local drafts are unavailable or damaged. Delete local drafts to reset storage.');
    }
  }
  function action(run: () => void) {
    try {
      run();
      setDrafts(readDrafts(localStorage));
      setMessage('Local drafts updated. Nothing was uploaded.');
    } catch (e) {
      setMessage(
        e instanceof Error && e.name !== 'QuotaExceededError'
          ? e.message
          : 'Browser storage is full or unavailable. Delete a draft or use smaller images.',
      );
    }
  }
  return (
    <details
      className="local-drafts"
      onToggle={(e) => {
        if (e.currentTarget.open) refresh();
      }}
    >
      <summary>Local drafts · optional</summary>
      <p>
        Save only on this browser. Saving includes all poster text, hidden layers and uploaded
        images. Review that content before saving on a shared device. The recipient field is
        excluded unless you choose to include it. Refreshing never restores a draft automatically.
      </p>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={includeName}
          onChange={(e) => setIncludeName(e.target.checked)}
        />
        Include recipient name in this personalized local draft
      </label>
      <div className="actions">
        <button
          onClick={() =>
            action(() => {
              const s = usePosterStore.getState();
              saveDraft(localStorage, s.document, s.recipientName, includeName);
              setIncludeName(false);
            })
          }
        >
          Save locally
        </button>
        <button onClick={refresh}>Refresh draft list</button>
        <button onClick={() => action(() => localStorage.removeItem(DRAFT_KEY))}>
          Delete all local drafts
        </button>
      </div>
      <p aria-live="polite">{message}</p>
      <p className="muted">
        Storage on this browser: {drafts.length} / 20 drafts · approximately{' '}
        {(JSON.stringify(drafts).length / 1_000_000).toFixed(2)} / 4 MB of draft text and image
        data.
      </p>
      {drafts.length === 0 ? (
        <p className="muted">No local drafts loaded.</p>
      ) : (
        <ul className="draft-list">
          {drafts.map((d, i) => (
            <li key={d.id}>
              <strong>
                Draft {i + 1} · {d.document.template}
              </strong>
              <span>
                {d.recipientName ? 'Personalized' : 'Recipient field excluded'} ·{' '}
                {new Date(d.savedAt).toLocaleString()}
              </span>
              <div className="actions">
                <button onClick={() => setPending(d)}>Open draft {i + 1}</button>
                <button
                  onClick={() =>
                    action(() => {
                      duplicateDraft(localStorage, d.id);
                    })
                  }
                >
                  Duplicate draft {i + 1}
                </button>
                <button onClick={() => action(() => deleteDraft(localStorage, d.id))}>
                  Delete draft {i + 1}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {pending && (
        <Modal title="Open saved draft?" onClose={() => setPending(null)}>
          <p>
            This replaces the current poster and recipient field. The previous layout remains in
            Undo.
          </p>
          <button
            className="primary"
            onClick={() => {
              const s = usePosterStore.getState();
              s.change(structuredClone(pending.document));
              s.setRecipientName(pending.recipientName ?? '');
              s.select(null);
              setPending(null);
            }}
          >
            Open saved draft
          </button>
        </Modal>
      )}
    </details>
  );
}
