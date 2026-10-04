import { readFile } from 'node:fs/promises';
import { renderIssue, type AuditReport } from './report';
import { upsertAuditIssue } from './issues';

const report: AuditReport = JSON.parse(await readFile('artifacts/resource-audit.json', 'utf8'));
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GH_TOKEN;
if (!repository || !token || !report.runUrl)
  throw Error('Issue publishing needs repository, workflow run URL and GITHUB_TOKEN.');
const result = await upsertAuditIssue({
  repository,
  token,
  body: renderIssue(report),
  actionable: report.findings.length > 0,
  runUrl: report.runUrl,
  preservePreviousFindings:
    report.baseline.status !== 'loaded' ||
    report.findings.some((finding) =>
      [
        'BASELINE_RESTORE_FAILED',
        'SOURCE_BASELINE_INVALID',
        'AUDIT_REPORT_MISSING',
        'SOURCE_AUDIT_CRASH',
        'REGISTRY_UNAVAILABLE',
        'VALIDATION_CRASH',
      ].includes(finding.code),
    ),
});
console.log(`Maintenance issue: ${result.action}${result.number ? ` #${result.number}` : ''}.`);
