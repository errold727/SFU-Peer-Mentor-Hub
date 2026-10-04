import { memo, useEffect, useState } from 'react';
import { Group, Rect, Text, Image as CanvasImage, Line, Ellipse } from 'react-konva';
import QRCode from 'qrcode';
import type Konva from 'konva';
import { type PosterElement, resolveRecipient } from './posterTypes';
import { BlockContentRenderer } from './BlockContentRenderer';
import { imagePlacement, isImageBlock, isQR } from './blocks';
function useImage(src?: string) {
  const [loaded, setLoaded] = useState<{
    src: string;
    image?: HTMLImageElement;
    error?: boolean;
  }>();
  useEffect(() => {
    if (!src) return;
    let active = true;
    const img = new window.Image();
    img.onload = () => {
      if (active) setLoaded({ src, image: img });
    };
    img.onerror = () => {
      if (active) setLoaded({ src, error: true });
    };
    img.src = src;
    return () => {
      active = false;
    };
  }, [src]);
  return {
    image: loaded && loaded.src === src ? loaded.image : undefined,
    failed: loaded && loaded.src === src && !!loaded.error,
  };
}
export const PosterElementRenderer = memo(function PosterElementRenderer({
  element: e,
  recipientName,
  onSelect,
  onChange,
  onGuide,
  onEdit,
}: {
  element: PosterElement;
  recipientName: string;
  onSelect: () => void;
  onEdit?: () => void;
  onChange: (patch: Partial<PosterElement>) => void;
  onGuide: (x: number | null, y: number | null) => void;
}) {
  const qrElement = isQR(e);
  const [qr, setQr] = useState({ text: '', src: '' });
  useEffect(() => {
    if (!qrElement) return;
    let active = true;
    QRCode.toDataURL(e.text, { width: 512, margin: 2, errorCorrectionLevel: 'M' })
      .then((src) => {
        if (active) setQr({ text: e.text, src });
      })
      .catch(() => {
        if (active) setQr({ text: e.text, src: '' });
      });
    return () => {
      active = false;
    };
  }, [qrElement, e.text]);
  const { image, failed } = useImage(isQR(e) ? (qr.text === e.text ? qr.src : undefined) : e.src);
  useEffect(() => {
    if (failed && !e.imageError) onChange({ imageError: true });
  }, [failed, e.imageError, onChange]);
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
    onDblClick: onEdit,
    onDblTap: onEdit,
    onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => {
      const node = event.target,
        stage = node.getStage();
      if (!stage) return;
      const w = stage.width() / stage.scaleX(),
        h = stage.height() / stage.scaleY();
      let x: number | null = null,
        y: number | null = null;
      for (const guide of [0, 32, w / 2 - 8, w / 2, w / 2 + 8, w - 32, w]) {
        for (const offset of [0, e.width / 2, e.width]) {
          if (Math.abs(node.x() + offset - guide) < 6) {
            node.x(guide - offset);
            x = guide;
          }
        }
      }
      for (const guide of [0, 32, h / 3, h / 2, (h * 2) / 3, h - 32, h]) {
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
        cornerRadius={e.block?.radius ?? (e.type === 'resource' ? 8 : 0)}
      />
      {e.type === 'image' || isQR(e) || isImageBlock(e) ? (
        image ? (
          <Group
            clipFunc={(ctx) => {
              const r = Math.min(e.block?.radius || 0, e.width / 2, e.height / 2);
              ctx.beginPath();
              ctx.moveTo(r, 0);
              ctx.lineTo(e.width - r, 0);
              ctx.quadraticCurveTo(e.width, 0, e.width, r);
              ctx.lineTo(e.width, e.height - r);
              ctx.quadraticCurveTo(e.width, e.height, e.width - r, e.height);
              ctx.lineTo(r, e.height);
              ctx.quadraticCurveTo(0, e.height, 0, e.height - r);
              ctx.lineTo(0, r);
              ctx.quadraticCurveTo(0, 0, r, 0);
              ctx.closePath();
            }}
          >
            <CanvasImage
              image={image}
              {...(e.block && !isQR(e)
                ? imagePlacement(
                    e.width,
                    e.height,
                    image.naturalWidth,
                    image.naturalHeight,
                    e.block,
                  )
                : { width: e.width, height: e.height })}
            />
            {e.block && e.block.overlay > 0 && (
              <Rect
                width={e.width}
                height={e.height}
                fill={e.block.overlayColor}
                opacity={e.block.overlay}
              />
            )}
          </Group>
        ) : (
          <Text
            text={
              failed
                ? 'Image unavailable — replace image'
                : e.src || isQR(e)
                  ? 'Preparing image…'
                  : 'Replace Image'
            }
            width={e.width}
            height={e.height}
            fill="#666666"
          />
        )
      ) : e.type === 'divider' || e.block?.kind === 'divider' ? (
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
      ) : e.block ? (
        <BlockContentRenderer element={e} recipientName={recipientName} />
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
});
