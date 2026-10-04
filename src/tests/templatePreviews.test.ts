import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { templates } from '../poster/templates';

type PreviewManifest = {
  sourceHashes: Record<string, string>;
  previews: { id: string; name: string; file: string; width: number; height: number }[];
};
const previewDirectory = 'public/assets/template-previews';
const manifest: PreviewManifest = JSON.parse(
  readFileSync(path.join(previewDirectory, 'manifest.json'), 'utf8'),
);

// Read the WebP container and encoded dimensions without depending on a particular encoder.
// Handles ordinary lossy/lossless WebP and the extended container used for alpha metadata.
function webpDimensions(bytes: Buffer, filename: string) {
  expect(bytes.length, filename).toBeGreaterThanOrEqual(30);
  expect(bytes.toString('ascii', 0, 4), filename).toBe('RIFF');
  expect(bytes.toString('ascii', 8, 12), filename).toBe('WEBP');
  expect(bytes.readUInt32LE(4) + 8, `${filename}: complete RIFF container`).toBe(bytes.length);
  let canvas: { width: number; height: number } | undefined;
  let image: { width: number; height: number } | undefined;
  let offset = 12;
  while (offset < bytes.length) {
    expect(offset + 8, `${filename}: complete chunk header`).toBeLessThanOrEqual(bytes.length);
    const kind = bytes.toString('ascii', offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    expect(start + length, `${filename}: complete ${kind} chunk`).toBeLessThanOrEqual(bytes.length);
    if (kind === 'VP8X') {
      expect(length, filename).toBeGreaterThanOrEqual(10);
      canvas = {
        width: bytes.readUIntLE(start + 4, 3) + 1,
        height: bytes.readUIntLE(start + 7, 3) + 1,
      };
    } else if (kind === 'VP8 ') {
      expect(length, filename).toBeGreaterThanOrEqual(10);
      expect(bytes.subarray(start + 3, start + 6).toString('hex'), filename).toBe('9d012a');
      image = {
        width: bytes.readUInt16LE(start + 6) & 0x3fff,
        height: bytes.readUInt16LE(start + 8) & 0x3fff,
      };
    } else if (kind === 'VP8L') {
      expect(length, filename).toBeGreaterThanOrEqual(5);
      expect(bytes[start], filename).toBe(0x2f);
      const dimensions = bytes.readUInt32LE(start + 1);
      image = { width: (dimensions & 0x3fff) + 1, height: ((dimensions >>> 14) & 0x3fff) + 1 };
    }
    offset = start + length + (length % 2);
  }
  expect(offset, `${filename}: chunk padding`).toBe(bytes.length);
  expect(image, `${filename}: encoded still image`).toBeDefined();
  if (canvas) expect(image, `${filename}: canvas matches encoded image`).toEqual(canvas);
  return image!;
}

const requiredSources = [
  ...readdirSync('src/poster/templates')
    .filter((file) => /^(pack.*|index)\.ts$/.test(file))
    .map((file) => `src/poster/templates/${file}`),
  ...[
    'BlockContentRenderer.tsx',
    'PosterElementRenderer.tsx',
    'blockLayout.ts',
    'blocks.ts',
    'posterTypes.ts',
  ].map((file) => `src/poster/${file}`),
  ...readdirSync('public/assets/poster-scenes')
    .filter((file) => /\.(svg|webp|png|jpe?g|gif|avif)$/i.test(file))
    .map((file) => `public/assets/poster-scenes/${file}`),
].sort();

describe('generated template preview freshness', () => {
  it('maps every gallery template to one correctly named preview without stale entries', () => {
    expect(manifest.previews).toHaveLength(16);
    expect(new Set(manifest.previews.map((preview) => preview.id)).size).toBe(16);
    expect(new Set(manifest.previews.map((preview) => preview.file)).size).toBe(16);
    expect(manifest.previews.map(({ id, name }) => ({ id, name }))).toEqual(
      templates.map(({ id, name }) => ({ id, name })),
    );
    for (const template of templates) {
      const preview = manifest.previews.find(({ id }) => id === template.id)!;
      expect(preview.file, template.id).toBe(`${template.id}.webp`);
      expect(template.preview, template.id).toBe(
        `${import.meta.env.BASE_URL}assets/template-previews/${preview.file}`,
      );
    }
    expect(
      readdirSync(previewDirectory)
        .filter((file) => file.endsWith('.webp'))
        .sort(),
    ).toEqual(manifest.previews.map(({ file }) => file).sort());
  });

  it('ships complete lightweight WebP files whose dimensions match their metadata', () => {
    for (const preview of manifest.previews) {
      expect(preview.file).toMatch(/^[a-z0-9-]+\.webp$/);
      const bytes = readFileSync(path.join(previewDirectory, preview.file));
      expect(webpDimensions(bytes, preview.file)).toEqual({
        width: preview.width,
        height: preview.height,
      });
      expect(preview.width, preview.file).toBeGreaterThan(0);
      expect(preview.height, preview.file).toBeGreaterThan(0);
      expect(preview.width, `${preview.file}: thumbnail width`).toBeLessThanOrEqual(816);
      expect(preview.height, `${preview.file}: thumbnail height`).toBeLessThanOrEqual(1056);
      expect(bytes.length, `${preview.file}: lightweight preview`).toBeLessThan(200_000);
    }
  });

  it('tracks every pack, registry, block renderer, layout, type and scene asset dependency', () => {
    expect(Object.keys(manifest.sourceHashes).sort()).toEqual(requiredSources);
  });

  it('fails when template, renderer or scene contents changed after preview generation', () => {
    for (const source of requiredSources) {
      const bytes = readFileSync(source);
      const normalized = /\.(tsx?|svg)$/.test(source)
        ? bytes.toString('utf8').replace(/\r\n/g, '\n')
        : bytes;
      const actual = createHash('sha256').update(normalized).digest('hex');
      expect(manifest.sourceHashes[source], source).toMatch(/^[a-f0-9]{64}$/);
      expect(actual, `${source}: stale thumbnail; regenerate with npm run posters:previews`).toBe(
        manifest.sourceHashes[source],
      );
    }
  });
});
