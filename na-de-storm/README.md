# NA DE STORM — Kunst, chaos en een nieuwe wereld (1940–1950)

Een interactief **3D-museum in de browser**, gemaakt voor CKV Beeldend (4 vwo) door **Milan, Berend en Polle**. Je loopt in de ik-persoon door zeven ruimtes – van een donkere, sobere entree naar lichte, open zalen – en bekijkt 39 echte kunstwerken uit 1940–1950, plus historische context, een latere vergelijking en ons eigen praktijkwerk.

> NA DE STORM is een fictieve wereldtentoonstelling voor een schoolopdracht. De kunstwerken bestaan echt; de tentoonstelling niet.

- **Onderzoeksverslag:** [`docs/ONDERZOEK.md`](docs/ONDERZOEK.md) – conclusies, selectie per zaal, beeldrechten, bronafwijkingen en bronnenlijst.
- **Techniek:** Vite + Three.js, alleen statische bestanden (geen server of API-sleutels nodig).

---

## Wat zit erin?

| Onderdeel | Uitleg |
|---|---|
| **7 ruimtes** | Entree · Zaal 1 *Een wereld in crisis* · Zaal 2 *De mens achter de geschiedenis* · Zaal 3 *Dromen, symbolen en het onderbewuste* · Zaal 4 *Een nieuwe beeldtaal* · Zaal 5 *Op weg naar een andere toekomst* · Finale *Wat bouwen we opnieuw op?* |
| **39 werken uit 1940–1950** | 7 tot 9 per zaal, elk met titel, maker, jaar, techniek, afmetingen, collectie en acht vaste vragen (wat zie je, wie/wanneer, context, beeldaspecten, betekenis, waarom deze zaal, wat zegt het over 1940–1950, bron). |
| **Beeldrechten** | 18 echte afbeeldingen (publiek domein of vrij gelicenseerd). Werken die nog beschermd zijn, tonen we als duidelijk gelabelde **kleurnotitie** (geen reproductie) met een link naar het museum. |
| **First-person** | WASD/pijltjes, muis met Pointer Lock (of slepen), Shift rennen, botsingen met muren, wanden, pilaren, banken en sokkels. |
| **Inzoomen** | Klik op een werk (of druk **E**): de camera vliegt vloeiend en om muren heen naar het werk; links het beeld, rechts de informatie; vorig/volgend werk; vergroten met zoomen en verschuiven; terug naar exact je oude positie. |
| **Educatieve laag** | Zaalteksten met begrippen, interactieve tijdlijn 1940–1950, quiz, reflectie, eindscherm met inzichten, bronnenpagina, credits, labels FEIT / INTERPRETATIE / KEUZE. |
| **Navigatie** | Kompas naar de volgende zaal, minikaart, grote plattegrond met ‘ga hierheen’, terug naar de entree, korte tour, voortgang. |
| **Toegankelijkheid** | Muisgevoeligheid, gezichtsveld, loopbeweging uit, minder beweging, tekstgrootte, hoog contrast, volume/geluid uit, kwaliteit laag/normaal/hoog, volledige toetsenbordbediening. |
| **Fallback** | Lijstweergave zonder 3D (ook automatisch als WebGL 2 ontbreekt). |

### Bediening

| Toets | Actie |
|---|---|
| `W A S D` / pijltjes | lopen |
| muis | rondkijken (klik eerst in het beeld) |
| `Shift` | rennen |
| klik / `E` | kunstwerk of zaaltekst bekijken |
| `Esc` | menu / venster sluiten |
| `M` `T` `C` `H` | plattegrond, tijdlijn, collectie, hulp |
| `G` `F` | geluid aan/uit, volledig scherm |
| `←` `→` `Z` | in de detailweergave: vorig/volgend werk, vergroten |

---

## 1. Het project lokaal starten

Je hebt **Node.js 20.19 of nieuwer** nodig (download via <https://nodejs.org>, kies de LTS-versie).

```bash
cd na-de-storm
npm install        # één keer: installeert Three.js, Vite en de lettertypen
npm run dev        # start een ontwikkelserver
```

Open daarna het adres dat in de terminal verschijnt (meestal <http://localhost:5173>). Wijzigingen in de code zie je direct in de browser.

## 2. Bestanden aanpassen

```
na-de-storm/
├── index.html                 schermen en HTML-structuur
├── netlify.toml               Netlify-instellingen
├── vite.config.js
├── public/
│   ├── beelden/               de rechtenvrije afbeeldingen (jpg)
│   └── favicon.svg
├── docs/ONDERZOEK.md          onderzoeksverslag en bronnen
└── src/
    ├── main.js                opstarten, WebGL-controle, lijstweergave
    ├── game.js                spelverloop: lopen, klikken, detail, tour, vensters
    ├── styles.css             alle vormgeving
    ├── data/
    │   ├── artworks.js        ★ alle kunstwerken en hun teksten (één centrale bron)
    │   ├── rooms.js           ★ plattegrond: zalen, deuren, ophangplekken
    │   ├── texts.js           ★ introductie, zaalteksten, begrippen, reflectie, tour
    │   ├── timeline.js        tijdlijn 1940–1950
    │   ├── quiz.js            quizvragen
    │   └── imageSizes.js      pixelmaten van de afbeeldingen (tegen vervorming)
    ├── core/                  botsingen + padvinding, besturing, camera, audio, opslag
    ├── world/                 architectuur, licht, kunstwerken in 3D, wandteksten, installatie
    └── ui/                    detailweergave, vensters, plattegrond, lijstweergave
```

**Veelvoorkomende aanpassingen**

- **Tekst van een werk wijzigen:** zoek het werk op `id` in `src/data/artworks.js` en pas `texts` aan.
- **Je eigen mening invullen:** de concepten staan in `src/data/texts.js` (`ROOM_TEXTS`, sectie ‘Onze mening (concept)’, en `REFLECTION`). Herschrijf ze in je eigen woorden.
- **Taakverdeling aanpassen:** `CURATORS` in `src/data/texts.js` en `curator` per zaal in `src/data/rooms.js`.
- **Een werk toevoegen:**
  1. Voeg een object toe aan `ARTWORKS` in `artworks.js` (kopieer een bestaand werk en pas alles aan).
  2. Heb je een rechtenvrije afbeelding? Zet de jpg in `public/beelden/` en voeg de pixelmaat toe aan `src/data/imageSizes.js`. Anders: gebruik `interpretation` (kleurnotitie).
  3. Hang het op: voeg in `rooms.js` bij de juiste zaal een regel toe aan `slots`, bijvoorbeeld `{ art: 'mijn-id', wall: 'W', at: -30 }` (`wall` = N/S/E/W of een wand zoals `p2:a`; `at` = positie langs de muur in meters).
- **Kwaliteit testen:** kies in het spel *Menu → Instellingen → Beeldkwaliteit*.
- **Testmodus:** open de site met `?debug` achter het adres; dan is `window.__nds` beschikbaar in de console (bijv. `__nds.debugState()`).

## 3. De productiebuild maken

```bash
npm run build      # maakt de map dist/ met de complete website
npm run preview    # bekijk de build lokaal op http://localhost:4173
```

De map `dist/` bevat alles wat online moet: HTML, JavaScript, lettertypen en afbeeldingen. De site werkt met relatieve paden, dus ook vanuit een submap.

## 4. Het project naar GitHub uploaden

**Aanbevolen: een eigen repository voor alleen dit museum.**

1. Maak op <https://github.com/new> een nieuwe repository, bijvoorbeeld `na-de-storm` (leeg laten, zonder README).
2. Open een terminal in de map `na-de-storm` en voer uit:

   ```bash
   git init
   git add .
   git commit -m "NA DE STORM – eerste versie"
   git branch -M main
   git remote add origin https://github.com/JOUW-NAAM/na-de-storm.git
   git push -u origin main
   ```

   (`node_modules/` en `dist/` worden automatisch overgeslagen via `.gitignore`.)

*Alternatief:* staat dit project als submap `na-de-storm/` in een bestaande repository (zoals nu), dan kan dat ook – zie stap 5.

## 5. GitHub aan Netlify koppelen

1. Ga naar <https://app.netlify.com> en log in (bijvoorbeeld met je GitHub-account).
2. Kies **Add new site → Import an existing project → GitHub** en geef Netlify toegang tot de repository.
3. Kies de repository. Netlify leest `netlify.toml` en vult automatisch in:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - Node-versie 22
4. **Alleen als het museum in een submap staat** (bijvoorbeeld `na-de-storm/` binnen een grotere repository): vul bij **Base directory** `na-de-storm` in. De publish directory wordt dan `na-de-storm/dist`.

## 6. De site publiceren

Klik op **Deploy site**. Na ongeveer een minuut staat het museum online op een adres als `https://naam-1234.netlify.app`. Onder *Site configuration → Change site name* kun je een mooiere naam kiezen, bijvoorbeeld `na-de-storm-ckv.netlify.app`.

Controleer daarna even: startscherm laadt, *Betreed het museum* werkt, afbeeldingen verschijnen.

## 7. Later updates publiceren

Pas de bestanden aan, test met `npm run dev`, en push naar GitHub:

```bash
git add .
git commit -m "Teksten zaal 2 aangepast"
git push
```

Netlify bouwt en publiceert dan **automatisch** de nieuwe versie (zie het tabblad *Deploys*).

*Zonder GitHub:* `npm run build` en sleep de map `dist/` naar <https://app.netlify.com/drop>.

---

## Getest

De tests zijn uitgevoerd met Playwright in headless Chromium (software-rendering, geen echte grafische kaart). Zie het overzicht in de opleveringsnotities. Belangrijk:

- `npm install` en `npm run build` slagen zonder fouten.
- Het volledige acceptatiescenario (lopen → werk aanklikken → camera vliegt erheen → info rechts → volgend werk → terug naar exact dezelfde positie → direct verder lopen) is automatisch getest.
- Alle werken zijn één voor één geopend en gecontroleerd op juiste titel, acht tekstsecties en een geladen afbeelding.
- **Niet getest:** echte prestaties op een laptop met GPU (de testomgeving heeft geen grafische kaart), Safari, en echte touchscreens.

## Bekende beperkingen

- Werken die nog auteursrechtelijk beschermd zijn (o.a. Pollock, Rothko, Picasso, Hopper, Kahlo) tonen we als **kleurnotitie**, niet als afbeelding. Wil je ze in de klas laten zien, gebruik dan de link naar het museum.
- De foto van Nash valt onder CC BY-NC-ND 3.0: alleen niet-commercieel gebruik, met naamsvermelding (zoals op deze site).
- De 3D-ervaring is gemaakt voor laptop en computer. Op telefoons werkt een eenvoudige aanraakbediening, maar de **lijstweergave** is daar prettiger.
- Pointer Lock werkt niet in elke browser (bijvoorbeeld in sommige ingesloten vensters); dan kijk je rond door te slepen.

## Licenties

- Code: eigen werk voor dit schoolproject.
- [Three.js](https://threejs.org) – MIT. [Vite](https://vite.dev) – MIT.
- Lettertypen Cormorant Garamond en Inter – SIL Open Font License, via Fontsource.
- Afbeeldingen: zie `docs/ONDERZOEK.md` §4 en de bronnenpagina in de site.
