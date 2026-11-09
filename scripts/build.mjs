// "Build": assemble a static dist/ (index.html + src + vendor + public). No bundler, no spawn.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'index.html'), join(dist, 'index.html'));
for (const d of ['src', 'vendor', 'public']) {
  const src = join(root, d);
  try { cpSync(src, join(dist, d), { recursive: true }); } catch { /* optional dir */ }
}
console.log('build: dist/ assembled (static, import-map modules)');
