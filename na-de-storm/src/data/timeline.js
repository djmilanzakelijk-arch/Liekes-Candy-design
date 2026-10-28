import { ARTWORKS } from './artworks.js';

// Tijdlijn 1940–1950. cat: 'wereld' (geschiedenis), 'kunst' of 'nl' (Nederland).
// `art` verwijst naar een kunstwerk-id in artworks.js.

export const TIMELINE = [
  { year: 1940, date: '10 mei', cat: 'nl', title: 'Duitse inval in Nederland', text: 'Duitsland valt Nederland, België en Luxemburg binnen. Op 15 mei capituleert Nederland.' },
  { year: 1940, date: '14 mei', cat: 'nl', title: 'Bombardement op Rotterdam', text: 'De binnenstad van Rotterdam wordt verwoest. Veel later wordt dit herdacht met Zadkines De verwoeste stad.', art: 'zadkine-stad' },
  { year: 1940, date: '29 juni', cat: 'kunst', title: 'Paul Klee overlijdt', text: 'Klee sterft in Zwitserland; Tod und Feuer is een van zijn laatste schilderijen.', art: 'klee-tod-und-feuer' },
  { year: 1940, date: 'juli–okt.', cat: 'wereld', title: 'Slag om Engeland en de Blitz', text: 'De Duitse luchtmacht bombardeert Groot-Brittannië. Nash schildert de wrakken, Moore tekent de schuilkelders.', art: 'nash-totes-meer' },
  { year: 1940, date: 'oktober', cat: 'kunst', title: 'Mondriaan in New York', text: 'Piet Mondriaan komt aan in New York, waar hij zijn laatste werken maakt.', art: 'mondrian-broadway' },
  { year: 1941, date: '25–26 feb.', cat: 'nl', title: 'Februaristaking', text: 'In Amsterdam en omgeving leggen mensen het werk neer uit protest tegen de jodenvervolging.' },
  { year: 1941, date: '1940–1941', cat: 'kunst', title: 'Vlucht via Marseille', text: 'Het Emergency Rescue Committee van Varian Fry helpt kunstenaars als Max Ernst en André Breton Europa te ontvluchten.', art: 'ernst-europe' },
  { year: 1941, date: '7 december', cat: 'wereld', title: 'Aanval op Pearl Harbor', text: 'Japan valt de Amerikaanse vloot aan; de VS gaan in oorlog.' },
  { year: 1942, date: '19 februari', cat: 'wereld', title: 'Executive Order 9066', text: 'Japanse Amerikanen worden naar kampen gebracht. Dorothea Lange fotografeert de evacuaties.', art: 'lange-american' },
  { year: 1942, date: 'begin 1942', cat: 'kunst', title: 'Hopper voltooit Nighthawks', text: 'Het Art Institute of Chicago koopt het schilderij nog hetzelfde jaar.', art: 'hopper-nighthawks' },
  { year: 1942, date: '10 juni', cat: 'wereld', title: 'Vernietiging van Lidice', text: 'Het Tsjechische dorp wordt uitgemoord; Ben Shahn maakt er een affiche over.', art: 'shahn-nazi-brutality' },
  { year: 1942, date: '20 oktober', cat: 'kunst', title: 'Art of This Century opent', text: 'Peggy Guggenheim opent in New York een galerie voor surrealisme en abstracte kunst.' },
  { year: 1943, date: 'juni', cat: 'kunst', title: 'Brief van Rothko en Gottlieb', text: 'In The New York Times pleiten ze voor eenvoudige, grote vormen met een ‘tragische en tijdloze’ inhoud.', art: 'rothko-no3' },
  { year: 1943, date: 'november', cat: 'kunst', title: 'Eerste solotentoonstelling Pollock', text: 'Bij Art of This Century; het MoMA koopt in 1944 The She-Wolf.', art: 'pollock-shewolf' },
  { year: 1943, date: '10 oktober', cat: 'kunst', title: 'Charlotte Salomon vermoord', text: 'Salomon wordt in Auschwitz vermoord; haar levenswerk wordt nu bewaard in Amsterdam.', art: 'salomon-leben' },
  { year: 1944, date: '23 januari', cat: 'kunst', title: 'Edvard Munch overlijdt', text: 'Munch sterft in het bezette Noorwegen.', art: 'munch-klokken' },
  { year: 1944, date: '1 februari', cat: 'kunst', title: 'Mondriaan overlijdt', text: 'Victory Boogie Woogie blijft onvoltooid achter in zijn atelier.', art: 'mondrian-victory' },
  { year: 1944, date: '6 juni', cat: 'wereld', title: 'D-Day', text: 'Geallieerde landing in Normandië, vastgelegd door Robert F. Sargent.', art: 'sargent-jaws' },
  { year: 1944, date: 'najaar 1944', cat: 'nl', title: 'Begin van de Hongerwinter', text: 'In het westen van Nederland sterven in de winter van 1944–1945 duizenden mensen door honger en kou.' },
  { year: 1944, date: '13 december', cat: 'kunst', title: 'Kandinsky overlijdt', text: 'Kandinsky sterft in Neuilly-sur-Seine bij Parijs.', art: 'kandinsky-bleu' },
  { year: 1945, date: '5 mei', cat: 'nl', title: 'Bevrijding van Nederland', text: 'De Duitse troepen in Nederland capituleren.' },
  { year: 1945, date: '8 mei', cat: 'wereld', title: 'Einde van de oorlog in Europa', text: 'Duitsland capituleert onvoorwaardelijk.' },
  { year: 1945, date: '6 en 9 aug.', cat: 'wereld', title: 'Atoombommen op Hiroshima en Nagasaki', text: 'Japan capituleert; op 2 september eindigt de Tweede Wereldoorlog officieel.', art: 'levy-nagasaki' },
  { year: 1945, date: '24 oktober', cat: 'wereld', title: 'Oprichting van de Verenigde Naties', text: 'Een nieuwe internationale organisatie moet de vrede bewaren.' },
  { year: 1946, date: '1946', cat: 'kunst', title: '‘Abstract expressionism’', text: 'Criticus Robert Coates gebruikt de term in The New Yorker.' },
  { year: 1946, date: '1946', cat: 'kunst', title: 'Eames-stoel in productie', text: 'De gebogen multiplex stoelen van Charles en Ray Eames worden in serie gemaakt.', art: 'eames-lcw' },
  { year: 1947, date: '5 juni', cat: 'wereld', title: 'Marshallplan aangekondigd', text: 'De VS bieden West-Europa hulp bij de wederopbouw.', art: 'dirksen-marshall' },
  { year: 1947, date: '25 juni', cat: 'nl', title: 'Het Achterhuis verschijnt', text: 'Het dagboek van Anne Frank wordt in Nederland uitgegeven.' },
  { year: 1947, date: '1947', cat: 'kunst', title: 'Matisse: Jazz / Pollock: druiptechniek', text: 'Matisse publiceert Jazz; Pollock begint zijn doeken op de vloer te beschilderen.', art: 'matisse-icarus' },
  { year: 1948, date: '1948', cat: 'kunst', title: 'Newman: Onement I', text: 'Newman schildert zijn eerste ‘zip’-schilderij.', art: 'newman-onement' },
  { year: 1948, date: '21 juli', cat: 'kunst', title: 'Arshile Gorky overlijdt', text: 'Gorky, de brug tussen surrealisme en abstract expressionisme, sterft in Connecticut.', art: 'gorky-liver' },
  { year: 1948, date: '8 november', cat: 'kunst', title: 'Oprichting van CoBrA', text: 'In Parijs richten kunstenaars uit Kopenhagen, Brussel en Amsterdam de groep CoBrA op.', art: 'appel-vragende' },
  { year: 1948, date: '10 december', cat: 'wereld', title: 'Universele Verklaring van de Rechten van de Mens', text: 'De Verenigde Naties nemen de verklaring aan.' },
  { year: 1949, date: '4 april', cat: 'wereld', title: 'Oprichting van de NAVO', text: 'Westerse landen sluiten een militair bondgenootschap; de Koude Oorlog verhardt.' },
  { year: 1949, date: '8 augustus', cat: 'kunst', title: 'Life over Pollock', text: 'Het tijdschrift vraagt of Pollock ‘de grootste levende schilder van de Verenigde Staten’ is.', art: 'pollock-autumn' },
  { year: 1949, date: 'november', cat: 'nl', title: 'CoBrA in het Stedelijk', text: 'De internationale CoBrA-tentoonstelling in het Stedelijk Museum Amsterdam zorgt voor veel ophef.', art: 'appel-vragende' },
  { year: 1949, date: '27 december', cat: 'nl', title: 'Soevereiniteitsoverdracht Indonesië', text: 'Nederland erkent de onafhankelijkheid van Indonesië.' },
  { year: 1950, date: 'zomer 1950', cat: 'kunst', title: 'Biënnale van Venetië', text: 'In het Amerikaanse paviljoen hangen onder meer werken van Gorky, de Kooning en Pollock.', art: 'dekooning-excavation' },
  { year: 1950, date: '25 juni', cat: 'wereld', title: 'Begin van de Koreaanse Oorlog', text: 'De nieuwe vrede blijkt kwetsbaar.' },
  { year: 1950, date: '1950', cat: 'kunst', title: 'Pollock, Léger, Magritte', text: 'Pollock maakt Autumn Rhythm, Léger Les Constructeurs, Magritte Het rijk der lichten II.', art: 'leger-constructeurs' }
];

export const TIMELINE_YEARS = Array.from({ length: 11 }, (_, i) => 1940 + i);

// Eén kernzin per jaar voor de tijdlijnwand in de entree.
export const YEAR_HEADLINES = {
  1940: 'Bezetting en Blitz',
  1941: 'Vlucht naar New York',
  1942: 'Kampen en propaganda',
  1943: 'Mythen en oerbeelden',
  1944: 'D-Day en Hongerwinter',
  1945: 'Bevrijding en atoombom',
  1946: 'Een nieuw woord: abstract expressionisme',
  1947: 'Marshallplan en de druiptechniek',
  1948: 'CoBrA en de zip',
  1949: 'Is Pollock de grootste?',
  1950: 'Een nieuwe wereld, nieuwe dreiging'
};

// Werken uit het museum per jaar (het eerste jaartal in de datering telt).
export function worksInYear(year) {
  return ARTWORKS.filter((a) => a.status === 'periode' && Number((a.year.match(/\d{4}/) || [])[0]) === year);
}
