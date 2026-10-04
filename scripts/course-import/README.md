# CourSys offering pipeline

## Official interfaces

Open [CourSys Browse](https://coursys.sfu.ca/browse/) without signing in. Its JavaScript sends a public JSON request to `/browse/?tabledata=yes&semester[]=1267&start=0&length=500&order[0][column]=1&order[0][dir]=asc&xlist[]=yes`. Spring 2027 is **1271**. **1264 is Summer 2026**, and is deliberately rejected by this importer.

The official [browse.js](https://github.com/sfu-fas/coursys/blob/master/media/js/browse.js) and [OfferingDataJson implementation](https://github.com/sfu-fas/coursys/blob/master/coredata/views.py) document parameter names, the 500-row limit, six display columns, enrollment syntax, crosslists, and exclusions. The JSON contains HTML in course/title cells; a narrow checked parser extracts the documented public fields and renders only plain text. A changed contract fails instead of publishing empty data. Instructor display names are public; emails, private identifiers and student data are never collected.

The [Course Outlines API](https://www.sfu.ca/outlines/help/api.html) enriches each discovered section through `https://www.sfu.ca/bin/wcm/course-outlines?2027/spring/engl/211/d100`. It never establishes the offering universe. A 404, malformed outline or unpublished schedule retains the original CourSys offering. Missing data is not inferred from a previous snapshot.

## Commands

```sh
npm run courses:discover -- 1267
npm run courses:discover -- 1271
npm run courses:sync -- 1267
npm run courses:sync -- 1271
npm run courses:sync:all
npm run courses:sync:all -- --force
npm run courses:publish -- all
npm run courses:validate
npm run courses:report
```

Discovery scans the **whole term** in deterministic pages and derives its subject list from those rows. It avoids a separate query for every historic subject in the global dropdown. Counts must match `recordsFiltered`, and duplicates/page gaps are fatal. A count change during discovery requires a fresh run. `discover` writes its own diagnostic cache; `sync` maintains a resumable, timestamped run under `.course-import/<term>/`.

`sync` never writes production. It uses three workers, request starts spaced at least 300 ms apart globally, 20-second timeouts and three attempts maximum for timeouts, interrupted networks, 429 and 5xx. Permanent errors are not retried. Each completed outline and subject is cached. Restart the same command to resume. `--force` intentionally starts a new run; do not reuse weeks-old discovery for a fresh enrollment snapshot.

Inspect `.course-import/<term>/report.json` and the candidate manifest. Review unavailable outlines and any unusually large removals. Publishing rejects incomplete or malformed terms and missing/extra subject files. Immutable files go to `public/data/courses/<term>/snapshots/<run>/`; the manifest is replaced last using a same-directory atomic rename. Production remains pointed at its old version if staging fails. GitHub Pages deploys the entire tested artifact atomically. Older immutable versions may be archived through a reviewed change once no longer needed; retain the immediately previous deployed version for in-flight clients.

## Schema and completeness

Each numeric term directory has `manifest.json`, `subjects.json`, and versioned subject files plus a compact all-subject index. The manifest records discovered subjects, source/normalized section totals, course totals, schedule/enrollment/enrichment counts, timestamps, failed subjects and missing outlines. `complete=true` requires every discovered subject to succeed and exact source-total equality. Enrollment counts above capacity are valid source evidence and reported, not clamped. No seat predictions are generated.

The compact index omits long descriptions, registrar notes, prerequisites and corequisites. Subject details are fetched and validated when requested or selected. The homepage does not load course data. All selections remain memory-only.

`courseTypes.ts` retains V1 `term` and `department` names for a careful migration and adds `termCode`, `instructors`, `enrollment`, `source`, `snapshotAt`, `outlineRetrievedAt`, and optional official detail fields. `lastUpdated` is legacy-only. Canonical campus values are Burnaby, Surrey, Vancouver, Online and Other; unknown is absent. Harbour Centre and other named Vancouver sites normalize to Vancouver.

The legacy `courses:import` command remains an outline-only diagnostic, not a publication pipeline. The V1 folders and regression fixtures preserve historical evidence. Never copy those directly into a CourSys manifest or union outline-only sections into claimed CourSys coverage.

## Automation and recovery

The daily/manual `course-data-sync.yml` reuses one data branch/PR, merges main without rewriting history, runs the complete import and all quality gates, and opens a reviewed PR. It never merges itself or changes verification dates for resources. GitHub's repository setting must allow Actions to create pull requests; no personal token is needed or stored. Failed job artifacts contain public import caches/reports for resuming and fictional browser diagnostics, retained seven days.

GitHub combines PR creation and review approval in one repository permission setting. The workflow uses creation only and contains no approve/merge step. If repository policy leaves that setting disabled, PR creation will fail visibly and the job retains its public candidate artifacts; a maintainer must authorize the setting before unattended PR creation can work. GitHub may also require a maintainer to approve running checks for a PR created with `GITHUB_TOKEN`; the refresh job already runs all quality gates before opening it.

Unit tests use public-shaped sanitized fixtures. `npm run courses:sync:all -- --force` is the explicit live integration command. `courses:validate`, `courses:report` and ordinary tests require no SFU network.
