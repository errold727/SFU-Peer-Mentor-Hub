export const auditIssueTitle = 'Weekly SFU Resource Audit';
export const auditIssueMarker = '<!-- sfu-peer-mentor-hub:weekly-resource-audit -->';
export const maximumIssueBodyLength = 60_000;
const retainedStart = '<!-- sfu-peer-mentor-hub:retained-review-start -->';
const retainedEnd = '<!-- sfu-peer-mentor-hub:retained-review-end -->';

type GitHubIssue = {
  number: number;
  title: string;
  body: string | null;
  state: string;
  pull_request?: unknown;
};
export type AuditIssueOptions = {
  repository: string;
  token: string;
  body: string;
  actionable: boolean;
  runUrl: string;
  preservePreviousFindings?: boolean;
};
export type AuditIssueResult = {
  action: 'created' | 'updated' | 'unchanged' | 'skipped';
  number?: number;
  url?: string;
  duplicateNumbers?: number[];
};

function validRunUrl(value: string) {
  const url = new URL(value);
  if (
    url.origin !== 'https://github.com' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/actions\/runs\/\d+(?:\/attempts\/\d+)?$/.test(url.pathname)
  )
    throw Error('Audit issue requires a public GitHub Actions run URL.');
  return url;
}

function safeIssueMarkdown(body: string) {
  return body
    .replace(/\r\n?/g, '\n')
    .split('')
    .filter(
      (character) =>
        character === '\n' ||
        character === '\t' ||
        (character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127),
    )
    .join('')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/@/g, '&#64;')
    .replace(/::/g, ':&#58;')
    .replace(/!\[/g, '[')
    .replace(/\]\(\s*(?:javascript|data|vbscript|file):[^)]*\)/gi, '](unsafe URL omitted)')
    .trim();
}
function retainedSnapshot(body: string) {
  const start = body.indexOf(`${retainedStart}\n`);
  const end = body.indexOf(`\n${retainedEnd}`, start + retainedStart.length);
  return start >= 0 && end > start ? body.slice(start + retainedStart.length + 1, end) : undefined;
}

/** Preserve report Markdown while neutralizing raw HTML, mentions and workflow-command text. */
export function renderIssueBody(body: string, runUrl: string, previousBody?: string) {
  const safeRun = validRunUrl(runUrl).href;
  const sanitized = safeIssueMarkdown(body);
  let retained = '';
  if (previousBody) {
    const previous = safeIssueMarkdown(previousBody.replace(auditIssueMarker, ''));
    const previousRun =
      previous
        .match(
          /\[Workflow run\]\(https:\/\/github\.com\/[^\s)]+\/actions\/runs\/\d+(?:\/attempts\/\d+)?\)/g,
        )
        ?.at(-1) ?? '';
    const notice = `\n\n_Previous report excerpt truncated. Review its workflow artifact for remaining findings._\n${previousRun}`;
    const excerpt =
      previous.length > 27_000 ? previous.slice(0, 27_000 - notice.length) + notice : previous;
    retained = `\n\n## Previous findings retained because coverage was incomplete\n\nThese older findings are not automatically resolved by a later reachable page or replacement baseline. A maintainer may remove this retained section after reviewing them.\n\n${retainedStart}\n${excerpt}\n${retainedEnd}`;
  }
  const prefix = `${auditIssueMarker}\n\n`;
  const footer = `\n\n[Workflow run](${safeRun})\n\nAutomation reports review needs; it does not verify changed facts. Resolution and closure remain with the maintainer.`;
  const omission =
    '\n\n_Report truncated to fit the issue limit. The workflow artifact contains the complete report._';
  const available = Math.min(
    previousBody ? 28_000 : maximumIssueBodyLength,
    maximumIssueBodyLength - prefix.length - footer.length - retained.length,
  );
  const content =
    sanitized.length > available
      ? sanitized.slice(0, available - omission.length) + omission
      : sanitized;
  return prefix + content + retained + footer;
}

/** Only this marker authorizes updates; a matching human-authored title is not sufficient. */
export function findAuditIssue(issues: GitHubIssue[]) {
  return issues
    .filter(
      (issue) =>
        issue.state === 'open' &&
        !('pull_request' in issue) &&
        issue.body?.startsWith(`${auditIssueMarker}\n`),
    )
    .sort((a, b) => a.number - b.number);
}

/** Call only in the separate GitHub publishing step. Never closes an issue or retries a mutation. */
export async function upsertAuditIssue(
  options: AuditIssueOptions,
  fetcher: typeof fetch = fetch,
): Promise<AuditIssueResult> {
  if (!options.actionable) return { action: 'skipped' };
  const [owner, repository, extra] = options.repository.split('/');
  if (
    extra ||
    !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(owner ?? '') ||
    !/^[A-Za-z0-9_.-]{1,100}$/.test(repository ?? '') ||
    ['.', '..'].includes(repository)
  )
    throw Error('Invalid GitHub repository identity.');
  if (!options.token.trim()) throw Error('GitHub issue publishing requires a token.');
  const run = validRunUrl(options.runUrl);
  if (!run.pathname.startsWith(`/${owner}/${repository}/actions/runs/`))
    throw Error('Audit workflow run belongs to a different repository.');
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues`;
  async function request(url: string, method = 'GET', payload?: unknown): Promise<unknown> {
    const response = await fetcher(url, {
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${options.token}`,
        'X-GitHub-Api-Version': '2026-03-10',
        'User-Agent': 'SFU-Peer-Mentor-Hub-resource-audit',
        ...(payload ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    }).catch(() => {
      throw Error(
        `GitHub issue API ${method} request failed; inspect the repository before retrying a mutation.`,
      );
    });
    // Never expose server bodies, request headers or credentials through thrown/logged text.
    if (!response.ok)
      throw Error(`GitHub issue API ${method} failed with HTTP ${response.status}.`);
    return response.json().catch(() => {
      throw Error(
        'GitHub issue API returned unreadable JSON; inspect the repository before retrying a mutation.',
      );
    });
  }
  const all: GitHubIssue[] = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await request(`${endpoint}?state=open&per_page=100&page=${page}`);
    if (
      !Array.isArray(batch) ||
      batch.some(
        (item) =>
          !item ||
          !Number.isSafeInteger(item.number) ||
          item.number < 1 ||
          typeof item.title !== 'string' ||
          typeof item.state !== 'string' ||
          (item.body !== null && typeof item.body !== 'string'),
      )
    )
      throw Error('GitHub returned an invalid issue listing; no issue was changed.');
    all.push(...batch);
    if (batch.length < 100) break;
    if (page === 10)
      throw Error('Issue listing exceeded the safe pagination limit; no issue was changed.');
  }
  const matches = findAuditIssue(all);
  const issue = matches[0];
  // Keep one original snapshot through repeated gaps/recovery; never nest prior snapshots.
  // Existing retained reviews are cleared only by an explicit maintainer edit to the issue.
  const previous = issue?.body
    ? (retainedSnapshot(issue.body) ?? (options.preservePreviousFindings ? issue.body : undefined))
    : undefined;
  const body = renderIssueBody(
    options.body.split(options.token).join('[REDACTED]'),
    options.runUrl,
    previous?.split(options.token).join('[REDACTED]'),
  );
  const duplicateNumbers =
    matches.length > 1 ? matches.slice(1).map((item) => item.number) : undefined;
  const result = (action: AuditIssueResult['action'], number: number): AuditIssueResult => ({
    action,
    number,
    url: `https://github.com/${owner}/${repository}/issues/${number}`,
    ...(duplicateNumbers ? { duplicateNumbers } : {}),
  });
  if (issue?.title === auditIssueTitle && issue.body === body)
    return result('unchanged', issue.number);
  if (issue) {
    await request(`${endpoint}/${issue.number}`, 'PATCH', { title: auditIssueTitle, body });
    return result('updated', issue.number);
  }
  const created = await request(endpoint, 'POST', { title: auditIssueTitle, body });
  if (
    !created ||
    typeof created !== 'object' ||
    !('number' in created) ||
    !Number.isSafeInteger(created.number) ||
    Number(created.number) < 1
  )
    throw Error(
      'GitHub issue creation returned an unexpected response; inspect the repository before retrying.',
    );
  return result('created', Number(created.number));
}
