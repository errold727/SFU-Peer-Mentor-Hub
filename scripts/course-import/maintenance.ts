import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { offeringTerms, type TermCode } from '../../src/course/courseTypes';
import { validateTermDirectory } from './pipeline';
const command = process.argv[2],
  root = process.argv[3] ?? 'public/data/courses';
const rows: string[] = [
  '# SFU course data status',
  '',
  'Generated from validated manifests. Coverage means every section returned by the public CourSys term index; it does not mean every possible goSFU registration component. Course Outlines only enriches that universe.',
  '',
];
for (const term of Object.keys(offeringTerms) as TermCode[]) {
  const { manifest: m, courses } = await validateTermDirectory(join(root, term));
  const index = await readFile(join(root, term, m.indexFile));
  console.log(
    `${term}: ${m.subjectCount} subjects, ${m.courseCount} courses, ${m.sectionCount} sections, complete=${m.complete}`,
  );
  rows.push(
    `## ${m.termLabel} / ${term}`,
    '',
    `- CourSys snapshot: ${m.snapshotAt}`,
    `- Enrichment completed: ${m.completedAt}`,
    `- Subjects discovered/imported: ${m.subjectCount}/${m.subjects.length}`,
    `- Course codes: ${m.courseCount}`,
    `- Sections: ${m.sectionCount} (CourSys source total ${m.sourceSectionCount})`,
    `- Confirmed enrollment sections: ${m.enrollmentSections}`,
    `- Tutorial/lab sections: ${m.tutorialLabSections}`,
    `- Sections with schedules: ${m.withSchedules}`,
    `- Sections without schedules: ${m.withoutSchedules}`,
    `- Sections with enrollment data: ${m.withEnrollment}`,
    `- Sections enriched from Course Outlines: ${m.enrichedSections}`,
    `- Failed subjects: ${m.failedSubjects.join(', ') || 'None'}`,
    `- Complete CourSys index: ${m.complete}`,
    `- All-subject index: ${(index.length / 1024).toFixed(0)} KiB raw / ${(gzipSync(index).length / 1024).toFixed(0)} KiB gzip`,
    `- Over-capacity enrollment snapshots retained: ${courses.filter((c) => c.enrollment?.enrolled !== undefined && c.enrollment.capacity !== undefined && c.enrollment.enrolled > c.enrollment.capacity).length}`,
    '',
    '| Subject | Course codes | Sections |',
    '| --- | ---: | ---: |',
    ...m.subjects.map((s) => `| ${s.code} | ${s.courseCount} | ${s.sectionCount} |`),
    '',
    '### Missing or unusable outlines',
    '',
    ...m.enrichmentFailures.map(
      (f) => `- ${f.code} ${f.section}: ${f.reason.replace(/[\r\n]/g, ' ')}`,
    ),
    '',
  );
  const folders = await readdir(join(root, term, 'snapshots'));
  if (folders.length > 2)
    console.log(
      `Maintenance note: ${term} retains ${folders.length} immutable snapshot versions; archive reviewed old versions periodically.`,
    );
}
rows.push(
  '## Interpretation',
  '',
  'Enrollment is an observed count, not a demand forecast. Above-capacity counts and zero-capacity sections are retained exactly as provided. Missing outlines, times and prerequisite fields are not fabricated. CourSys excludes cancelled and locally merged offerings. Some tutorial/lab registration components are only available through goSFU or outlines; always confirm required components.',
  '',
  'The browser fetches only a term manifest and its compact index or selected subject. Long descriptions and registrar notes load with subject details. The homepage does not fetch course JSON. Selections are memory-only.',
  '',
);
if (command === 'report') {
  await writeFile('docs/COURSE_DATA_STATUS.md', rows.join('\n'));
  console.log('Wrote docs/COURSE_DATA_STATUS.md');
} else if (command !== 'validate') throw Error('Use validate or report');
