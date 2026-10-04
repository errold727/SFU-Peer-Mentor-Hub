import { useState, type RefObject } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import type Konva from 'konva';
import { usePosterStore } from '../store/posterStore';
import { posterSizes, visibleElements } from './posterTypes';
import { PosterElementRenderer } from './PosterElementRenderer';
import { SelectionTransformer } from './SelectionTransformer';
export function PosterCanvas({
  stageRef,
  scale,
  guides = false,
}: {
  stageRef: RefObject<Konva.Stage | null>;
  scale: number;
  guides?: boolean;
}) {
  const s = usePosterStore();
  const size = posterSizes[s.document.size];
  const [guide, setGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const editingElement = s.document.elements.find((e) => e.id === editing?.id);
  const saveInline = () => {
    if (editing && editingElement) {
      const e = editingElement;
      if (e.block)
        s.update(e.id, {
          text: editing.text,
          block: { ...e.block, [e.block.kind === 'title' ? 'title' : 'body']: editing.text },
        });
      else s.update(e.id, { text: editing.text });
    }
    setEditing(null);
  };
  const selected = s.document.elements.find((e) => e.id === s.selected);
  return (
    <div className="inline-canvas">
      <Stage
        ref={stageRef}
        width={size.width * scale}
        height={size.height * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage() || e.target.name() === 'paper') s.select(null);
        }}
      >
        <Layer>
          <Rect name="paper" width={size.width} height={size.height} fill={s.document.background} />
          {visibleElements(s.document.elements).map((e) => (
            <PosterElementRenderer
              key={e.id}
              element={e}
              recipientName={s.recipientName}
              onSelect={() => s.select(e.id)}
              onEdit={() => {
                if (
                  !e.locked &&
                  (['text', 'resource', 'footer', 'icon'].includes(e.type) ||
                    (e.block &&
                      ['title', 'greeting', 'text', 'info', 'highlight', 'footer'].includes(
                        e.block.kind,
                      )))
                )
                  setEditing({
                    id: e.id,
                    text: e.block
                      ? e.block.kind === 'title'
                        ? e.block.title
                        : e.block.body
                      : e.text,
                  });
              }}
              onChange={(patch) => s.update(e.id, patch)}
              onGuide={(x, y) => setGuide({ x, y })}
            />
          ))}
          {guide.x !== null && (
            <Line
              name="editor-only"
              points={[guide.x, 0, guide.x, size.height]}
              stroke="#267cbf"
              strokeWidth={1}
              listening={false}
            />
          )}
          {guide.y !== null && (
            <Line
              name="editor-only"
              points={[0, guide.y, size.width, guide.y]}
              stroke="#267cbf"
              strokeWidth={1}
              listening={false}
            />
          )}
          {guides && (
            <>
              {[32, size.width / 2, size.width - 32].map((x) => (
                <Line
                  key={`x${x}`}
                  name="editor-only"
                  points={[x, 0, x, size.height]}
                  stroke="#4b87a5"
                  strokeWidth={1}
                  dash={[6, 6]}
                  listening={false}
                />
              ))}
              {[32, size.height / 3, size.height / 2, (size.height * 2) / 3, size.height - 32].map(
                (y) => (
                  <Line
                    key={`y${y}`}
                    name="editor-only"
                    points={[0, y, size.width, y]}
                    stroke="#4b87a5"
                    strokeWidth={1}
                    dash={[6, 6]}
                    listening={false}
                  />
                ),
              )}
            </>
          )}
          <SelectionTransformer
            selected={selected && !selected.locked && selected.visible ? selected.id : null}
            revision={s.document}
          />
        </Layer>
      </Stage>
      {editing && editingElement && (
        <textarea
          autoFocus
          aria-label="Edit text on canvas"
          className="inline-text-editor"
          style={{
            left: editingElement.x * scale,
            top: editingElement.y * scale,
            width: Math.max(150, editingElement.width * scale),
            height: Math.max(60, editingElement.height * scale),
            fontSize: Math.max(14, editingElement.fontSize * scale),
          }}
          value={editing.text}
          onChange={(event) => setEditing({ ...editing, text: event.target.value })}
          onBlur={saveInline}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setEditing(null);
            }
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              saveInline();
            }
          }}
        />
      )}
    </div>
  );
}
