import { useEffect, useState } from 'react';
import { Group, Rect, Text, Image as CanvasImage, Line, Ellipse } from 'react-konva';
import QRCode from 'qrcode';
import type Konva from 'konva';
import { type PosterElement, resolveRecipient } from './posterTypes';
function useImage(src?: string) {
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    if (!src) return;
    let active = true;
    const img = new window.Image();
    img.onload = () => {
      if (active) setImage(img);
    };
    img.src = src;
    return () => {
      active = false;
    };
  }, [src]);
  return image;
}
export function PosterElementRenderer({
  element: e,
  recipientName,
  onSelect,
  onChange,
  onGuide,
}: {
  element: PosterElement;
  recipientName: string;
  onSelect: () => void;
  onChange: (patch: Partial<PosterElement>) => void;
  onGuide: (x: number | null, y: number | null) => void;
}) {
  const [qr, setQr] = useState('');
  useEffect(() => {
    if (e.type !== 'qrcode') return;
    let active = true;
    QRCode.toDataURL(e.text, { width: 512, margin: 2, errorCorrectionLevel: 'M' })
      .then((src) => {
        if (active) setQr(src);
      })
      .catch(() => {
        if (active) setQr('');
      });
    return () => {
      active = false;
    };
  }, [e.type, e.text]);
  const image = useImage(e.type === 'qrcode' ? qr : e.src);
  const props = {
    id: e.id,
    x: e.x,
    y: e.y,
    width: e.width,
    height: e.height,
    rotation: e.rotation,
    visible: e.visible,
    draggable: !e.locked,
    onClick: onSelect,
    onTap: onSelect,
    onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => {
      const node = event.target,
        stage = node.getStage();
      if (!stage) return;
      const w = stage.width() / stage.scaleX(),
        h = stage.height() / stage.scaleY();
      let x: number | null = null,
        y: number | null = null;
      for (const guide of [0, w / 2, w]) {
        for (const offset of [0, e.width / 2, e.width]) {
          if (Math.abs(node.x() + offset - guide) < 6) {
            node.x(guide - offset);
            x = guide;
          }
        }
      }
      for (const guide of [0, h / 2, h]) {
        for (const offset of [0, e.height / 2, e.height]) {
          if (Math.abs(node.y() + offset - guide) < 6) {
            node.y(guide - offset);
            y = guide;
          }
        }
      }
      onGuide(x, y);
    },
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
      onGuide(null, null);
      onChange({ x: event.target.x(), y: event.target.y() });
    },
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
      const node = event.target;
      const width = Math.max(20, e.width * node.scaleX()),
        height = Math.max(20, e.height * node.scaleY());
      node.scaleX(1);
      node.scaleY(1);
      onChange({ x: node.x(), y: node.y(), rotation: node.rotation(), width, height });
    },
  };
  return (
    <Group {...props}>
      <Rect
        width={e.width}
        height={e.height}
        fill={e.backgroundColor}
        stroke={e.borderColor}
        strokeWidth={e.borderWidth}
        cornerRadius={e.type === 'resource' ? 8 : 0}
      />
      {e.type === 'image' || e.type === 'qrcode' ? (
        image ? (
          <CanvasImage image={image} width={e.width} height={e.height} />
        ) : (
          <Text text="Preparing image…" width={e.width} height={e.height} fill="#666666" />
        )
      ) : e.type === 'divider' ? (
        <Line
          points={[0, e.height / 2, e.width, e.height / 2]}
          stroke={e.color}
          strokeWidth={Math.max(2, e.borderWidth)}
        />
      ) : e.type === 'shape' ? (
        e.shape === 'ellipse' ? (
          <Ellipse
            x={e.width / 2}
            y={e.height / 2}
            radiusX={e.width / 2}
            radiusY={e.height / 2}
            fill={e.color}
          />
        ) : e.shape === 'mountain' ? (
          <Line
            points={[
              0,
              e.height,
              e.width * 0.28,
              0,
              e.width * 0.52,
              e.height * 0.6,
              e.width * 0.72,
              e.height * 0.15,
              e.width,
              e.height,
            ]}
            closed
            fill={e.color}
          />
        ) : (
          <Rect
            width={e.width}
            height={e.height}
            fill={e.color}
            cornerRadius={e.shape === 'sticky' ? 16 : 0}
          />
        )
      ) : (
        <Text
          text={resolveRecipient(e.text, recipientName)}
          width={e.width}
          height={e.height}
          padding={e.padding}
          fontSize={e.fontSize}
          fontStyle={e.fontWeight}
          fontFamily={e.fontFamily}
          lineHeight={e.lineHeight}
          letterSpacing={e.letterSpacing}
          align={e.align}
          fill={e.color}
          wrap="word"
        />
      )}
    </Group>
  );
}
