import { useEffect, useRef, useState } from 'react';
import { verifyMentorCode, type AccessRole } from './access';
import './AccessEntry.css';

export default function AccessEntry({ onEnter }: { onEnter: (role: AccessRole) => void }) {
  const [mentor, setMentor] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  function back() {
    request.current++;
    setMentor(false);
    setCode('');
    setError(false);
    setBusy(false);
    requestAnimationFrame(() => heading.current?.focus());
  }
  return (
    <main className="access-entry">
      <section className="access-panel">
        {mentor ? (
          <>
            <h1>Mentor Access</h1>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (busy) return;
                const attempt = ++request.current;
                setBusy(true);
                setError(false);
                const accepted = await verifyMentorCode(code);
                if (attempt !== request.current) return;
                setCode('');
                setBusy(false);
                if (accepted) onEnter('mentor');
                else setError(true);
              }}
            >
              <label>
                Access Code
                <input
                  type="password"
                  autoFocus
                  autoComplete="off"
                  value={code}
                  aria-invalid={error}
                  aria-describedby={error ? 'access-error' : undefined}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setError(false);
                  }}
                />
              </label>
              {error && (
                <p id="access-error" role="alert">
                  Incorrect access code.
                </p>
              )}
              <div className="access-actions">
                <button className="primary" disabled={busy} type="submit">
                  Enter Hub
                </button>
                <button type="button" onClick={back}>
                  Back
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 ref={heading} tabIndex={-1}>
              SFU Peer Mentor Hub
            </h1>
            <h2>Choose your access</h2>
            <div className="access-choices">
              <button className="primary" onClick={() => setMentor(true)}>
                Peer Mentor
              </button>
              <button onClick={() => onEnter('mentee')}>Mentee / Student</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
