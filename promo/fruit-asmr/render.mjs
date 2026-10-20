// Captures scene.js frame-by-frame with headless Chromium and encodes it.
//
//   node render.mjs                       → out/frames.mp4 + out/events.json
//   node render.mjs --stills 1,3.2,12.8   → out/still-<t>.png only
//
// Playwright is resolved from PLAYWRIGHT_DIR or the global install.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
fs.mkdirSync(out, { recursive: true });

const require = createRequire(import.meta.url);
const pwDir = process.env.PLAYWRIGHT_DIR || '/opt/node-tools/node_modules/playwright';
const { chromium } = require(pwDir);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const file = path.join(here, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(here) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html?capture`;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => { console.error('[page error]', e); process.exitCode = 1; });
await page.goto(url);
await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
const info = await page.evaluate(() => ({ fontOk: window.SCENE.fontOk, duration: window.SCENE.duration, events: window.SCENE.events }));
console.log(`font loaded: ${info.fontOk}, duration ${info.duration}s, ${info.events.length} sound events`);

const grab = t => page.evaluate(t => {
  window.SCENE.render(t);
  return document.getElementById('c').toDataURL('image/png');
}, t);

const stillsArg = process.argv.indexOf('--stills');
if (stillsArg > 0) {
  for (const t of process.argv[stillsArg + 1].split(',').map(Number)) {
    const data = await grab(t);
    const file = path.join(out, `still-${t.toFixed(2)}.png`);
    fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
    console.log('wrote', file);
  }
} else {
  fs.writeFileSync(path.join(out, 'events.json'), JSON.stringify(info, null, 1));
  const fps = 30;
  const frames = Math.round(info.duration * fps);
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    path.join(out, 'frames.mp4'),
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const started = Date.now();
  for (let i = 0; i < frames; i++) {
    const data = await grab(i / fps);
    const buf = Buffer.from(data.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 30 === 0) console.log(`frame ${i}/${frames} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
  console.log('wrote', path.join(out, 'frames.mp4'));
}

await browser.close();
server.close();
