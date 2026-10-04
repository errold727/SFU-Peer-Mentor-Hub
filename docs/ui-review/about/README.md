# About page review

Scope: the `#/about` page, supporting attribution/configuration, notices, tests, and this review. No resource facts, course imports, or Poster Maker behavior changed.

## Page structure

Exactly four main sections: Supporting FASS Peer Mentorship; Created by Errol Dai; Data Sources & Credits; Beta Feedback. Long privacy/provider/tool details use native disclosures. The page uses existing typography, spacing, red accents, and keyboard focus styles.

| View            | Before                       | After                      |
| --------------- | ---------------------------- | -------------------------- |
| Desktop, 1440px | [Before](before-desktop.png) | [After](after-desktop.png) |
| Mobile, 390px   | [Before](before-mobile.png)  | [After](after-mobile.png)  |

Before images capture the deployed page at base commit `86cbc0e`; after images capture the local production build with disclosures initially closed.

## Source and attribution inventory — 2026-10-04

| Credit                               | Actual use / evidence                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CourSys public browse-data interface | `scripts/course-import/coursys.ts`: public browse listing/table data used for imported offerings and enrollment snapshots. Not described as a formally supported API. [Public browse](https://coursys.sfu.ca/browse/).                                                                                                                                                                                   |
| SFU Course Outlines REST API         | `scripts/course-import/pipeline.ts` and legacy `import.ts`: published outline/section enrichment from `www.sfu.ca/bin/wcm/course-outlines`. [Documentation](https://www.sfu.ca/outlines/help/api.html).                                                                                                                                                                                                  |
| Resource information providers       | `src/data/aboutCredits.ts`: 56 deduplicated provider-level credit rows from the 183 current resources, organized into 34 SFU services, 15 faculty/teaching providers, 3 student organizations, and 4 external providers. Names, contributions and official URLs remain inspectable in that file. Detailed factual citations remain with the resource records.                                            |
| Runtime tools                        | `src/data/aboutTools.ts`: React/React DOM, React Router, Konva/React Konva, jsPDF, QRCode, Fuse.js, Lucide, Zustand and date-fns/date-fns-tz; checked against actual imports, package metadata and lockfile. These are local libraries, not external data APIs.                                                                                                                                          |
| Licenses                             | `public/THIRD_PARTY_NOTICES.txt`: full installed production-graph license/notice texts, including transitive and optional dependencies, embedded jsPDF notices, pako notices and Lucide's Feather-derived MIT notice. The conservative inventory is not a claim that every package is used in the browser. Its header records the lockfile hash and update procedure.                                    |
| Poster assets                        | `docs/template-references/README.md`, `manifest.json`, `image-prompts.json`, and `src/poster/templates/packAssets.ts`: 15 editable templates adapted from owner-supplied visual references; three generic university scenes generated with built-in OpenAI image generation. Other decorative motifs are code-native illustrations. No official SFU photo/logo claim or invented reference-pack license. |
| Hosting and feedback                 | GitHub Pages hosts the static build. Google Forms is a voluntary external link; no Google Forms API or embedded form is used.                                                                                                                                                                                                                                                                            |

The resource audit found 67 exact stored provider name/type pairs. Credits combine Library/SLC/Research Commons, ISS/Study Abroad, Residence, Food, SFSS, Science and Safety & Risk variants. The Hub-authored referral guide is not treated as a separate institutional provider. CourSys/Outlines are credited once in course data. WriteAway and Alumo are included from actual source records even though they are not primary provider labels. TELUS remains external despite its SFU referral URL. TeamDynamix is SFU IT documentation, not a separate integration. No provider is inferred merely from an allowlist or a passing service mention.

The browser loads course snapshots from this site's static data. The audit found no analytics, remote QR service, external fonts, or AI API calls. Individual resource review gaps remain in [resource coverage](../../resources/COVERAGE.md); importer operation remains in the [course maintenance guide](../../../scripts/course-import/README.md). Information is not a substitute for official academic, legal or immigration advice.

## Public link verification — 2026-10-04

- The [official FASS Peer Mentorship program page](https://www.sfu.ca/students/get-involved/programs-and-opportunities/fassconnections.html) loaded in the browser and describes experienced student mentors supporting new SFU students with campus resources and opportunities.
- The owner copied the published responder link. The clean URL stored in `src/config/feedback.ts` was then opened and checked separately: [Peer Mentor Hub feedback](https://docs.google.com/forms/d/e/1FAIpQLSc_9CUif3rzQLiJ9dpKlHqtXGfXfzbNY3kq_nq4Vt4uPYRMfg/viewform).
- The signed-out responder page showed the title **Peer Mentor Hub**, editable fields **Course Planning**, **Poster Maker**, **Resources**, and an enabled **Submit** button. It was published and accepting responses at inspection. Google sign-in was optional to save progress; anonymity is not promised.
- No text was entered, no response was submitted, no existing responses were read, and no form settings were changed. Submission delivery was not tested. The hub does not prefill or forward poster/recipient data.
- Set the configuration constant to `null` if access is withdrawn. Replacement links must be owner-supplied and verified in the browser; the UI only accepts a clean published responder URL and otherwise shows a pending state. Do not use an editor link as a fallback.

Local drafts retain manually entered personal text, hidden content and images. The recipient checkbox controls only the separate recipient field. This qualification remains in the first section; full draft/export behavior remains in the root README. Voluntary external feedback is described separately, including Google's optional progress saving.

## Validation

- `npm test`: 250 tests passed, including configured, unconfigured and invalid feedback URLs; four-section structure; author/source links; privacy qualifications; external link safety.
- `npm run lint`: passed.
- `npm run build`: passed; existing Vite large-chunk advisory remains.
- `npm run test:e2e`: all 61 tests passed. The first Windows run needed its test-owned preview process closed to finish teardown; a final focused About run then passed both tests and exited normally. About coverage exercises keyboard navigation and visible focus, Enter/Space disclosure toggling, all-open desktop/390px overflow and axe checks, existing navigation, and no third-party network requests before activating feedback.
- Course validation, resource validation and offline source-metadata checks passed. The existing 22 resource maintenance notices remain documented; this focused task does not change their factual review status.
- Public links are checked separately in the browser; unit/browser acceptance tests do not submit or depend on live Google/SFU responses.
