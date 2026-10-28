// Centrale gegevensbron voor alle kunstwerken. Elk werk heeft een uniek `id`;
// de 3D-wereld, het detailpaneel, de plattegrond en de tijdlijn lezen
// allemaal uit deze ene lijst, zodat beeld en informatie nooit door elkaar raken.
//
// status:
//   'periode'      gemaakt tussen 1940 en 1950 (telt mee voor de zes per zaal)
//   'context'      gemaakt vóór 1940, getoond als historische context
//   'vergelijking' gemaakt na 1950, getoond als latere vergelijking
//   'eigen'        eigen praktijkwerk van Milan, Berend, Polle en Constantijn
//
// image:          een rechtenvrij of vrij gelicenseerd bestand in /public/beelden/
// interpretation: geen afbeelding (auteursrecht) → de curatoren tonen een
//                 duidelijk gelabelde 'kleurnotitie': een abstracte samenvatting
//                 van kleur en compositie, uitdrukkelijk GEEN reproductie.
//
// size: echte afmetingen in centimeters (breedte w, hoogte h). Voor foto's en
// affiches gebruiken we een tentoonstellingsafdruk; dat staat dan in `sizeNote`.

export const ACCESSED = '21 oktober 2026';

const commons = (file) => `https://commons.wikimedia.org/wiki/File:${file}`;

export const ARTWORKS = [
  // ───────────────────────────── ENTREE (context) ─────────────────────────────
  {
    id: 'picasso-guernica',
    room: 'entree',
    status: 'context',
    title: 'Guernica',
    artist: 'Pablo Picasso',
    artistLife: '1881–1973',
    year: '1937',
    medium: 'Olieverf op doek',
    dimensions: '349,3 × 776,6 cm',
    size: { w: 776.6, h: 349.3 },
    collection: 'Museo Nacional Centro de Arte Reina Sofía, Madrid',
    type: 'schilderij',
    image: {
      file: 'picasso-guernica.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Pablo Picasso. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://www.wikiart.org/en/pablo-picasso/guernica-1937'
    },
    texts: {
      zien: 'Een breed, bijna kleurloos doek vol schreeuwende mensen en dieren: een stier, een stervend paard, een moeder met een dood kind in haar armen, een gevallen soldaat met een gebroken zwaard en een vrouw die met een lamp naar binnen leunt. Bovenin hangt een lamp in de vorm van een oog.',
      context: 'Op 26 april 1937, tijdens de Spaanse Burgeroorlog, bombardeerde het Duitse Legioen Condor het Baskische stadje Guernica. Picasso schilderde het doek binnen enkele weken voor het Spaanse paviljoen van de Wereldtentoonstelling van 1937 in Parijs.',
      beeldaspecten: 'Grisaille: alleen zwart, wit en grijs, als een krantenfoto. Kubistisch gebroken vormen, scherpe hoeken en een driehoekige opbouw in het midden. Het enorme formaat omringt de kijker.',
      betekenis: 'Picasso toont het lijden van burgers zonder de vliegtuigen of de daders te laten zien. Het werk werd wereldwijd een symbool tegen oorlogsgeweld.',
      zaal: 'Onze keuze: Guernica hangt als historische context in de entree, vóór de route begint. Onze fictieve wereldtentoonstelling begint waar de laatste vooroorlogse wereldtentoonstelling eindigde. Het werk is van 1937 en valt dus buiten de periode; het telt niet mee voor de zalen.',
      periode: 'Het laat zien dat kunstenaars al vóór 1940 een beeldtaal hadden ontwikkeld om massaal geweld te tonen. Die taal keert terug in Picasso’s Het knekelhuis (zaal 1).'
    },
    sources: [
      { label: 'Museo Reina Sofía – Guernica', url: 'https://www.museoreinasofia.es/en/collection/artwork/guernica' },
      { label: 'Wikipedia – Guernica (Picasso)', url: 'https://en.wikipedia.org/wiki/Guernica_(Picasso)' }
    ]
  },

  // ───────────────────────────── ZAAL 1 ─────────────────────────────
  {
    id: 'nash-totes-meer',
    room: 'zaal1',
    status: 'periode',
    featured: true,
    title: 'Totes Meer (Dood meer)',
    artist: 'Paul Nash',
    artistLife: '1889–1946',
    year: '1940–1941',
    medium: 'Olieverf op doek',
    dimensions: '101,6 × 152,4 cm',
    size: { w: 152.4, h: 101.6 },
    collection: 'Tate, Londen (N05717), geschonken door de War Artists’ Advisory Committee in 1946',
    type: 'schilderij',
    image: {
      file: 'nash-totes-meer.jpg',
      credit: 'Foto © Tate, via Wikimedia Commons',
      license: 'Het schilderij is publiek domein (maker overleed in 1946); de foto valt onder CC BY-NC-ND 3.0 (niet-commercieel gebruik met naamsvermelding)',
      sourceUrl: commons('Totes_Meer_(Dead_Sea)_1940-1_Paul_Nash.jpg')
    },
    texts: {
      zien: 'Een golvende ‘zee’ onder een bleke maan. Wie beter kijkt, ziet dat de golven bestaan uit vleugels, staartstukken en rompen van neergestorte vliegtuigen. Rechts op de voorgrond ligt een strook land; aan de horizon is het stil en leeg.',
      context: 'Nash was in 1940 een officiële oorlogskunstenaar. Hij baseerde dit schilderij op schetsen en foto’s van een verzamelplaats bij Cowley (Oxford), waar wrakken van neergeschoten Duitse vliegtuigen werden opgestapeld tijdens en na de Slag om Engeland (1940).',
      beeldaspecten: 'Koele blauw-, groen- en grijstinten overheersen. Een sterke diagonaal van wrakken loopt van voren naar achteren de diepte in. De herhaling van scherpe, gekartelde vormen lijkt op golven. Het maanlicht geeft een stille, vervreemdende sfeer.',
      betekenis: 'De Duitse titel maakt van het wrakkenveld een ‘dode zee’: een vernietigde vijandelijke luchtmacht. Toch voelt het werk niet als een overwinning, maar stil en onheilspellend: machines worden een landschap van de dood.',
      zaal: 'Onze keuze: dit werk hangt centraal, op de eerste wand die je ziet. Het laat zien hoe een kunstenaar een feitelijk onderwerp omvormt tot een beeld dat je vooral voelt. Nash was beïnvloed door het surrealisme – een eerste brug naar zaal 3.',
      periode: 'Ook officieel bestelde oorlogskunst kon twijfel en melancholie bevatten; het was niet alleen propaganda.'
    },
    sources: [
      { label: 'Tate – Paul Nash, Totes Meer (Dead Sea), 1940–1', url: 'https://www.tate.org.uk/art/artworks/nash-totes-meer-dead-sea-n05717' },
      { label: 'Wikipedia – Totes Meer', url: 'https://en.wikipedia.org/wiki/Totes_Meer' }
    ]
  },
  {
    id: 'moore-sleepers',
    room: 'zaal1',
    status: 'periode',
    title: 'Pink and Green Sleepers (Roze en groene slapers)',
    artist: 'Henry Moore',
    artistLife: '1898–1986',
    year: '1941',
    medium: 'Potlood, inkt, gouache en was op papier',
    dimensions: 'ca. 38 × 56 cm',
    size: { w: 56, h: 38 },
    collection: 'Tate, Londen (N05713), geschonken door de War Artists’ Advisory Committee in 1946',
    type: 'tekening',
    image: {
      file: 'moore-sleepers.jpg',
      credit: 'Foto © Tate',
      license: '© de rechthebbenden van Henry Moore. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://www.tate.org.uk/art/artworks/moore-pink-and-green-sleepers-n05713'
    },
    texts: {
      zien: 'Twee mensen liggen naast elkaar te slapen onder dekens, hun hoofden achterover gekanteld. Hun lichamen zijn opgebouwd uit vele kleine lijntjes, alsof ze uit steen zijn gehouwen. Roze en groene tinten geven kleur aan het verder donkere blad.',
      context: 'Tijdens de Blitz (september 1940 – mei 1941) zochten duizenden Londenaren ’s nachts beschutting in de metrostations. Henry Moore werkte als oorlogskunstenaar, maakte daar schetsen en werkte ze later uit tot zijn bekende ‘Shelter Drawings’ (schuilkelder-tekeningen).',
      beeldaspecten: 'Moore tekende met was, die de waterverf afstoot; zo ontstaat een korrelige, gevlekte structuur. Ritmische arceringen maken de vormen rond en zwaar. De kleur is ingetogen en de figuren vullen bijna het hele blad, waardoor je heel dichtbij lijkt te staan.',
      betekenis: 'De slapers zijn kwetsbaar én massief tegelijk, als monumenten van uithoudingsvermogen. Moore toont geen bommen of ruïnes, maar de stille gevolgen voor gewone mensen.',
      zaal: 'Onze keuze: dit werk is een tegenwicht voor de wrakken van Nash: dezelfde oorlog, nu vanuit de burger gezien. Het bereidt voor op zaal 2, waar de mens centraal staat.',
      periode: 'Beeldhouwkundig denken – volume, gewicht – werkt door in tekeningen. Kunstenaars kozen voor menselijke waardigheid in plaats van sensatie.'
    },
    sources: [
      { label: 'Tate – Henry Moore, Pink and Green Sleepers, 1941', url: 'https://www.tate.org.uk/art/artworks/moore-pink-and-green-sleepers-n05713' },
      { label: 'Henry Moore Foundation – catalogus', url: 'https://catalogue.henry-moore.org/objects/17095' }
    ]
  },
  {
    id: 'shahn-nazi-brutality',
    room: 'zaal1',
    status: 'periode',
    title: 'This Is Nazi Brutality (Dit is nazi-wreedheid)',
    artist: 'Ben Shahn',
    artistLife: '1898–1969',
    year: '1942',
    medium: 'Offsetlitho (affiche), uitgegeven door het Office of War Information',
    dimensions: 'Affiche; formaat verschilt per exemplaar',
    size: { w: 72 },
    sizeNote: 'Getoond als tentoonstellingsafdruk.',
    collection: 'O.a. National Archives, Washington (NAID 513687); United States Holocaust Memorial Museum',
    type: 'affiche',
    image: {
      file: 'shahn-nazi-brutality.jpg',
      credit: 'U.S. National Archives, via Wikimedia Commons',
      license: 'Publiek domein (werk voor de Amerikaanse overheid)',
      sourceUrl: commons('THIS_IS_NAZI_BRUTALITY_-_NARA_-_513687.jpg')
    },
    texts: {
      zien: 'Een man met een kap over zijn hoofd en geboeide handen staat tegen een bakstenen muur. Over zijn borst staat in rode letters ‘This is Nazi brutality’. Daaronder staat, als een telexbericht uit Berlijn, dat alle mannen van het Tsjechische dorp Lidice zijn doodgeschoten, de vrouwen naar een concentratiekamp zijn gestuurd, de kinderen zijn weggevoerd en dat de naam van het dorp is uitgewist.',
      context: 'Op 10 juni 1942 werd Lidice vernietigd als wraak voor de aanslag op nazi-leider Reinhard Heydrich. Ben Shahn werkte toen voor de grafische afdeling van het Amerikaanse Office of War Information (OWI) en maakte dit affiche nog in hetzelfde jaar.',
      beeldaspecten: 'Een sobere, frontale compositie. De muur sluit de ruimte af: er is geen uitweg. De zwarte figuur contrasteert met de felrode tekst, en de ‘koude’ typemachineletters van het bericht versterken het zakelijke, onmenselijke karakter.',
      betekenis: 'Shahn toont niet het geweld zelf, maar het moment ervóór. De kijker moet de rest zelf invullen. Het anonieme slachtoffer wordt een symbool voor alle onschuldige burgers.',
      zaal: 'Onze keuze: het affiche laat zien dat grafische vormgeving en propaganda ook bij de beeldende kunst van de oorlog horen. Vergelijk het met Nussbaum achter de middenwand: beiden gebruiken een afgesloten ruimte en een muur.',
      periode: 'De Amerikaanse overheid werkte in de oorlog samen met moderne kunstenaars. Dit affiche is tegelijk kunstwerk, nieuwsbericht en oproep.'
    },
    sources: [
      { label: 'United States Holocaust Memorial Museum – collectie', url: 'https://collections.ushmm.org/search/catalog/irn33819' },
      { label: 'Franklin D. Roosevelt Library – This Is Nazi Brutality', url: 'https://fdr.artifacts.archives.gov/objects/14526/this-is-nazi-brutality' },
      { label: 'Wikimedia Commons – NARA-scan', url: commons('THIS_IS_NAZI_BRUTALITY_-_NARA_-_513687.jpg') }
    ]
  },
  {
    id: 'sargent-jaws',
    room: 'zaal1',
    status: 'periode',
    title: 'Into the Jaws of Death (In de kaken van de dood)',
    artist: 'Robert F. Sargent',
    artistLife: '1923–2012',
    year: '6 juni 1944',
    medium: 'Foto (U.S. Coast Guard)',
    dimensions: 'Negatief; getoond als tentoonstellingsafdruk',
    size: { w: 110 },
    sizeNote: 'Getoond als vergrote tentoonstellingsafdruk.',
    collection: 'National Archives, College Park (26-G-2343)',
    type: 'foto',
    image: {
      file: 'sargent-jaws.jpg',
      credit: 'U.S. National Archives, via Wikimedia Commons',
      license: 'Publiek domein (werk van de U.S. Coast Guard)',
      sourceUrl: commons('Into_the_Jaws_of_Death_23-0455M_edit.jpg')
    },
    texts: {
      zien: 'Vanuit een landingsvaartuig met een open klep zie je soldaten tot hun middel door het water waden, op weg naar een strand in nevel en rook. Daarachter rijzen steile heuvels op. Rechtsonder zie je nog de helm van een man in de boot.',
      context: 'Op D-Day, 6 juni 1944, landden geallieerde troepen in Normandië. Sargent, fotograaf bij de Amerikaanse kustwacht, maakte deze foto rond 7.40 uur bij de sector ‘Easy Red’ van Omaha Beach. Op dit strand vielen die dag zeer veel slachtoffers.',
      beeldaspecten: 'Een kader in een kader: de opening van de boot omlijst het strand. De rij soldaten vormt een horizontale lijn die je blik meeneemt. Grijze, vlakke tonen en rook maken de kust onzeker en dreigend.',
      betekenis: 'De kijker staat letterlijk op de plek van de volgende soldaat. De titel maakt van een documentaire opname een symbool voor moed en angst tegelijk.',
      zaal: 'Onze keuze: een foto naast schilderijen laat zien dat dit de eerste oorlog was die zo massaal werd gefotografeerd. De camera werd een getuige.',
      periode: 'Documentaire fotografie veranderde in de jaren veertig hoe mensen thuis de werkelijkheid van de oorlog zagen.'
    },
    sources: [
      { label: 'National Archives – Into the Jaws of Death', url: 'https://www.archives.gov/research/still-pictures/highlights/into-the-jaws-of-death' },
      { label: 'Wikimedia Commons – bestandspagina', url: commons('Into_the_Jaws_of_Death_23-0455M_edit.jpg') }
    ]
  },
  {
    id: 'picasso-charnel',
    room: 'zaal1',
    status: 'periode',
    featured: true,
    title: 'Le Charnier (Het knekelhuis)',
    artist: 'Pablo Picasso',
    artistLife: '1881–1973',
    year: '1944–1945',
    medium: 'Olieverf en houtskool op doek',
    dimensions: '199,8 × 250,1 cm',
    size: { w: 250.1, h: 199.8 },
    collection: 'The Museum of Modern Art (MoMA), New York (93.1971)',
    type: 'schilderij',
    image: {
      file: 'picasso-charnel.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Pablo Picasso. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://www.wikiart.org/en/pablo-picasso/the-charnel-house-1945'
    },
    texts: {
      zien: 'Onder een tafel met een kan en een pan ligt een stapel verwrongen lichamen; handen lijken vastgebonden. Delen van het doek zijn onaf: je ziet houtskoollijnen en kale stukken doek zonder kleur.',
      context: 'Picasso bleef tijdens de Duitse bezetting in Parijs. Het werk ontstond in 1944–1945, toen de eerste berichten en beelden van massamoorden en concentratiekampen naar buiten kwamen. Het wordt vaak gezien als tegenhanger van Guernica (1937), dat in de entree hangt.',
      beeldaspecten: 'Bijna alleen zwart, wit en grijs (grisaille). De lichamen zijn kubistisch gebroken. Het gewone stilleven boven staat in scherp contrast met de verschrikking eronder. Het onafgemaakte deel laat de tekening zien.',
      betekenis: 'Het stilleven verwijst naar het gewone leven dat doorging terwijl eronder de gruwel lag. Het onafgemaakte deel kun je lezen als het onvermogen om dit volledig af te beelden – dat is een interpretatie, geen vaststaand gegeven.',
      zaal: 'Onze keuze: het hangt op de laatste wand van zaal 1, vlak bij de doorgang. Het vat samen waar de crisis toe leidde. Kijk ook terug naar Guernica in de entree.',
      periode: 'Het kubisme, ontstaan rond 1907, bleef in de jaren veertig een taal om geweld en verbrokkeling te tonen.'
    },
    sources: [
      { label: 'MoMA – Pablo Picasso, The Charnel House', url: 'https://www.moma.org/collection/works/78752' }
    ]
  },
  {
    id: 'levy-nagasaki',
    room: 'zaal1',
    status: 'periode',
    title: 'Atomic Cloud Rises over Nagasaki (Atoomwolk boven Nagasaki)',
    artist: 'Charles Levy',
    artistLife: '1918–1997',
    year: '9 augustus 1945',
    medium: 'Foto, genomen vanuit een Amerikaanse B-29-bommenwerper',
    dimensions: 'Getoond als tentoonstellingsafdruk',
    size: { w: 74 },
    sizeNote: 'Getoond als vergrote tentoonstellingsafdruk.',
    collection: 'National Archives, College Park (NAID 535795)',
    type: 'foto',
    image: {
      file: 'levy-nagasaki.jpg',
      credit: 'U.S. National Archives, via Wikimedia Commons',
      license: 'Publiek domein (werk voor de Amerikaanse overheid)',
      sourceUrl: commons('Nagasakibomb.jpg')
    },
    texts: {
      zien: 'Een enorme, kolkende wolk stijgt in een zuil op boven een laag wolkendek. Bovenaan vormt zich een ronde ‘paddenstoel’. Van de stad zelf is niets te zien.',
      context: 'Drie dagen na Hiroshima (6 augustus 1945) werd op 9 augustus 1945 een atoombom op Nagasaki geworpen. Tienduizenden mensen kwamen direct om, en velen stierven later aan de gevolgen. Japan capituleerde kort daarna; op 2 september 1945 eindigde de Tweede Wereldoorlog officieel.',
      beeldaspecten: 'Een verticale, monumentale vorm domineert het beeld. Zachte grijstinten tegen wit. Door de grote afstand ontbreekt elke menselijke maat. De bijna ‘mooie’ vorm botst hard met wat hij betekent.',
      betekenis: 'De foto toont het einde van de oorlog én het begin van het atoomtijdperk. Dat je de slachtoffers niet ziet, maakt het beeld abstract – en juist daardoor beklemmend.',
      zaal: 'Onze keuze: deze foto sluit zaal 1 af. Hij laat zien dat de oorlog eindigde met een nieuwe vorm van onzekerheid, die na 1945 doorwerkte.',
      periode: 'De dreiging van totale vernietiging hoorde voortaan bij de naoorlogse wereld. Kunstenaars zochten naar beelden voor die nieuwe onzekerheid (zaal 4 en 5).'
    },
    sources: [
      { label: 'Wikimedia Commons – NARA-scan (NAID 535795)', url: commons('Nagasakibomb.jpg') },
      { label: 'National Archives – catalogus', url: 'https://catalog.archives.gov/id/535795' }
    ]
  },

  // ───────────────────────────── ZAAL 2 ─────────────────────────────
  {
    id: 'lange-american',
    room: 'zaal2',
    status: 'periode',
    featured: true,
    title: '“I Am an American” (Oakland, Californië)',
    artist: 'Dorothea Lange',
    artistLife: '1895–1965',
    year: 'Maart 1942',
    medium: 'Foto (zilvergelatinedruk), gemaakt voor de War Relocation Authority',
    dimensions: 'Getoond als tentoonstellingsafdruk',
    size: { w: 110 },
    sizeNote: 'Getoond als vergrote tentoonstellingsafdruk.',
    collection: 'National Archives; Library of Congress (cph.3a24566)',
    type: 'foto',
    image: {
      file: 'lange-american.jpg',
      credit: 'Library of Congress, via Wikimedia Commons',
      license: 'Publiek domein (werk voor de Amerikaanse overheid)',
      sourceUrl: commons('JapaneseAmericanGrocer1942.jpg')
    },
    texts: {
      zien: 'Een winkel op een straathoek met het opschrift ‘Wanto Co. Grocery’. Over de etalage hangt een groot spandoek: ‘I AM AN AMERICAN’. Boven de gevel hangt een bord met ‘SOLD’ (verkocht). Op straat staat een geparkeerde auto.',
      context: 'Na de Japanse aanval op Pearl Harbor (7 december 1941) tekende president Roosevelt op 19 februari 1942 Executive Order 9066. Daardoor werden ongeveer 120.000 mensen van Japanse afkomst aan de Amerikaanse westkust naar kampen gebracht; de meesten waren Amerikaans staatsburger. De eigenaar van deze winkel, de familie Masuda, had het spandoek op 8 december 1941 opgehangen. Kort daarna moest de familie vertrekken.',
      beeldaspecten: 'De tekst is het belangrijkste beeldelement. Het woord ‘SOLD’ boven ‘I AM AN AMERICAN’ geeft een bittere tegenstelling. De straat is leeg en de winkel gesloten. Lange kiest een rustige, frontale opname zonder dramatiek.',
      betekenis: 'De foto laat zien hoe identiteit ter discussie kwam te staan: iemand moest bewijzen dat hij erbij hoorde – en dat hielp niet. Lange gebruikt de tekst als stille ironie.',
      zaal: 'Onze keuze: de zaal over de mens begint met een gewone winkelgevel. Een klein, persoonlijk beeld vertelt hier een groot verhaal over uitsluiting.',
      periode: 'Documentaire fotografie werd een vorm van getuigenis. Een groot deel van Langes foto’s voor de War Relocation Authority werd tijdens de oorlog nauwelijks openbaar gemaakt.'
    },
    sources: [
      { label: 'Library of Congress – catalogusrecord', url: 'https://www.loc.gov/item/2004665381' },
      { label: 'Wikimedia Commons – bestandspagina', url: commons('JapaneseAmericanGrocer1942.jpg') },
      { label: 'National Archives – Executive Order 9066', url: 'https://www.archives.gov/milestone-documents/executive-order-9066' }
    ]
  },
  {
    id: 'adams-nakamura',
    room: 'zaal2',
    status: 'periode',
    title: 'Louise Tami Nakamura, Manzanar Relocation Center',
    artist: 'Ansel Adams',
    artistLife: '1902–1984',
    year: '1943',
    medium: 'Foto (zilvergelatinedruk)',
    dimensions: 'Getoond als tentoonstellingsafdruk',
    size: { w: 62 },
    sizeNote: 'Getoond als vergrote tentoonstellingsafdruk.',
    collection: 'Library of Congress, Prints & Photographs Division (ppprs.00025)',
    type: 'foto',
    image: {
      file: 'adams-nakamura.jpg',
      credit: 'Library of Congress, via Wikimedia Commons',
      license: 'Geen bekende auteursrechtelijke beperkingen (volgens de Library of Congress)',
      sourceUrl: commons('Ansel_Adams,_Portrait_of_Louise_Tami_Nakamura_at_Manzanar,_1943.jpg')
    },
    texts: {
      zien: 'Een close-up van een lachend meisje met strikken in haar haar en een kraagje met kant. Ze kijkt vrolijk en recht in de camera. De achtergrond is egaal en licht.',
      context: 'Ansel Adams, bekend van zijn landschapsfoto’s, fotografeerde in 1943 op uitnodiging van kampdirecteur Ralph Merritt het leven in Manzanar, een kamp voor Japanse Amerikanen in Californië. In 1944 verscheen zijn fotoboek ‘Born Free and Equal’. Later schonk hij de foto’s aan de Library of Congress.',
      beeldaspecten: 'Een strak kader rond het gezicht, scherp licht en een groot tonenbereik van wit tot donkergrijs. Er is niets te zien van het kamp zelf: alle aandacht gaat naar het meisje.',
      betekenis: 'Adams wilde laten zien dat de geïnterneerden gewone, loyale Amerikanen waren. Daardoor tonen zijn foto’s veerkracht en waardigheid. Critici merkten op dat het onrecht van het kamp er minder zichtbaar in is dan bij Lange.',
      zaal: 'Onze keuze: we hangen Adams naast Lange. Twee fotografen, hetzelfde onderwerp, twee heel verschillende verhalen. Welk beeld is ‘waarder’? Dat is precies de vraag van deze zaal.',
      periode: 'Ook documentaire fotografie is nooit neutraal: kader, licht en keuze van het onderwerp sturen wat de kijker voelt.'
    },
    sources: [
      { label: 'Library of Congress – Ansel Adams’s Photographs of Japanese-American Internment at Manzanar', url: 'https://www.loc.gov/collections/ansel-adams-manzanar/' },
      { label: 'Wikimedia Commons – bestandspagina', url: commons('Ansel_Adams,_Portrait_of_Louise_Tami_Nakamura_at_Manzanar,_1943.jpg') }
    ]
  },
  {
    id: 'parks-gothic',
    room: 'zaal2',
    status: 'periode',
    featured: true,
    title: 'Washington, D.C. Government Charwoman (American Gothic)',
    artist: 'Gordon Parks',
    artistLife: '1912–2006',
    year: 'Augustus 1942',
    medium: 'Foto (Farm Security Administration / Office of War Information)',
    dimensions: 'Getoond als tentoonstellingsafdruk',
    size: { w: 70 },
    sizeNote: 'Getoond als vergrote tentoonstellingsafdruk.',
    collection: 'Library of Congress (fsa.8b14845)',
    type: 'foto',
    image: {
      file: 'parks-gothic.jpg',
      credit: 'Library of Congress, via Wikimedia Commons',
      license: 'Publiek domein (FSA/OWI, werk voor de Amerikaanse overheid)',
      sourceUrl: commons('Gordon_Parks_-_American_Gothic.jpg')
    },
    texts: {
      zien: 'Ella Watson, een zwarte schoonmaakster bij de overheid, staat recht voor een grote Amerikaanse vlag. In haar ene hand houdt ze een bezem, naast haar staat een dweil. Ze kijkt ernstig in de camera.',
      context: 'Gordon Parks werkte in 1942 als fotograaf voor de Farm Security Administration in Washington en ervoer daar zelf rassendiscriminatie. Ella Watson werkte als schoonmaakster in het gebouw waar hij werkte. De pose verwijst naar het beroemde schilderij American Gothic (1930) van Grant Wood.',
      beeldaspecten: 'Een symmetrische, frontale compositie. De verticalen van bezem, dweil en vlagstrepen geven het beeld een strakke opbouw. Het grote, lichte vlak van de vlag staat in contrast met de vrouw ervoor.',
      betekenis: 'Ironie: de vlag staat voor vrijheid en gelijkheid, maar de vrouw ervoor krijgt die gelijkheid niet. In een land dat in oorlog was ‘voor de vrijheid’, toont Parks de rassenscheiding thuis.',
      zaal: 'Onze keuze: deze foto opent de middenwand. Ze laat zien hoe één persoonlijk portret een heel maatschappelijk verhaal kan vertellen.',
      periode: 'Fotografen citeerden bekende kunstwerken om sociale kritiek te geven. Fotografie werd in de jaren veertig volwaardig onderdeel van de kunstwereld.'
    },
    sources: [
      { label: 'Library of Congress – Washington, D.C. Government charwoman', url: 'https://www.loc.gov/item/2017765074' },
      { label: 'National Gallery of Art – Washington, D.C. Government Charwoman (American Gothic)', url: 'https://www.nga.gov/content/ngaweb/collection/art-object-page.171968.html' },
      { label: 'Wikimedia Commons – bestandspagina', url: commons('Gordon_Parks_-_American_Gothic.jpg') }
    ]
  },
  {
    id: 'nussbaum-judenpass',
    room: 'zaal2',
    status: 'periode',
    featured: true,
    title: 'Selbstbildnis mit Judenpass (Zelfportret met jodenpas)',
    artist: 'Felix Nussbaum',
    artistLife: '1904–1944',
    year: 'ca. 1943',
    yearNote: 'De precieze datering is niet bekend; de collectie houdt ca. 1943 aan.',
    medium: 'Olieverf op paneel',
    dimensions: '56 × 49 cm',
    size: { w: 49, h: 56 },
    collection: 'Felix-Nussbaum-Haus, Osnabrück',
    type: 'schilderij',
    image: {
      file: 'nussbaum-judenpass.jpg',
      credit: 'Wikimedia Commons',
      license: 'Publiek domein in Nederland en de EU (de maker overleed in 1944)',
      sourceUrl: commons('1943-Felix-Nussbaum-Selbstporträt-mit-Judenpaß-Auschwitz.jpg')
    },
    texts: {
      zien: 'De kunstenaar staat in een hoek tussen hoge muren, met hoed en jas. Op zijn jas zit een gele jodenster. Hij houdt een identiteitsbewijs omhoog met de stempels ‘JUIF – JOOD’. Boven de muur zie je een donkere lucht en een kale boom met een paar bloesems.',
      context: 'In bezet België moesten joden zich laten registreren; hun identiteitspapieren kregen een stempel. Nussbaum, die uit Duitsland was gevlucht, leefde met zijn vrouw ondergedoken in Brussel. In 1944 werden zij ontdekt en naar Auschwitz gedeporteerd.',
      beeldaspecten: 'De muren sluiten de figuur in: er is geen uitweg. Zijn blik is schuin en waakzaam. De kleuren zijn gedempt; alleen de gele ster en het papier springen eruit. Het paspoort wordt als bewijsstuk naar de kijker toegedraaid.',
      betekenis: 'Een zelfportret als getuigenis: ‘dit ben ik, en zo word ik behandeld’. De bloesems aan de kale boom kunnen worden gelezen als een sprankje hoop – dat is een interpretatie.',
      zaal: 'Onze keuze: vergelijk dit werk met Langes ‘I Am an American’. Twee mensen worden door papieren en borden gedefinieerd – de één moet bewijzen dat hij erbij hoort, de ander wordt door zijn papieren uitgesloten.',
      periode: 'Het werk toont hoe vervolging tot in het persoonlijkste genre doordrong: het zelfportret.'
    },
    sources: [
      { label: 'Wikimedia Commons – bestandspagina met collectiegegevens', url: commons('1943-Felix-Nussbaum-Selbstporträt-mit-Judenpaß-Auschwitz.jpg') },
      { label: 'Deutsches Historisches Museum (LeMO) – biografie Felix Nussbaum', url: 'https://www.dhm.de/lemo/biografie/felix-nussbaum' }
    ]
  },
  {
    id: 'salomon-leben',
    room: 'zaal2',
    status: 'periode',
    title: 'Leben? oder Theater? Ein Singespiel (Leven? of theater? Een zangspel)',
    artist: 'Charlotte Salomon',
    artistLife: '1917–1943',
    year: '1940–1942',
    yearNote: 'Bronnen geven 1940–1942 of 1941–1942 als ontstaansperiode.',
    medium: 'Gouache op papier (reeks; het museum bewaart circa 1.300 bladen)',
    dimensions: 'Losse bladen van ongeveer 32,5 × 25 cm',
    size: { w: 32.5, h: 25 },
    collection: 'Joods Museum, Amsterdam (geschonken door Paula en Albert Salomon, 1971)',
    type: 'schilderij',
    image: {
      file: 'salomon-leben.jpg',
      credit: 'Joods Museum Amsterdam, via Wikimedia Commons',
      license: 'Publiek domein in Nederland (maker overleed in 1943) Getoond: het titelblad van de reeks.',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Charlotte_Salomon_-_JHM_4155.jpg'
    },
    texts: {
      zien: 'Geen enkel schilderij, maar een lange reeks genummerde gouaches in felle kleuren. Beelden, tekst en aanwijzingen voor muziek lopen door elkaar. Figuren komen vaak meerdere keren op één blad voor, alsof je naar een filmstrip kijkt.',
      context: 'Salomon, een jonge Duits-joodse kunstenares uit Berlijn, vluchtte in 1939 naar Zuid-Frankrijk. Daar maakte ze in korte tijd dit autobiografische werk over haar familie en haar eigen leven. In 1943 werd ze naar Auschwitz gedeporteerd en vermoord; ze was zwanger.',
      beeldaspecten: 'Felle primaire kleuren, een snelle, losse penseelstreek en tekst als beeldelement. Door figuren te herhalen op één blad suggereert Salomon beweging en verloop van tijd.',
      betekenis: 'Door haar levensverhaal als ‘theater’ te presenteren, schept Salomon afstand tot haar trauma. De titelvraag ‘Leven? of theater?’ laat open of kunst de werkelijkheid toont of herschept – precies de vraag van onze tentoonstelling.',
      zaal: 'Onze keuze: dit werk geeft de zaal een Nederlandse verbinding, want het wordt bewaard in Amsterdam. Het hangt tegenover Nussbaum: twee joodse kunstenaars die in ballingschap hun eigen verhaal vastlegden.',
      periode: 'Kunst werd voor vervolgde kunstenaars een manier om herinnering te bewaren toen hun bestaan werd bedreigd.'
    },
    sources: [
      { label: 'Jüdisches Museum Berlin – Charlotte Salomon. Life? or Theatre?', url: 'https://www.jmberlin.de/charlottesalomon/en' },
      { label: 'Joods Museum Amsterdam (Joods Cultureel Kwartier)', url: 'https://jck.nl' }
    ]
  },
  {
    id: 'hopper-nighthawks',
    room: 'zaal2',
    status: 'periode',
    featured: true,
    title: 'Nighthawks (Nachtbrakers)',
    artist: 'Edward Hopper',
    artistLife: '1882–1967',
    year: '1942',
    medium: 'Olieverf op doek',
    dimensions: '84,1 × 152,4 cm',
    size: { w: 152.4, h: 84.1 },
    collection: 'Art Institute of Chicago (1942.51), Friends of American Art Collection',
    type: 'schilderij',
    image: {
      file: 'hopper-nighthawks.jpg',
      credit: 'Art Institute of Chicago, via Wikimedia Commons',
      license: '© de rechthebbenden van Edward Hopper. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Nighthawks_by_Edward_Hopper_1942.jpg'
    },
    texts: {
      zien: '’s Nachts zitten drie klanten aan de bar van een eethuis op een straathoek; een man in het wit werkt achter de bar. Door het grote, ronde raam valt fel licht op de verder lege, donkere straat. Een deur naar binnen is niet te zien.',
      context: 'Hopper voltooide het werk begin 1942, enkele weken na de aanval op Pearl Harbor. Het Art Institute of Chicago kocht het nog in hetzelfde jaar. Hopper zei later dat hij waarschijnlijk onbewust ‘de eenzaamheid van een grote stad’ had geschilderd.',
      beeldaspecten: 'Gelig-groen kunstlicht tegen nachtelijk donker. Sterke horizontalen en de diagonaal van de bar sturen je blik. Het glas scheidt binnen en buiten: jij staat als kijker buiten. De architectuur is vereenvoudigd en leeg.',
      betekenis: 'De mensen zijn dicht bij elkaar maar niet verbonden. Veel kijkers lezen er de gespannen sfeer van de oorlogstijd in; Hopper heeft dat verband zelf niet zo gelegd, dus dat blijft een interpretatie.',
      zaal: 'Onze keuze: het ‘thuisfront’. Het gewone leven gaat door, maar voelt leeg en onzeker.',
      periode: 'Ook realistische schilderkunst kon in de jaren veertig vooral een gevoel uitdrukken in plaats van een gebeurtenis.'
    },
    sources: [
      { label: 'Art Institute of Chicago – Nighthawks', url: 'https://www.artic.edu/artworks/111628/nighthawks' },
      { label: 'Wikipedia – Nighthawks (Hopper)', url: 'https://en.wikipedia.org/wiki/Nighthawks_(Hopper)' }
    ]
  },

  // ───────────────────────────── ZAAL 3 ─────────────────────────────
  {
    id: 'ernst-europe',
    room: 'zaal3',
    status: 'periode',
    featured: true,
    title: 'Europe after the Rain II (Europa na de regen II)',
    artist: 'Max Ernst',
    artistLife: '1891–1976',
    year: '1940–1942',
    yearNote: 'Begonnen in Frankrijk, voltooid in de Verenigde Staten.',
    medium: 'Olieverf op doek (met de techniek decalcomanie)',
    dimensions: 'ca. 55 × 148 cm',
    size: { w: 148, h: 55 },
    collection: 'Wadsworth Atheneum Museum of Art, Hartford (Connecticut)',
    type: 'schilderij',
    image: {
      file: 'ernst-europe.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Max Ernst. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://www.wikiart.org/en/max-ernst/europe-after-the-rain-ii'
    },
    texts: {
      zien: 'Een breed landschap van verweerde, zwamachtige rotsen, ruïnes en vergane vormen, als een wereld na een ramp. Tussen de vormen ontdek je half verborgen figuren. Boven alles strekt zich een heldere lucht uit.',
      context: 'Ernst, een Duitse kunstenaar die in Frankrijk woonde, werd bij het uitbreken van de oorlog als ‘vijandige vreemdeling’ geïnterneerd, onder meer in Camp des Milles. In 1941 vluchtte hij naar de VS, mede met hulp van het Emergency Rescue Committee van Varian Fry en van verzamelaar Peggy Guggenheim. Daar voltooide hij het schilderij.',
      beeldaspecten: 'Decalcomanie: verf wordt tussen twee oppervlakken geperst en weer losgetrokken, zodat toevallige structuren ontstaan; Ernst werkte die daarna met de kwast uit. Okers, roestbruin en groen tegen blauw. Een panoramisch, breed formaat.',
      betekenis: 'Een visioen van een verwoest Europa, grotendeels geschilderd vóórdat de ergste verwoestingen plaatsvonden. Toeval en het onderbewuste werken samen tot een droomlandschap dat als een voorspelling voelt.',
      zaal: 'Onze keuze: dit werk verbindt het surrealisme met de oorlog. De droomtechniek wordt een middel om chaos zichtbaar te maken.',
      periode: 'Het werk staat voor de vlucht van Europese surrealisten naar New York – een beslissende stap in het verhaal van zaal 4.'
    },
    sources: [
      { label: 'Wadsworth Atheneum Museum of Art', url: 'https://www.thewadsworth.org' },
      { label: 'Heidelberg University – arthistoricum (Europe after the Rain II)', url: 'https://books.ub.uni-heidelberg.de/arthistoricum/catalog/view/485/736/87202' }
    ]
  },
  {
    id: 'miro-escape',
    room: 'zaal3',
    status: 'periode',
    title: 'L’Échelle de l’évasion (De ontsnappingsladder), uit de reeks Constellations',
    artist: 'Joan Miró',
    artistLife: '1893–1983',
    year: '1940',
    medium: 'Gouache, aquarel en inkt op papier',
    dimensions: '40,0 × 47,6 cm',
    size: { w: 47.6, h: 40 },
    collection: 'The Museum of Modern Art (MoMA), New York (743.1978), Helen Acheson Bequest',
    type: 'schilderij',
    image: {
      file: 'miro-escape.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Joan Miró. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://www.wikiart.org/en/joan-miro/the-escape-ladder-1940'
    },
    texts: {
      zien: 'Over een lichte, gevlekte achtergrond zweven sterren, ogen, manen, vogels en vrouwfiguren, verbonden door dunne zwarte lijnen. Kleine vlakjes rood, blauw en geel geven ritme aan het geheel.',
      context: 'Miró begon de reeks van 23 Constellations in januari 1940 in Varengeville (Normandië) en voltooide haar in september 1941, nadat hij voor de oorlog naar Spanje was teruggekeerd. Het Metropolitan Museum en het MoMA beschrijven de reeks als een ontsnapping uit de oorlog in de wereld van de nacht, de muziek en de sterren.',
      beeldaspecten: 'Een ‘all-over’-compositie: vormen zijn over het hele vlak verspreid, zonder duidelijk middelpunt. Dunne lijnen verbinden de tekens als sterrenbeelden. Primaire kleuren op een lichte ondergrond.',
      betekenis: 'De ladder is bij Miró een terugkerend symbool voor ontsnapping en voor de verbinding tussen aarde en hemel. Kleine tekens worden een eigen, poëtische taal.',
      zaal: 'Onze keuze: het werk hangt op een schuine wand – in deze zaal klopt de ruimte bewust niet helemaal, net als in een droom.',
      periode: 'De Constellations werden in 1945 in New York tentoongesteld. Hun ‘all-over’-opbouw sluit aan bij wat de Amerikaanse abstract expressionisten later deden.'
    },
    sources: [
      { label: 'MoMA – The Escape Ladder (from the Constellation series)', url: 'https://www.moma.org/collection/works/37949' },
      { label: 'The Met – Constellation: Toward the Rainbow (over de reeks)', url: 'https://www.metmuseum.org/art/collection/search/490007' }
    ]
  },
  {
    id: 'tanning-birthday',
    room: 'zaal3',
    status: 'periode',
    featured: true,
    title: 'Birthday (Verjaardag)',
    artist: 'Dorothea Tanning',
    artistLife: '1910–2012',
    year: '1942',
    medium: 'Olieverf op doek',
    dimensions: '102,2 × 64,8 cm',
    size: { w: 64.8, h: 102.2 },
    collection: 'Philadelphia Museum of Art (aangekocht in 1999)',
    type: 'schilderij',
    image: {
      file: 'tanning-birthday.jpg',
      credit: 'Philadelphia Museum of Art',
      license: '© de rechthebbenden van Dorothea Tanning. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://philamuseum.org/collection/object/93232'
    },
    texts: {
      zien: 'De kunstenares staat blootsvoets in een kamer met een reeks openstaande deuren die eindeloos achter elkaar doorlopen. Ze draagt een bloes met pofmouwen en een rok die lijkt te bestaan uit takken en wortels. Aan haar voeten zit een vreemd, gevleugeld fabeldier.',
      context: 'Tanning schilderde dit zelfportret in New York, waar ze toen woonde. Max Ernst zag het in haar atelier toen hij werken zocht voor een tentoonstelling van vrouwelijke kunstenaars in de galerie van Peggy Guggenheim, en stelde de titel voor.',
      beeldaspecten: 'Een gladde, realistische schildertrant, ondanks het vreemde onderwerp. Diepte door de herhaalde deuren. Het lichte lichaam steekt af tegen het donkere interieur. De figuur staat rechtop en frontaal, vol zelfvertrouwen.',
      betekenis: 'De deuren kunnen staan voor mogelijkheden, het onderbewuste of de toekomst. Tanning toont zichzelf als hoofdpersoon van haar eigen droomwereld, niet als muze van een man – belangrijk in een beweging die door mannen werd gedomineerd.',
      zaal: 'Onze keuze: ook dit werk hangt op de schuine wand, achter Miró: je moet eromheen lopen, zoals je door de deuren in het schilderij zou gaan.',
      periode: 'Het surrealisme kreeg in de jaren veertig in New York een nieuw middelpunt – en vrouwelijke kunstenaars kregen er meer ruimte.'
    },
    sources: [
      { label: 'Philadelphia Museum of Art – Birthday', url: 'https://philamuseum.org/collection/object/93232' }
    ]
  },
  {
    id: 'kahlo-column',
    room: 'zaal3',
    status: 'periode',
    title: 'La columna rota (De gebroken zuil)',
    artist: 'Frida Kahlo',
    artistLife: '1907–1954',
    year: '1944',
    medium: 'Olieverf op masoniet',
    dimensions: '39,8 × 30,6 cm',
    size: { w: 30.6, h: 39.8 },
    collection: 'Museo Dolores Olmedo, Mexico-Stad',
    type: 'schilderij',
    image: {
      file: 'kahlo-column.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Frida Kahlo. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://www.wikiart.org/en/frida-kahlo/the-broken-column-1944'
    },
    texts: {
      zien: 'Kahlo staat in een kaal, gebarsten landschap. Haar bovenlichaam is opengesneden; in plaats van een ruggengraat zie je een brokkelende Griekse zuil. Een metalen korset houdt haar lichaam bij elkaar. Overal in haar huid steken spijkers. Tranen lopen over haar wangen, maar ze kijkt de kijker recht aan.',
      context: 'Kahlo liep in 1925 bij een busongeluk zware verwondingen op en onderging haar hele leven operaties. In 1944 moest ze een stalen korset dragen. André Breton bewonderde haar werk en noemde het surrealistisch, maar Kahlo zei zelf dat ze geen dromen schilderde, maar haar eigen werkelijkheid.',
      beeldaspecten: 'Een symmetrische, frontale figuur. Scherpe details (spijkers, korset) tegenover een vlak landschap. Koele blauwe lucht tegen aardse tinten. De zuil vormt de verticale as van het beeld.',
      betekenis: 'Lichamelijke pijn wordt een symbolisch zelfportret. De rechte houding en de directe blik laten kracht zien, ondanks de pijn.',
      zaal: 'Onze keuze: is dit surrealisme, of juist extreem persoonlijk realisme? Die vraag maakt het werk perfect voor deze zaal – en voor onze hoofdvraag.',
      periode: 'De grens tussen droom en werkelijkheid werd in de jaren veertig door veel kunstenaars bevraagd.'
    },
    sources: [
      { label: 'Learner.org – Art Through Time: The Broken Column', url: 'https://www.learner.org/series/art-through-time-a-global-view/dreams-and-visions/the-broken-column/' },
      { label: 'Wikipedia – The Broken Column', url: 'https://en.wikipedia.org/wiki/The_Broken_Column' }
    ]
  },
  {
    id: 'magritte-empire',
    room: 'zaal3',
    status: 'periode',
    title: 'L’Empire des lumières, II (Het rijk der lichten, II)',
    artist: 'René Magritte',
    artistLife: '1898–1967',
    year: '1950',
    medium: 'Olieverf op doek',
    dimensions: '78,8 × 99,1 cm',
    size: { w: 99.1, h: 78.8 },
    collection: 'The Museum of Modern Art (MoMA), New York (16.1951), schenking D. en J. de Menil',
    type: 'schilderij',
    image: {
      file: 'magritte-empire.jpg',
      credit: 'Wikipedia (niet-vrij bestand)',
      license: '© de rechthebbenden van René Magritte. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://en.wikipedia.org/wiki/File:The_Empire_of_Light_MOMA.jpg'
    },
    texts: {
      zien: 'Een straat met een huis, bomen en één brandende straatlantaarn is in nachtelijk duister gehuld. Maar de lucht erboven is helder blauw met witte wolken, als op een zonnige middag.',
      context: 'Magritte, een Belgische surrealist, woonde tijdens de oorlog in bezet Brussel. Vanaf het eind van de jaren veertig schilderde hij talrijke versies van dit thema; deze versie uit 1950 kwam in 1951 in het MoMA.',
      beeldaspecten: 'Een heldere, bijna fotografische schildertrant. Een tweedeling tussen dag (boven) en nacht (onder). Warm lamplicht tegen koel blauw. Een rustige, evenwichtige compositie.',
      betekenis: 'Twee tegenstellingen die niet tegelijk kunnen bestaan, worden als vanzelfsprekend getoond. Het is een raadsel zonder oplossing dat de kijker laat twijfelen aan wat ‘normaal’ is.',
      zaal: 'Onze keuze: het jongste werk van deze zaal. Het laat zien dat het surrealisme in 1950 nog volop leefde, terwijl in New York een nieuwe abstractie opkwam.',
      periode: 'Rond 1950 bestonden figuratieve droombeelden en radicale abstractie naast elkaar.'
    },
    sources: [
      { label: 'MoMA – René Magritte, The Empire of Light, II', url: 'https://www.moma.org/collection/works/78456' }
    ]
  },
  {
    id: 'gorky-liver',
    room: 'zaal3',
    status: 'periode',
    featured: true,
    title: 'The Liver Is the Cock’s Comb (De lever is de hanenkam)',
    artist: 'Arshile Gorky',
    artistLife: 'ca. 1904–1948',
    year: '1944',
    medium: 'Olieverf op doek',
    dimensions: '186,1 × 249,9 cm',
    size: { w: 249.9, h: 186.1 },
    collection: 'Buffalo AKG Art Museum, Buffalo (New York)',
    type: 'schilderij',
    image: {
      file: 'gorky-liver.jpg',
      credit: 'Wikimedia Commons',
      license: 'Publiek domein (de maker overleed in 1948)',
      sourceUrl: commons("The_Liver_is_the_Cock's_Comb.jpg")
    },
    texts: {
      zien: 'Een groot doek vol zwevende, organische vormen in felrood, geel, zwart en wit, verbonden door dunne, sierlijke lijnen. Sommige vormen lijken op organen, veren of plantdelen, maar er is geen duidelijke voorstelling.',
      context: 'Gorky werd rond 1904 in Armenië geboren en overleefde de Armeense genocide; zijn moeder stierf in 1919 van de honger. In 1920 emigreerde hij naar de VS. Vanaf 1944 werd hij aangemoedigd door André Breton, die hem tot de surrealisten rekende. Gorky overleed in 1948.',
      beeldaspecten: 'Biomorfe vormen, vloeiende contourlijnen als in een tekening, en dun verdunde verf die hier en daar uitloopt. Het grote formaat geeft de vormen ruimte om te bewegen.',
      betekenis: 'De titel is raadselachtig, een vreemde combinatie zoals de surrealisten die graag maakten. Het werk verbindt herinneringen, natuur en verlangen zonder ze letterlijk te tonen.',
      zaal: 'Onze keuze: Gorky hangt naast de doorgang naar zaal 4. Hij is de brug: hij verbindt surrealistisch automatisme met de schaal en de vrijheid van het abstract expressionisme.',
      periode: 'Het werk laat zien hoe het surrealisme in New York overging in een nieuwe, Amerikaanse abstractie.'
    },
    sources: [
      { label: 'Buffalo AKG Art Museum – Arshile Gorky', url: 'https://buffaloakg.org/node/13663' },
      { label: 'Wikipedia – The Liver Is the Cock’s Comb', url: 'https://en.wikipedia.org/wiki/The_Liver_Is_the_Cock%27s_Comb' }
    ]
  },

  // ───────────────────────────── ZAAL 4 ─────────────────────────────
  {
    id: 'mondrian-broadway',
    room: 'zaal4',
    status: 'periode',
    featured: true,
    title: 'Broadway Boogie Woogie',
    artist: 'Piet Mondriaan',
    artistLife: '1872–1944',
    year: '1942–1943',
    medium: 'Olieverf op doek',
    dimensions: '127 × 127 cm',
    size: { w: 127, h: 127 },
    collection: 'The Museum of Modern Art (MoMA), New York (73.1943)',
    type: 'schilderij',
    image: {
      file: 'mondrian-broadway.jpg',
      credit: 'Wikimedia Commons',
      license: 'Publiek domein (de maker overleed in 1944; ook in de VS publiek domein)',
      sourceUrl: commons('Piet_Mondrian,_1942_-_Broadway_Boogie_Woogie.jpg')
    },
    texts: {
      zien: 'Een raster van gele lijnen, opgebouwd uit kleine blokjes rood, blauw, grijs en geel, op een witte ondergrond. Hier en daar liggen grotere gekleurde vlakken. De zwarte lijnen uit zijn eerdere werk ontbreken.',
      context: 'Mondriaan, geboren in Amersfoort, vertrok in 1938 uit Parijs naar Londen en kwam in oktober 1940 aan in New York. Hij was gefascineerd door de stad, de jazz en de boogiewoogie-muziek. Het MoMA verwierf het schilderij al in 1943.',
      beeldaspecten: 'Ritme en herhaling, uitsluitend primaire kleuren en grijs, geen diepte maar alleen het vlak. De ‘knipperende’ blokjes suggereren verkeer, lichtjes en muziek.',
      betekenis: 'De stad en de muziek worden vertaald in pure abstractie. Mondriaan laat zien dat abstracte kunst niet koud hoeft te zijn: het werk zit vol energie.',
      zaal: 'Onze keuze: het werk hangt bij de ingang van zaal 4 als vertrekpunt. Een Europese abstracte kunstenaar komt aan in New York. Let op het verschil: Mondriaan werkt geometrisch en beheerst; de New Yorkse schilders in deze zaal werken met gebaar en emotie.',
      periode: 'Het kunstcentrum van de wereld verschuift in de jaren veertig van Parijs naar New York; Europese ballingen als Mondriaan spelen daarin een sleutelrol.'
    },
    sources: [
      { label: 'MoMA – Piet Mondrian, Broadway Boogie Woogie', url: 'https://www.moma.org/collection/works/78682' },
      { label: 'Wikimedia Commons – bestandspagina', url: commons('Piet_Mondrian,_1942_-_Broadway_Boogie_Woogie.jpg') }
    ]
  },
  {
    id: 'pollock-autumn',
    room: 'zaal4',
    status: 'periode',
    featured: true,
    title: 'Autumn Rhythm (Number 30) (Herfstritme, nummer 30)',
    artist: 'Jackson Pollock',
    artistLife: '1912–1956',
    year: '1950',
    medium: 'Email (lakverf) op doek',
    dimensions: '266,7 × 525,8 cm',
    size: { w: 525.8, h: 266.7 },
    collection: 'The Metropolitan Museum of Art, New York (aangekocht in 1957)',
    type: 'schilderij',
    image: {
      file: 'pollock-autumn.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Jackson Pollock. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://www.wikiart.org/en/jackson-pollock/autumn-rhythm-number-30-1950'
    },
    texts: {
      zien: 'Een enorm doek zonder grondlaag, bedekt met lijnen, slierten, vlekken en spatten van zwart, wit, bruin en grijsblauw. Er is geen middelpunt: het netwerk van lijnen beslaat het hele vlak.',
      context: 'Vanaf 1947 legde Pollock zijn doeken op de vloer van zijn schuur in Springs (Long Island) en liet hij verf druipen, gieten en slingeren met stokken en verharde kwasten. In 1949 vroeg het tijdschrift Life zich af of hij ‘de grootste levende schilder van de Verenigde Staten’ was. In 1950 fotografeerde en filmde Hans Namuth hem aan het werk.',
      beeldaspecten: 'Een all-over-compositie. Elke lijn is het spoor van een beweging van het hele lichaam. Ritme zonder begin of eind. Het ruwe doek blijft zichtbaar, en het formaat is veel groter dan de kijker.',
      betekenis: 'Het schilderij is het verslag van een handeling. Daarom bedacht criticus Harold Rosenberg in 1952 de term ‘action painting’ (let op: die term is van ná 1950). Je kunt er natuur in herkennen, maar het gaat vooral om energie, ritme en de aanwezigheid van de maker.',
      zaal: 'Onze keuze: het grootste werk van het museum hangt op de grootste wand. Hier ervaar je wat schaal doet: je staat bijna ín het schilderij.',
      periode: 'In 1950 kreeg een radicaal nieuwe, Amerikaanse beeldtaal internationale aandacht, onder meer op de Biënnale van Venetië.'
    },
    sources: [
      { label: 'The Met – Autumn Rhythm (Number 30)', url: 'https://www.metmuseum.org/art/collection/search/488978' },
      { label: 'Wikipedia – Autumn Rhythm (Number 30)', url: 'https://en.wikipedia.org/wiki/Autumn_Rhythm_(Number_30)' }
    ]
  },
  {
    id: 'krasner-untitled',
    room: 'zaal4',
    status: 'periode',
    title: 'Untitled (Zonder titel), uit de reeks Little Images',
    artist: 'Lee Krasner',
    artistLife: '1908–1984',
    year: '1949',
    medium: 'Olieverf op board',
    dimensions: '121,9 × 93,9 cm',
    size: { w: 93.9, h: 121.9 },
    collection: 'The Museum of Modern Art (MoMA), New York (500.1969), schenking Alfonso A. Ossorio',
    type: 'schilderij',
    image: {
      file: 'krasner-untitled.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Lee Krasner. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding. Let op: WikiArt noemt dit werk ‘Untitled, 1949’; we konden niet met zekerheid vaststellen dat het om precies het MoMA-exemplaar gaat.',
      sourceUrl: 'https://www.wikiart.org/en/lee-krasner/untitled-1949'
    },
    texts: {
      zien: 'Een dicht raster van kleine, dikke tekens in wit, zwart en kleuren. Ze lijken op letters van een onbekend schrift en vullen rij na rij het hele vlak.',
      context: 'Krasner was al een gevestigde abstracte schilder toen ze Pollock leerde kennen; ze trouwden in 1945 en verhuisden naar Springs op Long Island. Daar maakte ze eind jaren veertig de reeks ‘Little Images’, aan een tafel in haar slaapkamer. Lange tijd werd ze vooral gezien als ‘de vrouw van Pollock’.',
      beeldaspecten: 'Dikke verf, vaak rechtstreeks uit de tube. Herhaling en een rasterstructuur zonder middelpunt (all-over). De verf vormt een reliëf.',
      betekenis: 'Krasner vergeleek de tekens met het Hebreeuwse schrift dat ze als kind leerde. Het is een persoonlijke, onleesbare taal: kunst als schrift zonder vaste betekenis.',
      zaal: 'Onze keuze: Krasner krijgt een eigen plek in deze zaal, om te laten zien dat vrouwen een zelfstandige bijdrage leverden aan het abstract expressionisme.',
      periode: 'De rol van vrouwelijke kunstenaars in deze periode bleef in de geschiedschrijving lang onderbelicht.'
    },
    sources: [
      { label: 'MoMA – Lee Krasner, Untitled (1949)', url: 'https://www.moma.org/collection/works/79836' },
      { label: 'MoMA Learning – Lee Krasner, Untitled', url: 'https://www.moma.org/learn/moma_learning/lee-krasner-untitled-1949/' }
    ]
  },
  {
    id: 'dekooning-excavation',
    room: 'zaal4',
    status: 'periode',
    title: 'Excavation (Opgraving)',
    artist: 'Willem de Kooning',
    artistLife: '1904–1997',
    year: '1950',
    medium: 'Olieverf (en email) op doek',
    dimensions: '205,7 × 254,6 cm',
    size: { w: 254.6, h: 205.7 },
    collection: 'Art Institute of Chicago (1952.1)',
    type: 'schilderij',
    image: {
      file: 'dekooning-excavation.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Willem de Kooning. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://www.wikiart.org/en/willem-de-kooning/excavation-1950'
    },
    texts: {
      zien: 'Een gebroken wit vlak vol in elkaar grijpende, hoekige en ronde vormen, omlijnd met zwarte lijnen. Kleine accenten geel, rood en blauw lichten op. Hier en daar lijk je fragmenten van ogen, monden of lichaamsdelen te zien.',
      context: 'De Kooning werd in Rotterdam geboren en reisde in 1926 als verstekeling naar de VS. Excavation was het grootste doek dat hij tot dan toe had gemaakt. Het werd in 1950 getoond op de Biënnale van Venetië; het Art Institute of Chicago kocht het in 1952.',
      beeldaspecten: 'Krachtige, gestische penseelstreken. De verf werd aangebracht, weggeschraapt en opnieuw geschilderd, laag over laag. Een dicht, beweeglijk vlak zonder rustpunt; overwegend licht met donkere contouren.',
      betekenis: 'De titel verwijst naar graven in lagen: het doek lijkt een archeologische opgraving. Het werk zweeft tussen abstractie en figuratie, want de Kooning bleef altijd met het menselijk lichaam bezig.',
      zaal: 'Onze keuze: een Nederlandse verbinding in het hart van New York – een Rotterdammer als een van de leiders van de nieuwe beeldtaal.',
      periode: 'Naast Pollocks druipschilderijen laat dit werk een andere kant van het ‘gebaar’ zien: schilderen als worsteling.'
    },
    sources: [
      { label: 'Art Institute of Chicago – Excavation', url: 'https://www.artic.edu/artworks/76244/excavation' },
      { label: 'MoMA – de Kooning: A Retrospective (2011)', url: 'https://www.moma.org/interactives/exhibitions/2011/dekooning/archives/111.html' }
    ]
  },
  {
    id: 'rothko-no3',
    room: 'zaal4',
    status: 'periode',
    featured: true,
    title: 'No. 3/No. 13 (Magenta, Black, Green on Orange)',
    artist: 'Mark Rothko',
    artistLife: '1903–1970',
    year: '1949',
    medium: 'Olieverf op doek',
    dimensions: '216,5 × 164,8 cm',
    size: { w: 164.8, h: 216.5 },
    collection: 'The Museum of Modern Art (MoMA), New York (428.1981)',
    type: 'schilderij',
    image: {
      file: 'rothko-no3.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Mark Rothko. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://www.wikiart.org/en/mark-rothko/no-3-no-13'
    },
    texts: {
      zien: 'Op een oranje veld zweven boven elkaar rechthoeken met zachte, vervagende randen, in magenta, zwart en groen, gescheiden door smalle banden.',
      context: 'Rothko werd geboren in Daugavpils (toen Rusland, nu Letland) en emigreerde als kind naar de VS. In 1943 schreef hij met Adolph Gottlieb een brief aan The New York Times waarin zij pleitten voor eenvoudige, grote vormen met een ‘tragische en tijdloze’ inhoud. Rond 1949 kwam hij tot zijn kenmerkende kleurvelden.',
      beeldaspecten: 'Kleur is het onderwerp. Dunne, doorschijnende verflagen en zachte randen laten de vlakken ‘ademen’. Een groot, staand formaat dat ongeveer de maat van een mens heeft.',
      betekenis: 'Rothko wilde basale menselijke emoties oproepen, zoals tragiek en extase. Hij wilde dat kijkers dichtbij stonden, zodat de kleur hen omringt.',
      zaal: 'Onze keuze: Rothko hangt recht tegenover de ingang van de zaal, zodat je vanaf de drempel de kleur op je af voelt komen.',
      periode: 'Dit is de stille kant van het abstract expressionisme: het ‘color field painting’.'
    },
    sources: [
      { label: 'MoMA – Mark Rothko, No. 3/No. 13', url: 'https://www.moma.org/collection/works/79687' }
    ]
  },
  {
    id: 'newman-onement',
    room: 'zaal4',
    status: 'periode',
    title: 'Onement I',
    artist: 'Barnett Newman',
    artistLife: '1905–1970',
    year: '1948',
    medium: 'Olieverf op doek en olieverf op afplakband op doek',
    dimensions: '69,2 × 41,2 cm',
    size: { w: 41.2, h: 69.2 },
    collection: 'The Museum of Modern Art (MoMA), New York (390.1992), schenking Annalee Newman',
    type: 'schilderij',
    image: {
      file: 'newman-onement.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Barnett Newman. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding.',
      sourceUrl: 'https://www.wikiart.org/en/barnett-newman/onement-i-1948'
    },
    texts: {
      zien: 'Een donkerrood vlak wordt precies in het midden verticaal gedeeld door een smalle, oranje streep met een ruwe rand.',
      context: 'Newman maakte dit werk in 1948. Hij plakte een strook afplakband op het doek, maar besloot het band te laten zitten en er met oranje verf overheen te schilderen. Later zag hij dit kleine doek als zijn doorbraak; zo’n verticale streep noemde hij een ‘zip’.',
      beeldaspecten: 'Extreme eenvoud: één verticale lijn, volledige symmetrie, twee kleuren. De met de hand geschilderde rand van de streep houdt het werk levendig.',
      betekenis: 'De zip kan scheiding én verbinding betekenen: licht dat door het donker breekt, of een mens die rechtop staat. Newman verbond zijn werk met ideeën over schepping en het ‘sublieme’. De titel wordt vaak in verband gebracht met ‘one’ (eenheid) en ‘atonement’ (verzoening) – dat is een gangbare interpretatie.',
      zaal: 'Onze keuze: we hangen dit kleine werk alleen op een grote witte wand. Zo zie je hoe één minimale ingreep een hele ruimte kan vullen.',
      periode: 'Aan het eind van het decennium brachten kunstenaars de schilderkunst terug tot het wezenlijke.'
    },
    sources: [
      { label: 'MoMA – Barnett Newman, Onement I', url: 'https://www.moma.org/collection/works/79601' }
    ]
  },

  // ───────────────────────────── ZAAL 5 ─────────────────────────────
  {
    id: 'mondrian-victory',
    room: 'zaal5',
    status: 'periode',
    featured: true,
    title: 'Victory Boogie Woogie',
    artist: 'Piet Mondriaan',
    artistLife: '1872–1944',
    year: '1942–1944',
    yearNote: 'Onvoltooid bij Mondriaans dood op 1 februari 1944.',
    medium: 'Olieverf, tape, papier, houtskool en potlood op doek',
    dimensions: '127 × 127 cm (diagonaal 178,4 cm), ruitvormig opgehangen',
    size: { w: 127, h: 127 },
    diamond: true,
    collection: 'Kunstmuseum Den Haag (in bruikleen van de Rijksdienst voor het Cultureel Erfgoed)',
    type: 'schilderij',
    image: {
      file: 'mondrian-victory.jpg',
      credit: 'Kunstmuseum Den Haag, via Wikimedia Commons',
      license: 'Publiek domein in Nederland en de EU (de maker overleed in 1944)',
      sourceUrl: commons('Piet_Mondriaan_Victory_Boogie_Woogie.jpg')
    },
    texts: {
      zien: 'Een vierkant doek dat op zijn punt hangt (een ruit), vol honderden kleine rechthoeken in rood, geel, blauw, grijs en zwart op wit. Op sommige plekken zitten nog stukjes gekleurd papier en tape die Mondriaan erop plakte om met de compositie te schuiven.',
      context: 'Mondriaan werkte tot vlak voor zijn dood op 1 februari 1944 in New York aan dit schilderij. De titel verwijst naar de verwachte overwinning van de geallieerden. In 1998 werd het werk voor Nederland verworven; het is te zien in het Kunstmuseum Den Haag.',
      beeldaspecten: 'Een ruitvorm met horizontale en verticale elementen. De vlakken zijn versnipperd in kleine blokjes, nog levendiger dan in Broadway Boogie Woogie. De collage-elementen laten het werkproces zien.',
      betekenis: '‘Victory’ staat voor de hoop op de overwinning op nazi-Duitsland. Het onvoltooide werk voelt als een open toekomst: het is nooit helemaal ‘af’.',
      zaal: 'Onze keuze: het openingswerk van zaal 5. Een Nederlandse kunstenaar schilderde midden in de oorlog naar de toekomst. Vergelijk het met Broadway Boogie Woogie in zaal 4.',
      periode: 'Zelfs in oorlogstijd bleef de droom van een nieuwe, harmonieuze wereld bestaan.'
    },
    sources: [
      { label: 'Kunstmuseum Den Haag – Victory Boogie Woogie', url: 'https://www.kunstmuseum.nl/en/collection/victory-boogie-woogie' },
      { label: 'Wikipedia – Victory Boogie Woogie', url: 'https://en.wikipedia.org/wiki/Victory_Boogie_Woogie' }
    ]
  },
  {
    id: 'matisse-icarus',
    room: 'zaal5',
    status: 'periode',
    title: 'Icare (Icarus), plaat VIII uit het boek Jazz',
    artist: 'Henri Matisse',
    artistLife: '1869–1954',
    year: '1947',
    yearNote: 'Ontworpen 1943–1947, uitgegeven in 1947.',
    medium: 'Pochoir (sjabloondruk) naar een papierknipsel',
    dimensions: 'Boekpagina ca. 42 × 32,5 cm',
    size: { w: 32.5, h: 42 },
    collection: 'O.a. MoMA, New York (930.1964.8) en The Metropolitan Museum of Art; uitgever Tériade, Parijs',
    type: 'grafiek',
    image: {
      file: 'matisse-icarus.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Henri Matisse. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding. Het beeld toont de compositie van Icarus; WikiArt dateert dit ontwerp 1943–1944, de boekuitgave volgde in 1947.',
      sourceUrl: 'https://www.wikiart.org/en/henri-matisse/icarus-1944'
    },
    texts: {
      zien: 'Een zwarte, vereenvoudigde figuur met gespreide armen zweeft of valt tegen een diepblauwe lucht vol grillige gele vormen. In de borst zit een kleine rode vlek, als een hart.',
      context: 'Matisse was na een zware operatie in 1941 grotendeels aan bed of rolstoel gebonden. Hij ging ‘tekenen met de schaar’ in beschilderd papier. Het boek Jazz verscheen in 1947 bij uitgever Tériade, met twintig platen en zijn eigen handgeschreven teksten. De pochoir-techniek zorgde dat de felle kleuren van de knipsels behouden bleven.',
      beeldaspecten: 'Platte kleurvlakken zonder schaduw. Een sterk contrast tussen zwart, blauw en geel. Eenvoudige, organische contouren met de schaar gesneden.',
      betekenis: 'Icarus vloog te dicht bij de zon en stortte neer. Is dit de val of juist de vlucht? De gele vormen worden gelezen als sterren, maar soms ook als ontploffingen – het werk balanceert tussen oorlog en vrijheid. Die dubbele lezing is een interpretatie.',
      zaal: 'Onze keuze: na de donkere zalen laat Matisse zien hoe kleur en eenvoud na de oorlog weer ruimte kregen, zonder de val te vergeten.',
      periode: 'Kunstenaars zochten na 1945 naar nieuwe, frisse technieken. Het papierknipsel werd voor Matisse een heel nieuw begin.'
    },
    sources: [
      { label: 'MoMA – Henri Matisse, Icarus (plate VIII) from Jazz', url: 'https://www.moma.org/collection/works/28467' },
      { label: 'The Met – Icarus, plate VIII from “Jazz”', url: 'https://www.metmuseum.org/art/collection/search/337069' }
    ]
  },
  {
    id: 'leger-constructeurs',
    room: 'zaal5',
    status: 'periode',
    featured: true,
    title: 'Les Constructeurs (De bouwers), definitieve versie',
    artist: 'Fernand Léger',
    artistLife: '1881–1955',
    year: '1950',
    medium: 'Olieverf op doek',
    dimensions: '300 × 228 cm',
    size: { w: 228, h: 300 },
    collection: 'Musée national Fernand Léger, Biot (MNFL 94001)',
    type: 'schilderij',
    image: {
      file: 'leger-constructeurs.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Fernand Léger. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding. WikiArt vermeldt dit werk als ‘Les Constructeurs’ (1950); de afmetingen staan er niet bij, dus het is niet met zekerheid de definitieve versie uit Biot.',
      sourceUrl: 'https://www.wikiart.org/en/fernand-leger/manufacturers-1950'
    },
    texts: {
      zien: 'Bouwvakkers werken hoog in een stalen constructie van rode balken, met touwen en ladders. Achter hen een blauwe lucht met witte wolken. De figuren zijn stevig en hebben dikke zwarte contouren.',
      context: 'Léger verbleef tijdens de oorlog in de Verenigde Staten (1940–1945) en keerde daarna terug naar Frankrijk, waar de wederopbouw volop bezig was. Volgens Léger kreeg hij het idee toen hij arbeiders hoog in een stalen constructie aan het werk zag. Het museum in Biot kreeg het werk in 1969 geschonken.',
      beeldaspecten: 'Heldere, platte kleuren met dikke zwarte omtreklijnen. Contrast tussen de geometrische balken en de ronde lichamen en wolken. Een verticale opbouw die je blik omhoog trekt.',
      betekenis: 'Een optimistisch beeld van gewone arbeiders die letterlijk een nieuwe wereld bouwen. Léger wilde kunst maken die voor iedereen begrijpelijk was.',
      zaal: 'Onze keuze: dit is het sterkste beeld van de wederopbouw in onze tentoonstelling. Hoop wordt hier concreet: staal, touw en mensen.',
      periode: 'Rond 1950 werd ‘opbouwen’ een kernwoord in Europa – in de politiek, in de steden en in de kunst.'
    },
    sources: [
      { label: 'POP / Joconde – Les Constructeurs (définitif), MNFL 94001', url: 'https://www.pop.culture.gouv.fr/notice/joconde/50280000007' },
      { label: 'Renault Group – Les Constructeurs (persbericht 2014)', url: 'https://group.renault.com/en/news-on-air/news/les-constructeurs-by-fernand-leger-exhibited-at-renault-flins-plant/' }
    ]
  },
  {
    id: 'appel-vragende',
    room: 'zaal5',
    status: 'periode',
    featured: true,
    title: 'Vragende kinderen',
    artist: 'Karel Appel',
    artistLife: '1921–2006',
    year: '1949',
    medium: 'Beschilderd hout (reliëf)',
    dimensions: '105 × 67 × 17,5 cm',
    size: { w: 67, h: 105 },
    collection: 'Stedelijk Museum Amsterdam (BA 481)',
    type: 'reliëf',
    image: {
      file: 'appel-vragende.jpg',
      credit: 'WikiArt',
      license: '© de rechthebbenden van Karel Appel. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding. Let op: Appel maakte in 1948–1949 meerdere werken met deze titel; het kan om een verwante versie uit dezelfde reeks gaan.',
      sourceUrl: 'https://www.wikiart.org/en/karel-appel/questioning-children-1949'
    },
    texts: {
      zien: 'Op een plank zijn houten blokken en restjes afvalhout bevestigd. Daarop zijn met felle kleuren kindergezichten geschilderd, met stippen en lijnen als ogen en monden. Ze lijken je smekend aan te kijken.',
      context: 'Appel was in 1948 een van de oprichters van de internationale kunstenaarsgroep CoBrA (naar Copenhagen, Brussel, Amsterdam). De reeks Vragende kinderen ontstond na een treinreis door Duitsland kort na de oorlog, waar hij bedelende kinderen op de stations zag. Een muurschildering met hetzelfde thema in de kantine van het Amsterdamse stadhuis (1949) werd na klachten van ambtenaren afgedekt en pas in 1959 weer zichtbaar.',
      beeldaspecten: 'Gevonden materiaal in plaats van een doek. Felle primaire kleuren en een kinderlijke, spontane vormentaal. Als reliëf komt het werk letterlijk naar je toe.',
      betekenis: 'De kinderen zijn slachtoffers van de oorlog die ‘vragen’ – om eten, om aandacht, om een toekomst. CoBrA zocht naar de spontaniteit van kindertekeningen als een nieuw begin na de catastrofe.',
      zaal: 'Onze keuze: CoBrA is het Europese – en Nederlandse – antwoord op de nieuwe vrijheid in de kunst. Het lijkt op het abstract expressionisme, maar heeft eigen wortels.',
      periode: 'Na 1945 wilden jonge Europese kunstenaars radicaal opnieuw beginnen. Dat veroorzaakte ook ophef: lang niet iedereen was klaar voor zo’n vrije kunst.'
    },
    sources: [
      { label: 'Stedelijk Museum Amsterdam – Karel Appel, Vragende kinderen', url: 'https://www.stedelijk.nl/en/collection/2800-karel-appel-vragende-kinderen' }
    ]
  },
  {
    id: 'dirksen-marshall',
    room: 'zaal5',
    status: 'periode',
    title: 'Europe – All Our Colours to the Mast (Al onze kleuren in de mast)',
    artist: 'Reyn Dirksen',
    artistLife: '1924–1999',
    year: '1950',
    medium: 'Lithografie (affiche) voor het Marshallplan, gedrukt bij Kuhn & Zoon, Rotterdam',
    dimensions: 'ca. 75 × 55 cm',
    size: { w: 55 },
    collection: 'O.a. George C. Marshall Foundation; National Portrait Gallery (Smithsonian); The Henry Ford',
    type: 'affiche',
    image: {
      file: 'dirksen-marshall.jpg',
      credit: 'George C. Marshall Foundation, via Wikimedia Commons',
      license: 'Publiek domein volgens Wikimedia Commons (uitgegeven door de Economic Cooperation Administration, een Amerikaanse overheidsdienst)',
      sourceUrl: commons('Europe_Plan_Marshall._Poster_1947.JPG')
    },
    texts: {
      zien: 'Een zeilschip op woelig water. De zeilen bestaan uit de vlaggen van de West-Europese landen die Marshallhulp kregen, en het woord ‘EUROPE’ vormt de romp. Onderaan staat ‘All our colours to the mast’.',
      context: 'Het Marshallplan (European Recovery Program) werd op 5 juni 1947 aangekondigd door de Amerikaanse minister George Marshall. Tussen 1948 en 1952 kreeg West-Europa miljarden dollars hulp voor de wederopbouw. In 1950 organiseerde de Amerikaanse Economic Cooperation Administration een affichewedstrijd over Europese samenwerking; de Nederlander Reyn Dirksen won de eerste prijs.',
      beeldaspecten: 'Een heldere, diagonale compositie: het schip vaart met de wind mee. Veel kleur door de vlaggen, tegen een dramatische lucht. Tekst en beeld vormen samen één boodschap.',
      betekenis: 'Europa is een schip dat alleen vooruitkomt als alle landen samen ‘hun kleuren in de mast’ hijsen. Samenwerking als weg uit de verwoesting.',
      zaal: 'Onze keuze: vergelijk dit affiche met Shahn in zaal 1. Dezelfde Amerikaanse overheid gebruikt grafische vormgeving – eerst om te waarschuwen voor wreedheid, nu om hoop en samenwerking uit te dragen.',
      periode: 'Rond 1950 werd Europese samenwerking een nieuw ideaal; kort daarna begon de Europese eenwording.'
    },
    sources: [
      { label: 'National Portrait Gallery – All Our Colours to the Mast', url: 'https://npg.si.edu/exh/marshall/mast.htm' },
      { label: 'The Henry Ford – ERP-affiche ‘All Our Colours to the Mast’', url: 'https://www.thehenryford.org/collections/explore/artifact/343111' },
      { label: 'George C. Marshall Foundation', url: 'https://marshallfoundation.org/?p=1200' },
      { label: 'Wikimedia Commons – bestandspagina', url: commons('Europe_Plan_Marshall._Poster_1947.JPG') }
    ]
  },
  {
    id: 'moore-family',
    room: 'zaal5',
    status: 'periode',
    featured: true,
    title: 'Family Group (Familiegroep)',
    artist: 'Henry Moore',
    artistLife: '1898–1986',
    year: '1948–1949',
    yearNote: 'Afgietsels in brons gemaakt tussen 1948 en 1951.',
    medium: 'Brons (oplage van vier, plus één)',
    dimensions: '152 × 113 × 76 cm (met sokkel)',
    size: { w: 113, h: 152, d: 76 },
    collection: 'Afgietsels o.a. in The Barclay School (Stevenage), Tate (Londen) en MoMA (New York)',
    type: 'beeld',
    image: {
      file: 'moore-family.jpg',
      credit: 'Foto via Wikimedia Commons',
      license: '© de rechthebbenden van Henry Moore. Getoond als citaat voor onderwijsdoeleinden (CKV-schoolproject, niet-commercieel), met bronvermelding. In de zaal staat een abstracte ruimtelijke impressie; de foto toont een afgietsel van het echte beeld.',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Henry_Moore,_Family_Group_(1950).jpg'
    },
    texts: {
      zien: 'Een zittende man en vrouw houden samen een klein kind vast, dat tussen hen in op hun armen rust. De vormen zijn vereenvoudigd en rond; de figuren vormen samen één blok.',
      context: 'Moore werkte al sinds de oorlog aan het thema ‘familie’. Een eerste afgietsel kwam in 1950 bij The Barclay School in Stevenage, een van de eerste Britse ‘new towns’ die na de oorlog werden gebouwd. Het was zijn eerste grote brons met meerdere afgietsels.',
      beeldaspecten: 'Gesloten, ronde volumes; de armen van de ouders vormen een beschermende kring rond het kind. Het brons geeft gewicht en duurzaamheid.',
      betekenis: 'Na de oorlog staat het gezin voor bescherming, toekomst en wederopbouw. Het beeld is een tegenhanger van Moores slapende schuilkelder-figuren in zaal 1.',
      zaal: 'Onze keuze: hetzelfde oog van dezelfde kunstenaar, maar nu na de storm: van overleven naar opbouwen. Daarom staat het beeld vrij in de lichte zaal, waar je eromheen kunt lopen.',
      periode: 'Kunst kreeg na 1945 een plek in nieuwe scholen en wijken: kunst als onderdeel van de wederopbouw.'
    },
    sources: [
      { label: 'Henry Moore Foundation – Family Group (LH 269)', url: 'https://catalogue.henry-moore.org/objects/18106/family-group' },
      { label: 'Wikipedia – Family Group (Moore)', url: 'https://en.wikipedia.org/wiki/Family_Group_(Moore)' }
    ]
  },
  {
    id: 'zadkine-stad',
    room: 'zaal5',
    status: 'vergelijking',
    title: 'De verwoeste stad',
    artist: 'Ossip Zadkine',
    artistLife: '1888–1967',
    year: '1951–1953',
    yearNote: 'Ontwerp vanaf 1947; onthuld in 1953. Valt buiten de periode: latere vergelijking.',
    medium: 'Brons (monument)',
    dimensions: 'Hoogte ca. 6 m',
    size: { w: 70 },
    sizeNote: 'Getoond als foto van het monument.',
    collection: 'Openbare ruimte, Rotterdam (rijksmonument)',
    type: 'foto',
    image: {
      file: 'zadkine-stad.jpg',
      credit: 'Foto: F. Eveleens (2007), via Wikimedia Commons',
      license: 'Foto onder CC BY 3.0 / GFDL. Het beeld zelf is nog auteursrechtelijk beschermd (Zadkine overleed in 1967); een foto van een kunstwerk dat blijvend in de openbare ruimte staat, is toegestaan op grond van de Nederlandse panoramavrijheid',
      sourceUrl: commons('Rotterdam_zadkine_monument.jpg')
    },
    texts: {
      zien: 'Een menselijke figuur met omhooggeslagen armen en het hoofd achterover, als in een schreeuw. In de borst zit een groot gat, waar het hart zou moeten zitten.',
      context: 'Op 14 mei 1940 werd de binnenstad van Rotterdam gebombardeerd en grotendeels verwoest. Zadkine, een in Rusland geboren beeldhouwer die in Parijs woonde, maakte het beeld als monument voor de stad; het werd in 1953 onthuld.',
      beeldaspecten: 'Gebroken, hoekige vormen, een open middenstuk en een sterke opwaartse beweging. Het beeld is zowel aanklacht als gebaar van verzet.',
      betekenis: 'Een stad zonder hart, die toch blijft staan. Het gat in de borst is een van de bekendste beelden van de Nederlandse oorlogsherinnering.',
      zaal: 'Onze keuze: LATERE VERGELIJKING. Dit werk is van ná 1950 en telt niet mee voor de zaal. We tonen het om te laten zien dat de verwerking van de oorlog na 1950 doorging.',
      periode: 'De oorlog bleef na 1950 doorwerken; monumenten maakten herinnering zichtbaar in de herbouwde stad.'
    },
    sources: [
      { label: 'Wikimedia Commons – De verwoeste stad (Rotterdam)', url: 'https://commons.wikimedia.org/wiki/Category:De_verwoeste_stad/Rotterdam' },
      { label: 'Wikipedia – De verwoeste stad', url: 'https://nl.wikipedia.org/wiki/De_verwoeste_stad' }
    ]
  },

  // ───────────────────────────── FINALE: eigen werk ─────────────────────────────
  {
    id: 'eigen-installatie',
    room: 'finale',
    status: 'eigen',
    featured: true,
    title: 'Na de storm',
    artist: 'Milan, Berend, Polle en Constantijn',
    artistLife: 'Curatoren van deze tentoonstelling',
    year: '2026',
    medium: 'Digitale ruimtelijke installatie: zwevende fragmenten, licht en beweging (Three.js)',
    dimensions: 'ca. 6,4 m doorsnede × 9 m hoog',
    size: { w: 640, h: 900 },
    collection: 'Eigen praktijkwerk, ontworpen voor deze tentoonstelling',
    type: 'installatie',
    texts: {
      zien: 'Boven een ronde sokkel zweven honderden fragmenten. Onderaan zijn ze donker, scherp en kriskras gedraaid – een chaos van scherven. Hoe hoger je kijkt, hoe lichter en kleuriger ze worden en hoe rustiger ze zich ordenen, tot ze bovenin samenkomen in het licht dat door de opening in het plafond valt.',
      context: 'Eigen praktijkwerk van Milan, Berend, Polle en Constantijn – ontworpen voor deze tentoonstelling. Het is geen bestaand historisch kunstwerk. We lieten ons inspireren door wat we in de zalen onderzochten: de verbrokkeling bij Picasso, het all-over-netwerk van Pollock, de kleurvelden van Rothko en de verticale ‘zip’ van Newman.',
      beeldaspecten: 'Kleur: van grafiet en roestbruin onderin naar oker, rood, blauw en gebroken wit bovenin. Lijn en vorm: scherpe, gebroken vormen worden geleidelijk vlakken. Compositie: een verticale as, zoals Newmans zip, als lijn van chaos naar licht. Beweging: onderin draaien de scherven onrustig, bovenin langzaam en gelijkmatig.',
      betekenis: 'De installatie verbeeldt de overgang van chaos naar hoop – het verhaal van onze hele route. De oorlog verdwijnt niet: de donkere scherven blijven de basis. Maar uit dezelfde fragmenten kan iets nieuws worden opgebouwd.',
      zaal: 'Onze keuze: dit werk staat in het midden van de laatste zaal, onder het daglicht. Je kunt eromheen lopen en het van alle kanten bekijken, zoals je na de route ook op de hele periode terugkijkt.',
      periode: 'Onze vraag aan jou: kan kunst laten voelen wat er na een catastrofe gebeurt, zonder iets letterlijk te laten zien?'
    },
    sources: []
  },
  {
    id: 'eigen-doek',
    room: 'finale',
    status: 'eigen',
    title: 'Studie: storm en stilte',
    artist: 'Milan, Berend, Polle en Constantijn',
    artistLife: 'Curatoren van deze tentoonstelling',
    year: '2026',
    medium: 'Digitaal gegenereerd ‘druipschilderij’ (code als kwast)',
    dimensions: '420 × 260 cm (digitaal)',
    size: { w: 420, h: 260 },
    collection: 'Eigen praktijkwerk, ontworpen voor deze tentoonstelling',
    type: 'schilderij',
    texts: {
      zien: 'Links een dicht, donker netwerk van slierten en spatten in zwart, grafiet en roestbruin. Naar rechts toe wordt het netwerk opener en verschijnen rustige vlakken in oker, blauw en gebroken wit, met één lichte verticale streep.',
      context: 'Eigen praktijkwerk van Milan, Berend, Polle en Constantijn – ontworpen voor deze tentoonstelling. Een computerprogramma ‘gooit’ de verf volgens regels die wij bedachten: veel energie en willekeur links, rust en ordening rechts.',
      beeldaspecten: 'Een all-over-compositie die langzaam overgaat in kleurvelden. Lijn als spoor van beweging (zoals bij Pollock) en een verticale ‘zip’ (zoals bij Newman).',
      betekenis: 'Het doek is een studie bij de installatie: hetzelfde verhaal van chaos naar stilte, nu op een plat vlak.',
      zaal: 'Onze keuze: het hangt in de finale naast de installatie, zodat je ziet hoe we de beeldtaal uit zaal 4 zelf hebben uitgeprobeerd.',
      periode: 'Een eerbetoon aan de technieken van de jaren veertig – met een middel van nu.'
    },
    sources: []
  }
];

export const ART_BY_ID = Object.fromEntries(ARTWORKS.map((a) => [a.id, a]));

export const isCounted = (a) => a.status === 'periode';
