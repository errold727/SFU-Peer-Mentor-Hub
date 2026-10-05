# Course timetable preview

The Course Planner uses one session-only Zustand selection store. **Add / Added**, detail actions, the floating **View Timetable** launcher, offering details and modal all read the same section snapshots. Added is a toggle that removes the section when activated again. Identity remains the dataset's validated `term:course code:section` key (the code includes subject and number). A multi-day lecture counts once. There is no planning selection cap; the offering-details table shows four selections per page to stay readable. Mentor and mentee modes share this implementation; only mentors see poster insertion actions.

The launcher appears after the first selection without moving focus or opening the dialog. It shows selected **sections**, explicitly identifies multiple terms, stays available until selections are removed, and leaves page-end clearance. The modal opens on the currently browsed term if it has choices, otherwise the most recently selected remaining term. Switching terms preserves choices. Clear requires an inline confirmation and applies only to the visible term. Removing the final section keeps an empty dialog with Back to courses; focus returns to the launcher or course search when it closes.

## Shared schedule model

`src/course/timetableModel.ts` supplies both the existing upgraded time grid and its text alternative. It uses immutable public section snapshots, exact minute positions, Monday–Friday plus relevant weekends, and an initial 08:00–20:00 range that expands for earlier/later meetings. Published local times stay in America/Vancouver; a viewer's timezone does not shift them. The calendar is a recurring weekly pattern, not an actual dated week.

The existing conflict engine retains teaching-date intersection and actual shared-weekday logic. Confirmed timetable conflicts require valid time/day data and complete teaching-date bounds proving a shared occurrence. Adjacent intervals do not overlap. Missing dates or schedules limit certainty. Visual lanes are assigned independently, in stable overlap clusters: two patterns with disjoint dates can share the same weekday/time position in separate lanes without a confirmed-conflict warning. Color is stable per course and term; section/component labels and conflict borders/text carry meaning without color alone.

At desktop widths, the modal uses approximately 96% of the viewport width and 94% of its height. The calendar scales its minute positions to the available height so the normal 08:00–20:00 range fits without vertical scrolling at 1440 × 900. The narrower selected-sections panel scrolls independently. Overlapping meetings retain equal-width lanes; confirmed conflicts add a red outline, warning icon and Conflict badge to each affected block and selected section while preserving the course color. Longer days, weekend columns and dense overlaps remain reachable; short meetings retain exact time geometry and full accessible labels.

Every valid published teaching block is rendered. Invalid blocks are quarantined with a visible warning; known portions of partially published schedules remain visible. Empty meetings never imply asynchronous delivery. Only explicit asynchronous delivery metadata can establish that status. Exam records are listed separately, never repeated through the weekly grid; a valid one-day examination can be checked against actual-date conflicts. Ambiguous exam dates limit conflict checking.

Meeting activation opens an inline details panel, with title, instructor, meetings, dates, location, official links and removal. Published blocks cannot be dragged or resized. Alternatives remain separate selections; the app does not infer lecture/tutorial/lab associations, enrolment eligibility, seat availability or cross-campus travel guarantees.

## Data and privacy

Planning selections remain only in application memory, survive ordinary internal navigation and clear on a full reload. They are never added to browser storage, URLs, analytics or a backend. Public dataset caching remains separate. Full selected public snapshots stay available after search/subject/page changes and cache eviction. Selecting a record whose detail snapshot is missing fails visibly; existing selections are not silently discarded. Reopening the timetable does not fetch the course universe again.

No new API, dependency, importer behavior or published course time was introduced. The native dialog is reused for background inertness, keyboard containment and Escape. Timetable-specific restoration handles a launcher removed after clearing, and page scroll is retained. On small screens the dialog fills the viewport, days remain reachable in a horizontal grid, and the selection list collapses.

## Validation and review

Synthetic unit and browser fixtures cover identity, term isolation, more than four selections, filtering/navigation, exact geometry, weekends, evening/short meetings, three-way overlaps, adjacency, disjoint dates, missing/partial/asynchronous schedules, focus and empty states. Browser fixtures satisfy the real dataset validators and intercept public dataset requests; they do not depend on live SFU schedules. A timezone-specific browser case checks that Pacific class times do not shift for an Asia/Tokyo viewer.

The initial timetable release passed 293 unit tests and 70 browser tests, plus lint, `tsc -b`, production build and course/resource validators. The role/timetable/SLC integration adds desktop fit, independently scrolling selections, visible conflict pairs, shared-lane widths, and tablet mentee coverage; its final results are recorded in the integration pull request.

See the [desktop and mobile screenshot review](ui-review/timetable/README.md). The screenshots deliberately use synthetic sections to demonstrate overlaps, weekends and incomplete data. Final GitHub checks and deployment results are recorded in the pull request. Tests do not submit data or enrol in courses. Source snapshots can change; confirm current schedules and enrol through SFU.
