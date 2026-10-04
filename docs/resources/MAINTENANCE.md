# Maintaining the public resource directory

The static catalog is curated source data, not a scraper output or a service database. Only public service information belongs here. Never add student/mentee records, documents, diagnoses, recipient names, passwords or access tokens. No new browser storage or backend is used.

## Update a record

1. Open the responsible official source and read the relevant section. Inspect a PDF/image directly when the fact is only there. A search snippet or HTTP 200 is not factual verification.
2. Edit the canonical record in `src/data/resources/catalog/`. Keep stable IDs; use the registry's merged-ID mapping for deliberate consolidations. Do not duplicate a whole service for campus variants.
3. Give important fields an evidence reference with an exact URL and heading/page locator. Record a source's publication/update date only if the source supplies it. Retrieval timestamps describe our access, never the publisher's update time.
4. Preserve audience, campus, eligibility, costs, dates and exceptions in both details and the concise editable poster representation. Unknown cost is not zero/free. Unresolved high-impact information uses a supported service-link block.
5. Record a new agent/human source review only after comparing the claims. A partial review has no `verifiedAt` or `lastVerified`. Obtain a separate review for high-impact records and precise contact/fee/deadline/time values. Do not call an agent review human approval.
6. Validate the whole candidate batch before changing the published registry, then review the diff, test, commit and push. A failed/partial retrieval never replaces the catalog.

## Checks

```text
npm run resources:validate
npm run resources:report -- --output .resource-reports/coverage.json
npm run resources:links -- --output .resource-reports/links.json
npm run resources:validate -- --input path/to/staged-candidate.json
npm test
npm run lint
npm run build
npm run test:e2e
```

`--input` only validates a nonempty candidate array. It never imports, overwrites or publishes records. Reports use a pending file then rename. Publishing remains an explicit reviewed Git change. The legacy `verify:resources -- --offline` remains supported for existing integrations.

The existing resource-health Actions workflow now produces downloadable coverage and link reports. It never edits resource facts, verification timestamps or source dates. Link checks use GET, three workers, URL deduplication, a 15-second request timeout, bounded redirects and at most one transient retry. They respect short Retry-After delays and defer longer ones. HTTP200 challenges and 401/403/429 are blocked; 404/410 are invalid; timeouts are unknown, not discontinued. A redirect to an unrecognized provider or generic homepage is flagged for inspection. Domain recognition is a URL-safety allowlist, not evidence that a claim is true.

## Review targets and lifecycle

Configurable targets in `catalog/define.ts`: schedules/hours/events 7 days; sensitive eligibility, fees and term dates 14 days; safety contacts 30 days; evergreen descriptions 180 days. These are internal review targets, not guarantees from SFU. Expiry and known changes take precedence. Review due does not erase the historical fact that a source was read.

Verification, freshness, link health and lifecycle are independent. Recurring sessions carry validity bounds and known closure exceptions; the app does not invent dates beyond them. All date-only comparisons use America/Vancouver. Dates have no implied midnight cutoff. Retired/historical services are excluded from discovery; expired records are visibly labelled and excluded from recommendations. Source-link records can remain useful when unsupported details are omitted.

For blocked Library pages, use an ordinary authorized browser or another directly relevant official SFU page. Do not bypass a challenge. Keep the exact blocked source and support the retained service identity from an accessible official referral; otherwise leave the candidate in the coverage backlog. A blocked page is not evidence of discontinuation.
