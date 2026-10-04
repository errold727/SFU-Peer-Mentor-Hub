import { mkdir, readFile, stat, writeFile, rename, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { parseSourceState, type SourceSnapshotState } from './sources';
import { sourceStateMaxBytes } from './policy';
import { renderReport, renderSummary, type AuditReport } from './report';

export async function readState(
  file: string,
): Promise<{ state?: SourceSnapshotState; baseline: AuditReport['baseline'] }> {
  try {
    const info = await stat(file);
    if (info.size > sourceStateMaxBytes) throw Error('oversized state');
    const state = parseSourceState(JSON.parse(await readFile(file, 'utf8')));
    return {
      state,
      baseline: {
        status: 'loaded',
        note: 'Prior public source snapshots restored; pending changes remain reviewable.',
      },
    };
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException).code === 'ENOENT';
    return {
      baseline: {
        status: missing ? 'missing' : 'invalid',
        note: missing
          ? 'No retained baseline is available. This run establishes first observations, not unchanged or verified facts.'
          : 'Previous source-state artifact was invalid and was not trusted. Baselines restart; earlier changes cannot be inferred.',
      },
    };
  }
}

export async function atomicWrite(file: string, value: string) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file + '.pending', value, 'utf8');
  await rename(file + '.pending', file);
}

export async function saveReport(report: AuditReport, directory = 'artifacts') {
  await atomicWrite(
    path.join(directory, 'resource-audit.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  await atomicWrite(path.join(directory, 'resource-audit.md'), renderReport(report));
  await atomicWrite(path.join(directory, 'resource-audit-summary.md'), renderSummary(report));
}

export async function jobSummary(report: AuditReport) {
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(process.env.GITHUB_STEP_SUMMARY, renderSummary(report));
}
