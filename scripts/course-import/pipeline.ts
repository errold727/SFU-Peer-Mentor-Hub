import { mkdir, readFile, writeFile, rename, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  courseId,
  offeringTerms,
  type TermCode,
  type CourseOffering,
  type CourseManifest,
  type OfferingDataset,
} from '../../src/course/courseTypes';
import { validateManifest, validateOfferings } from '../../src/course/offeringValidation';
import {
  browseRequest,
  normalizeCoursys,
  parseBrowseResponse,
  subjectsFromOfferings,
} from './coursys';
import { getPublicJSON, mapBounded, HttpError } from './http';
import { normalizeOutline, plainText } from './normalize';

export async function writeJSON(path: string, data: unknown) {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path + '.tmp', JSON.stringify(data, null, 2) + '\n');
  await rename(path + '.tmp', path);
}
async function readJSON(path: string) {
  return JSON.parse(await readFile(path, 'utf8'));
}
export async function discoverSubjects(term: TermCode, directory: string, force = false) {
  const cache = join(directory, 'discovery.json');
  if (!force) {
    try {
      const saved = await readJSON(cache);
      validateOfferings(saved);
      if (saved.termCode !== term) throw Error('Cached term mismatch');
      return saved as OfferingDataset;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
  }
  const snapshotAt = new Date().toISOString();
  let count: number | undefined;
  const courses: CourseOffering[] = [];
  for (let start = 0; count === undefined || start < count; start += 500) {
    const pageFile = join(directory, `page-${start}.json`);
    let raw: unknown;
    try {
      raw = await readJSON(pageFile);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      raw = await getPublicJSON(browseRequest(term, start));
      await writeJSON(pageFile, raw);
    }
    const page = parseBrowseResponse(raw);
    if (count !== undefined && count !== page.recordsFiltered)
      throw Error('CourSys changed during pagination; retry fresh discovery');
    count = page.recordsFiltered;
    if (!page.data.length || (page.data.length !== 500 && start + page.data.length !== count))
      throw Error('CourSys pagination gap');
    courses.push(...page.data.map((row) => normalizeCoursys(row, term, snapshotAt)));
  }
  const data: OfferingDataset = { schemaVersion: 2, termCode: term, snapshotAt, courses };
  validateOfferings(data);
  if (courses.length !== count) throw Error('CourSys source total mismatch');
  await writeJSON(cache, data);
  await writeJSON(join(directory, 'subjects.json'), {
    termCode: term,
    snapshotAt,
    subjects: subjectsFromOfferings(courses).map((code) => ({
      code,
      sectionCount: courses.filter((c) => c.department === code).length,
    })),
  });
  return data;
}

export function enrichOffering(
  base: CourseOffering,
  raw: unknown,
  retrievedAt: string,
): CourseOffering {
  const root = raw as { info?: Record<string, unknown>; courseSchedule?: unknown[] };
  const path = `${offeringTerms[base.termCode as TermCode].path}/${base.department.toLowerCase()}/${base.courseNumber.toLowerCase()}/${base.section.toLowerCase()}`;
  const outline = normalizeOutline(
    { ...root, courseSchedule: root.courseSchedule ?? [] },
    path,
    retrievedAt.slice(0, 10),
  );
  const info = root.info!;
  const kinds = [...new Set(outline.meetings.map((m) => m.kind).filter(Boolean))];
  return {
    ...base,
    meetings: outline.meetings,
    outlineUrl: outline.outlineUrl,
    sourceUrl: outline.sourceUrl,
    source: { courSys: true, courseOutlines: true },
    outlineRetrievedAt: retrievedAt,
    instructor: base.instructor ?? outline.instructor,
    instructors: base.instructors?.length
      ? base.instructors
      : outline.instructor
        ? [outline.instructor]
        : [],
    prerequisiteText: outline.prerequisiteText,
    corequisites: plainText(info.corequisites),
    units: plainText(info.units),
    designation: plainText(info.designation),
    description: plainText(info.description),
    registrarNotes: plainText(info.registrarNotes),
    classNumber: plainText(info.classNumber),
    deliveryMethod: plainText(info.deliveryMethod),
    enrollmentSection: info.type === 'e' ? true : info.type === 'n' ? false : undefined,
    sectionType: kinds.length === 1 ? kinds[0] : undefined,
    scheduleNote: outline.scheduleNote,
  };
}

export async function syncTerm(term: TermCode, force = false) {
  const dir = join('.course-import', term);
  await mkdir(dir, { recursive: true });
  // A force run uses a new directory so every response in the run has a common cache lifetime.
  let run: { id: string };
  try {
    run = force
      ? { id: new Date().toISOString().replace(/[:.]/g, '-') }
      : await readJSON(join(dir, 'current-run.json'));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    run = { id: new Date().toISOString().replace(/[:.]/g, '-') };
  }
  if (!/^[\dTZ-]+$/.test(run.id)) throw Error('Invalid run directory');
  await writeJSON(join(dir, 'current-run.json'), run);
  const runDir = join(dir, run.id),
    data = await discoverSubjects(term, runDir);
  const subjects = subjectsFromOfferings(data.courses),
    failedSubjects: string[] = [],
    enrichmentFailures: CourseManifest['enrichmentFailures'] = [];
  const all: CourseOffering[] = [];
  for (const subject of subjects) {
    const file = join(runDir, subject + '.json');
    try {
      let saved:
        { dataset: OfferingDataset; failures: CourseManifest['enrichmentFailures'] } | undefined;
      try {
        saved = await readJSON(file);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }
      if (!saved) {
        const failures: CourseManifest['enrichmentFailures'] = [];
        const courses = await mapBounded(
          data.courses.filter((c) => c.department === subject),
          async (base) => {
            const path = `${offeringTerms[term].path}/${base.department.toLowerCase()}/${base.courseNumber.toLowerCase()}/${base.section.toLowerCase()}`;
            const outlineCache = join(
              runDir,
              'outlines',
              `${base.department}-${base.courseNumber}-${base.section}.json`,
            );
            let result: { course: CourseOffering; reason?: string };
            try {
              result = await readJSON(outlineCache);
            } catch (e) {
              if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
              try {
                const enriched = enrichOffering(
                  base,
                  await getPublicJSON(`https://www.sfu.ca/bin/wcm/course-outlines?${path}`),
                  new Date().toISOString(),
                );
                validateOfferings({ ...data, courses: [enriched] });
                result = { course: enriched };
              } catch (error) {
                result = {
                  course: base,
                  reason:
                    error instanceof HttpError
                      ? `Outline HTTP ${error.status}`
                      : error instanceof Error
                        ? error.message
                        : 'Outline unavailable',
                };
              }
              await writeJSON(outlineCache, result);
            }
            if (result.reason)
              failures.push({ code: base.code, section: base.section, reason: result.reason });
            return result.course;
          },
        );
        saved = { dataset: { ...data, courses }, failures };
        validateOfferings(saved.dataset);
        await writeJSON(file, saved);
      }
      validateOfferings(saved.dataset);
      const expected = data.courses
        .filter((c) => c.department === subject)
        .map(courseId)
        .sort();
      if (JSON.stringify(saved.dataset.courses.map(courseId).sort()) !== JSON.stringify(expected))
        throw Error('Subject differs from discovery universe');
      all.push(...saved.dataset.courses);
      enrichmentFailures.push(...saved.failures);
      console.log(
        `${term} ${subject}: ${saved.dataset.courses.length} sections (${saved.failures.length} outlines unavailable)`,
      );
    } catch (error) {
      failedSubjects.push(subject);
      console.error(
        `${term} ${subject}: ${error instanceof Error ? error.message : 'Subject failed'}`,
      );
    }
  }
  const prefix = `snapshots/${run.id}`;
  const manifest: CourseManifest = {
    schemaVersion: 2,
    termCode: term,
    termLabel: offeringTerms[term].label,
    source: 'SFU CourSys',
    snapshotAt: data.snapshotAt,
    completedAt: new Date().toISOString(),
    subjectCount: subjects.length,
    courseCount: new Set(all.map((c) => c.code)).size,
    sectionCount: all.length,
    sourceSectionCount: data.courses.length,
    subjects: subjects.map((code) => ({
      code,
      courseCount: new Set(all.filter((c) => c.department === code).map((c) => c.code)).size,
      sectionCount: all.filter((c) => c.department === code).length,
      file: `${prefix}/${code}.json`,
    })),
    failedSubjects,
    complete: failedSubjects.length === 0 && all.length === data.courses.length,
    indexFile: `${prefix}/index.json`,
    enrollmentSections: all.filter((c) => c.enrollmentSection === true).length,
    tutorialLabSections: all.filter((c) => ['TUT', 'LAB'].includes(c.sectionType ?? '')).length,
    withSchedules: all.filter((c) => c.meetings.length).length,
    withoutSchedules: all.filter((c) => !c.meetings.length).length,
    withEnrollment: all.filter((c) => c.enrollment).length,
    enrichedSections: all.filter((c) => c.source?.courseOutlines).length,
    enrichmentFailures,
  };
  await writeJSON(join(dir, 'report.json'), manifest);
  if (!manifest.complete)
    throw Error('Incomplete import: production preserved. See staging report.json.');
  validateManifest(manifest);
  const candidate = join(dir, 'candidate');
  for (const s of manifest.subjects)
    await writeJSON(join(candidate, s.file), {
      ...data,
      courses: all.filter((c) => c.department === s.code),
    });
  // The all-subject index omits long detail text; selected subject details load on demand.
  const summaries = all.map((c) => {
    const summary = { ...c };
    delete summary.description;
    delete summary.registrarNotes;
    delete summary.prerequisiteText;
    delete summary.corequisites;
    return summary;
  });
  await writeJSON(join(candidate, manifest.indexFile), { ...data, courses: summaries });
  await writeJSON(join(candidate, 'subjects.json'), {
    termCode: term,
    snapshotAt: data.snapshotAt,
    subjects: manifest.subjects,
  });
  await writeJSON(join(candidate, 'manifest.json'), manifest);
  await validateTermDirectory(candidate);
  console.log(
    `Validated candidate: ${term}, ${subjects.length} subjects, ${all.length} sections. Run courses:publish to promote reviewed data.`,
  );
  return manifest;
}

export async function validateTermDirectory(root: string) {
  const m: unknown = await readJSON(join(root, 'manifest.json'));
  validateManifest(m);
  if (!m.complete) throw Error('Incomplete term cannot be published');
  const subjects = await readJSON(join(root, 'subjects.json'));
  if (
    subjects.termCode !== m.termCode ||
    JSON.stringify(subjects.subjects) !== JSON.stringify(m.subjects)
  )
    throw Error('Subject directory mismatch');
  const files = await readdir(join(root, m.indexFile, '..'));
  const expected = [...m.subjects.map((s) => s.code + '.json'), 'index.json'].sort();
  if (JSON.stringify(files.sort()) !== JSON.stringify(expected))
    throw Error('Unexplained missing or extra subject file');
  const all: CourseOffering[] = [];
  for (const s of m.subjects) {
    const d: unknown = await readJSON(join(root, s.file));
    validateOfferings(d);
    if (
      d.termCode !== m.termCode ||
      d.snapshotAt !== m.snapshotAt ||
      d.courses.length !== s.sectionCount ||
      d.courses.some((c) => c.department !== s.code)
    )
      throw Error('Subject content/count mismatch');
    all.push(...d.courses);
  }
  validateOfferings({
    schemaVersion: 2,
    termCode: m.termCode,
    snapshotAt: m.snapshotAt,
    courses: all,
  });
  const index: unknown = await readJSON(join(root, m.indexFile));
  validateOfferings(index);
  if (
    index.termCode !== m.termCode ||
    JSON.stringify(index.courses.map(courseId).sort()) !== JSON.stringify(all.map(courseId).sort())
  )
    throw Error('Search index mismatch');
  if (all.length !== m.sourceSectionCount || new Set(all.map((c) => c.code)).size !== m.courseCount)
    throw Error('Source coverage mismatch');
  return { manifest: m, courses: all };
}

export async function publishTerm(term: TermCode, destination = 'public/data/courses') {
  const candidate = join('.course-import', term, 'candidate');
  const { manifest } = await validateTermDirectory(candidate);
  const target = join(destination, term);
  // Immutable versioned files first; manifest is the final atomic pointer. Old versions remain usable by in-flight clients.
  for (const file of [...manifest.subjects.map((s) => s.file), manifest.indexFile])
    await writeJSON(join(target, file), await readJSON(join(candidate, file)));
  await writeJSON(join(target, 'subjects.json'), await readJSON(join(candidate, 'subjects.json')));
  await writeJSON(join(target, 'manifest.json'), manifest);
  return manifest;
}
