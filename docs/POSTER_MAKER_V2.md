# Poster Maker V2

The poster start screen is at `#/poster`, the gallery at `#/poster/templates`, and the editor at `#/poster/edit`. Choose a blank canvas with one of five sizes/styles, or customize a template. Nothing is saved automatically.

## Ten templates

| Template            | Structure                                                                       |
| ------------------- | ------------------------------------------------------------------------------- |
| Blank Poster        | Empty canvas                                                                    |
| Welcome to SFU      | Large campus hero, introduction and getting-started checklist                   |
| Weekly Check-In     | Hero, weekly highlight, two resource cards and short check-in list              |
| Important Deadlines | Three numbered date/action cards and submission checklist                       |
| Library Guide       | Floor/area table, services sidebar and research panel                           |
| Recreation Guide    | Large schedule table and preparation cards                                      |
| Course Planning     | Course table, planning checklist and schedule notes                             |
| Workshop / Event    | Large hero, event title, details and replaceable QR destination                 |
| Student Essentials  | Six icon resource cards                                                         |
| Check-In Newsletter | Hero, title, greeting, intro, wide announcement, four content blocks and footer |

Previews render the actual model with the editor's renderer. The built-in campus illustration is original vector artwork; it contains no factual text or official SFU logo. Dates, names, schedules and course facts remain editable. Placeholder content is not verified SFU information.

## Editing

- **Sections:** select a logical block; drag its handle or use arrow buttons to reorder. Duplicate, hide/show and delete act on the whole block. Reordering changes both visual placement and stacking. Undo/redo restores these actions and image replacements.
- **Properties:** edit the selected block's title, wording, icons, colours, typography, border, padding and geometry. Double-click a text block on the canvas for direct editing; Ctrl/Cmd+Enter saves, Escape cancels, and leaving the field saves. Other fields remain available in Properties.
- **Images:** select the hero or image block and choose Replace Image. Cover preserves aspect ratio and crops; Contain shows the whole image; Fill intentionally stretches. Zoom and horizontal/vertical position control the crop. Overlay colour/opacity and radius are editable.
- **Tables/lists:** edit headers, cells, alignment and colours; add/delete rows and columns. Add/remove/reorder list items. Content mode converts cards between info, highlight, bullet list, checklist, table/key-value and schedule while carrying wording forward.
- **Add Section:** text, image, highlight, info, list, checklist, table, schedule, QR, footer and divider blocks; hero/title/greeting are also available. Layers retains low-level selection and stacking controls. A structured block is one actual canvas group with generated child shapes/text.
- **Resources:** select a card, choose Replace Content, search and pick a Resource Hub item. Its source URL and lastVerified date remain attached internally when display wording changes. Source metadata is a disclosure in Properties. Unverified Library records retain their null dates.
- **Courses:** select offerings in Course Planner, add them to Poster Basket, then use Resources in the editor. Insert individual/multiple cards, an editable course table or a conflict notice. Table rows use the selected offerings' actual codes/instructors, include term wording, and retain each official source. Optional QR blocks can link to official pages. Blank canvases do not auto-import basket items.
- **Layout:** Auto Arrange uses measured text, margins and gutters, reserves headers/footers, ignores hidden sections and avoids locked obstacles. Remaining cards rebalance after a deletion. Guides show margins, columns, horizontal divisions and centre; dragging snaps within a small threshold. Preview hides editor handles/guides, as do all exports.

At desktop widths the canvas sits between tools and properties. At 768 and 390 px, Sections & tools and Properties open separately; controls are not permanently squeezed beside the canvas. Fit/150/200/300% zoom and the scrollable canvas support close editing.

## Architecture and privacy

`PosterElement` retains primitive compatibility and adds structured `BlockContent`. `blocks.ts` constructs/converts blocks and attaches provenance. `blockLayout.ts` measures and describes the text/shape layout shared by rendering, quality checks and arrangement. `BlockContentRenderer` memoizes that layout. `PosterElementRenderer` handles image decoding/crop, QR rendering and canvas interactions. `blockArrange.ts` handles content geometry; `SectionsPanel` and `BlockProperties` expose logical controls. Existing store history handles undo/redo.

There is no backend, authentication, image upload service, analytics, central name storage or mentee database. Local images are decoded in the browser and normalized to PNG, at most 2400 px on the longest edge; inputs above 10 MB are rejected. Object URLs are revoked. Image effects depend on the source string, avoiding repeated decoding on unrelated edits. Template previews mount near the viewport and disconnect observers on cleanup. PDF code loads only when needed.

Drafts remain explicit browser-local storage using the existing key and validation boundary. Recipient fields are omitted unless separately opted in. Manually entered text and images are included in a deliberately saved draft, including hidden blocks. Limits remain 20 drafts and approximately four million serialized characters, subject to browser quota. There is no automatic save or restore. Old primitive drafts are accepted. Invalid block payloads and remote-image URLs are rejected.

## Verification evidence

Local release checks on October 4, 2026: **164 unit/integration tests, 33 Playwright tests, lint and production build passed**. CI repeats lint, tests, data validation, offline source validation, build and browser tests before deployment.

Browser work included actual clicks, local image upload, title/body edits, Bennett Library replacement, course table row additions/deletions and instructor edits, section hide/delete/duplicate/reorder, undo/redo, Auto Arrange, inline canvas text, content-mode conversion and draft privacy. Desktop was operated at 1440 × 900 and 1024 × 768, tablet at 768 × 1024, and mobile at 390 × 844. Mobile table editing and tablet section controls were also operated directly through the computer/browser interface. A fresh screenshot capture run reported no console warnings or errors.

The automated reference workflow creates THIRD-WEEK CHECK-IN, uses Student Name, changes the announcement/footer, replaces myInvolvement with Bennett Library, edits a course table and replaces the hero with a local test graphic. The SEP 30 announcement is explicitly test content, not newly verified source data. The rendered PNG was opened and visually inspected. The replacement image's pixels are also checked in the download. Standard, 2× and print PNG dimensions pass; PDF is checked for its PDF signature, Letter MediaBox and absence of an embedded editable document. Existing print-QR decoding and name/network privacy assertions remain in the suite. Guide/selection-free exports are compared by bytes.

Review images in [ui-review/poster-maker-v2](ui-review/poster-maker-v2/):

- [Start screen](ui-review/poster-maker-v2/poster-start.png)
- [All ten real previews](ui-review/poster-maker-v2/template-gallery.png)
- [Newsletter editor](ui-review/poster-maker-v2/newsletter-editor.png)
- [Newsletter canvas](ui-review/poster-maker-v2/newsletter-template.png)
- [Replaced hero in editor](ui-review/poster-maker-v2/hero-image-replaced.png)
- [Actual exported reference poster](ui-review/poster-maker-v2/export-preview.png)
- [1024 px](ui-review/poster-maker-v2/editor-1024.png), [768 px](ui-review/poster-maker-v2/editor-768.png), [390 px](ui-review/poster-maker-v2/mobile-editor.png)

Release procedure: push the checked branch, open **Poster Maker V2: Template-first block editor**, wait for passing CI, merge, then wait for Pages. Repeat the full browser suite with `PLAYWRIGHT_BASE_URL=https://errold727.github.io/SFU-Peer-Mentor-Hub/` and manually operate the production start/gallery/editor before reporting deployment verified. Pre-release screenshots above are local evidence, not a claim that a deployment already passed.

## Practical limits

- One page per poster. Very dense content may need fewer cards, larger geometry or multiple posters. Text stays in the model when clipped; quality warnings remain advisory. Arbitrary photos/rotations cannot be fully assessed for contrast or print legibility.
- Images are rasterized on import; animated images use a still frame. Large image drafts may reach local storage limits. There is no cloud backup, sync or remote-image import.
- PNG/PDF are flattened visual exports. PDF does not contain an editable poster or hidden recipient JSON; local drafts retain editability.
- Template body/schedule values are neutral placeholders. Resource/course insertion preserves source caveats and snapshot limits; the editor does not certify user-edited wording.
- Accessibility checks cover labelled keyboard controls, focus, responsive routes and axe checks. Canvas reading itself is visual; properties/layers supply editing alternatives. Testing with assistive-technology users remains worthwhile.
