import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { resources } from '../src/data/resources';
import { validateResources } from '../src/utils/resourceValidation';
import { checkResourceLinks } from '../src/utils/resourceLinks';
import { resourceStatus } from '../src/utils/resourceStatus';
import type { SFUResource } from '../src/data/resources/types';

const [mode = 'validate', ...args] = process.argv.slice(2);
const option = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const staged = option('--input');
let items: SFUResource[] = resources;
if (staged) {
  const candidate: unknown = JSON.parse(await readFile(staged, 'utf8'));
  if (
    !Array.isArray(candidate) ||
    !candidate.length ||
    candidate.some((r) => !r || typeof r !== 'object')
  )
    throw new Error(
      'Staged input must be a non-empty array; published files have not been changed.',
    );
  items = candidate;
}
const report = validateResources(items);
async function output(data: unknown) {
  const target = option('--output');
  if (!target) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  await mkdir(path.dirname(target), { recursive: true });
  const pending = target + '.pending';
  await writeFile(pending, JSON.stringify(data, null, 2) + '\n');
  await rename(pending, target);
  console.log(`Report saved: ${target}`);
}
if (mode === 'validate') {
  for (const message of report.errors) console.error(message);
  console.log(
    `${items.length} canonical records; ${report.errors.length} errors; ${report.warnings.length} maintenance notices.`,
  );
  console.log(
    'Validation checks metadata and evidence references; it cannot certify the source facts.',
  );
  process.exitCode = report.errors.length ? 1 : 0;
} else if (mode === 'report') {
  const tally = (values: string[]) =>
    Object.fromEntries(
      [...new Set(values)].sort().map((v) => [v, values.filter((x) => x === v).length]),
    );
  await output({
    generatedAt: new Date().toISOString(),
    total: items.length,
    topics: tally(items.map((r) => r.topic ?? 'legacy')),
    campuses: tally(items.flatMap((r) => r.campuses ?? [r.campus])),
    audiences: tally(items.flatMap((r) => r.audiences ?? [])),
    verification: tally(items.map((r) => r.verification?.status ?? 'legacy')),
    freshness: tally(items.map((r) => resourceStatus(r).freshness)),
    highImpact: items.filter((r) => r.highImpact).length,
    secondReviewed: items.filter((r) => r.secondReview).length,
    blockedSources: [
      ...new Set(
        items.flatMap((r) =>
          (r.sources ?? []).filter((s) => s.retrievalStatus === 'blocked').map((s) => s.url),
        ),
      ),
    ],
    errors: report.errors,
    warnings: report.warnings,
    sharedSources: report.sharedSources,
    records: items.map((r) => ({
      id: r.id,
      topic: r.topic,
      title: r.title,
      status: r.verification?.status,
      sourceUrl: r.sourceUrl,
      reviewDueAt: r.reviewDueAt,
    })),
  });
} else if (mode === 'links') {
  const links = await checkResourceLinks(
    items.flatMap((r) => [
      r.sourceUrl,
      ...(r.sources ?? []).map((s) => s.url),
      ...(r.actionUrl ? [r.actionUrl] : []),
    ]),
  );
  await output({
    checkedAt: new Date().toISOString(),
    notice: 'Reachability only. No verification timestamps or content were changed.',
    links,
  });
  process.exitCode = links.some((r) => r.status === 'invalid') ? 1 : 0;
} else
  throw new Error(
    'Use validate, report or links. Staged JSON can be checked with --input; publication is a reviewed Git change.',
  );
