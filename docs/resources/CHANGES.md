# Resource Hub completion changes

Baseline: main `1f27e37`, 32 public resource cards, 218 passing unit tests and successful production build, recorded 2026-10-04.

Milestone `d297fd4` (pushed): compatible version-2 directory schema; separate factual review, freshness and lifecycle; source evidence and publication validation. 224 tests, lint and build passed.

Milestone `2185e6e` (pushed): 183 canonical resources across all 20 topics; 161 source-reviewed and 22 partial. Twenty-five existing canonical records updated, 158 new, seven fragmented deadline records merged, zero retired services. Net change is +151. English/Mandarin search, audience/online filters, structured access/conditions, qualified editable poster content and bounded read-only maintenance tooling are integrated. `npm test`: 237 passed; strict resource validation: zero errors; lint, TypeScript/production build and existing course-data validation passed.

No technology-stack migration, login, backend, course-offering copy, analytics, or recipient storage was introduced. Existing Course Planner resource objects remain compatible with the extended resource type.

Independent comparisons covered 143 records, including all 100 high-impact entries. The unsupported Bennett floor guide was removed; source conflicts and missing schedules remain explicit. Full topic/campus/audience accounting is in [COVERAGE](COVERAGE.md), factual outcomes in [VERIFICATION](VERIFICATION.md), and maintenance commands in [MAINTENANCE](MAINTENANCE.md).

Final local acceptance on 2026-10-04:

| Command / check                                                          | Result                                                                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `npm test`                                                               | **241 passed**, 17 files                                                                                         |
| `npm run resources:validate`                                             | **183 records, 0 errors**, 22 honest partial-review maintenance notices                                          |
| `npm run resources:report -- --output .resource-reports/coverage.json`   | Coverage/applicability/evidence report generated                                                                 |
| `npm run resources:links -- --output .resource-reports/links-final.json` | **226 URLs: 212 reachable, 2 redirects, 12 blocked, 0 invalid**; completed 2026-10-04T16:15:32.732Z              |
| `npm run lint`                                                           | Passed                                                                                                           |
| `npm run build`                                                          | TypeScript and production build passed; Vite warns about the approximately 530 kB initial JS chunk (150 kB gzip) |
| `npm run courses:validate`                                               | Both existing complete course datasets passed; no course records changed                                         |
| `npm run verify:resources -- --offline`                                  | Legacy validator passed                                                                                          |
| `npm run test:e2e`                                                       | **59 passed** in 56.1 seconds on Microsoft Edge after updating assertions for the new resource labels            |
| `git diff --check`                                                       | Passed                                                                                                           |

The first full browser run found two outdated assertions for the new Computing ID poster title and provenance label; those were corrected and the complete suite rerun. The separate code review found and fixed filtered-schedule membership loss, date-range closing-date recommendations, response-body timeout isolation, and missing validation of published cost/date/poster evidence. A visual review also fixed stale editor clipping feedback after text was shortened. These cases have regression tests.

Browser coverage includes existing Course Planner, all 15 templates plus Blank, accessibility/keyboard, explicit draft consent, exports and responsive routes, plus the new 1440×900, 768×1024 and 390×844 resource flows. A library + writing-support + fee-deadline poster was exported to actual PNG and PDF; both were opened (PDF rendered with Poppler) and inspected with all conditions retained and no clipping. See [screenshots and detailed UI review](../ui-review/resource-hub/README.md).

Known source failures are not hidden: the initial audit found the obsolete Linguistics URL and it was removed from published source links while its 404 finding remains in the research backlog. Twelve URLs were blocked during the final link pass; this does not change the source-review status. Both redirects lead to relevant official SFU pages and were inspected. No link audit updates verification dates.

Delivery uses a PR titled **Resource Hub: Comprehensive SFU student resources** into `main`. The GitHub Actions build runs lint, unit/data validation, production build and the full browser suite before Pages deployment. Merge and production verification are reported in the PR and final delivery message after those external steps succeed; local acceptance is not presented as deployment evidence.
