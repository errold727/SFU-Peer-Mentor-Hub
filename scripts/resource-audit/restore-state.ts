import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicWrite } from './io';
import { parseSourceState, type SourceSnapshotState } from './sources';
import { sourceStateArtifact, sourceStateMaxBytes } from './policy';

export type StateArtifact = {
  id: number;
  expired: boolean;
  size_in_bytes: number;
  created_at: string;
  workflow_run: { id: number; head_branch: string };
};
export type RestoreOutcome = {
  status: 'loaded' | 'missing' | 'unavailable';
  note: string;
  runId?: number;
  degraded: boolean;
  baselineCarryForwardBlocked: boolean;
  failedCandidates: number;
};
export type RestoreDependencies = {
  listArtifacts: () => Promise<StateArtifact[]>;
  getRun: (
    id: number,
  ) => Promise<{ path: string; event: string; head_branch: string; status: string }>;
  downloadState: (artifact: StateArtifact) => Promise<unknown>;
};
const positiveInteger = (value: unknown) => Number.isSafeInteger(value) && Number(value) > 0;
const unavailable = (failedCandidates = 0): RestoreOutcome => ({
  status: 'unavailable',
  degraded: true,
  baselineCarryForwardBlocked: true,
  failedCandidates,
  note: 'Prior audit state could not be restored. Source-change comparison has a coverage gap; do not promote replacement state or discard unresolved reviews.',
});

/** Try older trusted artifacts after a corrupt/download-failed candidate, but disclose the gap. */
export async function restoreSourceState(
  dependencies: RestoreDependencies,
  branch = 'main',
): Promise<{ outcome: RestoreOutcome; state?: SourceSnapshotState }> {
  let failures = 0;
  try {
    const listing = await dependencies.listArtifacts();
    if (
      !Array.isArray(listing) ||
      listing.some(
        (artifact) =>
          !artifact ||
          !positiveInteger(artifact.id) ||
          typeof artifact.expired !== 'boolean' ||
          !Number.isSafeInteger(artifact.size_in_bytes) ||
          artifact.size_in_bytes < 0 ||
          !Number.isFinite(Date.parse(artifact.created_at)) ||
          !artifact.workflow_run ||
          !positiveInteger(artifact.workflow_run.id) ||
          typeof artifact.workflow_run.head_branch !== 'string',
      )
    )
      throw Error('Invalid artifact listing');
    const candidates = listing
      .filter((artifact) => !artifact.expired && artifact.workflow_run.head_branch === branch)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    for (const artifact of candidates.slice(0, 20)) {
      try {
        const run = await dependencies.getRun(artifact.workflow_run.id);
        if (
          run.path !== '.github/workflows/weekly-resource-audit.yml' ||
          !['schedule', 'workflow_dispatch'].includes(run.event) ||
          run.head_branch !== branch ||
          run.status !== 'completed'
        )
          continue;
        if (artifact.size_in_bytes > sourceStateMaxBytes) throw Error('Oversized artifact');
        const state = parseSourceState(await dependencies.downloadState(artifact));
        return {
          state,
          outcome: {
            status: 'loaded',
            runId: artifact.workflow_run.id,
            degraded: failures > 0,
            baselineCarryForwardBlocked: failures > 0,
            failedCandidates: failures,
            note:
              failures > 0
                ? 'Restored an older valid default-branch source snapshot after newer candidates failed. Newer pending changes may be missing; state promotion is blocked until the gap is reviewed.'
                : 'Restored bounded public source state from a completed default-branch weekly audit.',
          },
        };
      } catch {
        failures++;
      }
    }
    if (failures || candidates.length > 20) return { outcome: unavailable(failures) };
    return {
      outcome: {
        status: 'missing',
        degraded: false,
        baselineCarryForwardBlocked: false,
        failedCandidates: 0,
        note: 'No retained default-branch source-state artifact; this run establishes first observations.',
      },
    };
  } catch {
    return { outcome: unavailable(failures) };
  }
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY;
  const branch = process.env.AUDIT_DEFAULT_BRANCH ?? 'main';
  if (!repository || !/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(repository))
    throw Error('A valid GITHUB_REPOSITORY is required.');
  const gh = (args: string[]) =>
    execFileSync('gh', args, {
      encoding: 'utf8',
      maxBuffer: sourceStateMaxBytes,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  const result = await restoreSourceState(
    {
      listArtifacts: async () => {
        const artifacts: StateArtifact[] = [];
        for (let page = 1; page <= 10; page++) {
          const listing = JSON.parse(
            gh([
              'api',
              `repos/${repository}/actions/artifacts?name=${sourceStateArtifact}&per_page=100&page=${page}`,
            ]),
          ) as { artifacts: StateArtifact[]; total_count: number };
          if (!Array.isArray(listing.artifacts)) throw Error('Invalid artifact listing');
          artifacts.push(...listing.artifacts);
          if (listing.artifacts.length < 100 || artifacts.length >= listing.total_count)
            return artifacts;
        }
        throw Error('Artifact pagination exceeded the safe limit');
      },
      getRun: async (id) => JSON.parse(gh(['api', `repos/${repository}/actions/runs/${id}`])),
      downloadState: async (artifact) => {
        // Separate candidate directories avoid collisions with failed downloads; only bounded JSON is read.
        const directory = `.resource-audit/restored/${artifact.id}`;
        gh([
          'run',
          'download',
          String(artifact.workflow_run.id),
          '--repo',
          repository,
          '--name',
          sourceStateArtifact,
          '--dir',
          directory,
        ]);
        const file = `${directory}/state.json`;
        if ((await stat(file)).size > sourceStateMaxBytes) throw Error('Oversized state');
        return JSON.parse(await readFile(file, 'utf8'));
      },
    },
    branch,
  );
  if (result.state) {
    try {
      await atomicWrite('.resource-audit/state.json', JSON.stringify(result.state) + '\n');
    } catch {
      result.outcome = unavailable(result.outcome.failedCandidates);
    }
  }
  await atomicWrite('.resource-audit/restore-status.json', JSON.stringify(result.outcome) + '\n');
  console.log(
    `Source-state restoration: ${result.outcome.status}${result.outcome.degraded ? ' (degraded; state promotion blocked)' : ''}. No verification dates changed.`,
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
