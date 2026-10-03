import { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
export function SelectionTransformer({
  selected,
  revision,
}: {
  selected: string | null;
  revision: unknown;
}) {
  const ref = useRef<Konva.Transformer>(null);
  useEffect(() => {
    const tr = ref.current;
    const node = selected ? tr?.getStage()?.findOne('#' + selected) : undefined;
    tr?.nodes(node ? [node] : []);
    tr?.getLayer()?.batchDraw();
  }, [selected, revision]);
  return (
    <Transformer
      ref={ref}
      name="editor-only"
      rotateEnabled
      flipEnabled={false}
      boundBoxFunc={(old, next) =>
        Math.abs(next.width) < 20 || Math.abs(next.height) < 20 ? old : next
      }
    />
  );
}
