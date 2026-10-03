import { readdir, readFile } from 'node:fs/promises';
import { validateCourseDataset } from '../../src/course/validation';
const root = process.argv[2] ?? 'public/data/courses';
let count = 0,
  files = 0;
for (const term of await readdir(root)) {
  if (!/^20\d{2}-(spring|summer|fall)$/.test(term))
    throw new Error(`Invalid term directory: ${term}`);
  for (const file of await readdir(`${root}/${term}`)) {
    if (!file.endsWith('.json') || file.endsWith('.review.json')) continue;
    const data: unknown = JSON.parse(await readFile(`${root}/${term}/${file}`, 'utf8'));
    validateCourseDataset(data);
    const [year, season] = term.split('-');
    if (
      data.courses.some(
        (c) =>
          c.department.toLowerCase() + '.json' !== file ||
          c.term.toLowerCase() !== `${season} ${year}`,
      )
    )
      throw new Error(`Dataset path mismatch: ${term}/${file}`);
    count += data.courses.length;
    files++;
    console.log(`VALID ${term}/${file}: ${data.courses.length} offerings`);
  }
}
console.log(`${count} offerings validated across ${files} datasets.`);
