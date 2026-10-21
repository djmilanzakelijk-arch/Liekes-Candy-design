// Bouwt één zelfstandig HTML-bestand (na-de-storm.html) met alle code,
// lettertypen en afbeeldingen erin. Handig om te mailen of lokaal te openen.
// Gebruik: npm run build:single
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

execSync('vite build', { stdio: 'inherit', env: { ...process.env, SINGLE: '1' } });

const dir = 'public/beelden';
const images = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.jpg'))) {
  images[f] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(dir, f)).toString('base64');
}
const favicon = 'data:image/svg+xml;base64,' + fs.readFileSync('public/favicon.svg').toString('base64');

let html = fs.readFileSync('dist-single/index.html', 'utf8');
html = html.replace('href="./favicon.svg"', `href="${favicon}"`);
const inject = `<script>window.__NDS_IMAGES = ${JSON.stringify(images)};</script>`;
html = html.replace('<script type="module"', inject + '\n<script type="module"');
fs.writeFileSync('na-de-storm.html', html);
console.log(`na-de-storm.html: ${(fs.statSync('na-de-storm.html').size / 1e6).toFixed(1)} MB`);
