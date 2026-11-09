// In-process test runner: imports every tests/*.test.js into one node process
// (avoids child-process spawning, which the sandbox blocks).
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const testsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests');
const files = readdirSync(testsDir).filter(f => f.endsWith('.test.js')).sort();
if (files.length === 0) { console.error('no test files found in tests/'); process.exit(1); }
for (const f of files) {
  await import(pathToFileURL(join(testsDir, f)).href);
  console.log(`loaded ${f}`);
}
console.log(`\nrunner: imported ${files.length} test files; node:test will report results and set exit code.`);
