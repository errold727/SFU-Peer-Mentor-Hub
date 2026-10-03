# SFU Peer Mentor Hub

[Live site](https://errold727.github.io/SFU-Peer-Mentor-Hub/) · [Repository](https://github.com/errold727/SFU-Peer-Mentor-Hub) · [Build and deployment](https://github.com/errold727/SFU-Peer-Mentor-Hub/actions)

A peer-created, independent tool for SFU Peer Mentors. **Find → Select → Create**: find public SFU information, collect useful resources, and create editable posters or neutral course comparisons. This is not an official Simon Fraser University website.

## Product philosophy

Useful information comes first. Official sources stay attached to factual content. Missing facts remain unavailable, and verification dates describe an actual source check. This application helps mentors share information; it does not manage mentees or provide immigration advice.

## Phase 0 features

- **Resource Hub:** fuzzy title/summary/fact/tag search; category, campus and term filters; source details and verification status; Vancouver-aware deadlines; Bennett Library floor guide; safety, academic, international and student essentials; sport/day recreation filtering and compact poster content.
- **Poster Content Basket:** add, deduplicate, remove and clear public resources; take selected content directly into the editor.
- **Poster Maker:** eight editable templates; temporary recipient personalization; text, image, shape, icon, resource, QR, divider and footer elements; pointer/keyboard editing; move, resize, rotate, align, snap, duplicate, lock, hide, reorder, undo and redo. Typography, border, spacing and colour controls include contrast and text-clipping warnings.
- **Exports:** standard, 2x and print-resolution PNG; PDF with matching page dimensions. Hidden content, guides and transform handles are excluded. Letter print PNG is 2550 × 3300 pixels; Letter PDF is 612 × 792 points. Other formats preserve their aspect ratio.
- **Course Planner:** nine curated official offerings across ENGL, ECON and CMPT, Fall 2026 and Spring 2027. Course details, sourced prerequisites, cross-term comparisons, deterministic partial/complete timetable overlap detection and course-to-poster content.
- **Responsive navigation:** Home, Resources, Poster Maker, Template Gallery, Course Planner, About/Privacy/Sources. HashRouter supports direct links and refreshes on GitHub Pages.

## Privacy design

There is no backend, authentication, third-party analytics, database, student profile, mentor/mentee assignment, communication history or personal-note model.

Both Zustand stores are **memory-only**. Resource selections, uploaded images, edits and the optional recipient name are cleared by a full page refresh. No localStorage, sessionStorage or IndexedDB persistence is used. Names and images are never uploaded by this application. Recipient placeholders are resolved at rendering time.

Explicit PNG/PDF downloads contain the visible content the user chose to export. They contain no hidden student JSON or custom personal metadata. A recipient name may appear in the downloaded filename and visual content. Exported files are the user's responsibility to share appropriately. GitHub serves the static site and may maintain its ordinary hosting logs; the app does not send editor content to GitHub.

## Technology

React 19, TypeScript, Vite, React Router (HashRouter), Zustand, React-Konva/Konva, Lucide React, jsPDF, QRCode, date-fns, date-fns-tz and Fuse.js. Vitest, React Testing Library, Playwright, ESLint and Prettier support verification and maintenance. Fonts are system fonts. No official SFU logo or restricted font is bundled; `OfficialLogoSlot` remains unused pending an authorized asset.

## Local setup

Use Node 24 (see `.nvmrc`) and npm. Git history is maintained on `codex/phase0` during Phase 0.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/SFU-Peer-Mentor-Hub/`.

```sh
npm test             # Unit and React integration tests
npm run lint         # ESLint
npm run build        # TypeScript checks + production dist/
npm run preview      # Preview built files
npm run test:e2e     # Browser tests against a production preview
npm run format      # Prettier
```

The browser suite uses installed Microsoft Edge on Windows. In CI it uses Playwright Chromium (`npx playwright install --with-deps chromium`). Set `PLAYWRIGHT_BASE_URL` to test an already running or deployed site; otherwise the suite builds and starts its own preview on port 4173. Tests create only temporary example content and local downloads. Screenshots and reports in `test-results/` are ignored by Git. On restricted Windows runners, test-server cleanup may require permission to stop the server process.

## Project layout

```text
src/app/                       Routing and application shell
src/pages/                     Six route-level views
src/components/                Resource, layout and accessible UI pieces
src/data/resources/            Public SFU resources and source metadata
src/store/                     Ephemeral basket and editor stores
src/poster/                    Canvas, element types, templates, layout and export
src/course/                    Normalized types, validation, comparison and conflicts
src/utils/                     Vancouver dates, search and verification
src/tests/                     Unit and React integration tests
public/data/courses/            Static JSON snapshots by term/department
e2e/                           Browser workflow and export tests
scripts/course-import/         Future importer design
.github/workflows/deploy.yml   Gated test/build/deploy pipeline
```

## Resource model and maintenance

`SFUResource` in `src/data/resources/types.ts` includes a stable ID, title, category, summary, optional labelled facts, campus, optional term/date/expiry, source name/URL, `lastVerified`, tags and poster compatibility. `lastVerified` is an ISO date or **null when verification is incomplete**. `verificationNote` explains the limitation.

To add or update a resource:

1. Read an official SFU source. Check the relevant term, campus and scope. Do not infer unavailable facts.
2. Update the typed resource in `src/data/resources/`; keep the official URL, source label and actual verification date together. Use a precise, stable source where available.
3. Keep important facts as plain editable text. Set `date` for a dated item and `validUntil` for an expiring schedule.
4. Add a factual regression test for sensitive dates, phone numbers or structured data. Run tests/build, review, commit and push.

Verification is fresh under 90 days, reviewSoon from 90 through 180 days, and stale above 180 days. Unknown dates display Verification needed; aging dates display Review recommended. Dates and relative labels use America/Vancouver, including DST and UTC midnight boundaries. Home never recommends expired dates as upcoming.

The October 3, 2026 verification pass confirmed Fall deadlines and exam dates, the recreation schedule, safety and lost-and-found contacts, computing account information, student essentials, advising directories and curated course offerings. SFU Library blocked automated access: the specification's floor guide and Library support links remain explicitly **unverified**, with no fabricated check date. Confirm them through the linked Library pages before sharing. The floor guide's verification note is retained in copied/poster content.

## Poster templates and editor

Templates live in `src/poster/templates/index.ts`. Add a definition with a stable ID, title, subtitle and editable body; create its elements with `makeElement`. Coordinates are in logical canvas pixels. Supported sizes are Letter Portrait (816 × 1056 at 96 pixels/inch), Instagram Portrait (1080 × 1350), Square (1080 × 1080), Story (1080 × 1920), and Digital Screen (1920 × 1080).

Use `{{recipientName}}` for optional render-time personalization. Do not put names into resource data or the content basket. Template changes can be undone. Resource text retains facts, source URL and verification metadata. Uploaded backgrounds are decorative; deadlines, telephone numbers and course facts remain text elements.

Use **Fit resource cards** to arrange unlocked resource cards within the page. Check clipping and small-text warnings and the preview before exporting; fewer cards are often easier to read. The Layers list and numeric inspector provide keyboard-accessible alternatives to canvas dragging. Arrow keys move 1 pixel, Shift + Arrow moves 10, Delete removes unlocked elements, Ctrl/Cmd + Z undoes and Shift + Ctrl/Cmd + Z redoes.

PNG/PDF are final visual exports; the PDF embeds the rendered poster, rather than an editable document model. The live editor retains editable text until refresh. No project-save or recipient persistence feature is included.

## Course data and architecture

Course Planner loads only `public/data/courses/<year>-<term>/<department>.json` from this same static site. It does not make browser-side requests to SFU or scrape HTML. Each dataset declares schema version, verification date, limitations and normalized course records.

To add data:

1. Inspect the official course outline or published SFU endpoint. See [importer design](scripts/course-import/README.md) for the verified source pattern.
2. Create or update the normalized JSON file. Preserve course/section/term identity and source URLs. Keep absent instructor, campus, seat/waitlist and prerequisite fields absent.
3. Normalize meeting days to Mon–Sun and time intervals to integer minutes since midnight. Include all verified required components. Unknown schedules use an empty array and are not described as asynchronous.
4. Register any new term/department in `src/course/courseTypes.ts`. Run the dataset validator and tests. Add factual regression tests, review the diff, then commit.

Offering information (instructor, section, schedule, seats) is distinct from course requirements (the source's prerequisite text). An empty prerequisite source displays **Prerequisite information unavailable**. No prerequisites are inferred.

Conflict detection checks same term, shared day and `a.start < b.end && b.start < a.end`. It handles containment and partial overlap and allows back-to-back meetings. Optional non-overlapping teaching-date ranges prevent false conflicts. An absence of detected overlap is not a guarantee of a complete registration schedule.

The future importer will follow **Official SFU source → reviewed importer → validated JSON → Course Planner**. It should preserve last-known-good data on failures and open reviewable data PRs. No scheduled importer or live-seat claim is made in Phase 0.

## GitHub Actions and Pages

Vite's base is `/SFU-Peer-Mentor-Hub/`. Hash URLs such as `#/resources` and `#/course-planner` do not require server rewrites.

`deploy.yml` runs on pushes to `main` and `codex/phase0` and PRs into `main`. It checks out the repository, configures Node, runs `npm ci`, lint, all unit/integration tests, a production build and browser tests. Only a successful `main` run configures Pages, uploads `dist/` with the official Pages artifact action, and deploys with the official Pages deployment action. PRs and development pushes never deploy.

Repository Settings → Pages must use **GitHub Actions** as its source. The deployment job uses the `github-pages` environment with `pages: write` and `id-token: write`; the build job has read-only repository access. No personal access token is stored in the repository.

Expected production URL: <https://errold727.github.io/SFU-Peer-Mentor-Hub/>. Consult the linked Actions page for current deployment status.

## Verification coverage

The suite covers fuzzy resource search; category/campus/term filtering; deadline status, expiry and Vancouver DST; library floors and safety contacts; recreation sport/day filters; basket add/remove/deduplication; editable resource integration and temporary names; partial/complete/adjacent timetable intervals; cross-term comparison and missing prerequisites; dataset schema checks; hidden elements and selection-free export; no database dependencies or persistent stores; responsive navigation; pointer dragging/resizing; keyboard editing/lock/undo; actual PNG/PDF file signatures and dimensions; templates; and QR export.

## Known limitations and Phase 1 roadmap

- Course snapshots cover nine offerings, not every course or required tutorial/lab. Seat/waitlist fields are unavailable in the inspected source. Future offerings can change. Phase 1: expand verified coverage and add the reviewable importer.
- Library verification is incomplete because official pages blocked automated retrieval. Phase 1: obtain a human-verified floor guide and replace the null check dates.
- The editor has one page per poster. Dense resources can require smaller text, a larger canvas, or separate posters. Phase 1: richer multi-page layouts, better typographic presets and optional local-only project files.
- PNG/PDF exports are visual output. The app does not persist unsaved work or offer an editable PDF. Phase 1: consider an explicit local-file save format with clear privacy controls.
- Public source URLs and term information need ongoing human maintenance. Phase 1: source-review reminders and accessibility testing with assistive-technology users, without collecting student records.
