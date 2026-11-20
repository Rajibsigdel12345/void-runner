import { chromium } from 'playwright-core';
import fs from 'node:fs';
const CH = 'C:/Users/rajib/AppData/Local/Google/Chrome/Application/chrome.exe';
const SRC = 'public/icon-512.png';
const OUT = 'public/icon-192.png';
const SIZE = 192;
const b64 = fs.readFileSync(SRC).toString('base64');
const html = '<!doctype html><html><body><canvas id="c" width="' + SIZE + '" height="' + SIZE + '"></canvas><script>' +
  'var img = new Image();' +
  'img.onload = function(){ var c=document.getElementById("c"); var x=c.getContext("2d"); x.imageSmoothingEnabled=true; x.imageSmoothingQuality="high"; x.clearRect(0,0,' + SIZE + ',' + SIZE + '); x.drawImage(img,0,0,' + SIZE + ',' + SIZE + '); document.title="DONE:" + c.toDataURL("image/png"); };' +
  'img.onerror = function(){ document.title="ERR"; };' +
  'img.src="data:image/png;base64,' + b64 + '";' +
  '<\/script></body></html>';
const browser = await chromium.launch({ executablePath: CH, headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const dataUrl = await page.waitForFunction(() => document.title && document.title.indexOf('DONE:') === 0, null, { timeout: 15000 }).then(() => page.evaluate(() => document.title));
if (dataUrl.indexOf('ERR') === 0) { await browser.close(); console.log('ICON_GEN_ERR'); process.exit(2); }
const png = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
fs.writeFileSync(OUT, png);
// verify PNG header: sig + IHDR dims at offset 16..23 (big-endian)
const sig = png.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
console.log('ICON192_DONE sig_ok=' + sig + ' w=' + w + ' h=' + h + ' bytes=' + png.length);
await browser.close();
process.exit(sig && w === SIZE && h === SIZE ? 0 : 3);