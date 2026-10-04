import { offeringTerms, type TermCode } from '../../src/course/courseTypes';
import { discoverSubjects, publishTerm, syncTerm } from './pipeline';
import { subjectsFromOfferings } from './coursys';
const [command, argument, ...flags] = process.argv.slice(2);
const terms =
  argument === 'all' ? (Object.keys(offeringTerms) as TermCode[]) : [argument as TermCode];
if (terms.some((t) => !(t in offeringTerms)))
  throw Error('Use term 1267 (Fall 2026) or 1271 (Spring 2027). 1264 is Summer.');
for (const term of terms) {
  if (command === 'discover') {
    const d = await discoverSubjects(
      term,
      `.course-import/${term}/discovery`,
      flags.includes('--force'),
    );
    console.log(
      JSON.stringify({
        termCode: term,
        subjects: subjectsFromOfferings(d.courses),
        sectionCount: d.courses.length,
      }),
    );
  } else if (command === 'sync') await syncTerm(term, flags.includes('--force'));
  else if (command === 'publish') {
    await publishTerm(term);
    console.log(`Published validated ${term} snapshot`);
  } else throw Error('Unknown command');
}
