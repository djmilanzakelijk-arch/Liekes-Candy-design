import { esc, tag, link } from './dom.js';
import { ROOMS, ROOM_BY_ID } from '../data/rooms.js';
import { ARTWORKS, ART_BY_ID, ACCESSED, isCounted } from '../data/artworks.js';
import { EXHIBITION, ABOUT, CURATORS, CURATOR_NOTE, ROOM_TEXTS, GLOSSARY, REFLECTION, INSIGHTS } from '../data/texts.js';
import { TIMELINE, TIMELINE_YEARS } from '../data/timeline.js';
import { QUIZ } from '../data/quiz.js';
import { drawMap } from './map.js';

// Elk venster is een functie die { title, html, bind } teruggeeft.
// `g` is de game-API (acties zoals reizen, openen, instellingen).

export const MODALS = {
  pause(g) {
    return {
      title: 'Gepauzeerd',
      wide: false,
      html: `
        <div class="menu-grid">
          <button class="btn primary large" data-act="resume">Verder in het museum</button>
          <button class="btn ghost" data-open="map">Plattegrond <kbd>M</kbd></button>
          <button class="btn ghost" data-open="collection">Bekeken werken <kbd>C</kbd></button>
          <button class="btn ghost" data-open="timeline">Tijdlijn <kbd>T</kbd></button>
          <button class="btn ghost" data-act="tour">${g.tourActive ? 'Tour stoppen' : 'Start de korte tour'}</button>
          <button class="btn ghost" data-open="about">Over de tentoonstelling</button>
          <button class="btn ghost" data-open="quiz">Quiz</button>
          <button class="btn ghost" data-open="reflection">Reflectie</button>
          <button class="btn ghost" data-open="sources">Bronnen</button>
          <button class="btn ghost" data-open="credits">Credits</button>
          <button class="btn ghost" data-open="settings">Instellingen en toegankelijkheid</button>
          <button class="btn ghost" data-open="help">Bediening <kbd>H</kbd></button>
          <button class="btn ghost" data-act="entrance">Terug naar de entree</button>
          <button class="btn ghost" data-open="end">Afronden</button>
          <button class="btn ghost" data-act="startscreen">Naar het startscherm</button>
        </div>`,
      bind(root) {
        root.querySelector('[data-act="resume"]').addEventListener('click', () => g.resume(true));
        root.querySelector('[data-act="tour"]').addEventListener('click', () => (g.tourActive ? g.stopTour() : g.startTour()));
        root.querySelector('[data-act="entrance"]').addEventListener('click', () => g.travelTo('entree'));
        root.querySelector('[data-act="startscreen"]').addEventListener('click', () => g.toStartScreen());
      }
    };
  },

  help() {
    const rows = [
      ['W A S D of pijltjes', 'Lopen'], ['Muis', 'Rondkijken (na klikken in het beeld)'], ['Shift', 'Rennen'],
      ['E of klikken', 'Kunstwerk of zaaltekst bekijken'], ['Esc', 'Menu, of een venster sluiten'],
      ['M', 'Plattegrond'], ['T', 'Tijdlijn'], ['C', 'Bekeken werken'], ['G', 'Geluid aan/uit'],
      ['F', 'Volledig scherm'], ['H', 'Deze hulp'],
      ['← / →', 'In de detailweergave: vorig/volgend werk'], ['Z', 'In de detailweergave: vergroten']
    ];
    return {
      title: 'Bediening',
      html: `
        <p>Je loopt zelf door het museum, in de ik-persoon. Klik eerst in het beeld: dan neemt de muis de kijkrichting over (Pointer Lock). Met <kbd>Esc</kbd> krijg je de muis terug.</p>
        <table class="keys">${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
        <h3>Op een tablet of telefoon</h3>
        <p>Sleep met je linkerduim om te lopen en met je rechterduim om rond te kijken. Tik op een werk om het te bekijken. De ervaring is gemaakt voor een laptop of computer; op kleine schermen werkt de <em>lijstweergave zonder 3D</em> vaak prettiger.</p>
        <h3>Toegankelijkheid</h3>
        <p>Alle knoppen werken met <kbd>Tab</kbd> en <kbd>Enter</kbd>. In <em>Instellingen</em> kun je de muisgevoeligheid, loopbeweging, bewegingen, tekstgrootte en contrast aanpassen.</p>`
    };
  },

  settings(g) {
    const s = g.settings;
    return {
      title: 'Instellingen en toegankelijkheid',
      html: `
        <div class="settings">
          <label class="row"><span>Muisgevoeligheid</span><input type="range" min="0.3" max="2.5" step="0.1" value="${s.sensitivity}" data-set="sensitivity"><output>${s.sensitivity.toFixed(1)}</output></label>
          <label class="row"><span>Gezichtsveld</span><input type="range" min="55" max="85" step="1" value="${s.fov}" data-set="fov"><output>${s.fov}°</output></label>
          <label class="row"><span>Volume</span><input type="range" min="0" max="1" step="0.05" value="${s.volume}" data-set="volume"><output>${Math.round(s.volume * 100)}%</output></label>
          <label class="row check"><input type="checkbox" data-set="muted" ${s.muted ? 'checked' : ''}><span>Geluid uit</span></label>
          <label class="row check"><input type="checkbox" data-set="headBob" ${s.headBob ? 'checked' : ''}><span>Subtiele loopbeweging</span></label>
          <label class="row check"><input type="checkbox" data-set="reducedMotion" ${s.reducedMotion ? 'checked' : ''}><span>Minder beweging (korte camera-overgangen, geen deining)</span></label>
          <label class="row check"><input type="checkbox" data-set="invertY" ${s.invertY ? 'checked' : ''}><span>Verticale muisrichting omkeren</span></label>
          <label class="row check"><input type="checkbox" data-set="dragLook" ${s.dragLook ? 'checked' : ''}><span>Rondkijken door te slepen (in plaats van Pointer Lock)</span></label>
          <label class="row"><span>Tekstgrootte</span>
            <select data-set="textSize"><option value="normaal" ${s.textSize === 'normaal' ? 'selected' : ''}>Normaal</option><option value="groot" ${s.textSize === 'groot' ? 'selected' : ''}>Groot</option><option value="extra" ${s.textSize === 'extra' ? 'selected' : ''}>Extra groot</option></select></label>
          <label class="row check"><input type="checkbox" data-set="highContrast" ${s.highContrast ? 'checked' : ''}><span>Hoog contrast voor panelen</span></label>
          <label class="row"><span>Beeldkwaliteit</span>
            <select data-set="quality"><option value="laag" ${s.quality === 'laag' ? 'selected' : ''}>Laag (snelst, geen schaduwen)</option><option value="normaal" ${s.quality === 'normaal' ? 'selected' : ''}>Normaal</option><option value="hoog" ${s.quality === 'hoog' ? 'selected' : ''}>Hoog (zachte schaduwen, gloed)</option></select></label>
        </div>
        <p class="small">Instellingen worden in deze browser onthouden (als de browser dat toestaat).</p>`,
      bind(root) {
        root.querySelectorAll('[data-set]').forEach((el) => {
          el.addEventListener('input', () => {
            const key = el.dataset.set;
            let v = el.type === 'checkbox' ? el.checked : el.type === 'range' ? parseFloat(el.value) : el.value;
            g.setSetting(key, v);
            const out = el.parentElement.querySelector('output');
            if (out) out.textContent = key === 'fov' ? `${v}°` : key === 'volume' ? `${Math.round(v * 100)}%` : Number(v).toFixed(1);
          });
        });
      }
    };
  },

  map(g) {
    return {
      title: 'Plattegrond',
      wide: true,
      html: `
        <div class="map-layout">
          <div class="map-canvas-wrap"><canvas id="bigmap" width="560" height="980" aria-label="Plattegrond van het museum"></canvas>
            <p class="legend"><span class="dot filled"></span> bekeken <span class="dot"></span> nog niet bekeken <span class="you">▲</span> jij</p></div>
          <ol class="room-list">
            ${ROOMS.map((r) => `
              <li class="${r.id === g.currentRoom ? 'current' : ''}">
                <div><strong>${esc(r.id === 'entree' ? 'Entree' : r.label)} · ${esc(r.title)}</strong>
                <span>${countRoom(r.id, g.viewed)} · curator ${esc(r.curator)} (voorstel)</span></div>
                <div class="row-actions">
                  <button class="btn ghost small" data-room-text="${r.id}">Zaaltekst</button>
                  <button class="btn small ${r.id === g.currentRoom ? 'ghost' : 'primary'}" data-go="${r.id}">${r.id === g.currentRoom ? 'Je bent hier' : 'Ga hierheen'}</button>
                </div>
              </li>`).join('')}
          </ol>
        </div>
        <p class="small">‘Ga hierheen’ brengt je direct naar de ingang van een zaal. Zelf lopen kan natuurlijk ook: volg de pijl linksboven.</p>`,
      bind(root) {
        const c = root.querySelector('#bigmap');
        const tr = drawMap(c.getContext('2d'), c.width, c.height, { ...g.mapState(), full: true });
        c.addEventListener('click', (e) => {
          const rect = c.getBoundingClientRect();
          const p = tr.toWorld((e.clientX - rect.left) * (c.width / rect.width), (e.clientY - rect.top) * (c.height / rect.height));
          const room = ROOMS.find((r) => p.x >= r.rect[0] && p.x <= r.rect[1] && p.z >= r.rect[2] && p.z <= r.rect[3]);
          if (room && room.id !== g.currentRoom) g.travelTo(room.id);
        });
        root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.go !== g.currentRoom) g.travelTo(b.dataset.go); }));
        root.querySelectorAll('[data-room-text]').forEach((b) => b.addEventListener('click', () => g.openModal('room', b.dataset.roomText)));
      }
    };
  },

  timeline(g, year = 1940) {
    const catLabel = { wereld: 'Wereld', kunst: 'Kunst', nl: 'Nederland' };
    const yearHtml = (y) => TIMELINE.filter((e) => e.year === y).map((e) => `
      <li class="ev cat-${e.cat}">
        <span class="when">${esc(e.date)}</span>
        <div><span class="chip">${catLabel[e.cat]}</span><strong>${esc(e.title)}</strong><p>${esc(e.text)}</p>
        ${e.art ? `<button class="btn ghost small" data-art="${e.art}">Bekijk: ${esc(ART_BY_ID[e.art].title.split(' (')[0])}</button>` : ''}</div>
      </li>`).join('');
    return {
      title: 'Tijdlijn 1940–1950',
      wide: true,
      html: `
        <div class="years" role="tablist">${TIMELINE_YEARS.map((y) => `<button role="tab" class="year ${y === year ? 'active' : ''}" data-year="${y}" aria-selected="${y === year}">${y}</button>`).join('')}</div>
        <ul class="events" id="tl-events">${yearHtml(year)}</ul>
        <p class="small">Jaartallen gecontroleerd op ${esc(ACCESSED)}. ‘Kunst’ = gebeurtenis in de kunstwereld, ‘Wereld’ = algemene geschiedenis, ‘Nederland’ = Nederlandse geschiedenis.</p>`,
      bind(root) {
        const list = root.querySelector('#tl-events');
        const bindArt = () => list.querySelectorAll('[data-art]').forEach((b) => b.addEventListener('click', () => g.openArtFromList(b.dataset.art)));
        bindArt();
        root.querySelectorAll('[data-year]').forEach((b) => b.addEventListener('click', () => {
          root.querySelectorAll('[data-year]').forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', x === b); });
          list.innerHTML = yearHtml(Number(b.dataset.year));
          bindArt();
        }));
      }
    };
  },

  collection(g) {
    const counted = ARTWORKS.filter(isCounted);
    const seen = counted.filter((a) => g.viewed.has(a.id)).length;
    return {
      title: 'Collectie en voortgang',
      wide: true,
      html: `
        <p class="progress-line"><strong>${seen}</strong> van de <strong>${counted.length}</strong> werken uit 1940–1950 bekeken. Je hoeft niet alles te zien om het museum te verlaten.</p>
        ${ROOMS.map((r) => {
          const works = (r.slots || []).map((s) => ART_BY_ID[s.art]);
          if (r.id === 'finale') works.unshift(ART_BY_ID['eigen-installatie']);
          if (!works.length) return '';
          return `<section class="coll-room"><h3>${esc(r.id === 'entree' ? 'Entree' : r.label)} · ${esc(r.title)}</h3><ul>
            ${works.map((a) => `<li class="${g.viewed.has(a.id) ? 'seen' : ''}">
              <span class="check" aria-label="${g.viewed.has(a.id) ? 'bekeken' : 'nog niet bekeken'}">${g.viewed.has(a.id) ? '✓' : ''}</span>
              <div><strong>${esc(a.title)}</strong><span>${esc(a.artist)} · ${esc(a.year)}${badge(a)}</span></div>
              <button class="btn ghost small" data-art="${a.id}">Bekijk</button></li>`).join('')}
          </ul></section>`;
        }).join('')}`,
      bind(root) {
        root.querySelectorAll('[data-art]').forEach((b) => b.addEventListener('click', () => g.openArtFromList(b.dataset.art)));
      }
    };
  },

  room(g, roomId) {
    const room = ROOM_BY_ID[roomId];
    const t = ROOM_TEXTS[roomId];
    const works = (room.slots || []).map((s) => ART_BY_ID[s.art]);
    return {
      title: `${room.id === 'entree' ? 'Entree' : room.label} · ${room.title}`,
      wide: true,
      html: `
        <p class="lead">${esc(t.lead)}</p>
        <p class="small">Curator: ${esc(room.curator)} (voorgestelde taakverdeling)</p>
        ${t.sections.map((s) => `<section class="text-sec"><h3>${esc(s.h)} ${tag(s.tag)}</h3><p>${esc(s.p)}</p></section>`).join('')}
        ${t.concepts.length ? `<section class="text-sec"><h3>Begrippen</h3><dl class="glossary">${t.concepts.map((c) => `<div><dt>${esc(c)}</dt><dd>${esc(GLOSSARY[c] || '')}</dd></div>`).join('')}</dl></section>` : ''}
        ${works.length ? `<section class="text-sec"><h3>Werken in deze zaal</h3><ul class="work-list">${works.map((a) => `<li><button class="link" data-art="${a.id}">${esc(a.artist)} – <em>${esc(a.title)}</em> (${esc(a.year)})</button>${badge(a)}</li>`).join('')}</ul></section>` : ''}`,
      bind(root) {
        root.querySelectorAll('[data-art]').forEach((b) => b.addEventListener('click', () => g.openArtFromList(b.dataset.art)));
      }
    };
  },

  about() {
    return {
      title: 'Over de tentoonstelling',
      wide: true,
      html: `
        <p class="lead">${esc(ABOUT.intro)}</p>
        <div class="question-box"><span>Hoofdvraag</span>${esc(EXHIBITION.question)}</div>
        ${ABOUT.sections.map((s) => `<section class="text-sec"><h3>${esc(s.h)} ${tag(s.tag)}</h3><p>${esc(s.p)}</p></section>`).join('')}
        <section class="text-sec"><h3>De route</h3><ol class="route">
          ${ROOMS.map((r) => `<li><strong>${esc(r.id === 'entree' ? 'Entree' : r.label)} – ${esc(r.title)}</strong> <span>${esc(ROOM_TEXTS[r.id].lead)}</span></li>`).join('')}
        </ol></section>
        <p class="disclaimer">${esc(EXHIBITION.disclaimer)}</p>`
    };
  },

  credits() {
    return {
      title: 'Credits',
      wide: true,
      html: `
        <section class="text-sec"><h3>Curatoren</h3>
          <ul class="curator-list">${CURATORS.map((c) => `<li><strong>${esc(c.name)}</strong> – ${esc(c.role)}<p>${esc(c.task)}</p></li>`).join('')}</ul>
          <p class="small">${esc(CURATOR_NOTE)}</p>
        </section>
        <section class="text-sec"><h3>Eigen praktijkwerk</h3><p>De installatie ‘Na de storm’ en de studie ‘Storm en stilte’ zijn eigen praktijkwerk van Milan, Berend, Polle en Constantijn, ontworpen voor deze tentoonstelling.</p></section>
        <section class="text-sec"><h3>Techniek</h3><ul>
          <li>3D: ${link('https://threejs.org', 'Three.js')} (MIT-licentie), gebouwd met ${link('https://vite.dev', 'Vite')}.</li>
          <li>Lettertypen: Cormorant Garamond en Inter (SIL Open Font License), meegeleverd via Fontsource.</li>
          <li>Geluid: volledig in de browser gegenereerd met de Web Audio API – er zijn geen bestaande muziek- of geluidsfragmenten gebruikt.</li>
          <li>Architectuur, texturen en de installatie zijn in code ontworpen voor dit project.</li>
        </ul></section>
        <section class="text-sec"><h3>Afbeeldingen</h3><p>Zie <em>Bronnen</em> voor de herkomst en licentie van elke afbeelding.</p></section>
        <p class="disclaimer">${esc(EXHIBITION.disclaimer)}</p>`
    };
  },

  sources() {
    const general = [
      ['MoMA – Collection 1880–1950 / Abstract Expressionist New York', 'https://www.moma.org/collection/'],
      ['The Metropolitan Museum of Art – Collection', 'https://www.metmuseum.org/art/collection'],
      ['Tate – Art and artists', 'https://www.tate.org.uk/art'],
      ['Art Institute of Chicago – Collection', 'https://www.artic.edu/collection'],
      ['Stedelijk Museum Amsterdam – Collectie', 'https://www.stedelijk.nl/en/collection'],
      ['Kunstmuseum Den Haag – Collectie', 'https://www.kunstmuseum.nl'],
      ['National Archives (VS) – Executive Order 9066', 'https://www.archives.gov/milestone-documents/executive-order-9066'],
      ['Library of Congress – Farm Security Administration/Office of War Information', 'https://www.loc.gov/pictures/collection/fsa/'],
      ['Wikimedia Commons – bestandspagina’s met licentie-informatie per afbeelding', 'https://commons.wikimedia.org']
    ];
    return {
      title: 'Bronnen en verantwoording',
      wide: true,
      html: `
        <p>Alle bronnen zijn geraadpleegd op ${esc(ACCESSED)}. We maken onderscheid tussen <strong>feiten</strong> (gecontroleerd in museum- en archiefbronnen), <strong>interpretaties</strong> en onze eigen <strong>curatoriële keuzes</strong>. We hebben geen kunstwerken, citaten of gebeurtenissen verzonnen. Waar bronnen elkaar tegenspreken (bijvoorbeeld over een datering of afmeting), staat dat bij het werk vermeld.</p>
        <section class="text-sec"><h3>Afbeeldingen en auteursrecht</h3><ul>
          <li><strong>Publiek domein of vrij gelicenseerd:</strong> werken van kunstenaars die vóór 1956 overleden, en foto’s en affiches van de Amerikaanse overheid (via Wikimedia Commons, de Library of Congress en de National Archives).</li>
          <li><strong>Auteursrechtelijk beschermd:</strong> werken van onder meer Picasso, Pollock, Rothko, Hopper en Kahlo. Die tonen we als citaat voor onderwijsdoeleinden, voor dit niet-commerciële CKV-schoolproject, met de naam van de maker, de collectie en de herkomst van de afbeelding (onder meer WikiArt, Tate, het Philadelphia Museum of Art en Wikipedia). De rechten blijven bij de rechthebbenden.</li>
          <li><strong>Ruimtelijke impressie:</strong> bij het beeld van Henry Moore staat in de zaal een abstracte vorm, geen replica.</li>
          <li><strong>Eigen werk:</strong> de installatie, de studie en alle architectuur zijn speciaal voor dit project gemaakt.</li>
        </ul></section>
        <section class="text-sec"><h3>Algemene bronnen</h3><ul>${general.map(([l, u]) => `<li>${link(u, l)}</li>`).join('')}</ul>
          <p class="small">Een uitgebreid onderzoeksverslag staat in het projectbestand <code>docs/ONDERZOEK.md</code>.</p></section>
        <section class="text-sec"><h3>Per kunstwerk</h3>
          ${ROOMS.map((r) => {
            const works = (r.slots || []).map((s) => ART_BY_ID[s.art]).filter((a) => a.status !== 'eigen');
            if (!works.length) return '';
            return `<h4>${esc(r.id === 'entree' ? 'Entree' : r.label)} · ${esc(r.title)}</h4><ul class="src-list">${works.map((a) => `
              <li><strong>${esc(a.artist)}, ${esc(a.title)}, ${esc(a.year)}</strong> – ${esc(a.collection)}.
                <br>Bronnen: ${a.sources.map((s) => link(s.url, s.label)).join(' · ')}
                <br>Beeld: ${a.image ? `${esc(a.image.credit)} – ${esc(a.image.license)} (${link(a.image.sourceUrl, 'herkomst')})` : 'ruimtelijke impressie door de curatoren (geen replica)'}</li>`).join('')}</ul>`;
          }).join('')}
        </section>`
    };
  },

  quiz(g) {
    let i = 0, score = 0, answered = false;
    const render = (root) => {
      const body = root.querySelector('#quiz');
      if (i >= QUIZ.length) {
        g.saveQuiz(score);
        body.innerHTML = `
          <div class="quiz-end"><p class="big">${score} / ${QUIZ.length}</p>
          <p>${score >= 8 ? 'Uitstekend! Je hebt goed gekeken.' : score >= 5 ? 'Goed bezig. Loop gerust nog eens langs de werken die je miste.' : 'Er is nog genoeg te ontdekken. Probeer het na een rondje opnieuw.'}</p>
          <button class="btn primary" data-q="restart">Opnieuw</button></div>`;
        body.querySelector('[data-q="restart"]').addEventListener('click', () => { i = 0; score = 0; render(root); });
        return;
      }
      const q = QUIZ[i];
      answered = false;
      body.innerHTML = `
        <p class="quiz-count">Vraag ${i + 1} van ${QUIZ.length}</p>
        <h3 class="quiz-q">${esc(q.q)}</h3>
        <div class="quiz-options">${q.options.map((o, k) => `<button class="btn ghost option" data-k="${k}">${esc(o)}</button>`).join('')}</div>
        <div class="quiz-feedback" aria-live="polite"></div>`;
      body.querySelectorAll('.option').forEach((b) => b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const k = Number(b.dataset.k);
        const ok = k === q.answer;
        if (ok) score++;
        body.querySelectorAll('.option').forEach((x) => {
          x.disabled = true;
          if (Number(x.dataset.k) === q.answer) x.classList.add('correct');
          else if (x === b) x.classList.add('wrong');
        });
        const fb = body.querySelector('.quiz-feedback');
        fb.innerHTML = `<p><strong>${ok ? 'Goed!' : 'Helaas.'}</strong> ${esc(q.explain)}</p>
          <div class="row-actions">${q.art ? `<button class="btn ghost small" data-art="${q.art}">Bekijk het werk</button>` : ''}<button class="btn primary small" data-q="next">${i + 1 < QUIZ.length ? 'Volgende vraag' : 'Uitslag'}</button></div>`;
        fb.querySelector('[data-q="next"]').addEventListener('click', () => { i++; render(root); });
        fb.querySelector('[data-art]')?.addEventListener('click', () => g.openArtFromList(q.art));
        fb.querySelector('[data-q="next"]').focus();
      }));
    };
    return {
      title: 'Quiz over de tentoonstelling',
      html: `<div id="quiz"></div>${g.quizBest !== null ? `<p class="small">Je beste score tot nu toe: ${g.quizBest} / ${QUIZ.length}</p>` : ''}`,
      bind: render
    };
  },

  reflection(g) {
    const r = g.reflection;
    return {
      title: 'Reflectie',
      wide: true,
      html: `
        <div class="question-box"><span>De vraag</span>${esc(REFLECTION.question)}</div>
        <fieldset class="choices"><legend>Wat vind jij?</legend>
          ${REFLECTION.options.map((o) => `<label class="choice"><input type="radio" name="refl" value="${o.id}" ${r.choice === o.id ? 'checked' : ''}><span><strong>${esc(o.label)}</strong><small>${esc(o.hint)}</small></span></label>`).join('')}
        </fieldset>
        <label class="textarea-label" for="refl-text">Leg in een paar zinnen uit waarom. Noem minstens één werk uit het museum.</label>
        <textarea id="refl-text" rows="5" placeholder="Ik vind dat kunst… omdat…">${esc(r.text)}</textarea>
        <div class="row-actions"><button class="btn primary" data-act="save">Bewaar mijn antwoord</button><span class="saved" aria-live="polite"></span></div>
        <p class="small">Je antwoord wordt alleen in deze browser bewaard en nergens naartoe gestuurd.</p>`,
      bind(root) {
        root.querySelector('[data-act="save"]').addEventListener('click', () => {
          const choice = root.querySelector('input[name="refl"]:checked')?.value || null;
          g.saveReflection(choice, root.querySelector('#refl-text').value);
          root.querySelector('.saved').textContent = 'Opgeslagen.';
        });
      }
    };
  },

  end(g) {
    const counted = ARTWORKS.filter(isCounted);
    const seen = counted.filter((a) => g.viewed.has(a.id)).length;
    const minutes = Math.max(1, Math.round((Date.now() - g.startedAt) / 60000));
    return {
      title: 'Na de storm – wat neem je mee?',
      wide: true,
      html: `
        <div class="stats"><div><strong>${seen}/${counted.length}</strong><span>werken bekeken</span></div><div><strong>${g.visitedRooms.size}/${ROOMS.length}</strong><span>ruimtes bezocht</span></div><div><strong>${minutes}</strong><span>${minutes === 1 ? 'minuut' : 'minuten'} in het museum</span></div></div>
        <h3>De belangrijkste inzichten</h3>
        <ol class="insights">${INSIGHTS.map((x) => `<li><strong>${esc(x.h)}</strong><p>${esc(x.p)}</p></li>`).join('')}</ol>
        <div class="question-box"><span>Terug naar de hoofdvraag</span>${esc(EXHIBITION.question)}<p>Ons antwoord in één zin: oorlog en verlies maakten het afbeelden van de werkelijkheid urgenter (fotografie, affiches) én ontoereikender – en daarom zochten kunstenaars naar een nieuwe beeldtaal van gebaar, kleur en schaal om te laten voelen wat niet te zeggen was.</p></div>
        <div class="end-actions">
          <button class="btn primary" data-open="quiz">Doe de quiz</button>
          <button class="btn ghost" data-open="reflection">Geef je reflectie</button>
          <button class="btn ghost" data-open="sources">Bronnen</button>
          <button class="btn ghost" data-open="credits">Credits</button>
          <button class="btn ghost" data-act="restart">Route opnieuw beginnen</button>
          <button class="btn ghost" data-act="resume">Verder rondkijken</button>
        </div>`,
      bind(root) {
        root.querySelector('[data-act="restart"]').addEventListener('click', () => g.restartRoute());
        root.querySelector('[data-act="resume"]').addEventListener('click', () => g.resume(true));
      }
    };
  }
};

function countRoom(roomId, viewed) {
  const works = (ROOM_BY_ID[roomId].slots || []).map((s) => ART_BY_ID[s.art]).filter(isCounted);
  if (!works.length) return roomId === 'finale' ? 'eigen praktijkwerk' : 'introductie en tijdlijn';
  return `${works.filter((a) => viewed.has(a.id)).length}/${works.length} werken bekeken`;
}

function badge(a) {
  if (a.status === 'context') return ' <span class="badge">context · vóór 1940</span>';
  if (a.status === 'vergelijking') return ' <span class="badge">latere vergelijking</span>';
  if (a.status === 'eigen') return ' <span class="badge gold">eigen werk</span>';
  if (a.type === 'beeld') return ' <span class="badge muted">ruimtelijke impressie</span>';
  if (a.interpretation) return ' <span class="badge muted">kleurnotitie</span>';
  return '';
}
