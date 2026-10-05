# Weekly resource reliability audit

Automation detects a review need → a maintainer compares the actual authoritative evidence → a reviewed change updates the facts → `verifiedAt` changes only after that factual review. **HTTP 200, an unchanged fingerprint and a passing workflow never verify a fact.**

## Schedule and entry points

`Weekly Resource Audit` runs from the default branch each Monday at **00:07 America/Vancouver**, using `cron: '7 0 * * 1'` and `timezone: 'America/Vancouver'`. GitHub supports IANA timezones, including daylight-saving adjustments; there is no fixed UTC conversion. Scheduled execution can be delayed by GitHub load. In a public repository, GitHub may disable schedules after 60 days without repository activity. Re-enable the workflow when needed; do not create artificial keepalive commits.

- [Current GitHub schedule syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onschedule)
- [Scheduled workflow inactivity policy](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/disabling-and-enabling-a-workflow)

Manual default: Actions → **Weekly Resource Audit** → **Run workflow**. The optional `deep_check` input raises the bounded response limit from 512 KiB to 2 MiB; it does not bypass access controls or increase concurrency. Every run audits the complete registry and both course terms. There is no partial-scope issue update that could erase uninspected findings.

```sh
gh workflow run weekly-resource-audit.yml --ref main
gh workflow run weekly-resource-audit.yml --ref main -f deep_check=true
npm run audit:weekly
npm run audit:weekly -- --offline
npm run audit:weekly -- --deep-check
npm run audit:weekly -- --state .resource-audit/state.json --output artifacts
```

The local command performs the same non-GitHub audit logic, but never posts an issue. `--offline` skips all live retrieval and never replaces retained source snapshots. Local tests/build are separate commands; the weekly workflow always runs `npm test`, `npm run lint` and `npm run build` and records their outcomes. Build includes TypeScript checking. The existing deployment workflow also runs the full browser suite before publishing the site.

## Checks and interpretation

Fall 2026 SLC programs reuse this audit through the existing resource catalog. `EVENT_PASSED` records elapsed occurrences without expiring an entire series; `SERIES_COMPLETED` and schedule expiry follow the final published date. Bounded occurrences/recurrences satisfy workshop validity, while unbounded service schedules remain reviewable. Program and occurrence registration URLs enter the ordinary link/source-change checks. `PROGRAM_MANUAL_REVIEW_REQUIRED` preserves source ambiguities, including past occurrences with withheld hours. Document receipts validate file identity and reviewed pages; neither a receipt nor a reachable link automatically changes `verifiedAt`. Search probes include the English and Mandarin SLC aliases.

The audit counts every canonical record, including malformed entries, and reuses the publication validator, resource search, poster formatter, date helpers, provider-domain allowlist and course validator. It inspects identity, provider/category/campus/audience/term, sources/actions/QR targets, evidence and review metadata, cost, relationships, dates, hours/sessions and poster content. Invalid records remain visible as failures; they are not silently skipped.

| Dimension            | What automation establishes                                                                          | What it cannot establish                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Link health          | Reachable, redirected, blocked, timed out, rate limited, not found, server error, invalid or unknown | Service discontinuation or factual correctness                   |
| Source change        | Normalized static source text differs from the last successful snapshot                              | Which Resource Hub sentence is wrong, or the correct replacement |
| Freshness            | An internal review target is approaching or overdue                                                  | That a stale record is necessarily false                         |
| Validity             | A published date/range/session validity period has passed or is upcoming                             | An unpublished deadline time or closure schedule                 |
| Factual verification | Reads existing recorded review evidence without changing it                                          | Automatic approval, human review or official SFU certification   |

Structural checks include duplicates, evidence and related-ID consistency, safe recognized HTTPS URLs, valid metadata/ranges, explicit unknown cost, unsupported zero/free implications, suspicious private fields and usable poster content. Shape guards let malformed records fail without crashing the rest of the audit. These checks cannot prove that all free text contains no personal information or that every natural-language qualification is equivalent to its source.

Poster checks use the actual output formatter, including concise facts and conditions. Long text, giant visible URLs, potentially omitted essential qualifications, expired content and stale schedule copy create review flags. Qualification matching is intentionally conservative and can have false positives; it never shortens or rewrites factual copy.

Search probes use the real search function with a fixed English/Mandarin query set and plausible canonical IDs/categories. They check current applicability and the first ten results. A `SEARCH_REGRESSION` concerns search quality, not the truth of a resource. Unavailable floor-specific facts must not be invented just to make a probe pass. Probes without an applicable corresponding resource are explicitly not applicable.

## Freshness and high impact

The existing centralized `reviewCadenceDays` in `src/data/resources/catalog/define.ts` remains authoritative:

| Cadence                                 | Internal review interval |
| --------------------------------------- | -----------------------: |
| Schedules, hours, events                |                   7 days |
| Sensitive eligibility, fees, term dates |                  14 days |
| Safety contacts                         |                  30 days |
| Evergreen descriptions                  |                 180 days |

An explicit resource `reviewDueAt` overrides the derived target. A missing factual review remains `reviewDue`, even with a future override. `reviewSoon` begins in the final quarter of the interval, bounded to 1–7 days; `reviewDue` starts on the due date, and `stale` means more than another full interval overdue. Targets are maintenance policy, not SFU policy. Existing UI source-review labels remain separate from these audit details.

The catalog's explicit `highImpact` flag and conservative category/claim classification cover emergency contacts, tuition/refunds, immigration/work authorization, medical/insurance, formal deadlines and rights procedures. Source changes, unavailable sources and overdue factual reviews for these records receive **HIGH PRIORITY REVIEW REQUIRED**. No emergency number, fee, deadline, immigration or insurance wording is inferred or automatically published.

Lifecycle is reported as upcoming, active, expired, historical or unknown. Date-only values remain valid through their America/Vancouver calendar date; exact timestamps retain their published offsets. Term scope is reported separately. Bounded recurring sessions expire at their validity end, and missing validity/source/review evidence is flagged. The audit does not extend a recurrence through university closures or delete historical content.

## Retrieval and fingerprints

The weekly audit and legacy `resources:links` share the same bounded GET implementation. GET avoids mistaking unsupported HEAD for a dead page. Default maximum concurrency is two, with at least 750 ms between request starts, a 15-second timeout and one transient retry. Retry-After is respected; longer delays are deferred rather than bypassed. Redirect targets are checked before following, loops/hop counts are bounded, and a specific page redirecting to a homepage or unrecognized provider is flagged. No CAPTCHA, authentication or access-control bypass is attempted.

Source/action/QR URLs are canonicalized only by removing fragments and known tracking parameters and sorting query parameters. Meaningful query values remain. Identical URLs and shared redirect targets share fetch work. Results retain requested aliases, final destination and distinct health status. HTTP 401/403 and challenge pages are **blocked**, 429 is **rateLimited**, and 404/410 is **notFound**. Unknown/network failures never mean discontinued.

One fetched body supplies both health and change detection. Response bytes are bounded while streaming, before a full body can accumulate. Inert HTML parsing executes no scripts and retrieves no subresources. Normalization prefers main/article content, strips scripts/styles/navigation and common generated chrome, normalizes whitespace, and removes narrowly identified generated retrieval timestamps. Publisher dates, amounts, contacts and other factual text are retained. Fingerprints use SHA-256; compact added/removed text provides review context.

Only complete supported static HTML/plain text with enough content and at most 32,000 normalized characters receives a fingerprint. PDFs, binaries, thin/dynamic shells, truncated/oversized content and inaccessible pages have explicit uncovered reasons. A main region cannot always be identified, so some pages use cleaned body text. Markup/template changes may still produce false alarms; text-only fingerprints can miss changes in images, PDFs, JavaScript-rendered content, link destinations or removed navigation. An unchanged hash is not a factual review.

The first successful observation establishes a **baseline**, not an unchanged result. A subsequent text change records old/new hashes, detection time and excerpts. Pending alerts survive later unchanged or inaccessible observations. For each affected resource they remain actionable until its recorded factual `verifiedAt` is newer than the detected change. A generic source can support several resources; reviewing one does not clear the others.

## State, reports and issue behavior

Local output is ignored by Git:

```text
artifacts/resource-audit.json         Complete machine-readable report
artifacts/resource-audit.md           Detailed human-readable report
artifacts/resource-audit-summary.md   Compact Job Summary
.resource-audit/state.json            Bounded public source text/hashes and pending changes
```

Actions uploads `resource-audit` and `resource-audit-source-state` artifacts with 90-day retention. Each run restores the most recent retained, completed default-branch weekly audit's source state through the GitHub API; it does not depend on a previous runner filesystem or a weekly cache eviction boundary. Only validated, bounded plain-data state is consumed, never downloaded code. Node dependencies use the existing npm cache. No private/user data is cached.

A missing/expired baseline is explicit and establishes first observations. Restoration failure or corrupt state is reported as a coverage gap; older valid artifacts may provide partial continuity, but a degraded/restoration-failed run cannot promote replacement state. The audit never fabricates a prior comparison. Ninety days is finite retention, so long inactivity can lose comparison continuity. The initial delivery has no retroactive snapshots of pages previously reviewed by a person/agent.

Every normal run writes a concise GitHub Job Summary and both full report formats, with counts, priority findings, source outcomes, search probes, every canonical record and separate Fall/Spring course rows. Errors are retained even when validation or a quality gate fails. A setup/reporting failure produces an explicit fallback summary; a failed dependency install cannot produce a complete JSON audit.

Actionable findings create or update one issue titled **Weekly SFU Resource Audit**, identified by a stable hidden marker rather than title alone. An unrelated human issue with the same title is never overwritten. A clean run creates no issue. The checklist is regenerated for the latest findings; durable decisions belong in issue comments and reviewed content changes. Coverage gaps retain one bounded previous-report section instead of silently dropping unresolved findings; that section remains until a maintainer removes it after review. Long checklists disclose truncation and link to full artifacts. If duplicate marked issues already exist, the oldest open one is used. The bot does not close issues: resolving factual findings and deciding whether earlier concerns are addressed remains a maintainer decision. Closing a marked issue manually permits a new issue on a later actionable audit.

Source changes and other warnings can leave Actions green while still opening the review issue. Schema/unsafe URL errors, missing/corrupt course datasets, registry/validation failures and failed tests/lint/build make the workflow fail. No factual edits or `verifiedAt` refreshes are permitted, and both an in-memory registry digest and a tracked-file diff guard check this boundary.

## Course data and security

Both numeric course terms reuse `validateTermDirectory`: manifests, discovered subject coverage, dataset files/index, section identities, meeting times and campus normalization. Reports separate Fall 2026 and Spring 2027, including section/schedule totals, failed subjects, enrichment gaps and snapshot age. The internal snapshot-age target is seven days. Missing schedules remain unknown, not asynchronous. Course records are never merged into the resource model.

The existing daily/manual `course-data-sync.yml` is preserved. It stages, validates and opens a reviewed data PR; failed imports preserve current production pointers and it never auto-merges. This weekly audit neither imports nor publishes courses.

Permissions are `contents: read`, `actions: read` for prior artifacts and `issues: write`. Checkout does not persist credentials. `GITHUB_TOKEN` is provided only to the restoration and issue-publishing steps; no PAT is needed. Fetched content is untrusted data: scripts are not executed, remote instructions are ignored, report text is escaped, response/state sizes are bounded, and URLs/text are never interpolated into shell commands. The audit has no content-write or PR permission and creates no maintenance commits.

## Troubleshooting and review

1. Open the run's Job Summary, then download `resource-audit`. Start with high-priority findings and errors; compare JSON source coverage against resources/unique URL counts.
2. A blocked page needs ordinary authorized browser/manual review. Do not change a factual verification timestamp to silence a network result.
3. For changed content, compare the old/new excerpt and the current authoritative page. Review affected fields and poster qualifications separately. Only then edit facts and record factual review metadata through a reviewed PR.
4. For baseline gaps, inspect artifact retention and Actions read permission. Restoring state is not factual review; resetting a baseline does not certify the source.
5. Search/poster warnings may be heuristic. Inspect actual user output before editing; missing facts remain omitted.
6. For stale or incomplete course data, inspect the separate course refresh run and staged diagnostics. Never publish a partially broken term.
7. For issue failure, inspect Actions issue permission and the existing marked issue before retrying an ambiguous POST. The publisher never blindly retries mutations.
8. For a disabled schedule, explicitly re-enable it after resolving repository inactivity. Keep actual maintenance meaningful.

Deterministic tests mock network responses and GitHub issue APIs. Live SFU availability is not required by ordinary tests. Manual delivery verification checks public sources, artifacts, readable summaries, issue create/update behavior, unchanged facts and a healthy deployed site; run URLs and final counts belong in the delivery PR.
