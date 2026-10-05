# Fall 2026 SLC source review

The primary source is the user-supplied **Program Guide Fall 2026_FINAL1.pdf**, published by SFU Library Student Learning Commons. All **11/11 pages** were inspected both as extracted text and rendered pages on 2026-10-05. The source PDF was not modified. Its SHA-256 is `14e98c0d7246c96c01e5c3f00cce3c4c82066b64ddfc6e9ee5021fa056f9af7b`.

The data lives in `src/data/resources/slcFall2026.ts` and joins the existing resource registry through `reconcileSlcFall2026`. The generated text, page renders, embedded-link inventory and link checks were reviewed in local `artifacts/slc-guide/`; those working artifacts are not a new public event database.

## Scope and reconciliation

- **18** canonical workshop/event programs, containing **41** dated occurrences after expanding two explicitly bounded weekly series.
- **8** ongoing service records: consultations, Conversation Partners, Neurolanguage Coaching, community drop-in umbrella, WriteAway, VOWəL, learning videos and writing videos.
- **7** community-location support records linked from the drop-in umbrella. These represent different venues and audience conditions, not duplicate cards for each date.
- Community records contain **11** explicitly supported dates: four Global Student Centre dates, the Black Student Centre's first date, and six Surrey Indigenous Student Centre dates. Five Surrey dates have **null normalized times** and remain excluded from This Week.
- The registry grows from **183 to 215 records**, adding **32** and replacing the existing `writing` aggregate in place. `writing` now describes consultations; `slc-writeaway` separately describes WriteAway. This replaces the prior combined wording with two PDF-sourced records; it does not claim every old source object was retained on the replacement. Git history preserves the former aggregate.
- Existing `slc`, `academic-english` and `co-curricular-record` records receive guide details and related links. Their previous web-only verification status and verified timestamps remain unchanged. CCR is not duplicated, and credit is not promised for every activity.

## Page accountability

| PDF page | Content inspected                                                        | Treatment                                                                               |
| -------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 1        | At-a-glance workshop calendar and linked destinations                    | Cross-check against detailed pages; no separate summary cards                           |
| 2        | Free workshops/events; strategy videos; CCR; consultations               | Cost qualification, video records, CCR detail and consultation service window           |
| 3        | Conversation Partners; Neurolanguage Coaching; first two Soup Circles    | Two service ranges with unknown campus/mode; dated Soup occurrences                     |
| 4        | Last two Soup Circles; seven community locations and restrictions        | Four Soup dates total; seven location records; Surrey time discrepancy retained         |
| 5        | Presentation confidence; two schedule-building dates; Little Debates     | Three programs, including explicitly bounded Tuesday recurrence                         |
| 6        | Reading; two quantitative exam dates; Photo Walk                         | Three programs, including explicitly bounded Friday recurrence                          |
| 7        | Two study-skills dates; AI rehearsal; workplace English dates            | Three programs; workplace dates are an explicit list, not a weekly extrapolation        |
| 8        | Two procrastination dates; two public-speaking dates; scientific writing | Three programs; undergraduate condition retained for scientific writing                 |
| 9        | Big Paper; Writer You Are Becoming; zine description                     | Description mismatch flagged; zine date continues on page 10                            |
| 10       | Zine date/location; Writing Walk; Exam Anxiety                           | Page 9/10 zine evidence joined; exact workshop occurrences                              |
| 11       | WriteAway; VOWəL                                                         | Separate services, undergraduate and feedback conditions, no unbounded dated recurrence |

## Workshop inventory

Each row is one searchable canonical resource. Program titles retain source wording; summaries and useful descriptions are concise paraphrases. Occurrence IDs are internal child IDs and never separate resource cards.

| Resource ID                   | Guide pages | Explicit dates / bounded recurrence | Times, locations and qualifications                                                                                    |
| ----------------------------- | ----------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `slc-present-with-confidence` | 5           | Sep 15                              | 12:30–13:30, Bennett 7200; multilingual students                                                                       |
| `slc-schedule-building`       | 5           | Sep 17; Sep 21                      | 12:30–13:20 Arts Central AQ 3020; 11:30–12:20 Sci-Space AQ 3146; both hybrid; all faculties                            |
| `slc-lifes-little-debates`    | 5           | Tuesdays Sep 22–Nov 24 (10 dates)   | 14:30–15:30, SLC Bennett 3020                                                                                          |
| `slc-unlock-readings`         | 6           | Sep 24                              | 12:30–13:20, Arts Central AQ 3020 + Zoom; bring an academic reading                                                    |
| `slc-quantitative-exams`      | 6           | Sep 25; Dec 2                       | 11:30–12:20, Sci-Space AQ 3146 + Zoom                                                                                  |
| `slc-photo-walk`              | 6           | Fridays Sep 25–Oct 9 (3 dates)      | 15:00–16:00, SLC Bennett 3020                                                                                          |
| `slc-study-skills`            | 7           | Sep 28; Nov 25                      | 11:30–12:20, Sci-Space AQ 3146 + Zoom                                                                                  |
| `slc-ai-rehearsal`            | 7           | Sep 29                              | 12:30–13:30, Bennett 7301                                                                                              |
| `slc-workplace-english`       | 7           | Sep 29; Oct 6, 27; Nov 10, 17       | 12:30–13:30, Global Student Centre AQ 2013; SFU students whose first language is not English                           |
| `slc-procrastination`         | 8           | Oct 2; Nov 23                       | 11:30–12:20, Sci-Space AQ 3146 + Zoom                                                                                  |
| `slc-public-speaking`         | 8           | Oct 6; Oct 26                       | 12:30–13:30 Arts Central AQ 3020; 11:30–12:20 Sci-Space AQ 3146; both hybrid                                           |
| `slc-soup-circles`            | 3–4         | Oct 8; Nov 4, 26; Dec 7             | 12:00–14:00; Bennett 3020, Bennett 3020, AQ 2013, Bennett 3008 respectively; no registration; soup may run out earlier |
| `slc-scientific-writing`      | 8           | Oct 19                              | 11:30–13:30, Sci-Space AQ 3146 + Zoom; undergraduates                                                                  |
| `slc-big-paper`               | 9           | Oct 22                              | 11:30–12:30, Arts Central AQ 3020 + Zoom; description pending confirmation                                             |
| `slc-writer-becoming`         | 9           | Oct 22                              | 12:30–13:30, Media Maker Commons Bennett 3100; no artistic experience needed, materials provided                       |
| `slc-zine-making`             | 9–10        | Nov 5                               | 14:00–16:00, Media Maker Commons Bennett 3100                                                                          |
| `slc-writing-walk`            | 10          | Nov 19                              | 12:30–14:00, SLC Bennett 3020; comfortable shoes, indoor option dependent on weather                                   |
| `slc-exam-anxiety`            | 10          | Nov 30                              | 11:30–12:20, Sci-Space AQ 3146 + Zoom                                                                                  |

Times are normalized to 24-hour local wall time. No viewer-timezone conversion is applied. AQ/SUB/MBC building abbreviations are retained as printed. No Zoom meeting URL is invented.

## Ongoing services and community locations

| Resource ID                             | Page | Published schedule / scope                                                       | Qualification or missing information                                                                                       |
| --------------------------------------- | ---- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `writing`                               | 2    | Sep 14–Dec 12; Burnaby, Surrey and virtual consultations                         | SFU students taking credit courses; free; French designated hours; no appointment times inferred; calendar wording flagged |
| `slc-conversation-partners`             | 3    | Sep 21–Dec 4; weekly one-hour partner meetings                                   | Common weekday, clock time, campus and mode not stated                                                                     |
| `slc-neurolanguage-coaching`            | 3    | Sep 21–Dec 10                                                                    | Appointment times, campus and mode not stated                                                                              |
| `slc-community-drop-in`                 | 4    | Navigation to seven location-specific services                                   | Location restrictions are not generalized to all students                                                                  |
| `slc-writeaway`                         | 11   | Reopens Sep 21; online draft feedback                                            | Undergraduates; 48-hour response is an aim, not a guarantee; up to three drafts per paper according to the guide           |
| `slc-vowel`                             | 11   | Fridays 09:00–noon in raw source wording                                         | Open writing/accountability community, not writing feedback; PDF/provider timezone conflict; no dated expansion            |
| `slc-learning-videos`                   | 2    | Learning strategy screencasts and recordings                                     | No inferred event dates                                                                                                    |
| `slc-writing-videos`                    | 2    | Academic writing strategy screencasts and recordings                             | No inferred event dates                                                                                                    |
| `slc-drop-in-out-on-campus`             | 4    | Thursdays 11:00–12:30, SUB 2230                                                  | No explicit start/end dates; confirm host-space conditions                                                                 |
| `slc-drop-in-womens-centre`             | 4    | Wednesdays 11:00–12:30, SUB 2220                                                 | No explicit start/end dates; confirm host-space conditions                                                                 |
| `slc-drop-in-indigenous-burnaby`        | 4    | Tuesdays 11:30–13:30, AQ 2002                                                    | **For self-identified Indigenous students only**; no explicit start/end dates                                              |
| `slc-drop-in-disability-neurodiversity` | 4    | Thursdays 15:30–17:30, SUB 1300; start TBA                                       | No inferred start date or later occurrences                                                                                |
| `slc-drop-in-black-student-centre`      | 4    | Every second Wednesday 14:00–15:00 beginning Sep 23, MBC 2270                    | Only Sep 23 is an explicit dated occurrence; no end date, so service is not marked completed after that first date         |
| `slc-drop-in-global-student-centre`     | 4    | Sep 22, 29 at 13:30–14:30; Oct 1, 7 at 14:30–15:30; AQ 2013                      | Four explicit dates only                                                                                                   |
| `slc-drop-in-indigenous-surrey`         | 4    | Sep 29 at 13:00–14:00; Oct 7, 21, Nov 4, 18, Dec 2 with unclear times; SRYC 5300 | **For self-identified Indigenous students only**; five uncertain times retained as null                                    |

## Unresolved source items

1. **Surrey Indigenous Wednesday times, page 4.** The rendered table and extracted text both say **“11:00pm to 12:00pm”**. The five dates remain recorded, with raw times retained and both normalized times null. Do not guess 11am. Ask SLC for corrected times; these entries cannot populate This Week or a factual timed poster.
2. **Big Paper description, page 9.** Its paragraph describes freezing during exams and duplicates the Exam Anxiety description on page 10. The raw paragraph is preserved for review, but the useful description is pending. Printed title/date/time/location remain independently usable. Ask SLC to confirm the workshop description.
3. **Consultation calendar wording, page 2.** The guide gives Sep 14–Dec 12, then calls Dec 12 “the last day of classes.” The service window is retained as the guide’s claim and flagged; the parenthetical is not copied as an academic-calendar fact. Confirm the service closing date with SLC.
4. **VOWəL timezone, page 11.** The guide says UTC-07:00/Pacific Daylight Time. The retrieved provider homepage says UTC-08:00/Pacific Standard Time. There is no reliable guide date range resolving the difference. Preserve both in the review note, make no timezone correction, and confirm current joining time with the provider. No dated recurrence is generated.

Additional incompleteness is explicit: no invented bounds for community weekly schedules, no inferred campus/mode for Conversation Partners or Neurolanguage Coaching, and no guaranteed individual appointment or attendance availability.

## Link and registration review

The coordinating reviewer checked **41 distinct embedded URLs** on 2026-10-05 at 08:17:32–08:17:33 UTC and read the non-challenge destinations. **36 Library URLs returned a bot challenge**, even where HTTP status was 200. Their source records therefore use `retrievalStatus: blocked` and `lastRetrievedAt: null`. A separate `source.document` receipt records the PDF filename/hash/pages/read time; a reachable or blocked URL never substitutes for factual document review.

Five URLs returned provider content: [WriteAway](https://writeaway.ca/), its `www` variant, [VOWəL homepage](https://vowel-writers.weebly.com/), [VOWəL About](https://vowel-writers.weebly.com/about.html), and [SFU CCR](https://www.sfu.ca/students/get-involved/recognition/co-curricular-record.html). The first two services use the verified provider destinations for optional QR/navigation. Destination verification does not resolve VOWəL’s timezone conflict.

All workshop registration URLs remain unavailable; Soup Circles instead retains the source’s explicit **no registration required** condition. Official page links remain evidence/navigation links, and are not silently reused as verified registration QR destinations. Raster QR images are not reused.

## Review and validation

The author inspected all pages and normalized the source. A separate coordinating-agent review completed at **2026-10-05T08:30:22Z**, covering all 11 rendered pages, extracted text, dates, rooms, modes, audience conditions, poster conditions and link checks. Its `secondReview` receipt applies to all 33 module records and three enriched overviews. Four manual-review flags remain; separate review does not turn unresolved facts into verified claims.

Data-focused regression checks cover canonical IDs/counts, all explicitly printed workshop dates, bounded recurrence dates, venue/time differences, source receipts, unknown campuses, Indigenous-only conditions, the five withheld Surrey times, Big Paper’s independently valid occurrence, no inferred service dates, QR eligibility and English/Mandarin discovery. The normal strict catalog validation remains enabled.

Run:

```powershell
npx vitest run src/tests/slcFall2026.test.ts src/tests/resourceDirectory.test.ts --maxWorkers=2
npx eslint src/data/resources/slcFall2026.ts src/data/resources/index.ts src/tests/slcFall2026.test.ts
```

At data handoff these two test files pass **51 tests**. Full integration, browser, audit and deployment checks are reported by the main task separately.
