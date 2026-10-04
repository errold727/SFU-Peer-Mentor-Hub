// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  auditIssueMarker,
  auditIssueTitle,
  findAuditIssue,
  maximumIssueBodyLength,
  renderIssueBody,
  upsertAuditIssue,
  type AuditIssueOptions,
} from '../../scripts/resource-audit/issues';

const options: AuditIssueOptions = {
  repository: 'example/mentor-hub',
  token: 'synthetic-test-token',
  body: '# Audit\n\n- [ ] Review SOURCE_CHANGED\n',
  actionable: true,
  runUrl: 'https://github.com/example/mentor-hub/actions/runs/12345',
};
const issue = (number: number, body = `${auditIssueMarker}\n\nPrevious findings`) => ({
  number,
  title: auditIssueTitle,
  body,
  state: 'open',
});
function api(...responses: unknown[]) {
  const fetcher = vi.fn<typeof fetch>();
  for (const response of responses) fetcher.mockResolvedValueOnce(Response.json(response));
  return fetcher;
}
const payload = (fetcher: ReturnType<typeof api>, index: number) =>
  JSON.parse(String(fetcher.mock.calls[index][1]?.body));

describe('single weekly audit maintenance issue', () => {
  it('does no network work or mutation when there are no actionable findings', async () => {
    const fetcher = api();
    expect(await upsertAuditIssue({ ...options, actionable: false, token: '' }, fetcher)).toEqual({
      action: 'skipped',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('creates a marked issue only when action is needed, using structured minimum-scope API calls', async () => {
    const fetcher = api([], { number: 12 });
    expect(await upsertAuditIssue(options, fetcher)).toEqual({
      action: 'created',
      number: 12,
      url: 'https://github.com/example/mentor-hub/issues/12',
    });
    expect(fetcher.mock.calls[0][0]).toContain('?state=open&per_page=100&page=1');
    expect(fetcher.mock.calls[1][1]).toMatchObject({ method: 'POST', redirect: 'error' });
    expect(payload(fetcher, 1)).toEqual({
      title: auditIssueTitle,
      body: renderIssueBody(options.body, options.runUrl),
    });
    expect(payload(fetcher, 1)).not.toHaveProperty('state');
    expect(payload(fetcher, 1)).not.toHaveProperty('labels');
  });
  it('updates the same marked open issue and never creates or closes a second issue', async () => {
    const fetcher = api([issue(12)], { number: 12 });
    expect((await upsertAuditIssue(options, fetcher)).action).toBe('updated');
    expect(fetcher.mock.calls[1][0]).toBe(
      'https://api.github.com/repos/example/mentor-hub/issues/12',
    );
    expect(fetcher.mock.calls[1][1]?.method).toBe('PATCH');
    expect(payload(fetcher, 1)).not.toHaveProperty('state');
  });
  it('does not mutate an already identical report', async () => {
    const fetcher = api([issue(12, renderIssueBody(options.body, options.runUrl))]);
    expect((await upsertAuditIssue(options, fetcher)).action).toBe('unchanged');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not claim a title-only human issue, a pull request, a quoted marker, or a closed issue', async () => {
    const unrelated = [
      issue(1, 'Human issue with the same title'),
      { ...issue(2), pull_request: {} },
      issue(3, `Quoted: ${auditIssueMarker}\n`),
      { ...issue(4), state: 'closed' },
    ];
    expect(findAuditIssue(unrelated)).toEqual([]);
    const fetcher = api(unrelated, { number: 5 });
    expect((await upsertAuditIssue(options, fetcher)).action).toBe('created');
  });
  it('paginates before choosing one existing issue and reports pre-existing duplicates without closing them', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => issue(index + 20, 'Unrelated'));
    const fetcher = api(firstPage, [issue(12), issue(8)], { number: 8 });
    expect(await upsertAuditIssue(options, fetcher)).toMatchObject({
      action: 'updated',
      number: 8,
      duplicateNumbers: [12],
    });
    expect(fetcher.mock.calls[1][0]).toContain('page=2');
    expect(fetcher.mock.calls[2][0]).toMatch(/\/issues\/8$/);
  });
  it('fails closed when listing is incomplete, malformed, or inaccessible', async () => {
    const fullPage = Array.from({ length: 100 }, (_, index) => issue(index + 1, 'Unrelated'));
    const tooMany = api(...Array.from({ length: 10 }, () => fullPage));
    await expect(upsertAuditIssue(options, tooMany)).rejects.toThrow('pagination limit');
    expect(tooMany.mock.calls.every((call) => call[1]?.method === 'GET')).toBe(true);
    await expect(upsertAuditIssue(options, api({ unexpected: [] }))).rejects.toThrow(
      'invalid issue listing',
    );
    const denied = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('sensitive API details', { status: 403 }));
    await expect(upsertAuditIssue(options, denied)).rejects.toThrow('HTTP 403');
    expect(denied).toHaveBeenCalledTimes(1);
  });
  it('does not retry an ambiguous creation failure', async () => {
    const fetcher = api([]);
    fetcher.mockRejectedValueOnce(new Error('Network disconnected'));
    await expect(upsertAuditIssue(options, fetcher)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('does not echo request error details or unparseable API bodies into logs', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error(`Network ${options.token}`));
    await expect(upsertAuditIssue(options, fetcher)).rejects.toThrow('request failed');
    await expect(upsertAuditIssue(options, fetcher)).rejects.not.toThrow(options.token);
    const unreadable = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(`private ${options.token}`));
    await expect(upsertAuditIssue(options, unreadable)).rejects.toThrow('unreadable JSON');
  });
  it('retains readable Markdown but neutralizes source HTML, mentions, commands and unsafe links', () => {
    const body = renderIssueBody(
      '# Audit\n\n| Count | Status |\n| --- | --- |\n- [ ] <script>alert(1)</script> @maintainer ::error::bad\u0000\n[unsafe](javascript:evil)\n![image](https://example.org/img.png)',
      options.runUrl,
    );
    expect(body).toContain('# Audit\n\n| Count | Status |');
    expect(body).toContain('- [ ] &lt;script&gt;');
    expect(body).toContain('&#64;maintainer');
    expect(body).not.toContain('::error::');
    expect(body).not.toContain('<script>');
    expect(body).not.toContain('](javascript:');
    expect(body).not.toContain('![image]');
    expect(body.startsWith(auditIssueMarker)).toBe(true);
  });
  it('bounds a long body and preserves the run link and clear truncation notice', () => {
    const body = renderIssueBody('Long finding\n'.repeat(10_000), options.runUrl);
    expect(body.length).toBeLessThanOrEqual(maximumIssueBodyLength);
    expect(body).toContain('Report truncated');
    expect(body).toContain(`[Workflow run](${options.runUrl})`);
  });
  it('does not include the supplied credential even if it accidentally appears in report text', async () => {
    const fetcher = api([], { number: 12 });
    await upsertAuditIssue({ ...options, body: `Oops ${options.token}` }, fetcher);
    expect(payload(fetcher, 1).body).not.toContain(options.token);
    expect(payload(fetcher, 1).body).toContain('[REDACTED]');
  });
  it.each([
    'https://evil.example/run',
    'https://github.com/elsewhere/repo/actions/runs/1',
    'javascript:alert(1)',
  ])('refuses an invalid or unrelated run URL: %s', async (runUrl) => {
    const fetcher = api();
    await expect(upsertAuditIssue({ ...options, runUrl }, fetcher)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not erase unresolved source-change findings supplied by the persisted source state', async () => {
    const body =
      '# Audit\n\n- [ ] SOURCE_CHANGED: review still required; current fingerprint unchanged.';
    const fetcher = api([issue(12)], { number: 12 });
    await upsertAuditIssue({ ...options, body }, fetcher);
    expect(payload(fetcher, 1).body).toContain('SOURCE_CHANGED: review still required');
  });
  it('retains one original snapshot through repeated coverage gaps and later recovered reports', async () => {
    const previous = renderIssueBody(
      '# Previous audit\n- [ ] SOURCE_CHANGED original unresolved fact',
      options.runUrl,
    );
    const first = api([issue(12, previous)], { number: 12 });
    await upsertAuditIssue(
      {
        ...options,
        body: '# Current report\nBaseline unavailable',
        preservePreviousFindings: true,
      },
      first,
    );
    const firstBody = payload(first, 1).body;
    expect(firstBody).toContain('SOURCE_CHANGED original unresolved fact');
    expect(firstBody).toContain('Previous findings retained because coverage was incomplete');
    const second = api([issue(12, firstBody)], { number: 12 });
    await upsertAuditIssue(
      { ...options, body: '# Next report\nAnother restore gap', preservePreviousFindings: true },
      second,
    );
    const secondBody = payload(second, 1).body;
    expect(secondBody.match(/SOURCE_CHANGED original unresolved fact/g)).toHaveLength(1);
    expect(secondBody).not.toContain('# Current report');
    const recovered = api([issue(12, secondBody)], { number: 12 });
    await upsertAuditIssue(
      { ...options, body: '# Restored coverage\n- [ ] Another warning' },
      recovered,
    );
    expect(payload(recovered, 1).body).toContain('SOURCE_CHANGED original unresolved fact');
  });
  it('bounds both current and preserved reports and retains the old workflow artifact link', () => {
    const previousRun = 'https://github.com/example/mentor-hub/actions/runs/100';
    const previous = renderIssueBody('Older finding\n'.repeat(6000), previousRun);
    const result = renderIssueBody('Current finding\n'.repeat(6000), options.runUrl, previous);
    expect(result.length).toBeLessThanOrEqual(maximumIssueBodyLength);
    expect(result).toContain(`[Workflow run](${previousRun})`);
    expect(result).toContain(`[Workflow run](${options.runUrl})`);
    expect(result).toContain('Previous report excerpt truncated');
  });
});
