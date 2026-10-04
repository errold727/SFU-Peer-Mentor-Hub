# Timetable browser review

Captured and visually inspected on 2026-10-04 in headless Microsoft Edge using
Playwright against a local production build. Desktop viewport: 1440 × 900. Mobile
viewport: 390 × 844 with touch emulation. Reduced motion was enabled.

These screenshots use **synthetic test offerings**, supplied by
[`e2e/fixtures/timetable.ts`](../../../e2e/fixtures/timetable.ts). They are not
evidence of actual SFU course offerings or enrolment availability. The selected
fixtures are TEST 101, 102, 103, 107, 108, 109 and 110, each section D100 in Spring 2027. Together they exercise three simultaneous Monday meetings, a ten-minute
Thursday block, weekend/early/late meetings, unavailable and partial schedules,
and explicitly asynchronous delivery.

| Screenshot                                     | What is visible                                                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [desktop-launcher.png](desktop-launcher.png)   | One persistent launcher showing seven selected sections and the active term.                                                     |
| [desktop-timetable.png](desktop-timetable.png) | Dominant weekly grid, three distinct overlap lanes, exact short-block heights, conflict styling and the selected-sections panel. |
| [desktop-weekend.png](desktop-weekend.png)     | Day navigation exposes Saturday and Sunday while retaining the time axis.                                                        |
| [mobile-timetable.png](mobile-timetable.png)   | Full-screen dialog, visible Close control and readable horizontally scrolling weekend columns.                                   |
| [mobile-unplaced.png](mobile-unplaced.png)     | Unavailable, partial and asynchronous states remain visible below the grid.                                                      |
| [mobile-selections.png](mobile-selections.png) | Scrolled mobile panel with reachable term Clear and section Remove controls.                                                     |

The review found a truncated code/time in the 20-minute three-way overlap. The
final capture uses two compact text lines for that block while preserving its
24px height. The ten-minute meeting remains 12px high. Unknown-section actions
were aligned with their status text.

The capture workflow operated the day selector, Clear/Cancel, Remove and Close on
both viewports. No page errors or console errors were observed; document width
matched each viewport. The Close button remained visible while scrolling mobile
content. Long day/time ranges intentionally scroll within the grid.

After the refinement, the production build and targeted ESLint passed. All nine
tests in [`e2e/timetable.spec.ts`](../../../e2e/timetable.spec.ts) passed against
the built preview, including geometry, keyboard focus, term isolation,
incomplete schedules and accessibility checks. The project-wide suite and
deployment are documented separately in the delivery report.

To repeat the deterministic checks against a fresh production build:

```powershell
npm run build
npm run preview -- --port 4317
# In another terminal:
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4317/SFU-Peer-Mentor-Hub/'
npx playwright test e2e/timetable.spec.ts --workers=1
```
