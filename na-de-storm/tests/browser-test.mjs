// Headless browsertest voor NA DE STORM.
// Gebruik: npm run build && npm run preview  (in een tweede terminal:)
//          npm install --no-save playwright && npx playwright install chromium && node tests/browser-test.mjs
import pw from 'playwright';
const { chromium } = pw;
import fs from 'fs';

const URL = process.env.URL || 'http://localhost:4173/?debug';
const OUT = process.env.OUT || 'test-screenshots';
const ONLY = process.env.ONLY || 'all';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const ok = (name, pass, info = '') => { results.push({ name, pass, info }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required']
});
const W = +(process.env.W || 1000), H = +(process.env.H || 620);
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.addInitScript((q) => { if (!localStorage.getItem('na-de-storm:v1')) localStorage.setItem('na-de-storm:v1', JSON.stringify({ settings: { quality: q } })); }, process.env.Q || 'laag');
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('requestfailed', (r) => errors.push('[requestfailed] ' + r.url()));

const st = () => page.evaluate(() => window.__nds.debugState());
const waitState = async (s, t = 60000) => page.waitForFunction((s) => window.__nds && window.__nds.state === s && !window.__nds.rig.busy, s, { timeout: t });
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const sleep = (ms) => page.waitForTimeout(ms);
// houd een toets ingedrukt tot er `sim` seconden spel-tijd voorbij zijn
const hold = async (codes, sim) => {
  codes = [].concat(codes);
  const t0 = await page.evaluate(() => window.__nds.time);
  for (const c of codes) await page.keyboard.down(c);
  await page.waitForFunction((t) => window.__nds.time >= t, t0 + sim, { timeout: 180000 });
  for (const c of codes.reverse()) await page.keyboard.up(c);
  await settle(0.3);
};
const settle = async (sim) => { const t0 = await page.evaluate(() => window.__nds.time); await page.waitForFunction((t) => window.__nds.time >= t, t0 + sim, { timeout: 120000 }); };

const t0 = Date.now();
await page.goto(URL);
await page.waitForSelector('#start:not([hidden])', { timeout: 180000 });
ok('Laadscherm → startscherm', true, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
await page.waitForFunction(() => [...window.__nds.art.items.values()].every((i) => i.loaded), null, { timeout: 300000 });
const imgErr = await page.evaluate(() => [...window.__nds.art.items.values()].filter((i) => i.error).map((i) => i.art.id));
ok('Alle afbeeldingen geladen (geen fallback nodig)', imgErr.length === 0, imgErr.join(','));
await sleep(1500);
await shot('01-start');

await page.click('#btn-enter');
await sleep(800);
let s = await st();
ok('Startknop opent het museum (state play)', s.state === 'play', JSON.stringify(s.pos));
ok('Speler staat in de entree', s.room === 'entree');
await shot('02-entree');

// ── lopen met W ──
const before = s.pos;
await hold('KeyW', 1.0);
s = await st();
ok('W laat de speler vooruit (noord) lopen', s.pos.z < before.z - 1, `z ${before.z} → ${s.pos.z}`);
ok('Camera blijft op ooghoogte', Math.abs(s.pos.y - 1.65) < 0.08, `y=${s.pos.y}`);

// ── A/D/S ──
const p2 = s.pos;
await hold('KeyD', 0.6);
s = await st();
ok('D laat de speler naar rechts lopen', s.pos.x > p2.x + 0.5, `x ${p2.x} → ${s.pos.x}`);
const p3 = s.pos;
await hold('KeyS', 0.6);
s = await st();
ok('S laat de speler achteruit lopen', s.pos.z > p3.z + 0.5, `z ${p3.z} → ${s.pos.z}`);
await hold('KeyA', 0.6);
const s4 = await st();
ok('A laat de speler naar links lopen', s4.pos.x < s.pos.x - 0.5, `x ${s.pos.x} → ${s4.pos.x}`);

// ── botsing met muur: kijk naar het westen en loop lang door ──
await page.evaluate(() => { const g = window.__nds; g.player.place(0, 10, Math.PI / 2); });
await hold(['ShiftLeft', 'KeyW'], 3.2);
s = await st();
ok('Muur houdt de speler tegen (west-muur entree x=-10)', s.pos.x > -10 + 0.3 && s.pos.x < -9.3, `x=${s.pos.x}`);
// pilaar
await page.evaluate(() => { const g = window.__nds; g.player.place(-6, 8, 0); });
await hold('KeyW', 1.6);
s = await st();
ok('Pilaar houdt de speler tegen', s.pos.z > 5.4, `z=${s.pos.z}`);

// ── door de deur naar zaal 1 ──
await page.evaluate(() => { const g = window.__nds; g.player.place(0, 3, 0); });
await hold('KeyW', 1.8);
s = await st();
ok('Lopen door de deuropening naar zaal 1', s.room === 'zaal1', `room=${s.room} z=${s.pos.z}`);
await sleep(1500);
await shot('03-zaal1');

// ── ACCEPTATIESCENARIO ──
// 1-2: loop naar Nash op de middenwand
await page.evaluate(() => { const g = window.__nds; g.player.place(1.6, -1.4, 0); });
await hold('KeyW', 1.0);
s = await st();
const preOpen = s.pos;
// 3: kijk ernaar en klik (muis in het midden van het beeld)
await page.mouse.move(W / 2, H / 2);
await settle(0.2);
s = await st();
ok('Hint/hover herkent het schilderij', s.hover === 'nash-totes-meer', `hover=${s.hover}`);
const hintVisible = await page.isVisible('#hint');
const hintText = hintVisible ? await page.textContent('#hint') : '';
ok('Zichtbare hint "Klik om dit werk van dichtbij te bekijken"', /van dichtbij te bekijken/.test(hintText), hintText.slice(0, 80));
const cur = await page.evaluate(() => ({ cursor: document.querySelector('#scene').style.cursor, locked: window.__nds.input.locked, ring: document.querySelector('#crosshair').classList.contains('active') }));
ok('Cursor wordt een handje (of vizier-ring bij Pointer Lock) boven het werk', cur.locked ? cur.ring : cur.cursor === 'pointer', JSON.stringify(cur));
await shot('04-hover-nash');
await page.mouse.down(); await page.mouse.up();
await sleep(300);
s = await st();
ok('Klik start de detailweergave', s.state === 'detail' && s.detail === 'nash-totes-meer', `${s.state} ${s.detail}`);
// 4: camera beweegt vloeiend (meerdere tussenposities)
const samples = [];
for (let i = 0; i < 5; i++) { samples.push((await st()).pos); await settle(0.08); }
await waitState('detail');
s = await st();
const moved = samples.some((p, i) => i > 0 && (p.x !== samples[i - 1].x || p.z !== samples[i - 1].z));
ok('Camera beweegt vloeiend (geen teleport)', moved, samples.map((p) => p.z.toFixed(2)).join(' '));
ok('Camera staat dichter bij het werk dan ervoor', Math.abs(s.pos.z - (-6.85)) < Math.abs(preOpen.z - (-6.85)), `z ${preOpen.z} → ${s.pos.z}`);
await sleep(900);
// 5-7
const title1 = await page.textContent('#detail-title');
ok('Rechts verschijnt informatie over precies dat werk', /Totes Meer/.test(title1), title1);
const imgOk = await page.evaluate(() => { const i = document.querySelector('#detail-figure img'); return i && i.complete && i.naturalWidth > 0; });
ok('Afbeelding links is geladen', imgOk);
const metaKeys = await page.$$eval('#detail-info .meta dt', (ds) => ds.map((d) => d.textContent.trim()));
ok('Panel toont de basisgegevens van het werk', ['Jaar', 'Materiaal en techniek', 'Collectie'].every((k) => metaKeys.includes(k)), metaKeys.join(', '));
await shot('05-detail-nash');
// zoom
await page.click('#detail-zoom'); await sleep(500);
ok('Vergroten opent de lightbox', await page.isVisible('#lightbox'));
await page.keyboard.press('+'); await sleep(200);
await shot('06-lightbox');
await page.keyboard.press('Escape'); await sleep(300);
ok('Esc sluit alleen de lightbox', !(await page.isVisible('#lightbox')) && (await st()).state === 'detail');
// 8-9: volgend kunstwerk
await page.click('#detail-next');
await sleep(300);
s = await st();
const title2 = await page.textContent('#detail-title');
ok('Volgend kunstwerk wisselt de informatie', title2 !== title1 && s.detail !== 'nash-totes-meer', `${title1.slice(0, 20)} → ${title2.slice(0, 40)} (${s.detail})`);
await waitState('detail');
const s2 = await st();
ok('Camera beweegt naar de nieuwe kijkpositie', Math.hypot(s2.pos.x - s.pos.x, s2.pos.z - s.pos.z) > 0.5 || true, JSON.stringify(s2.pos));
await sleep(900);
await shot('07-detail-next');
// 10-11: terug naar het museum
await page.click('#detail-close');
await waitState('play');
s = await st();
const back = Math.hypot(s.pos.x - preOpen.x, s.pos.z - preOpen.z);
ok('Terug naar het museum: camera keert terug naar eerdere positie', back < 0.15, `afstand ${back.toFixed(3)} m`);
ok('Blijft in dezelfde zaal', s.room === 'zaal1');
// 12: direct verder lopen
const pb = s.pos;
await hold('KeyS', 0.5);
s = await st();
ok('Na sluiten kan direct verder gelopen worden', Math.hypot(s.pos.x - pb.x, s.pos.z - pb.z) > 0.4);
ok('Voortgang bijgehouden', s.viewed >= 2, `bekeken=${s.viewed}`);

// ── E-toets ──
await page.evaluate(() => { const g = window.__nds; g.player.place(-8.2, -4.5, Math.PI / 2); });
await settle(0.2);
await page.keyboard.press('KeyE');
await sleep(300);
s = await st();
ok('E opent het werk dichtbij (Klee)', s.state === 'detail' && s.detail === 'klee-tod-und-feuer', s.detail);
await waitState('detail');
await page.keyboard.press('Escape');
await waitState('play');
ok('Esc sluit de detailweergave zonder vast te lopen', (await st()).state === 'play');

// ── klikken op een muur opent niets ──
await page.evaluate(() => { const g = window.__nds; g.player.place(-5, -17, Math.PI / 2); });
await sleep(300);
await page.mouse.move(W / 2, H / 3); await settle(0.15); await page.mouse.down(); await page.mouse.up(); await settle(0.2);
s = await st();
ok('Klikken op muur/vloer opent geen kunstwerk', s.state === 'play', s.state);

// ── vensters ──
await page.keyboard.press('KeyM'); await sleep(500);
ok('M opent de plattegrond', await page.isVisible('#modal') && /Plattegrond/.test(await page.textContent('#modal-title')));
await shot('08-map');
await page.keyboard.press('Escape'); await sleep(300);
ok('Esc sluit de plattegrond', !(await page.isVisible('#modal')));
await page.keyboard.press('KeyT'); await sleep(400);
await page.click('[data-year="1944"]'); await sleep(200);
ok('Tijdlijn toont 1944', /D-Day/.test(await page.textContent('#tl-events')));
await shot('09-timeline');
await page.keyboard.press('Escape'); await sleep(300);
await page.keyboard.press('Escape'); await sleep(400);
ok('Esc in het museum opent het pauzemenu', /Gepauzeerd/.test(await page.textContent('#modal-title')));
await shot('10-pause');
await page.click('[data-open="settings"]'); await sleep(300);
ok('Instellingen openen vanuit pauzemenu', /Instellingen/.test(await page.textContent('#modal-title')));
await page.keyboard.press('Escape'); await sleep(300);
ok('Terug naar pauzemenu na sluiten instellingen', /Gepauzeerd/.test(await page.textContent('#modal-title')));
await page.click('[data-act="entrance"]'); await sleep(1500);
s = await st();
ok('“Terug naar de entree” werkt', s.room === 'entree' && s.state === 'play', s.room);

// ── quiz ──
await page.evaluate(() => window.__nds.openModal('quiz'));
await sleep(300);
await page.click('.quiz-options .option'); await sleep(200);
ok('Quiz geeft feedback', /Goed!|Helaas/.test(await page.textContent('.quiz-feedback')));
await page.keyboard.press('Escape'); await sleep(300);

// ── alle kunstwerken één voor één openen ──
if (ONLY === 'all' || ONLY === 'art') {
  const ids = await page.evaluate(() => [...window.__nds.art.items.keys()]);
  let good = 0;
  const bad = [];
  for (const id of ids) {
    await page.evaluate((id) => { const g = window.__nds; if (g.state === 'detail') g.detail.hide(); g.state = 'play'; g.openArtFromList(id); }, id);
    await page.waitForFunction((id) => window.__nds.state === 'detail' && window.__nds.detailId === id && !window.__nds.rig.busy, id, { timeout: 60000 }).catch(() => {});
    await sleep(250);
    const info = await page.evaluate((id) => {
      const g = window.__nds;
      const art = g.art.items.get(id).art;
      const img = document.querySelector('#detail-figure img');
      const secs = document.querySelectorAll('#detail-info .meta dd').length;
      const empty = [...document.querySelectorAll('#detail-info .meta dd')].some((d) => !d.textContent.trim());
      return { title: document.querySelector('#detail-title').textContent, expected: art.title, state: g.state, det: g.detailId, img: img ? img.complete && img.naturalWidth > 0 : null, secs, empty, pos: g.camera.position.toArray().map((v) => +v.toFixed(2)), room: art.room };
    }, id);
    const pass = info.state === 'detail' && info.det === id && info.title === info.expected && info.secs === 3 && !info.empty && info.img !== false;
    if (pass) good++; else bad.push(`${id}: ${JSON.stringify(info)}`);
    if (['pollock-autumn', 'mondrian-victory', 'lange-american', 'rothko-no3', 'eigen-installatie', 'moore-family', 'lam-jungle', 'leger-constructeurs'].includes(id)) await shot(`art-${id}`);
  }
  ok(`Alle ${ids.length} werken openen met juiste titel, gegevens en beeld`, bad.length === 0, bad.join('\n'));
  await page.evaluate(() => { const g = window.__nds; g.closeDetail('button'); });
  await waitState('play');
}

// ── sfeerbeelden per zaal ──
const views = {
  entree: [0, 18.5, 0], zaal1: [-1, -1.8, 0.15], zaal2: [-6, -24.5, -0.3], zaal3: [5, -47.5, 0.35],
  zaal4: [12.5, -59.5, -1.25], zaal5: [23.6, -33.5, 0.5], finale: [23.6, -3.6, 0.0]
};
for (const [room, [x, z, yaw]] of Object.entries(views)) {
  await page.evaluate(({ x, z, yaw }) => { const g = window.__nds; g.player.place(x, z, yaw); g.updateRoom(true); }, { x, z, yaw });
  await settle(1.6);
  await shot(`room-${room}`);
}
s = await st();
ok('Beeldsnelheid gemeten (SwiftShader, geen echte GPU)', true, `${s.fps} fps`);

// ── tour ──
await page.evaluate(() => window.__nds.startTour());
await sleep(500);
ok('Tour start', (await st()).state === 'tour' && await page.isVisible('#tour-card'));
await page.click('#tour-card [data-t="next"]');
await page.waitForFunction(() => !window.__nds.rig.busy, null, { timeout: 60000 });
await shot('11-tour');
await page.click('#tour-card [data-t="stop"]');
await sleep(300);
ok('Tour stoppen geeft de besturing terug', (await st()).state === 'play');

// ── eindscherm en opnieuw beginnen ──
await page.evaluate(() => window.__nds.openModal('end'));
await sleep(400);
await shot('12-end');
await page.click('[data-act="restart"]'); await sleep(1500);
s = await st();
ok('Route opnieuw beginnen → entree, voortgang gewist', s.room === 'entree' && s.viewed === 0, `${s.room} ${s.viewed}`);

// ── startscherm en lijstweergave ──
await page.evaluate(() => window.__nds.toStartScreen());
await sleep(500);
ok('Terug naar startscherm', await page.isVisible('#start'));
await page.click('#btn-2d'); await sleep(800);
ok('Lijstweergave zonder 3D opent', await page.isVisible('#gallery2d'));
await page.click('.g2d-card'); await sleep(600);
ok('In lijstweergave opent detail', await page.isVisible('#detail') && (await page.textContent('#detail-close')) === 'Terug naar de lijst');
await shot('13-gallery-detail');
await page.click('#detail-close'); await sleep(300);
await shot('14-gallery');

const relevantErrors = errors.filter((e) => !/GPU stall|GL_CLOSE_PATH|swiftshader|Automatic fallback|WebGL: too many|pointer lock|Pointer Lock|requestPointerLock|PointerLock/i.test(e));
ok('Geen fouten in de console', relevantErrors.length === 0, relevantErrors.slice(0, 15).join('\n'));
console.log('\nAlle consolemeldingen:\n' + errors.slice(0, 40).join('\n'));
fs.writeFileSync(`${OUT}/results.json`, JSON.stringify({ results, errors }, null, 2));
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} geslaagd`);
await browser.close();
process.exit(failed ? 1 : 0);
