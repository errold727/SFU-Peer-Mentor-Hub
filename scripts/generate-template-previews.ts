import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Run against the local Vite app after changing template or renderer source.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5177/SFU-Peer-Mentor-Hub/';
const output = 'public/assets/template-previews';
const sources = [
  ...(await readdir('src/poster/templates'))
    .filter((file) => /^(pack.*|index)\.ts$/.test(file))
    .map((file) => `src/poster/templates/${file}`),
  ...[
    'blockLayout.ts',
    'BlockContentRenderer.tsx',
    'PosterElementRenderer.tsx',
    'blocks.ts',
    'posterTypes.ts',
  ].map((file) => `src/poster/${file}`),
  ...(await readdir('public/assets/poster-scenes'))
    .filter((file) => /\.(svg|webp|png|jpe?g)$/.test(file))
    .map((file) => `public/assets/poster-scenes/${file}`),
].sort();
async function sourceHash(source: string) {
  const bytes = await readFile(source);
  const content = /\.(tsx?|svg)$/.test(source)
    ? bytes.toString('utf8').replace(/\r\n/g, '\n')
    : bytes;
  return createHash('sha256').update(content).digest('hex');
}
const sourceHashes: Record<string, string> = {};
for (const source of sources) sourceHashes[source] = await sourceHash(source);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.CI ? 'chromium' : 'msedge' });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1200 },
  deviceScaleFactor: 1,
});
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
const previews: { id: string; name: string; file: string; width: number; height: number }[] = [];
try {
  await page.goto(`${baseURL}#/poster/edit`);
  const selector = page.getByLabel('Poster template', { exact: true });
  await selector.waitFor();
  const options = await selector.locator('option').evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: (node as HTMLOptionElement).value,
      name: node.textContent || '',
    })),
  );
  for (const template of options) {
    await selector.selectOption(template.id);
    await page.getByRole('button', { name: 'Apply template', exact: true }).click();
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const screenshot = await page.locator('.canvas-paper canvas').first().screenshot();
    const webp = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 408;
      canvas.height = 528;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/webp', 0.84).split(',')[1];
    }, screenshot.toString('base64'));
    const file = `${template.id}.webp`;
    await writeFile(path.join(output, file), Buffer.from(webp, 'base64'));
    previews.push({ ...template, file, width: 408, height: 528 });
    console.log(`Generated ${file}`);
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const changed = [];
  for (const source of sources) {
    const current = await sourceHash(source);
    if (current !== sourceHashes[source]) changed.push(source);
  }
  if (changed.length)
    throw new Error(`Source changed during capture. Regenerate previews: ${changed.join(', ')}`);
  await writeFile(
    path.join(output, 'manifest.json'),
    JSON.stringify({ sourceHashes, previews }, null, 2) + '\n',
  );
  console.log(`Generated ${previews.length} lightweight previews and source manifest.`);
} finally {
  await browser.close();
}
