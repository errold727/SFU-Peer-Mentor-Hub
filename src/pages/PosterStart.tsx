import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FilePlus2, LayoutTemplate } from 'lucide-react';
import { usePosterStore } from '../store/posterStore';
import { posterSizes } from '../poster/posterTypes';
import { posterStyles, applyPosterStyle } from '../poster/styles';
import { LocalDrafts } from '../poster/LocalDrafts';
export default function PosterStart() {
  const [setup, setSetup] = useState(false),
    [size, setSize] = useState('letter'),
    [style, setStyle] = useState<keyof typeof posterStyles>('classic');
  const navigate = useNavigate();
  const s = usePosterStore();
  return (
    <div className="poster-start">
      <header className="page-heading">
        <h1>Poster Maker</h1>
      </header>
      <p>How would you like to start?</p>
      {setup ? (
        <form
          className="poster-setup"
          onSubmit={(e) => {
            e.preventDefault();
            s.applyTemplate('blank');
            s.resize(size);
            s.change(applyPosterStyle(usePosterStore.getState().document, style));
            navigate('/poster/edit');
          }}
        >
          <h2>Create a New Poster</h2>
          <label>
            Size
            <select aria-label="Size" value={size} onChange={(e) => setSize(e.target.value)}>
              {Object.entries(posterSizes).map(([id, v]) => (
                <option key={id} value={id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Style
            <select
              aria-label="Style"
              value={style}
              onChange={(e) => setStyle(e.target.value as keyof typeof posterStyles)}
            >
              {Object.entries(posterStyles).map(([id, v]) => (
                <option key={id} value={id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <div className="actions">
            <button className="primary" type="submit">
              Create Poster
            </button>
            <button type="button" onClick={() => setSetup(false)}>
              Back
            </button>
          </div>
        </form>
      ) : (
        <div className="poster-start-options">
          <article>
            <FilePlus2 size={32} />
            <h2>Create a New Poster</h2>
            <p>Start with a blank canvas.</p>
            <button className="primary" onClick={() => setSetup(true)}>
              Create Blank Poster
            </button>
          </article>
          <article>
            <LayoutTemplate size={32} />
            <h2>Choose a Template</h2>
            <p>Start with a ready-made layout.</p>
            <Link className="button" to="/poster/templates">
              Browse Templates
            </Link>
          </article>
        </div>
      )}
      {s.past.length > 0 && (
        <Link className="button resume-poster" to="/poster/edit">
          Continue current poster
        </Link>
      )}
      <LocalDrafts onOpen={() => navigate('/poster/edit')} />
      <p className="muted">
        Images and unsaved content stay in this browser session. <Link to="/about">Privacy</Link>
      </p>
    </div>
  );
}
