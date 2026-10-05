# Roles, timetable and SLC review

Screenshots use deterministic browser fixtures for course selections and events. They do not contain student information. The actual mentor-code acceptance check reads the supplied code at runtime and does not commit it, log it or send it over the network.

- `role-entry-desktop.png`: fresh session at 1440 × 900, concise role choices.
- `course-timetable-desktop.png`: five sections, all weekdays and 08:00–20:00 in one desktop view.
- `course-conflict.png`: separate equal-width lanes, preserved course colors, visible warnings in the grid and selected list.
- `course-timetable-mobile.png`: 390 × 844, scrollable days and times, collapsed selections and text alternative.

The timetable browser checks also cover a 768 × 1024 student view, independently scrolling desktop selections, exact minute geometry, three-way overlap lanes, incomplete schedules, weekend meetings, focus restoration and keyboard access to disclosures. Published class times remain Pacific time in a browser configured for Asia/Tokyo.

Part 1 passed 451 unit tests and 78 browser tests, lint and the production build including TypeScript. Part 2 passed all 451 unit tests, lint, TypeScript and production build. Its browser suite covered all 81 scenarios: 79 passed in the full run, and two tests interrupted during a host scheduling pause passed unchanged on their exact rerun. All 12 timetable scenarios passed, including the geometry and keyboard checks. Final integration checks and deployment evidence are recorded in the pull request.
