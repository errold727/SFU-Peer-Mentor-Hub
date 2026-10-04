# Editable poster template pack

The 15 supplied poster references have corresponding structured templates. The gallery contains **16 choices: these 15 designs plus Blank Poster**. Each design is a Letter canvas (816 × 1056 logical pixels) composed of independent editable sections. Existing overlapping templates were upgraded; the old `weekly` ID resolves to `newsletter` without adding a duplicate gallery entry. Existing saved documents retain their own content.

Implementation branch: `codex/import-poster-template-pack`. Local interaction, visual and export verification is complete; see the evidence below. The published routes are [Poster Maker](https://errold727.github.io/SFU-Peer-Mentor-Hub/#/poster) and [Template Gallery](https://errold727.github.io/SFU-Peer-Mentor-Hub/#/poster/templates). CI and production deployment outcomes are recorded in the associated pull request and GitHub Actions runs.

## Reference inventory

Source archive: `SFU_Peer_Mentor_Generic_Poster_Samples.zip`. It contains these 15 PNGs and `README.txt`:

| #   | Original filename                     | Corresponding template         |
| --- | ------------------------------------- | ------------------------------ |
| 01  | `01_weekly_checkin_newsletter.png`    | Weekly Check-In Newsletter     |
| 02  | `02_welcome_to_sfu_orientation.png`   | Welcome to SFU Orientation     |
| 03  | `03_course_planning_blue.png`         | Course Planning — Classic      |
| 04  | `04_library_guide_editorial.png`      | Library Guide — Editorial      |
| 05  | `05_student_essentials_playful.png`   | Student Essentials — Playful   |
| 06  | `06_workshop_event_dark.png`          | Workshop / Event — Dark        |
| 07  | `07_welcome_to_sfu_photo.png`         | Welcome to SFU — Campus        |
| 08  | `08_important_deadlines_timeline.png` | Important Deadlines — Timeline |
| 09  | `09_sfu_library_photo.png`            | SFU Library — Campus           |
| 10  | `10_student_wellbeing.png`            | Student Wellbeing              |
| 11  | `11_get_active_recreation.png`        | Get Active — Recreation        |
| 12  | `12_course_planning_photo.png`        | Course Planning — Campus       |
| 13  | `13_campus_safety.png`                | Campus Safety                  |
| 14  | `14_academic_success.png`             | Academic Success               |
| 15  | `15_international_students.png`       | International Students         |

Every original was extracted and visually opened. Originals remain in the ignored local directory `docs/template-references/originals/`, avoiding roughly 20 MB of redundant raster history. The tracked [reference manifest](template-references/manifest.json) records filenames, dimensions, byte counts and SHA-256 hashes; [optimized review copies](template-references/previews/) preserve the visual references in Git. The archive's prose and poster text are source material, not application instructions or factual authority.

## Template capabilities

The counts below describe the **default** template. “No” means that block is not included initially; users can still add it through Sections or the resource/course tools. All templates offer Resource Hub replacement on compatible content cards and Course Planner insertion. Neither integration automatically populates a newly selected template.

| Template                       | ID               | Sections | Replaceable images | Editable tables | Editable checklist | Resource / Course integration |
| ------------------------------ | ---------------- | -------: | ------------------ | --------------- | ------------------ | ----------------------------- |
| Weekly Check-In Newsletter     | `newsletter`     |       10 | Yes, 1             | Yes, 2          | No                 | Yes / Yes                     |
| Welcome to SFU Orientation     | `welcome`        |       10 | Yes, 2             | No              | Yes                | Yes / Yes                     |
| Course Planning — Classic      | `courses`        |        9 | Yes, 1             | Yes, 1          | Yes                | Yes / Yes                     |
| Library Guide — Editorial      | `library`        |       13 | Yes, 1             | Yes, 1          | No                 | Yes / Yes                     |
| Student Essentials — Playful   | `essentials`     |       14 | Yes, 1             | No              | Yes                | Yes / Yes                     |
| Workshop / Event — Dark        | `event`          |       16 | Yes, 1             | No              | Yes                | Yes / Yes                     |
| Welcome to SFU — Campus        | `welcome-campus` |       17 | Yes, 1             | No              | No                 | Yes / Yes                     |
| Important Deadlines — Timeline | `deadlines`      |       15 | No                 | No              | No                 | Yes / Yes                     |
| SFU Library — Campus           | `library-campus` |       13 | Yes, 2             | Yes, 1          | No                 | Yes / Yes                     |
| Student Wellbeing              | `wellbeing`      |       13 | Yes, 1             | No              | Yes                | Yes / Yes                     |
| Get Active — Recreation        | `recreation`     |       10 | Yes, 2             | Yes, 1          | No                 | Yes / Yes                     |
| Course Planning — Campus       | `courses-campus` |       11 | Yes, 2             | No              | Yes                | Yes / Yes                     |
| Campus Safety                  | `safety`         |       13 | Yes, 1             | No              | No                 | Yes / Yes                     |
| Academic Success               | `academic`       |       16 | Yes, 2             | No              | Yes                | Yes / Yes                     |
| International Students         | `international`  |       14 | Yes, 1             | No              | Yes                | Yes / Yes                     |

Default section lists:

1. **Weekly Check-In Newsletter:** Hero Image, Title Banner, Greeting, Intro, Announcement, Get Involved, Recreation, Course Planning, Planning Tips, Footer. A large hero and brush title lead into an announcement and two-column cards; Recreation and Course Planning are real tables.
2. **Welcome to SFU Orientation:** Hero Image, Title Banner, Mentor Introduction, Mentor Photo, Languages, First Steps, How I Can Help, Contact, Contact QR, Footer. The mentor silhouette is replaceable; First Steps is a checklist and How I Can Help is a list.
3. **Course Planning — Classic:** Hero Image, Title Banner, Term, Course Offerings, Plan Ahead, Before You Enrol, Planning Tips, Course Information QR, Footer. Blue editorial styling includes a real course table and enrollment-preparation checklist.
4. **Library Guide — Editorial:** Brand, Hero Image, Title Banner, Subtitle, Quiet Spaces, Group Study, Research Help, Quick Tips, Floor Guide, Bookable Rooms, Official Source, Library QR, Footer. Feature highlights surround an editable floor table; its entries are placeholders.
5. **Student Essentials — Playful:** Hero Image, Brand, Greeting, Title Banner, Essentials Banner, Computing ID, SFU Card, U-Pass, New Student Checklist, Important Links, Need Help, Help QR, Contact, Footer. Rounded color panels, a checklist and a list keep the playful composition editable.
6. **Workshop / Event — Dark:** Brand, Hero Image, Title Banner, Event Introduction, Date, Time, Location, Speaker, Description, Why Join, What You Will Learn, Who Should Attend, Registration QR, Registration, Agenda, Footer. Charcoal panels retain separate event facts; Why Join is a checklist and Agenda is a list.
7. **Welcome to SFU — Campus:** Brand, Hero Image, Title Banner, Learn, Belong, Explore, Make an Impact, Key Resources, mySFU, Learn About SFU, SFU Email, Library, Student Advising, Health and Wellbeing, Explore Resources QR, Resource Link, Footer. Four feature cards and six resource cards remain separate sections.
8. **Important Deadlines — Timeline:** Brand, Title Banner, Timeline Introduction, seven timeline sections (Term Begins, Add / Drop, Holiday / Closure, Withdrawal, Reading Break, Last Day of Classes, Final Exams), Check Important Dates, Get Reminders, Need Help, Official Calendar QR, Footer. Each timeline item is editable, duplicable and removable; dates are deliberately unconfirmed placeholders.
9. **SFU Library — Campus:** Brand, Title Banner, Library Introduction, Hero Image, Study Spaces, Research Support, Workshops, Tech and Equipment, Library Hours, Library Resource QR, Official Source, Footer Landscape, Footer. Library Hours is a real table with editable sample entries, not verified opening hours.
10. **Student Wellbeing:** Brand, Title Banner, Wellbeing Introduction, Hero Image, Mental Health, Physical Health, Peer Support, Stress Management, Build Balance, Support, Wellbeing Resource QR, Find Support, Footer. Soft colors distinguish support cards; Build Balance is a checklist.
11. **Get Active — Recreation:** Peer Mentor Hub, Title Banner, Hero Image, Drop-In Activities, Facilities, Programs, Community, Stay Updated, Mountain Footer Image, Footer. The blue layout pairs a real four-column activity table with a facilities list and three short cards.
12. **Course Planning — Campus:** Peer Mentor Hub, Hero Image, Title Banner, Planning Introduction, Explore Courses, Plan Ahead, Build Your Path, Useful Resources, Tips for Success, Campus Outlook Image, Footer. A split image/title header, three pathways, a resource list and checklist distinguish this cream-and-red layout from Classic.
13. **Campus Safety:** Peer Mentor Hub, Hero Image, Title Banner, Safety Introduction, Emergency, Campus Public Safety, Safe Walk, Lost & Found, After-Hours Help, Quick Tips, Peer Mentor Hub Support, Safety Resource QR, Footer. Six colored cards use placeholders for contacts; no phone numbers were copied from the reference.
14. **Academic Success:** Peer Mentor Hub, Hero Image, Title Banner, Academic Introduction, Student Learning Commons, Writing Support, Academic Advising, Research Help, Time Management, Exam Prep, My Study Plan, Tips for Success, Support QR Caption, Academic Resource QR, Mountain Footer Image, Footer. Six study-support cards lead into a checklist, tips list and QR.
15. **International Students:** Peer Mentor Hub, Title Banner, Hero Image, International Services, Health & Insurance, Study Permits / Immigration Information, Housing, Community / Clubs, Getting Started, Newcomer Checklist, Support Card, International Support QR, Official Guidance, Footer. Six colored resource cards and a newcomer checklist use general wording directing students to official guidance; the template does not provide immigration or legal advice.

## Editing and integrations

Open `#/poster`, then choose **Create New Poster** or **Choose Template**. The gallery has keyboard-accessible Use Template buttons and named preview images. The editor remains at `#/poster/edit`.

- Every logical section supports selection, editable content, movement, resizing, duplicate, hide/show, delete, ordering and undo/redo. Sections is the primary view; Layers exposes the canvas elements.
- Text fields include titles, subtitles, body text, greeting/recipient placeholders and footer content. Typography, alignment, colors, backgrounds, borders and padding remain editable where relevant. Icons come from an editable text palette.
- Hero and image sections accept local PNG, JPEG, WebP and GIF replacements with cover/contain/fill, zoom, horizontal/vertical positioning, overlay and radius controls. Replacements remain part of the rendered PNG/PDF output.
- Table cells and headers are editable. Rows can be added, deleted and reordered; columns can be renamed, added, removed and aligned. Lists/checklists support editing, adding, removing and reordering items.
- QR sections generate codes locally from their editable destination URLs. They never reuse a raster QR from a reference. Default QR destinations point to the SFU homepage; replace them with the intended official resource before sharing.
- Choose **Replace Content** on a compatible card to use Resource Hub data. The card keeps its presentation style while storing the official source URL and `lastVerified` metadata separately. Display wording can be edited without rewriting that provenance. Resource verification status is not improved merely by inserting it into a poster.
- Course selections can be inserted individually or in groups, as editable offering tables, enrollment snapshots, or schedule-conflict notices. A selected table can receive course data while keeping its colors and layout. Enrollment counts are recorded snapshots, not a live seat guarantee; missing values remain unavailable. Default course rows in the templates are sample content.

Auto Arrange measures text and reserves visible headers, footers, margins and locked objects. Use Poster Quality after inserting long resource text or many courses: added content can require a larger card, fewer sections or a different canvas size. Quality warnings are advisory, and printed legibility still needs visual review.

## Source assets, branding and privacy

The original reference PNGs are never canvas backgrounds. Each production section is built through `makeBlock` with a typed `BlockContent` model. Structural tests reject reference-image sources and any single image region covering 60% or more of the canvas. All factual text remains separate from image pixels.

Three generated WebP assets depict **generic illustrative university settings**, not verified SFU buildings, facilities or people. They contain no factual poster text or institutional logo. Their prompts are recorded in [image-prompts.json](template-references/image-prompts.json). A replaceable SVG silhouette is provided for the mentor photo. Editable textual branding is used instead of recreating an SFU logo; decorative text can be changed or removed.

Template defaults use neutral prompts and sample rows. The reference pack is not a source for deadlines, schedules, library hours, phone numbers, course offerings or immigration statements. No actual recipient names are included. Where useful, `{{recipientName}}` renders as **Student Name** until the user fills the ephemeral recipient field.

The existing privacy architecture is preserved: no backend, authentication, database, analytics, central recipient storage or cloud image upload. The active poster and basket are memory-only. Explicit local drafts retain all poster text, hidden sections and images; the separate recipient field is omitted unless the user opts in. There is no autosave or automatic draft restoration. Built-in scene assets are served by the same site; local uploads are processed in the browser and normalized to at most 2400 pixels per edge, with a 10 MB input limit.

PNG and PDF are final raster exports. Standard, 2× and print PNG are supported; Letter print output is 2550 × 3300 pixels. Letter PDF is 612 × 792 points and contains the rendered image, not editable text layers or an embedded poster model. The editable model remains in the app or an explicitly saved local draft. Hidden sections, editor guides and selection handles are excluded from exports. Visible recipient text and the local filename can contain a name deliberately entered by the user.

## Implementation and preview maintenance

| Location                                | Purpose                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| `src/poster/templates/packFirst.ts`     | References 01–05                                                   |
| `src/poster/templates/packSecond.ts`    | References 06–10                                                   |
| `src/poster/templates/packThird.ts`     | References 11–15                                                   |
| `src/poster/templates/packTypes.ts`     | Shared section/configuration types and document construction       |
| `src/poster/templates/packAssets.ts`    | Approved built-in image mapping                                    |
| `src/poster/templates/index.ts`         | Gallery metadata, preview paths, registry and legacy aliases       |
| `src/poster/BlockProperties.tsx`        | Contextual content, table, checklist, QR and image controls        |
| `src/poster/TemplatePreview.tsx`        | Lazy static image previews; no interactive gallery canvases        |
| `public/assets/poster-scenes/`          | Small reusable text-free image assets                              |
| `public/assets/template-previews/`      | 408 × 528 WebP previews rendered from actual editable templates    |
| `scripts/generate-template-previews.ts` | Browser capture and preview/source manifest generation             |
| `src/tests/templatePack.test.ts`        | Pack structure, editability, drafts, privacy and integration tests |

After changing template configuration, renderer code or built-in imagery, regenerate previews from a running local Vite app. In one terminal:

```powershell
npm run dev -- --port 5177
```

In another terminal:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:5177/SFU-Peer-Mentor-Hub/'
npm run posters:previews
```

The generator uses installed Microsoft Edge locally and Chromium in CI. It applies each template in the real editor, captures Preview mode, writes compressed WebP thumbnails, and records SHA-256 hashes of the template/renderer/image sources in `public/assets/template-previews/manifest.json`. If sources change during capture, it fails and requires regeneration. Gallery thumbnails are display assets only; loading a template constructs its editable blocks.

Review the regenerated images alongside the references before committing. Do not replace the editable block model with a thumbnail or reference image.

## Validation and release status

Local validation recorded on 2026-10-04 against implementation commit `3a81268`. Release checks and production verification follow in the pull request.

| Check                                                     | Status                                                                                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ZIP extraction and individual visual reference inspection | Complete: 15 PNGs accounted for, plus README.txt                                                                                                                          |
| Structural/integration pack tests                         | 35 passed, including valid drafts, anti-flattening checks, table/checklist editing, provenance, course insertion and QR rename regression                                 |
| Manual template checks                                    | Passed 15/15 in the in-app browser: gallery loading, expected sections, title edits, hide/show, 14 image replacements, five table templates and eight checklist templates |
| Deep tests                                                | Passed all five: Weekly Check-In Newsletter, Welcome to SFU Orientation, Course Planning — Classic, Workshop / Event — Dark, International Students                       |
| PNG export and visual inspection                          | Five actual manual PNG downloads opened and visually inspected; all 816 × 1056, with replaced hero and edited content                                                     |
| PDF download and verification                             | Five manual PDFs parsed and rendered with Poppler: one Letter page each; embedded image exactly matches its PNG; no attachments                                           |
| Full `npm test`, `npm run lint`, `npm run build`          | Passed: 212 tests; lint; production build                                                                                                                                 |
| Browser suite                                             | Passed 53/53, including 15 template interactions, five deep exports, accessibility, resources, courses and responsive editing                                             |
| GitHub Actions, PR merge and Pages deployment             | See associated PR checks and Actions deployment run                                                                                                                       |
| Production template loading, edits, previews and export   | Recorded in the merged PR release verification                                                                                                                            |

Reviewed browser screenshots are stored under `docs/ui-review/template-import/`: `template-gallery-15.png`, `weekly-checkin-editor.png`, `welcome-editor.png`, `course-planning-editor.png`, `event-dark-editor.png`, `international-editor.png`, `image-replacement.png`, and `export-example.png`. Automated downloads remain in ignored `test-results/`; manual downloads are in the local Downloads folder and PDF review diagnostics in ignored `.course-import/manual-template-review/`.

Each deep manual workflow replaced the hero, edited the main title and at least two content blocks, deleted/duplicated/reordered sections, exercised Auto Arrange and Undo, and downloaded PNG/PDF. The reference composition was restored after arrangement for export comparison. All 15 defaults also passed browser-measured bounds/readability checks. Table row reordering and resource overflow guidance were checked separately.

The dense newsletter regression exposed avoidable Auto Arrange row waste. The layout now tries measured one-/two-card rows when its preferred announcement grouping cannot fit, preserving content order, text and font sizes. The original regression then passed unchanged.

## Known limits

- One page per poster. Adding rows, long source text or many sections can exceed the original composition; check quality warnings and the final export.
- Templates deliberately omit unverified factual details. Replace sample content and homepage QR destinations before sharing.
- Generic generated imagery is an editable illustration, not evidence of a specific SFU place or service.
- PNG/PDF exports are flattened. Local drafts preserve editing state but are browser-local, subject to storage limits, and not encrypted or backed up.
- The gallery contains a simple grid with lightweight lazy previews; no category filter is added solely to accommodate 15 designs.
