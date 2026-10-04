import { useNavigate, Link } from 'react-router-dom';
import { templates } from '../poster/templates';
import { usePosterStore } from '../store/posterStore';
import { TemplatePreview } from '../poster/TemplatePreview';
export default function Templates() {
  const navigate = useNavigate();
  return (
    <>
      <header className="page-heading">
        <h1>Template Gallery</h1>
        <Link to="/poster">Poster Maker</Link>
      </header>
      <p className="muted">
        Choose a layout. Every section stays editable. Undo restores your previous poster.
      </p>
      <div className="template-grid v2-gallery">
        {templates.map((t) => (
          <article className="template-card" key={t.id}>
            <TemplatePreview id={t.id} />
            <div className="template-info">
              <h2>{t.name}</h2>
              <p>{t.description}</p>
              <button
                aria-label={`Use template: ${t.name}`}
                onClick={() => {
                  usePosterStore.getState().applyTemplate(t.id);
                  navigate('/poster/edit');
                }}
              >
                Use template →
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
