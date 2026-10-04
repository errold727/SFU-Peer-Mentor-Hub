import { Rect, Text } from 'react-konva';
import type { PosterElement } from './posterTypes';
import { blockParts } from './blockLayout';
export function BlockContentRenderer({
  element,
  recipientName,
}: {
  element: PosterElement;
  recipientName: string;
}) {
  return (
    <>
      {blockParts(element, recipientName).parts.map((p, i) =>
        p.kind === 'rect' ? (
          <Rect
            key={i}
            x={p.x}
            y={p.y}
            width={p.width}
            height={p.height}
            fill={p.fill}
            cornerRadius={p.radius}
          />
        ) : (
          <Text
            key={i}
            x={p.x}
            y={p.y}
            width={p.width}
            height={p.height + 1}
            text={p.text}
            fontSize={p.fontSize}
            fontFamily={p.fontFamily}
            fontStyle={p.bold ? 'bold' : 'normal'}
            lineHeight={element.lineHeight}
            letterSpacing={element.letterSpacing}
            fill={p.fill}
            align={p.align}
          />
        ),
      )}
    </>
  );
}
