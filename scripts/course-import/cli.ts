import { offeringTerms, type TermCode } from '../../src/course/courseTypes';
import { discoverSubjects, publishTerm, syncTerm, writeJSON } from './pipeline';
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
  } else if (command === 'sync') {
    const statusFile = `.course-import/${term}/last-attempt.json`;
    await writeJSON(statusFile, { status: 'running', startedAt: new Date().toISOString() });
    try {
      const result = await syncTerm(term, flags.includes('--force'));
      await writeJSON(statusFile, {
        status: 'complete',
        snapshotAt: result.snapshotAt,
        completedAt: result.completedAt,
      });
    } catch (error) {
      await writeJSON(statusFile, {
        status: 'failed',
        failedAt: new Date().toISOString(),
        complete: false,
        reason: error instanceof Error ? error.message : 'Unknown import failure',
      });
      throw error;
    }
  } else if (command === 'publish') {
    await publishTerm(term);
    console.log(`Published validated ${term} snapshot`);
  } else throw Error('Unknown command');
}
