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
}: {
  stageRef: RefObject<Konva.Stage | null>;
  scale: number;
}) {
  const s = usePosterStore();
  const size = posterSizes[s.document.size];
  const [guide, setGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const selected = s.document.elements.find((e) => e.id === s.selected);
  return (
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
        <SelectionTransformer
          selected={selected && !selected.locked && selected.visible ? selected.id : null}
          revision={s.document}
        />
      </Layer>
    </Stage>
  );
}
