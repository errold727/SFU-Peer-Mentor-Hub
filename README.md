# SFU Peer Mentor Hub

A peer-created, independent tool to **Find → Select → Create**. Public SFU information becomes useful posters and neutral course comparisons. This is not an official SFU website.

## Development

Node 24 recommended. Run `npm ci`, then `npm run dev`. `npm test` runs Vitest; `npm run build` checks TypeScript and produces `dist/`. `npm run lint` checks the source.

## Phase 0 progress

- Resource Hub: fuzzy search, campus/category/term filters, source metadata, Vancouver deadlines, library guide, recreation filtering, and memory-only poster basket.
- Poster Maker and Course Planner are the next implementation milestones.

## Privacy

No backend, authentication, analytics, student profiles or mentee database. Basket and editor state are held in memory. Recipient names are never persisted or uploaded.

## Resource maintenance

Typed resources live in `src/data/resources`. Add an official source URL and label, factual summary, category, campus, tags, and a verification date. Set `lastVerified: null` when source content cannot be checked; never fabricate a verification date. Library floor details are user-supplied and currently await official-source verification. Dates are interpreted in America/Vancouver; expired dates never become upcoming recommendations.

## Stack

React, TypeScript, Vite, HashRouter, Zustand, React-Konva, Lucide, jsPDF, QRCode, date-fns/date-fns-tz, Fuse.js, Vitest, React Testing Library, ESLint and Prettier.

Development takes place on `codex/phase0`, with tested milestones pushed to GitHub. Deployment configuration and full architecture documentation will be completed with Phase 0.

Poster Maker milestone: eight editable templates, resource import, memory-only recipient names, canvas transforms, keyboard editing, layers, undo/redo, image uploads, QR codes, contrast checks, and PNG/PDF export. Browser checks verify file signatures, dimensions, mobile navigation, and refresh privacy.

Course Planner milestone: nine verified offering snapshots across ENGL, ECON and CMPT; term/department loading, official details, neutral comparisons, complete/partial overlap detection, and course-to-poster integration. Future importer design is documented in scripts/course-import/README.md.

