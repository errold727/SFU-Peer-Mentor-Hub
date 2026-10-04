import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { createTemplate } from './templates';
import { posterSizes, visibleElements } from './posterTypes';
import { PosterElementRenderer } from './PosterElementRenderer';
const noop = () => {};
export function TemplatePreview({ id }: { id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [width, setWidth] = useState(250);
  const doc = useMemo(() => createTemplate(id), [id]);
  const size = posterSizes[doc.size];
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(el);
    const resize = new ResizeObserver((e) => setWidth(e[0].contentRect.width));
    resize.observe(el);
    return () => {
      observer.disconnect();
      resize.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className="real-template-preview" aria-hidden="true">
      {ready && (
        <Stage
          width={width}
          height={(width * size.height) / size.width}
          scaleX={width / size.width}
          scaleY={width / size.width}
          listening={false}
        >
          <Layer>
            <Rect width={size.width} height={size.height} fill={doc.background} />
            {visibleElements(doc.elements).map((e) => (
              <PosterElementRenderer
                key={e.id}
                element={e}
                recipientName="Student Name"
                onSelect={noop}
                onChange={noop}
                onGuide={noop}
              />
            ))}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
