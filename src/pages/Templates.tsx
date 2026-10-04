import { useNavigate } from 'react-router-dom';
import { templates } from '../poster/templates';
import { usePosterStore } from '../store/posterStore';
import { MountainDivider } from '../components/ui/Motifs';
export default function Templates() {
  const navigate = useNavigate();
  return (
    <>
      <header className="page-heading">
        <h1>Template Gallery</h1>
      </header>
      <p className="notice">Replaces the current layout. Undo restores it.</p>
      <div className="template-grid">
        {templates.map((t, i) => (
          <article className="template-card" key={t.id}>
            <div className={`template-preview preview-${i % 3}`}>
              <span>SFU PEER MENTOR HUB</span>
              <h2>{t.title}</h2>
              <div className="preview-lines">
                <i />
                <i />
                <i />
              </div>
              <MountainDivider />
            </div>
            <div className="template-info">
              <h2>{t.name}</h2>
              <p>{t.description}</p>
              <button
                onClick={() => {
                  usePosterStore.getState().applyTemplate(t.id);
                  navigate('/poster');
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
