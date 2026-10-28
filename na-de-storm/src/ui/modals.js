import { esc, link } from './dom.js';
import { ROOMS, ROOM_BY_ID } from '../data/rooms.js';
import { ARTWORKS, ART_BY_ID, ACCESSED, isCounted } from '../data/artworks.js';
import { EXHIBITION, CURATORS, ROOM_TEXTS, INSIGHTS } from '../data/texts.js';
import { TIMELINE_YEARS, worksInYear } from '../data/timeline.js';
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
                <span>${countRoom(r.id, g.viewed)}${r.curator ? ` · ${/ en /.test(r.curator) ? 'samen gemaakt' : `curator ${esc(r.curator)}`}` : ''}</span></div>
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
    const yearHtml = (y) => {
      const works = worksInYear(y);
      if (!works.length) return '<li>Geen werken uit dit jaar in het museum.</li>';
      return works.map((a) => `<li><button class="link" data-art="${a.id}"><em>${esc(a.title.split(' (')[0])}</em> · ${esc(a.artist)}</button></li>`).join('');
    };
    return {
      title: 'Tijdlijn 1940–1950',
      wide: true,
      html: `
        <div class="years" role="tablist">${TIMELINE_YEARS.map((y) => `<button role="tab" class="year ${y === year ? 'active' : ''}" data-year="${y}" aria-selected="${y === year}">${y}</button>`).join('')}</div>
        <ul class="tl-works" id="tl-events">${yearHtml(year)}</ul>`,
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
        ${room.curator ? `<p class="small">${/ en /.test(room.curator) ? 'Curatoren' : 'Curator'}: ${esc(room.curator)}</p>` : ''}
        <p class="small"><strong>Zie het verslag voor meer informatie over deze zaal.</strong></p>
        ${works.length ? `<section class="text-sec"><h3>Werken in deze zaal</h3><ul class="work-list">${works.map((a) => `<li><button class="link" data-art="${a.id}">${esc(a.artist)} – <em>${esc(a.title)}</em> (${esc(a.year)})</button>${badge(a)}</li>`).join('')}</ul></section>` : ''}`,
      bind(root) {
        root.querySelectorAll('[data-art]').forEach((b) => b.addEventListener('click', () => g.openArtFromList(b.dataset.art)));
      }
    };
  },

  credits() {
    return {
      title: 'Credits',
      wide: true,
      html: `
        <section class="text-sec"><h3>Curatoren</h3>
          <ul class="curator-list">${CURATORS.map((c) => `<li><strong>${esc(c.name)}</strong></li>`).join('')}</ul>
        </section>
        <section class="text-sec"><h3>Eigen praktijkwerk</h3><p>De installatie ‘Na de storm’ en de studie ‘Storm en stilte’ zijn eigen praktijkwerk van Milan, Berend, Polle en Constantijn, ontworpen voor deze tentoonstelling.</p></section>
        <section class="text-sec"><h3>Techniek</h3><ul>
          <li>3D: ${link('https://threejs.org', 'Three.js')} (MIT-licentie), gebouwd met ${link('https://vite.dev', 'Vite')}.</li>
          <li>Lettertypen: Cormorant Garamond en Inter (SIL Open Font License), meegeleverd via Fontsource.</li>
          <li>Geluid: volledig in de browser gegenereerd met de Web Audio API – er zijn geen bestaande muziek- of geluidsfragmenten gebruikt.</li>
          <li>Architectuur, texturen en de installatie zijn in code ontworpen voor dit project.</li>
        </ul></section>
        <section class="text-sec"><h3>Afbeeldingen</h3><p>Bij elk werk staat de bron van de afbeelding.</p></section>
        <p class="disclaimer">${esc(EXHIBITION.disclaimer)}</p>`
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
          <button class="btn primary" data-open="credits">Credits</button>
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
