import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { appendFile, readFile } from 'node:fs/promises';
import { runAudit } from './engine';
import { atomicWrite, readState, saveReport } from './io';
import { auditCounts } from './report';
import { sourceStateMaxBytes } from './policy';

const args = process.argv.slice(2);
const supported = new Set(['--offline', '--deep-check', '--state', '--output']);
for (let i = 0; i < args.length; i++) {
  if (!supported.has(args[i]))
    throw Error(
      `Unknown audit option. Use --offline, --deep-check, --state FILE or --output DIRECTORY.`,
    );
  if (args[i] === '--state' || args[i] === '--output') {
    if (!args[++i] || args[i].startsWith('--')) throw Error('Audit option requires a path.');
  }
}
const option = (name: string, fallback: string) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const stateFile = option('--state', '.resource-audit/state.json');
const output = option('--output', 'artifacts');
const loaded = await readState(stateFile);
let commit = process.env.GITHUB_SHA ?? 'unknown';
try {
  commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  /* report unknown outside git */
}
const runUrl =
  process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : undefined;
const { report, state } = await runAudit({
  offline: args.includes('--offline'),
  deepCheck: args.includes('--deep-check'),
  commit,
  runUrl,
  previousState: loaded.state,
  baseline: loaded.baseline,
});
let restoreUnavailable = false;
if (process.env.GITHUB_ACTIONS === 'true' && !args.includes('--offline')) {
  try {
    const restore = JSON.parse(await readFile('.resource-audit/restore-status.json', 'utf8'));
    if (
      restore.status === 'unavailable' ||
      restore.baselineCarryForwardBlocked ||
      restore.degraded
    ) {
      restoreUnavailable = true;
      report.baseline.note =
        'Prior default-branch source state could not be restored; source-change coverage has a gap.';
      report.findings.push({
        id: 'BASELINE_RESTORE_FAILED',
        code: 'BASELINE_RESTORE_FAILED',
        severity: 'warning',
        priority: 'normal',
        resourceIds: [],
        message: report.baseline.note,
      });
    }
  } catch {
    restoreUnavailable = true;
    report.findings.push({
      id: 'BASELINE_RESTORE_FAILED',
      code: 'BASELINE_RESTORE_FAILED',
      severity: 'warning',
      priority: 'normal',
      resourceIds: [],
      message:
        'The workflow has no usable source-state restoration outcome. Replacement state will not be promoted.',
    });
  }
}
if (loaded.baseline.status === 'invalid')
  report.findings.push({
    id: 'SOURCE_BASELINE_INVALID',
    code: 'SOURCE_BASELINE_INVALID',
    severity: 'warning',
    priority: 'normal',
    resourceIds: [],
    message: loaded.baseline.note,
  });
const serializedState = JSON.stringify(state) + '\n';
const stateOversized = Buffer.byteLength(serializedState, 'utf8') > sourceStateMaxBytes;
if (stateOversized)
  report.findings.push({
    id: 'SOURCE_STATE_OVERSIZED',
    code: 'SOURCE_STATE_OVERSIZED',
    severity: 'error',
    priority: 'normal',
    resourceIds: [],
    message:
      'Source state exceeds the restore safety limit. Review snapshot retention; previous state was preserved.',
  });
await saveReport(report, output);
// Offline checks never replace a retained live baseline.
const stateReady =
  !args.includes('--offline') &&
  !restoreUnavailable &&
  !stateOversized &&
  loaded.baseline.status !== 'invalid' &&
  !report.findings.some((f) => f.code === 'SOURCE_AUDIT_CRASH');
if (stateReady) await atomicWrite(stateFile, serializedState);
if (process.env.GITHUB_OUTPUT)
  await appendFile(process.env.GITHUB_OUTPUT, `state_ready=${stateReady}\n`);
const count = auditCounts(report);
console.log(
  `Audit complete: ${count.resources} resources, ${count.uniqueUrls} unique URLs, ${count.errors} errors, ${count.warnings} review warnings.`,
);
console.log(
  `Reports: ${path.join(output, 'resource-audit.json')} and resource-audit.md. Facts and verifiedAt were not refreshed.`,
);
process.exitCode = count.errors ? 1 : 0;
