import { templates } from './templates';
export function TemplatePreview({ id }: { id: string }) {
  const template = templates.find((t) => t.id === id);
  return template ? (
    <div className="real-template-preview">
      <img
        src={template.preview}
        alt={`${template.name} editable layout preview`}
        width={408}
        height={528}
        loading="lazy"
        decoding="async"
      />
    </div>
  ) : null;
}
