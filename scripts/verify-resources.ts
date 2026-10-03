import { resources } from '../src/data/resources/index';
import { auditResources, classifyResponse } from '../src/utils/resourceHealth';
const report = auditResources(resources);
console.log(
  `Resource metadata: ${resources.length} records, ${report.sources.length} unique sources`,
);
for (const e of report.errors) console.error(`INVALID ${e}`);
for (const w of report.warnings) console.log(`REVIEW ${w}`);
for (const [url, ids] of report.sharedSources)
  console.log(`SHARED SOURCE (review intentional reuse): ${ids.join(', ')} ${url}`);
let invalid = report.errors.length;
if (!process.argv.includes('--offline')) {
  // GET, not HEAD: an automated-request block is not evidence that a page is dead.
  for (const url of report.sources) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'follow' });
      const body = (await res.text()).slice(0, 200000);
      const status = classifyResponse(res.status, res.redirected, body);
      if (status === 'invalid') invalid++;
      console.log(
        `${status.toUpperCase()} ${res.status} ${url}${res.redirected ? ' → ' + res.url : ''}`,
      );
    } catch {
      console.log(`UNVERIFIED network timeout or unavailable: ${url}`);
    }
  }
}
console.log(
  'Link reachability is not factual verification. Review source content before changing lastVerified.',
);
process.exitCode = invalid ? 1 : 0;
