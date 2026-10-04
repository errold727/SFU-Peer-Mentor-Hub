// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  restoreSourceState,
  type RestoreDependencies,
  type StateArtifact,
} from '../../scripts/resource-audit/restore-state';
import { fallbackAuditReport, workflowRunUrl } from '../../scripts/resource-audit/finalize';
import { emptySourceState, fingerprintSources } from '../../scripts/resource-audit/sources';
import { runAudit } from '../../scripts/resource-audit/engine';
import { sourceStateMaxBytes } from '../../scripts/resource-audit/policy';

const artifact = (id: number): StateArtifact => ({
  id,
  expired: false,
  size_in_bytes: 100,
  created_at: `2026-10-${String(id).padStart(2, '0')}T12:00:00Z`,
  workflow_run: { id: id * 100, head_branch: 'main' },
});
const trustedRun = {
  path: '.github/workflows/weekly-resource-audit.yml',
  event: 'schedule',
  head_branch: 'main',
  status: 'completed',
};
function dependencies(items: StateArtifact[] = [artifact(2)]): RestoreDependencies {
  return {
    listArtifacts: vi.fn().mockResolvedValue(items),
    getRun: vi.fn().mockResolvedValue(trustedRun),
    downloadState: vi.fn().mockResolvedValue(emptySourceState()),
  };
}

describe('audit state recovery and failure reporting', () => {
  it('distinguishes a genuine first baseline from restoration failure', async () => {
    const missing = await restoreSourceState(dependencies([]));
    expect(missing.outcome).toMatchObject({
      status: 'missing',
      degraded: false,
      baselineCarryForwardBlocked: false,
    });
    const failed = dependencies();
    vi.mocked(failed.listArtifacts).mockRejectedValue(new Error('Private transport diagnostics'));
    const unavailable = await restoreSourceState(failed);
    expect(unavailable.outcome).toMatchObject({
      status: 'unavailable',
      degraded: true,
      baselineCarryForwardBlocked: true,
    });
    expect(unavailable.outcome.note).not.toContain('Private transport');
  });
  it('restores a validated source state from a completed default-branch audit', async () => {
    const result = await restoreSourceState(dependencies());
    expect(result.outcome).toMatchObject({
      status: 'loaded',
      runId: 200,
      degraded: false,
      baselineCarryForwardBlocked: false,
    });
    expect(result.state).toEqual(emptySourceState());
  });
  it('falls back from corrupt newer state to valid older state and blocks promotion of the degraded baseline', async () => {
    const deps = dependencies([artifact(1), artifact(2)]);
    vi.mocked(deps.downloadState)
      .mockRejectedValueOnce(new Error('Broken download'))
      .mockResolvedValueOnce(emptySourceState());
    const result = await restoreSourceState(deps);
    expect(vi.mocked(deps.downloadState).mock.calls.map(([item]) => item.id)).toEqual([2, 1]);
    expect(result.outcome).toMatchObject({
      status: 'loaded',
      runId: 100,
      degraded: true,
      baselineCarryForwardBlocked: true,
      failedCandidates: 1,
    });
    expect(result.outcome.note).toContain('Newer pending changes may be missing');
  });
  it.each(['malformed', 'oversized'])(
    'tries an older artifact after a %s candidate',
    async (kind) => {
      const newest = artifact(2);
      if (kind === 'oversized') newest.size_in_bytes = sourceStateMaxBytes + 1;
      const deps = dependencies([newest, artifact(1)]);
      if (kind === 'malformed')
        vi.mocked(deps.downloadState)
          .mockResolvedValueOnce({ version: 99 })
          .mockResolvedValueOnce(emptySourceState());
      const result = await restoreSourceState(deps);
      expect(result.outcome).toMatchObject({
        status: 'loaded',
        runId: 100,
        baselineCarryForwardBlocked: true,
      });
    },
  );
  it('does not trust a pull-request run, a different workflow, another branch or an incomplete run', async () => {
    for (const change of [
      { event: 'pull_request' },
      { path: '.github/workflows/other.yml' },
      { head_branch: 'feature' },
      { status: 'in_progress' },
    ]) {
      const deps = dependencies();
      vi.mocked(deps.getRun).mockResolvedValue({ ...trustedRun, ...change });
      const result = await restoreSourceState(deps);
      expect(result.outcome.status).toBe('missing');
      expect(deps.downloadState).not.toHaveBeenCalled();
    }
  });
  it('does not silently restart state after every candidate fails', async () => {
    const deps = dependencies([artifact(2), artifact(1)]);
    vi.mocked(deps.downloadState).mockResolvedValue({ sources: { corrupted: true } });
    const result = await restoreSourceState(deps);
    expect(result).toMatchObject({
      outcome: { status: 'unavailable', baselineCarryForwardBlocked: true, failedCandidates: 2 },
    });
    expect(result.state).toBeUndefined();
  });
  it('preserves pending source-change evidence in the restored snapshot', async () => {
    const source = (text: string, checkedAt: string) => ({
      url: 'https://www.sfu.ca/students/example.html',
      requestedUrls: ['https://www.sfu.ca/students/example.html'],
      status: 'healthy' as const,
      checkedAt,
      contentType: 'text/plain',
      body: (
        'Public student support information explains access to services and eligibility conditions for the campus community. ' +
        text +
        ' '
      ).repeat(3),
      bytesRead: 500,
      bodyTruncated: false,
    });
    const original = fingerprintSources([source('Original', '2026-10-01T12:00:00Z')]);
    const changed = fingerprintSources([source('Changed', '2026-10-02T12:00:00Z')], original.state);
    const deps = dependencies();
    vi.mocked(deps.downloadState).mockResolvedValue(changed.state);
    const result = await restoreSourceState(deps);
    expect(Object.values(result.state!.sources)[0].pending).toEqual(
      Object.values(changed.state.sources)[0].pending,
    );
  });
  it('adds a usable workflow run URL to the fatal fallback report', async () => {
    const audit = vi.fn((options: Parameters<typeof runAudit>[0]) =>
      runAudit(options, {
        loadResources: async () => [],
        courses: async () => ({ terms: [], findings: [] }),
      }),
    );
    const recovered = await fallbackAuditReport(audit, {
      GITHUB_REPOSITORY: 'example/mentor-hub',
      GITHUB_RUN_ID: '123',
      GITHUB_SHA: 'abc',
    });
    expect(audit).toHaveBeenCalledWith({
      offline: true,
      commit: 'abc',
      runUrl: 'https://github.com/example/mentor-hub/actions/runs/123',
    });
    expect(
      recovered.findings.some(
        (finding) => finding.code === 'AUDIT_REPORT_MISSING' && finding.severity === 'error',
      ),
    ).toBe(true);
    expect(recovered.runUrl).toBe('https://github.com/example/mentor-hub/actions/runs/123');
    expect(workflowRunUrl({ GITHUB_REPOSITORY: 'example/mentor-hub', GITHUB_RUN_ID: '123' })).toBe(
      'https://github.com/example/mentor-hub/actions/runs/123',
    );
    expect(
      workflowRunUrl({ GITHUB_REPOSITORY: '../escape', GITHUB_RUN_ID: '123' }),
    ).toBeUndefined();
  });
});
