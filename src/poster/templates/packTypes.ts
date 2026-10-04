import { makeBlock } from '../blocks';
import type { BlockKind, BlockContent, PosterElement, PosterDocument } from '../posterTypes';

export type TemplateSection = {
  kind: BlockKind;
  label: string;
  box: [number, number, number, number];
  content?: Partial<BlockContent>;
  props?: Partial<PosterElement>;
};
export type PackTemplate = {
  id: string;
  name: string;
  description: string;
  reference: string;
  category: string;
  theme: string;
  background: string;
  sections: TemplateSection[];
};
export function section(
  kind: BlockKind,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  content: Partial<BlockContent> = {},
  props: Partial<PosterElement> = {},
): TemplateSection {
  return { kind, label, box: [x, y, width, height], content, props };
}
// Only text-free illustration/photo assets belong here, never a reference poster.
export { packImage } from './packAssets';
export function createPackTemplate(template: PackTemplate): PosterDocument {
  return {
    size: 'letter',
    template: template.id,
    background: template.background,
    elements: template.sections.map((s, zIndex) =>
      makeBlock(
        s.kind,
        {
          label: s.label,
          ...s.content,
          ...(s.kind === 'qr'
            ? { body: s.content?.body || s.props?.text || 'https://www.sfu.ca/' }
            : {}),
        },
        { x: s.box[0], y: s.box[1], width: s.box[2], height: s.box[3], zIndex, ...s.props },
      ),
    ),
  };
}
