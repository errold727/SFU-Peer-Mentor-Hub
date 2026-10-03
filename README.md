# SFU Peer Mentor Hub — V1

[Live site](https://errold727.github.io/SFU-Peer-Mentor-Hub/) · [Repository](https://github.com/errold727/SFU-Peer-Mentor-Hub) · [Actions](https://github.com/errold727/SFU-Peer-Mentor-Hub/actions)

A peer-created tool for SFU Peer Mentors. **Find → Select → Create**: find public SFU information, collect resources, and create editable posters or neutral course comparisons. This is not an official Simon Fraser University website or a replacement for official advice.

## What V1 does

- **Resource Hub:** 32 sourced resources, useful search aliases, category/campus/term filters, details, copy, Vancouver-aware deadlines, and sport/day recreation filtering. Cards distinguish Verified, Review Soon, Review Recommended / Stale, and Unverified. Printing is included; international topics link directly to their official guidance.
- **Poster Basket:** add, deduplicate, remove, clear, and reuse public facts directly as editable poster text, including source URLs and verification notes.
- **Poster Maker:** eight editable templates and five optional styles; temporary recipient personalization; text, image, shape, icon, resource, QR, divider and footer elements; pointer and keyboard editing; layers, hide/lock, undo/redo, snapping, alignment, typography and borders. Auto Arrange reserves margins/header/footer and avoids existing content. Body text is never automatically reduced below 16 px. Poster Quality detects overflow, overlap, small text, low contrast, empty content, placeholders, density and edge problems. Grow to fit text and Fit text safely address overflow.
- **Optional local drafts:** explicit Save locally, Open, Duplicate and Delete. No autosave or automatic restore. Recipient fields require a separate opt-in. Storage is browser-local with a visible usage indicator.
- **Exports:** standard, 2x and print PNG; PDF with matching page bounds. Hidden content, guides and selection handles are excluded. Letter print PNG is 2550 × 3300; Letter PDF is 612 × 792 points. PDF is a rendered visual, not an editable document or hidden student JSON.
- **Course Planner:** 1,628 published undergraduate sections across CMPT, ENGL, ECON, LING, CRIM, PSYC, POL and ARCH, for Fall 2026 and Spring 2027. Search by code/title/instructor/section, sort, filter section types, browse result pages, inspect details/prerequisites, compare across terms, show weekly meetings, identify precise conflicts, clear selections and add courses to posters. No course ranking or demand prediction.
- **Responsive routes:** Home, Resources, Poster Maker, Template Gallery, Course Planner and About. Hash URLs support refresh on GitHub Pages. Keyboard alternatives, focus containment/restoration, reduced motion and explicit form labels support accessibility.

## Privacy architecture

There is **no backend, login, analytics, mentee database, student profile, mentor/mentee assignment, communication history or central recipient storage**.

The two Zustand stores are memory-only. A full refresh clears the active basket, editor, uploaded images and recipient field. Recipient placeholders resolve only for rendering. The editor makes no third-party requests: QR images are generated locally and image uploads become local data URLs.

`src/poster/drafts.ts` is the only persistence boundary. It writes only after explicit Save locally or Duplicate actions. The recipient field is excluded by default; checking the personalized-draft option explicitly includes it. All manually entered poster text, hidden layers and images are part of an intentionally saved draft, so review them on shared devices. Drafts are never restored automatically and can be individually or entirely deleted. They are not encrypted, synced or backed up; browser data clearing removes them. Storage is limited to 20 drafts and approximately 4 million serialized characters, subject to browser quota. Invalid/remote-image draft payloads are rejected.

PNG/PDF downloads contain the visible text the user chose. A recipient name may appear in the local filename and pixels. There is no embedded editable poster model, hidden recipient JSON or custom personal metadata. GitHub serves static assets and may retain ordinary hosting logs; this app never sends editor content or recipient names to GitHub.

## Local development and checks

Use Node 24 and npm. V1 development uses `codex/v1`; `main` is the deployed branch.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run test:e2e
npm run courses:validate
npm run verify:resources -- --offline
npm run verify:resources
npm run preview
```

Vite normally serves `http://127.0.0.1:5173/SFU-Peer-Mentor-Hub/`. The browser suite builds a production preview on port 4173. Windows uses installed Microsoft Edge; CI uses Playwright Chromium (`npx playwright install --with-deps chromium`). Set `PLAYWRIGHT_BASE_URL` to test production or another running deployment. Screenshots/downloads use fictional test content and live under ignored `test-results/`. Restricted Windows runners may need process permissions for browser/server cleanup.

`npm run format` runs Prettier. TypeScript checks source, maintenance scripts and browser tests. Unit/integration tests exercise real behavior, normalization failures, source reliability, schedule conflicts, layout geometry, draft consent and privacy boundaries. Browser tests check all routes at 375/390/768/1024/1440 px, axe WCAG checks, keyboard dialogs, recovery from malformed course data, basket-to-poster use, all eight templates, editing and actual downloaded PNG/PDF bytes. Print export tests decode the QR from exported pixels.

## Architecture and performance

React 19, TypeScript, Vite, HashRouter, Zustand, React-Konva, Lucide, jsPDF, QRCode, date-fns and Fuse.js. System fonts; original SFU-inspired geometry; no official SFU logo or restricted font bundled.

```text
src/app/                      Shell, routing and error recovery
src/pages/                    Six route-level views
src/components/               Resource cards, basket and accessible dialogs
src/data/resources/           Public facts and official source metadata
src/store/                    Ephemeral editor and basket stores
src/poster/                   Canvas, layout, quality, styles, drafts and exports
src/course/                   Types, validation, comparisons, timetable and conflicts
src/utils/                    Vancouver dates, search, verification and link health
src/tests/                    Unit and integration tests
public/data/courses/           Static normalized snapshots per term/department
scripts/course-import/        Public API importer and dataset validator
scripts/verify-resources.ts   Read-only metadata / link report
 e2e/                         Browser flows, exports, accessibility and privacy
.github/workflows/            Gated deployment and monthly resource health
 docs/                        Audit evidence and maintenance/release notes
```

Poster Maker, Course Planner and Template Gallery load lazily. PDF dependencies load on PDF export. No course datasets are bundled in the initial application; only the selected term/department JSON is fetched. New requests abort stale fetches, search/sort is memoized, and results render 20 sections at a time. Poster measurements are memoized by document/name rather than selection. Production initial app JavaScript is roughly 114 KB gzip including shared React code; Poster Maker is about 120 KB gzip on demand. PDF chunks are larger but stay out of initial navigation. No large stock images or font downloads are used.

## Resource maintenance

`SFUResource` contains ID, title, category, summary, optional facts, campus, optional term/date/expiry, official source label/URL, lastVerified, tags and poster compatibility.

1. Read the official source and check its term, campus, dates and qualifications. Do not infer facts.
2. Update `src/data/resources/` with a precise URL and actual verification date. Use `lastVerified: null` and a verificationNote if content cannot be confirmed.
3. Keep factual text editable. Set date for deadlines and validUntil for expiring schedules. Review aliases in `src/utils/search.ts` when adding common terminology.
4. Run resource validation, relevant tests and the build. Review the diff, commit and push a PR.

Verification ages use America/Vancouver: under 90 days Verified, 90–180 Review Soon, over 180 Stale. Missing, invalid or future dates are Unverified. Past deadlines remain searchable but never appear as upcoming. Expired recreation schedules warn users.

`npm run verify:resources` checks metadata and each unique URL with GET. It distinguishes reachable, redirect, blocked, unverified and invalid. An HTTP 200 bot challenge is blocked, not verified content. Timeouts, 403 and 429 do not imply a dead link and do not fail the command. Malformed metadata and HTTP 404/410 fail it. Shared sources are reported separately from duplicate resource IDs. The command never changes lastVerified.

See [the resource audit](docs/resource-audit.md). Four Library cards remain unverified: Bennett floor guide, Student Learning Commons, Writing Support and Research Help. Direct retrieval, official search and an ordinary browser visit did not resolve Library access restrictions. The user-supplied Bennett guide remains clearly attributed and unverified; it is not silently certified.

## Course data import and schema

Run `npm run courses:import -- 2027-spring ENGL`. This reads the public SFU Course Outlines JSON API and writes candidates only to ignored `.course-import/`. It never edits published data. Inspect the candidate and its adjacent review report, run `npm run courses:validate -- .course-import`, compare official outlines and the Git diff, then copy approved JSON to `public/data/courses/`. Run validation, tests, build and browser checks before committing. All nine original offerings were retained in V1.

See [importer instructions](scripts/course-import/README.md) and [V1 review records](docs/course-data-review.json). The latter documents omitted sources; a missing API schedule or unavailable course directory is not filled in from assumptions.

Schema version 1 contains lastVerified, a scope note and course records. Identity is term/department/courseNumber/code/section. Each meeting has canonical days, integer start/end minutes, matching display times and optional teaching dates/kind/location. Optional fields include instructor, campus, prerequisite text, section type, associated group, source URLs and seats. Unavailable values remain absent. An empty schedule is not described as asynchronous; partially unavailable schedules show a warning. Exams are excluded from weekly class conflicts.

Conflicts require the same term, a shared day and `a.start < b.end && b.start < a.end`, with teaching-date overlap when known. Any lecture/tutorial/lab meeting block can cause a conflict. Back-to-back meetings do not overlap; the app does not estimate travel time. Associated groups are official metadata, not a registration-validity engine. Confirm all required components in official outlines and goSFU. Empty prerequisite text never means no prerequisites. The source does not supply seat/waitlist availability.

To add a department or term: import and review its data first, register it in `src/course/courseTypes.ts`, publish validated files for each available selector combination, then test. A future scheduled importer should open reviewable data PRs with bounded retries and caching; V1 does not schedule data imports or claim live data.

## Poster development

Templates live in `src/poster/templates/index.ts`, styles in `src/poster/styles.ts`, and logical sizes/types in `src/poster/posterTypes.ts`. Maintain the eight established template purposes. Create elements with makeElement and keep facts as editable text, not in images. The optional placeholder is `{{recipientName}}`. Template changes are undoable.

Auto Arrange chooses a readable grid in the largest available area, respects visible locked objects and reserves header/footer space. It supports 1/2/3/4/5+ cards. Dense cards keep complete text and show warnings instead of shrinking below 16 px. Welcome/event body content may occupy the available area; move it or choose a resource template. Grow to fit text can extend a card beyond the page, which the quality panel then flags. Visual/print review is still necessary, especially for rotated or image-backed content.

Canvas zoom uses Fit/150/200/300% of fit and a scrollable viewport. Layers and the inspector provide a keyboard alternative to dragging. Arrows move 1 px, Shift+Arrow 10 px, Delete removes unlocked elements, Ctrl/Cmd+Z undoes, and Shift+Ctrl/Cmd+Z redoes. PNG/PDF are flattened final output; optional local drafts retain editing state.

## CI/CD and release

Vite base: `/SFU-Peer-Mentor-Hub/`. GitHub Pages source: **GitHub Actions**. `deploy.yml` runs on main, codex/phase0, codex/v1 and PRs into main. Gates are npm ci, lint, unit/integration tests, normalized course validation, offline resource metadata validation, production build and browser tests. Failed browser diagnostics are retained for seven days. Only a passing main run deploys dist using the official Pages artifact/deployment actions. PRs never deploy. No personal token is committed.

The monthly read-only `resource-health.yml` reports public resource links and data schema health. It never creates commits, updates verification dates or posts issues. Bot blocks/timeouts remain non-failing review states; genuine malformed/dead sources require maintainer review.

Release process: push the tested development branch, open a PR, wait for checks, merge without rewriting history, wait for Pages, run production browser checks and inspect real routes/features. Only then create and push `v1.0.0` at the deployed main commit. Package version was already 1.0.0 in the original scaffold and is retained for the first tagged release.

## Known limitations and next work

- Four official Library sources remain inaccessible to automated verification; obtain a current human-verified guide before changing their null dates.
- Course snapshots can change, omit rejected/unavailable records and cover only the listed departments/terms and published undergraduate sections. Seats, live registration and automatic combination validation are unavailable. Maintain reviewed refreshes; do not predict demand.
- One page per poster. Dense factual content may require fewer cards, a larger format or separate posters. Quality checks are conservative geometry/text checks and cannot guarantee contrast over arbitrary images or printed legibility.
- Local drafts are explicit browser storage, not encrypted or backed up. No cross-device sync or editable PDF. Private-browsing/storage limits may prevent saving.
- Automated accessibility and keyboard checks supplement, but do not replace, testing with screen-reader and other assistive-technology users.
