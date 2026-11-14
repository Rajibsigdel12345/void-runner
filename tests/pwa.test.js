// ST-319 (I348): PWA conformance - manifest parse + icon budget + SW/wiring sanity (DOM-free).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'public', 'manifest.webmanifest');
const iconPath = join(root, 'public', 'icon-512.png');
const swPath = join(root, 'public', 'sw.js');

function manifest() { return JSON.parse(readFileSync(manifestPath, 'utf8')); }

test('pwa: manifest parses as JSON', () => {
  const m = manifest();
  assert.equal(typeof m, 'object');
  assert.ok(m !== null);
});

test('pwa: manifest installability fields (R-E37-5)', () => {
  const m = manifest();
  assert.ok(m.name && m.name.length >= 1);
  assert.ok(m.short_name && m.short_name.length >= 1);
  assert.equal(m.display, 'standalone');
  assert.match(m.theme_color, /^#[0-9a-fA-F]{6}$/);
  assert.match(m.background_color, /^#[0-9a-fA-F]{6}$/);
  assert.ok(m.start_url);
  assert.ok(m.scope);
});

test('pwa: manifest icon entry valid (512 any maskable)', () => {
  const m = manifest();
  assert.ok(Array.isArray(m.icons) && m.icons.length >= 1);
  const ic = m.icons[0];
  assert.equal(ic.sizes, '512x512');
  assert.equal(ic.type, 'image/png');
  assert.ok(typeof ic.purpose === 'string');
  assert.ok(ic.purpose.split(' ').includes('any'));
  assert.ok(ic.purpose.split(' ').includes('maskable'));
});

test('pwa: icon is a 512x512 PNG <= 45 KB (R-E37-3)', () => {
  assert.ok(existsSync(iconPath), 'icon-512.png missing');
  const buf = readFileSync(iconPath);
  assert.equal(buf.readUInt32BE(0), 0x89504e47, 'PNG signature');
  assert.equal(buf.toString('ascii', 12, 16), 'IHDR', 'IHDR chunk');
  assert.equal(buf.readUInt32BE(16), 512, 'width');
  assert.equal(buf.readUInt32BE(20), 512, 'height');
  assert.ok(buf.length <= 46080, 'icon ' + buf.length + ' B > 45 KB');
});

test('pwa: sw.js versioned cache + precache + stale purge + offline fallback', () => {
  const s = readFileSync(swPath, 'utf8');
  assert.match(s, /const CACHE = 'vr-shell-v\d+'/);
  assert.ok(s.includes("addEventListener('install'"));
  assert.ok(s.includes("addEventListener('activate'"));
  assert.ok(s.includes("addEventListener('fetch'"));
  assert.ok(s.includes('caches.delete'), 'stale purge');
  assert.ok(s.includes('./index.html'), 'shell precache/fallback');
  assert.ok(s.includes('self.skipWaiting()'));
  assert.ok(s.includes('self.clients.claim()'));
});

test('pwa: index.html wires manifest + theme-color + vr-build=dev (source of truth)', () => {
  const s = readFileSync(join(root, 'index.html'), 'utf8');
  assert.ok(s.includes('<link rel="manifest" href="./public/manifest.webmanifest" />'));
  assert.ok(s.includes('<meta name="theme-color" content="#04060f" />'));
  assert.ok(s.includes('<meta name="vr-build" content="dev" />'), 'source must stay dev (build stamps prod)');
  assert.ok(s.includes('<link rel="apple-touch-icon" href="./public/icon-512.png" />'));
});

test('pwa: build stamps prod + copies root-scope sw.js (R-E37-1/R-E37-2)', () => {
  const s = readFileSync(join(root, 'scripts', 'build.mjs'), 'utf8');
  assert.ok(s.includes('vr-build" content="prod"'), 'prod stamp');
  assert.ok(s.includes("join(dist, 'sw.js')"), 'root-scope copy');
});

test('pwa: main.js SW registration is prod-gated (R-E37-2)', () => {
  const s = readFileSync(join(root, 'src', 'main.js'), 'utf8');
  assert.ok(s.includes('meta[name="vr-build"]'));
  assert.ok(s.includes("buildMeta.content === 'prod'"));
  assert.ok(s.includes("navigator.serviceWorker.register('./sw.js')"));
});
