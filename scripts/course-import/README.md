# Reviewed course importer

Pipeline: official SFU public JSON API → normalization → validation → local candidate → reviewed Git diff → published JSON.

Run `npm run courses:import -- 2027-spring ENGL`. The importer traverses published 100–400 level courses and all their listed sections, including tutorials/labs. Requests are sequential with 20-second timeouts. Output goes ONLY to ignored `.course-import/<term>/`. No public data or Git history is changed. Read the adjacent `.review.json` for rejected/unavailable records. A missing top-level directory or empty result preserves existing data.

Run `npm run courses:validate -- .course-import`, inspect candidate records and their official outline links, compare the candidate to the existing public file, and copy only approved JSON into `public/data/courses/<term>/<department>.json`. Then run `npm run courses:validate`, `npm test`, `npm run build` and browser tests. Commit and submit the change for review. Do not blindly copy the review report into the browser dataset.

The API is `https://www.sfu.ca/bin/wcm/course-outlines?2027/spring/engl/211/d100`; the corresponding source is `https://www.sfu.ca/outlines.html?2027/spring/engl/211/d100`. No client requests go to SFU. No HTML course scraper, private goSFU access, or inferred seat data is used.

Schema version 1 has `lastVerified`, `note`, and `courses`. Identity fields are term (Spring 2027), department, courseNumber, code and section. Meetings contain canonical days, integer minutes since midnight, matching display times, and optional date ranges, kind and room. Times use campus-local America/Vancouver. Exams are excluded. Empty meetings mean unavailable, not asynchronous. Partially missing meeting blocks receive a visible scheduleNote. Section type and associated group are source metadata, not a guarantee of a valid registration combination.

Unknown instructor/campus/prerequisite/seat data remain absent. Missing prerequisite text never means there are no prerequisites. No demand predictions. Public instructor names are the only names in course JSON; importer ignores email, office hours and all unrelated fields.

Validation rejects mismatched identifiers/source paths, invalid dates/times, duplicate sections/outline URLs and malformed optional fields. The importer never updates lastVerified on a failed candidate. The verification date means the public API snapshot was retrieved and normalized; schedules may change.

For a new department or term, import and review first, then add the code to `src/course/courseTypes.ts` and publish a validated dataset for each offered selector combination. For a future scheduled importer, add bounded retries/caching and open a data-only PR with the review summary. Never commit automatically to main. No importer runs on a schedule in V1.
