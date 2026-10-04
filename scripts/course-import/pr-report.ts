import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import {
  courseId,
  type CourseManifest,
  type CourseOffering,
  type OfferingDataset,
  type TermCode,
} from '../../src/course/courseTypes';
import { validateTermDirectory } from './pipeline';
function oldJSON(path: string) {
  try {
    return JSON.parse(
      execFileSync('git', ['show', `origin/main:${path}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    );
  } catch {
    return undefined;
  }
}
function content(c: CourseOffering) {
  const copy = { ...c };
  delete copy.snapshotAt;
  delete copy.outlineRetrievedAt;
  return JSON.stringify(copy);
}
const rows = [
  '# Reviewed SFU offering refresh',
  '',
  'CourSys supplies the offering universe; missing outlines remain present. Promotion requires complete, validated subject coverage. This PR does not auto-merge.',
  '',
  '| Term | Subjects | Courses | Sections | Added | Removed | Changed | Failed subjects |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
];
for (const term of ['1267', '1271'] as TermCode[]) {
  const { manifest: m, courses } = await validateTermDirectory(`public/data/courses/${term}`);
  const oldManifest = oldJSON(`public/data/courses/${term}/manifest.json`) as
    CourseManifest | undefined;
  const oldCourses: CourseOffering[] = [];
  if (oldManifest)
    for (const subject of oldManifest.subjects) {
      const d = oldJSON(`public/data/courses/${term}/${subject.file}`) as
        OfferingDataset | undefined;
      if (d) oldCourses.push(...d.courses);
    }
  const old = new Map(oldCourses.map((c) => [courseId(c), content(c)])),
    next = new Map(courses.map((c) => [courseId(c), content(c)]));
  rows.push(
    `| ${m.termLabel} / ${term} | ${m.subjectCount} | ${m.courseCount} | ${m.sectionCount} | ${[...next.keys()].filter((k) => !old.has(k)).length} | ${[...old.keys()].filter((k) => !next.has(k)).length} | ${[...next].filter(([k, v]) => old.has(k) && old.get(k) !== v).length} | ${m.failedSubjects.join(', ') || 'None'} |`,
  );
}
rows.push(
  '',
  'See docs/COURSE_DATA_STATUS.md for snapshot timestamps, enrollment counts, enrichment coverage and unavailable outlines. Counts describe source snapshots, not enrollment predictions.',
  '',
);
await writeFile('.course-import/sync-pr.md', rows.join('\n'));
