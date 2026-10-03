import { mkdir, writeFile, rename } from 'node:fs/promises';
import { normalizeOutline } from './normalize';
import { validateCourseDataset } from '../../src/course/validation';
import type { CourseOffering } from '../../src/course/courseTypes';
const [term, input] = process.argv.slice(2);
if (!/^20\d{2}-(spring|summer|fall)$/.test(term ?? '') || !/^[a-z]{2,5}$/i.test(input ?? ''))
  throw new Error('Usage: npm run courses:import -- 2027-spring ENGL');
const dept = input.toLowerCase(),
  prefix = `${term.replace('-', '/')}/${dept}`;
const verified = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
async function get(path: string): Promise<unknown> {
  const response = await fetch(`https://www.sfu.ca/bin/wcm/course-outlines?${path}`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status} for ${path}`);
  return response.json();
}
function list(data: unknown): Record<string, unknown>[] {
  if (
    !Array.isArray(data) ||
    data.some((x) => !x || typeof x.value !== 'string' || !/^[a-z0-9]+$/i.test(x.value))
  )
    throw new Error('Invalid source directory');
  return data;
}
const numbers = list(await get(prefix)).filter((n) => /^[1-4]\d{2}[a-z]?$/i.test(String(n.value)));
const courses: CourseOffering[] = [],
  skipped: string[] = [];
// Sequential requests bound load on the public service. Never fetch from a URL supplied by API content.
for (const n of numbers) {
  const path = `${prefix}/${n.value}`;
  let sections: Record<string, unknown>[];
  try {
    sections = list(await get(path));
  } catch (error) {
    skipped.push(`${path}: ${error instanceof Error ? error.message : 'Unavailable directory'}`);
    continue;
  }
  for (const section of sections) {
    const outlinePath = `${path}/${section.value}`;
    try {
      const course = normalizeOutline(await get(outlinePath), outlinePath, verified, section);
      validateCourseDataset({
        schemaVersion: 1,
        lastVerified: verified,
        note: 'Candidate validation',
        courses: [course],
      });
      courses.push(course);
    } catch (error) {
      skipped.push(
        `${outlinePath}: ${error instanceof Error ? error.message : 'Unavailable source'}`,
      );
    }
  }
  console.log(`${term} ${dept.toUpperCase()} ${n.value}: ${sections.length} sections reviewed`);
}
const dataset = {
  schemaVersion: 1,
  lastVerified: verified,
  note: `Reviewed official SFU API snapshot. Undergraduate 100–400 level published sections only; ${skipped.length} source records unavailable or rejected. Exams excluded. Not a complete registration schedule. Seats not supplied by this API.`,
  courses,
};
validateCourseDataset(dataset);
if (!courses.length) throw new Error('No valid offerings; existing dataset preserved');
const directory = `.course-import/${term}`;
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/${dept}.json.tmp`, JSON.stringify(dataset, null, 2) + '\n');
await rename(`${directory}/${dept}.json.tmp`, `${directory}/${dept}.json`);
await writeFile(
  `${directory}/${dept}.review.json`,
  JSON.stringify(
    { term, department: dept, verified, offerings: courses.length, skipped },
    null,
    2,
  ) + '\n',
);
console.log(
  `Candidate only: ${directory}/${dept}.json (${courses.length} offerings). Review skipped records and diff before copying into public/data/courses.`,
);
