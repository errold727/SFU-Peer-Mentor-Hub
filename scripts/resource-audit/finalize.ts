import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAudit } from './engine';
import { saveReport, jobSummary } from './io';
import type { AuditReport } from './report';

export function workflowRunUrl(env: NodeJS.ProcessEnv = process.env) {
  return env.GITHUB_REPOSITORY &&
    /^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(env.GITHUB_REPOSITORY) &&
    env.GITHUB_RUN_ID &&
    /^\d+$/.test(env.GITHUB_RUN_ID)
    ? `https://github.com/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
    : undefined;
}
export async function fallbackAuditReport(
  audit: (options: Parameters<typeof runAudit>[0]) => Promise<{ report: AuditReport }> = runAudit,
  env: NodeJS.ProcessEnv = process.env,
) {
  const { report } = await audit({
    offline: true,
    commit: env.GITHUB_SHA,
    runUrl: workflowRunUrl(env),
  });
  report.findings.push({
    id: 'AUDIT_REPORT_MISSING',
    code: 'AUDIT_REPORT_MISSING',
    severity: 'error',
    priority: 'normal',
    resourceIds: [],
    message: 'The main audit did not produce a report. This fallback has no live-source coverage.',
  });
  return report;
}

async function main() {
  let report: AuditReport;
  try {
    report = JSON.parse(await readFile('artifacts/resource-audit.json', 'utf8'));
  } catch {
    report = await fallbackAuditReport();
  }
  report.runUrl ??= workflowRunUrl();
  const gates = {
    'Audit engine': process.env.AUDIT_OUTCOME,
    'Unit tests': process.env.TEST_OUTCOME,
    Lint: process.env.LINT_OUTCOME,
    Build: process.env.BUILD_OUTCOME,
  };
  for (const [name, status] of Object.entries(gates)) {
    report.gates[name] = status ?? 'not run';
    if (status !== 'success')
      report.findings.push({
        id: `GATE_FAILED:${name}`,
        code: 'QUALITY_GATE_FAILED',
        severity: 'error',
        priority: 'normal',
        resourceIds: [],
        message: `${name} did not pass (${status ?? 'missing outcome'}).`,
      });
  }
  try {
    execFileSync(
      'git',
      ['diff', '--exit-code', '--', 'src/data/resources', 'public/data/courses'],
      { stdio: 'pipe' },
    );
  } catch {
    report.integrity.unchanged = false;
    report.findings.push({
      id: 'FACT_FILES_CHANGED',
      code: 'FACT_FILES_CHANGED',
      severity: 'error',
      priority: 'normal',
      resourceIds: [],
      message:
        'Published resource/course files changed during the audit. No publication is allowed.',
    });
  }
  await saveReport(report);
  await jobSummary(report);
  console.log(
    `Final audit report written; ${report.findings.filter((f) => f.severity === 'error').length} error findings.`,
  );
  process.exitCode = report.findings.some((f) => f.severity === 'error') ? 1 : 0;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
