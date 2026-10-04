# SFU Peer Mentor Hub

[Live site](https://errold727.github.io/SFU-Peer-Mentor-Hub/) · [Repository](https://github.com/errold727/SFU-Peer-Mentor-Hub) · [Actions](https://github.com/errold727/SFU-Peer-Mentor-Hub/actions)

A peer-created tool for SFU Peer Mentors. **Find → Select → Create**: find public SFU information, collect resources, and create editable posters or neutral course comparisons. This is not an official Simon Fraser University website or a replacement for official advice.

## What the hub does

- **Resource Hub:** 183 canonical resources across 20 topic groups, English/Mandarin aliases, category/campus/audience/term filters, detailed access and eligibility, exact source evidence, and Vancouver-aware dates. Source review, freshness and expiry are separate. The delivery contains 161 source-reviewed and 22 partially reviewed records; 143 received a separate comparison, including all 100 high-impact entries. Counts describe the published wording, not a guarantee that every linked service detail is confirmed. See [coverage and specific gaps](docs/resources/COVERAGE.md).
- **Poster Basket:** add, deduplicate, remove, clear, and reuse public facts directly as editable poster text, with concise poster bodies and optional official-source QR codes. Full details and copied text retain source URLs and verification metadata.
- **Poster Maker:** start with a blank canvas (five sizes/five styles) or one of 15 editable designs reconstructed from the supplied reference pack. The gallery offers 16 choices including Blank Poster, with lightweight previews of the actual layouts. Newsletter, orientation, planning, library, playful essentials, dark event, timeline, wellbeing, recreation, safety, academic and international designs use independent sections. Sections support selection, drag/arrow reorder, duplicate, hide, delete and undo/redo. Contextual text/icon controls, replaceable local images, real tables/checklists/lists, dynamic QR codes, Resource Hub replacement and course/enrollment-table insertion keep content editable. Auto Arrange measures text and reserves headers, footers, margins and locked objects. Poster Quality flags layout, readability, image and QR issues. See [the complete template mapping and validation status](docs/TEMPLATE_PACK.md).
- **Optional local drafts:** explicit Save locally, Open, Duplicate and Delete. No autosave or automatic restore. Recipient fields require a separate opt-in. Storage is browser-local with a visible usage indicator.
- **Exports:** standard, 2x and print PNG; PDF with matching page bounds. Hidden content, guides and selection handles are excluded. Letter print PNG is 2550 × 3300; Letter PDF is 612 × 792 points. PDF is a rendered visual, not an editable document or hidden student JSON.
- **Course Planner:** dynamically discovered CourSys offerings for Fall 2026 (1267) and Spring 2027 (1271), across every subject returned for each term. All Subjects browsing, grouped sections, search by code/title/instructor/section/campus, filters, lazy details, temporary cross-subject selections, weekly meetings and deterministic conflicts. Counts, snapshot times and enrichment gaps are published in [COURSE_DATA_STATUS](docs/COURSE_DATA_STATUS.md). No course ranking or demand prediction.
- **Responsive routes:** Home, Resources, Poster Maker, Template Gallery, Course Planner and About. Hash URLs support refresh on GitHub Pages. Keyboard alternatives, focus containment/restoration, reduced motion and explicit form labels support accessibility.

## Privacy architecture

There is **no backend, login, analytics, mentee database, student profile, mentor/mentee assignment, communication history or central recipient storage**.

The three Zustand stores are memory-only. Course section selections survive internal navigation and remain separate by term; a full refresh clears them along with the active basket, editor, uploaded images and recipient field. Recipient placeholders resolve only for rendering. The editor makes no third-party requests: QR images are generated locally and image uploads become local data URLs. Planning choices are never written into storage, shared URLs or network requests.

`src/poster/drafts.ts` is the only persistence boundary. It writes only after explicit Save locally or Duplicate actions. The recipient field is excluded by default; checking the personalized-draft option explicitly includes it. All manually entered poster text, hidden layers and images are part of an intentionally saved draft, so review them on shared devices. Drafts are never restored automatically and can be individually or entirely deleted. They are not encrypted, synced or backed up; browser data clearing removes them. Storage is limited to 20 drafts and approximately 4 million serialized characters, subject to browser quota. Invalid/remote-image draft payloads are rejected.

PNG/PDF downloads contain the visible text the user chose. A recipient name may appear in the local filename and pixels. There is no embedded editable poster model, hidden recipient JSON or custom personal metadata. GitHub serves static assets and may retain ordinary hosting logs; this app never sends editor content or recipient names to GitHub.

## Local development and checks

Use Node 24 and npm. The Resource Hub implementation branch is `codex/resource-hub-completion`; `main` is the deployed branch. Resource delivery evidence is tracked in [CHANGES](docs/resources/CHANGES.md); prior template evidence remains in [TEMPLATE_PACK](docs/TEMPLATE_PACK.md#validation-and-release-status).

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run test:e2e
npm run courses:validate
npm run verify:resources -- --offline
npm run resources:validate
npm run resources:report
npm run resources:links -- --output .resource-reports/links.json
npm run preview
```

Vite normally serves `http://127.0.0.1:5173/SFU-Peer-Mentor-Hub/`. The browser suite builds a production preview on port 4173. Windows uses installed Microsoft Edge; CI uses Playwright Chromium (`npx playwright install --with-deps chromium`). Set `PLAYWRIGHT_BASE_URL` to test production or another running deployment. Screenshots/downloads use fictional test content and live under ignored `test-results/`. Restricted Windows runners may need process permissions for browser/server cleanup.

`npm run format` runs Prettier. TypeScript checks source, maintenance scripts and browser tests. Unit/integration tests exercise real behavior, normalization failures, source reliability, schedule conflicts, layout geometry, draft consent and privacy boundaries. The template-pack tests validate all 15 references, unique IDs, preview metadata, editable structures, image-region limits, dynamic QR destinations and resource/course integration. Browser validation covers responsive routes, axe WCAG checks, keyboard dialogs, recovery from malformed course data, basket-to-poster use, template editing and actual downloaded PNG/PDF bytes. Print export tests decode the QR from exported pixels. See the pack document for the current run results; implementation does not imply completed release verification.

Regenerate static poster previews after changing template, renderer or scene-asset source. Start `npm run dev -- --port 5177`, then run `npm run posters:previews` in another terminal. The default target is `http://127.0.0.1:5177/SFU-Peer-Mentor-Hub/`; `PLAYWRIGHT_BASE_URL` can select another running local app. The generator captures the actual editor and records a source hash manifest. See [preview maintenance](docs/TEMPLATE_PACK.md#implementation-and-preview-maintenance).

## Architecture and performance

React 19, TypeScript, Vite, HashRouter, Zustand, React-Konva, Lucide, jsPDF, QRCode, date-fns and Fuse.js. System fonts, editable textual branding and small generated campus illustrations; no official SFU logo or restricted font bundled. Generated scenes are generic university settings, not verified photographs of SFU locations or people.

```text
src/app/                      Shell, routing and error recovery
src/pages/                    Route-level views, including poster start/gallery/editor
src/components/               Resource cards, basket and accessible dialogs
src/data/resources/           Public facts and official source metadata
src/store/                    Ephemeral course planning, editor and basket stores
src/poster/                   Canvas, layout, quality, styles, drafts and exports
src/poster/templates/         Fifteen structured template configurations and registry
src/course/                   Types, validation, comparisons, timetable and conflicts
src/utils/                    Vancouver dates, search, verification and link health
src/tests/                    Unit and integration tests
public/data/courses/           Static normalized snapshots per term/department
public/assets/poster-scenes/  Reusable text-free illustrative images
public/assets/template-previews/ Static WebP gallery thumbnails and source manifest
scripts/course-import/        Public API importer and dataset validator
scripts/verify-resources.ts   Read-only metadata / link report
scripts/generate-template-previews.ts Browser-based preview generation
 e2e/                         Browser flows, exports, accessibility and privacy
.github/workflows/            Gated deployment and monthly resource health
 docs/                        Audit evidence and maintenance/release notes
```

Poster Maker, Course Planner and Template Gallery load lazily. PDF dependencies load on PDF export. No course datasets are bundled in the initial application; the browser loads a term manifest and compact all-subject index or individual subject snapshot. Long descriptions, prerequisite text and registrar notes load on detail/selection. New requests abort stale fetches, search/sort is memoized, and results render 12 course groups at a time. Poster measurements are memoized by document/name rather than selection. Gallery previews are lazy 408 × 528 WebP images generated from the real canvas; the gallery does not mount 15 interactive Konva editors. Three compressed, reusable scene assets supply the templates. Image decoding is keyed by source; local uploads are limited to 10 MB, normalized to at most 2400 px per edge, and temporary object URLs are revoked. Original full-resolution reference posters remain outside the production assets and bundle. No remote font downloads are used.

## Resource maintenance

`DirectoryResource` extends the compatible `SFUResource` shape with provider, campus/audience applicability, access/eligibility, cost, sources, field-level evidence, structured sessions/dates, lifecycle, review targets and concise qualified poster content. Twenty-five existing canonical IDs remain; seven fragmented deadline IDs resolve to their consolidated procedures. Existing editor documents and Course Planner resources remain compatible.

Read the actual primary source before changing any claim. Record retrieval separately from content review; partial records have no `lastVerified` date. Review targets are seven days for schedules, fourteen for sensitive/term information, thirty for safety and 180 for evergreen services. These are internal maintenance targets. High-impact claims and precise costs/contacts/dates receive separate review. See [VERIFICATION](docs/resources/VERIFICATION.md) and [MAINTENANCE](docs/resources/MAINTENANCE.md).

`resources:validate` checks the publication gates; `resources:report` reports coverage and review gaps; `resources:links` performs bounded, deduplicated GET checks without changing facts or review dates. Candidate JSON can be validated with `--input`; it cannot overwrite the published catalog. The monthly read-only workflow saves reports as Actions artifacts. A blocked page or failed request is not evidence of discontinuation.

Unsupported Bennett floor/collection claims were removed. Accessible SFU campus/referral pages support retained navigation and confirmed study spaces; protected Library details remain partial. Other conflicts and unpublished schedules are listed in [COVERAGE](docs/resources/COVERAGE.md). The [earlier 32-record audit](docs/resource-audit.md) is historical evidence, superseded for the current directory by these reports.

## Course data import and schema

CourSys determines the offering universe. The public endpoint uses DataTables GET parameters including `tabledata=yes`, `semester[]=1267` (Fall) or `semester[]=1271` (Spring), deterministic ordering and pages capped at 500. URL hash filters are only browser state. Public source code documents this interface; no login, private credentials or student records are used.

`npm run courses:sync:all` stages a complete import with three workers, a global 300 ms request-start interval, 20-second timeouts and at most three attempts for transient errors. Successful discovery pages, outlines and subject results are cached for resuming. `--force` starts a fresh sync run. Missing outlines retain the CourSys offering and an empty schedule rather than deleting it.

Review the candidates and reports under ignored `.course-import/1267/` and `.course-import/1271/`. Then run `npm run courses:publish -- all`, `npm run courses:validate` and `npm run courses:report`. Promotion validates source totals, every discovered subject, identities, schedules, enrollment and index consistency before writing immutable snapshot files and atomically replacing each term manifest. Failed imports preserve the previous published pointer. No command writes to GitHub automatically.

Schema version 2 retains existing code/department/term identities and adds termCode, instructors, provenance, snapshotAt, optional outlineRetrievedAt, delivery, units, designation, class number, description, corequisites, crosslisting and enrollment counts. Missing fields remain absent. CourSys counts may legitimately exceed capacity; preserve and report that evidence. Snapshot/retrieval time never claims SFU updated a record then.

Conflicts require the same term, overlapping time intervals and a shared teaching weekday within overlapping date ranges where published. Multiple blocks are checked. Adjacent classes do not overlap, and missing schedules are not assumed asynchronous. Confirm all required registration components through SFU.

The prior V1 datasets remain under their original named term folders as historical migration evidence and offline regression fixtures. The application exclusively reads the numeric-term manifests; no handwritten subject list remains. V1 may list outline-only tutorial components that CourSys does not index; these are not silently relabeled as CourSys offerings. See [pipeline instructions](scripts/course-import/README.md) and [generated coverage report](docs/COURSE_DATA_STATUS.md).

## Poster development

Template configurations live in `src/poster/templates/packFirst.ts`, `packSecond.ts` and `packThird.ts`; `index.ts` registers the 15 designs plus Blank Poster. Shared section types/construction live in `packTypes.ts`, styles in `src/poster/styles.ts`, and logical sizes/types in `src/poster/posterTypes.ts`. Use `makeBlock` for structured sections and `makeElement` for low-level primitives. Keep factual content in editable fields, not in images. The optional placeholder is `{{recipientName}}`, displayed as Student Name when empty. Old primitive drafts remain supported. Template changes are undoable.

Each user-supplied PNG has a mapped template with separately editable image, title, card, table/list/checklist and footer sections as appropriate. The PNGs are visual references, never full-page canvas backgrounds. Originals are ignored under `docs/template-references/originals/`; optimized review copies, hashes and generated-image provenance are tracked under `docs/template-references/`. Defaults are neutral prompts or sample content, not verified SFU facts. See [the 15-template inventory and section lists](docs/TEMPLATE_PACK.md#template-capabilities).

Start at `#/poster`, choose blank setup or `#/poster/templates`, and edit at `#/poster/edit`. Adding basket resources is explicit, so blank canvases and templates are not silently populated. Resource replacement retains official provenance while allowing display edits. Course selections can populate individual or multiple cards, an offering table, an enrollment snapshot or a conflict notice. Recorded enrollment is never presented as guaranteed current availability. QR codes are generated locally from editable URLs; default homepage links should be replaced before sharing.

Auto Arrange measures block text, reserves visible header/footer areas, ignores hidden sections and avoids locked objects. It rebalances content sections while maintaining readable gutters and font sizes. Dense content retains its wording and produces quality warnings. Grow to fit text can extend beyond the page, which the quality panel flags. Visual/print review remains necessary, especially for rotated or image-backed content. See [template-pack controls and validation](docs/TEMPLATE_PACK.md) and [the earlier V2 architecture notes](docs/POSTER_MAKER_V2.md).

Canvas zoom uses Fit/150/200/300% of fit and a scrollable viewport. Layers and the inspector provide a keyboard alternative to dragging. Arrows move 1 px, Shift+Arrow 10 px, Delete removes unlocked elements, Ctrl/Cmd+Z undoes, and Shift+Ctrl/Cmd+Z redoes. PNG/PDF are flattened final output; optional local drafts retain editing state.

## CI/CD and release

Vite base: `/SFU-Peer-Mentor-Hub/`. GitHub Pages source: **GitHub Actions**. `deploy.yml` runs on main, codex/phase0, codex/v1, codex/course-offerings-v2, codex/ui-density-polish, codex/poster-maker-v2, codex/import-poster-template-pack, the data maintenance branch and PRs into main. Gates are npm ci, lint, unit/integration tests, normalized course validation, offline resource metadata validation, production build and browser tests. Failed browser diagnostics are retained for seven days. Only a passing main run deploys dist using the official Pages artifact/deployment actions. PRs never deploy. No personal token is committed.

The monthly read-only `resource-health.yml` reports public resource links and data schema health. It never creates commits, updates verification dates or posts issues. Bot blocks/timeouts remain non-failing review states; genuine malformed/dead sources require maintainer review.

The daily/manual `course-data-sync.yml` stages both terms, validates, generates the coverage report, runs tests/lint/build/browser checks, and updates one `data/course-offerings-sync` PR without force-pushing or auto-merging. GitHub must allow Actions to create pull requests. Failed imports and browser diagnostics are retained for seven days.

The course browser's separate JavaScript chunk is about 9.2 KB gzip. The October 4 snapshots' all-subject indexes are 189 KiB (Fall) and 162 KiB (Spring) gzip; full details remain lazy. A local Node 24 benchmark of 100 mixed searches over each complete index measured about 1 ms median and 9–10 ms at the 95th percentile for filtering and sorting; these are development-machine measurements, not a guarantee for every device. Browser tests check that the homepage requests no course JSON and results are paginated.

Release process: push the tested development branch, open a PR, wait for checks, merge without rewriting history, wait for Pages, run production browser checks and inspect real routes/features. Only then create and push `v1.0.0` at the deployed main commit. Package version was already 1.0.0 in the original scaffold and is retained for the first tagged release.

## Known limitations and next work

- Four official Library sources remain inaccessible to automated verification; obtain a current human-verified guide before changing their null dates.
- CourSys is a snapshot of its public index, not a complete registration-validity engine. Cancelled/locally merged offerings and some tutorial/lab components are outside that index. Missing outlines and schedules remain visible; see the generated report. No live seat guarantee or demand prediction.
- One page per poster. Dense factual content may require fewer cards, a larger format or separate posters. Quality checks are conservative geometry/text checks and cannot guarantee contrast over arbitrary images or printed legibility.
- Local drafts are explicit browser storage, not encrypted or backed up. No cross-device sync or editable PDF. Private-browsing/storage limits may prevent saving.
- Automated accessibility and keyboard checks supplement, but do not replace, testing with screen-reader and other assistive-technology users.
