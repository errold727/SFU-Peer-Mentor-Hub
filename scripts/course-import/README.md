# Future course importer

Architecture: **official SFU source → importer → normalized JSON → Course Planner**.

Phase 0 contains a manually reviewed subset of public SFU Course Outlines. Public JSON is available at `https://www.sfu.ca/bin/wcm/course-outlines?2027/spring/engl/211/d100`; the corresponding human-facing source is `https://www.sfu.ca/outlines.html?2027/spring/engl/211/d100`. These were inspected on 2026-10-03. The app makes no runtime requests to SFU and does not scrape web pages.

Datasets live at `public/data/courses/<year>-<term>/<department>.json`. Each has schemaVersion 1, lastVerified, a scope note, and courses. Types and runtime validation live in `src/course`. Meetings use canonical day names and minutes since midnight in Vancouver local time. An empty meetings array means unknown, not asynchronous. Missing values must remain absent; an empty prerequisite source must not be interpreted as no prerequisites. Seats and waitlists are absent in the initial source data.

For a future GitHub Actions importer:

1. Confirm current official endpoint documentation/permission and rate limits. Use an explicit supported source adapter, bounded requests, backoff, caching, and timeouts.
2. Map known source fields only. Normalize day names and time formats. Keep tutorials/labs and teaching-date ranges when published; never silently label a lecture-only snapshot complete.
3. Validate intervals, term/department identity, unique offering IDs, official source URLs, and optional nonnegative enrollment counts. Fail closed on schema changes.
4. Preserve the last known-good dataset on fetch or validation failure. Set verification timestamps only after successful inspection; retain provenance and a concise change summary.
5. Open a reviewable pull request containing data changes. Run unit tests, dataset validation, browser smoke tests, and build before merging. Deploy through the existing Pages workflow.

Do not fetch private goSFU records, create student records, infer prerequisites, fabricate capacities, or predict demand. No importer is scheduled in Phase 0.
