// Copy three.js + addons from node_modules into vendor/ (pure fs, no spawn).
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcThree = join(root, 'node_modules', 'three', 'build', 'three.module.js');
const srcJsm = join(root, 'node_modules', 'three', 'examples', 'jsm');
const dst = join(root, 'vendor');

mkdirSync(dst, { recursive: true });
cpSync(srcThree, join(dst, 'three.module.js'));
rmSync(join(dst, 'jsm'), { recursive: true, force: true });
cpSync(srcJsm, join(dst, 'jsm'), { recursive: true });
console.log('vendor: three.module.js + examples/jsm copied to vendor/');
