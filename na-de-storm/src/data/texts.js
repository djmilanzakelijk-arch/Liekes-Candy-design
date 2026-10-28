// Teksten van de tentoonstelling: introductie, zaalteksten, begrippen,
// reflectie, inzichten en de korte tour. Labels:
//   FEIT        – historisch controleerbaar
//   INTERPRETATIE – een gangbare of onze eigen lezing van een werk
//   KEUZE       – een curatoriële keuze of mening van Milan, Berend, Polle en Constantijn

export const EXHIBITION = {
  title: 'NA DE STORM',
  subtitle: 'Kunst, chaos en een nieuwe wereld',
  period: '1940–1950',
  curators: ['Milan', 'Berend', 'Polle', 'Constantijn'],
  course: 'CKV Beeldend · 4 vwo',
  question: 'Hoe veranderden oorlog, verlies, onzekerheid en hoop de manier waarop kunstenaars de wereld afbeeldden?',
  disclaimer: 'NA DE STORM is een fictieve wereldtentoonstelling, ontworpen door Milan, Berend, Polle en Constantijn voor een schoolopdracht. Deze tentoonstelling heeft nooit echt bestaan; de kunstwerken wel. Ze bevinden zich in de collecties die bij elk werk staan vermeld.'
};

export const ABOUT = {
  intro: 'Tussen 1940 en 1950 veranderde de wereld ingrijpend: oorlog, bezetting, vervolging, de atoombom en daarna een moeizame wederopbouw. In dezelfde tien jaar veranderde ook de kunst. Deze tentoonstelling volgt die verandering in vijf zalen, van donker en sober naar licht en open.',
  sections: [
    {
      h: 'Wat is het hoofdthema?',
      tag: 'KEUZE',
      p: 'Ons hoofdthema is de overgang van chaos naar hoop. We laten zien hoe kunstenaars eerst probeerden de werkelijkheid van oorlog en verlies vast te leggen, en daarna steeds vaker een nieuwe beeldtaal zochten voor gevoelens die niet in woorden of realistische beelden te vangen waren.'
    },
    {
      h: 'Hoe laat de tentoonstelling de ontwikkeling in de kunstgeschiedenis zien?',
      tag: 'FEIT',
      p: 'De route volgt grofweg de tijd. In zaal 1 en 2 zie je kunst die tijdens de oorlog ontstond: schilderijen, affiches en documentaire fotografie. Zaal 3 toont het surrealisme, dat al voor 1940 bestond maar in de oorlog met de kunstenaars naar New York verhuisde. In zaal 4 zie je hoe daaruit in New York het abstract expressionisme groeide. Zaal 5 laat de naoorlogse wereld zien: wederopbouw, CoBrA, design en nieuwe hoop.'
    },
    {
      h: 'Welke ontwikkelingen zijn het belangrijkst?',
      tag: 'FEIT',
      p: '1) De oorlog maakte documentaire fotografie en grafische vormgeving tot belangrijke beeldende media. 2) Veel Europese kunstenaars vluchtten naar de VS, waardoor New York na 1945 het centrum van de kunstwereld werd. 3) Het surrealisme bracht het onderbewuste en het toeval in de kunst. 4) Rond 1947–1950 ontstond met het abstract expressionisme een abstracte kunst op groot formaat, gericht op gebaar, kleur en emotie. 5) In Europa zochten groepen als CoBrA een spontane, kinderlijke vrijheid als nieuw begin.'
    },
    {
      h: 'Waarom zijn de werken zo geplaatst?',
      tag: 'KEUZE',
      p: 'Elke zaal heeft één vraag. We plaatsen werken naast elkaar die elkaar iets laten zien: Lange naast Adams (twee blikken op hetzelfde kamp), Nussbaum tegenover Salomon (twee vervolgde kunstenaars), Mondriaan bij de ingang van zaal 4 (Europese abstractie komt aan in New York). Grote werken krijgen een eigen wand, kleine werken vormen samen een verhaal.'
    },
    {
      h: 'Hoe ondersteunen kleur, lijn, vorm en compositie het verhaal?',
      tag: 'INTERPRETATIE',
      p: 'In de eerste zalen overheersen donkere, gedempte kleuren, harde contrasten en afgesloten composities (muren, kaders). In het surrealisme worden vormen zacht, vreemd en biomorf. In het abstract expressionisme wordt de lijn een spoor van beweging en wordt kleur het onderwerp zelf. In zaal 5 keren heldere primaire kleuren en open composities terug. Ook de architectuur volgt dat verloop: van laag en donker naar hoog en licht.'
    },
    {
      h: 'Hoe beïnvloedde de historische context de kunst?',
      tag: 'FEIT',
      p: 'Kunstenaars werden vervolgd (Nussbaum, Salomon), geïnterneerd (Ernst) of vluchtten (Mondriaan, Lam, Léger). Overheden gaven opdrachten aan oorlogskunstenaars en fotografen (Nash, Moore, Lange, Parks, Shahn). Na 1945 stonden wederopbouw, de atoomdreiging en de Koude Oorlog centraal. De Amerikaanse kunst kreeg na de oorlog veel internationale aandacht.'
    },
    {
      h: 'Hoe lees je dit museum?',
      tag: 'UITLEG',
      p: 'Bij elk werk zie je labels: FEIT (historisch gecontroleerd), INTERPRETATIE (een mogelijke lezing) en KEUZE (onze curatoriële keuze of mening). Veel werken uit deze periode zijn nog auteursrechtelijk beschermd. Wij tonen ze als citaat voor onderwijsdoeleinden: voor een niet-commercieel schoolproject, met de naam van de maker, de collectie en de bron van de afbeelding. De rechten blijven bij de rechthebbenden. Bij het beeld van Henry Moore staat in de zaal een abstracte ruimtelijke impressie; in de detailweergave zie je een foto van het echte beeld.'
    }
  ]
};

export const CURATORS = [
  {
    name: 'Milan',
    role: 'Zaal 1, zaal 4 en de finale',
    task: 'Onderzoek naar de oorlogskunst en het abstract expressionisme; werken en teksten voor ‘Een wereld in crisis’, ‘Een nieuwe beeldtaal’ en de finale met ons eigen werk.'
  },
  {
    name: 'Constantijn',
    role: 'Zaal 2',
    task: 'Onderzoek naar documentaire fotografie; werken en teksten voor ‘De mens achter de geschiedenis’.'
  },
  {
    name: 'Berend',
    role: 'Zaal 3',
    task: 'Onderzoek naar het surrealisme; werken en teksten voor ‘Dromen, symbolen en het onderbewuste’.'
  },
  {
    name: 'Polle',
    role: 'Zaal 5',
    task: 'Onderzoek naar de wederopbouw, CoBrA en het Marshallplan; werken en teksten voor ‘Op weg naar een andere toekomst’.'
  }
];

export const ROOM_TEXTS = {
  entree: {
    lead: 'Hoe veranderde de kunst tussen 1940 en 1950 door oorlog, verlies en hoop?',
    sections: [],
    concepts: []
  },
  zaal1: {
    lead: 'Kunst uit de oorlog zelf. Het geweld zie je bijna nooit direct.',
    sections: [
      { h: 'Historische context', tag: 'FEIT', p: 'In september 1939 viel Duitsland Polen binnen. In mei 1940 werden Nederland, België en Frankrijk bezet; op 14 mei 1940 werd Rotterdam gebombardeerd. Londen werd in 1940–1941 getroffen door de Blitz. De Holocaust kostte miljoenen mensen het leven. In juni 1944 landden de geallieerden in Normandië en in augustus 1945 vielen de atoombommen op Hiroshima en Nagasaki.' },
      { h: 'Waarom deze werken samen?', tag: 'KEUZE', p: 'Alle werken ontstonden tussen 1940 en 1945, midden in de oorlog. Ze zijn bewust gemengd: schilderij, tekening, affiche en foto. Zo zie je dat de oorlog álle beeldende media veranderde – en dat kunstenaars heel verschillende antwoorden vonden op dezelfde crisis.' },
      { h: 'Beeldaspecten', tag: 'INTERPRETATIE', p: 'Kijk naar donkere en gedempte kleuren, harde licht-donkercontrasten, afgesloten ruimtes (muren bij Shahn en Nussbaum) en verbrokkelde vormen (Picasso). Juist de afwezigheid van geweld in beeld – bij Shahn, Moore en Levy – maakt het geweld voelbaar.' },
      { h: 'De ruimte', tag: 'KEUZE', p: 'Het plafond is laag, de wanden zijn donker en het licht is smal en koel. De zaal mag beklemmend voelen, maar nooit sensationeel.' },
    ],
    concepts: ['propaganda', 'oorlogskunstenaar', 'grisaille', 'kubisme', 'documentaire fotografie', 'dodendans']
  },
  zaal2: {
    lead: 'De gewone mensen achter de grote geschiedenis.',
    sections: [
      { h: 'Historische context', tag: 'FEIT', p: 'In de VS werden in 1942 ongeveer 120.000 Japanse Amerikanen naar kampen gebracht (Executive Order 9066). Zwarte Amerikanen vochten in een oorlog ‘voor de vrijheid’, terwijl thuis rassenscheiding gold. In bezet Europa werden joden geregistreerd, vervolgd en gedeporteerd. Miljoenen mensen raakten ontheemd.' },
      { h: 'Waarom deze werken samen?', tag: 'KEUZE', p: 'We zetten twee blikken op dezelfde kampen naast elkaar (Lange en Adams), en twee vervolgde joodse kunstenaars tegenover elkaar (Nussbaum en Salomon). Hopper en Munch laten zien hoe eenzaamheid en ouderdom ook deel zijn van ‘de mens achter de geschiedenis’.' },
      { h: 'Beeldaspecten', tag: 'INTERPRETATIE', p: 'Let op frontale composities en blikken recht in de camera (Parks, Adams, Kahlo in zaal 3), op tekst als beeldelement (Lange, Salomon, Nussbaum) en op de manier waarop licht een sfeer bepaalt (Hopper).' },
      { h: 'Documentair = objectief?', tag: 'INTERPRETATIE', p: 'Een foto lijkt de werkelijkheid te tonen, maar de fotograaf kiest het kader, het moment en het licht. Vergelijk Lange en Adams: wie laat het kamp ‘echter’ zien?' },
    ],
    concepts: ['documentaire fotografie', 'identiteit', 'Executive Order 9066', 'Grote Migratie', 'expressionisme', 'zelfportret']
  },
  zaal3: {
    lead: 'Kunstenaars vluchten in de droom: het surrealisme.',
    sections: [
      { h: 'Historische context', tag: 'FEIT', p: 'Het surrealisme ontstond in 1924 in Parijs rond André Breton. In 1940–1941 hielp onder anderen het Emergency Rescue Committee van Varian Fry vanuit Marseille kunstenaars als Max Ernst en André Breton te vluchten. In New York exposeerden zij onder meer bij Peggy Guggenheims galerie Art of This Century (geopend in oktober 1942).' },
      { h: 'Waarom deze werken samen?', tag: 'KEUZE', p: 'We laten zien dat ‘de droom’ in de jaren veertig heel verschillende vormen kreeg: biomorfe abstractie (Kandinsky, Gorky), een verwoest droomlandschap (Ernst), sterrenbeelden (Miró), een vrouwelijke droomwereld (Tanning), Afro-Cubaanse spiritualiteit (Lam), lichamelijke pijn (Kahlo) en een onmogelijk raadsel (Magritte).' },
      { h: 'Beeldaspecten', tag: 'INTERPRETATIE', p: 'Let op biomorfe vormen die op levende wezens lijken, op technieken die het toeval gebruiken (decalcomanie), op de all-over-opbouw bij Miró en op realistisch geschilderde, maar onmogelijke situaties bij Tanning en Magritte.' },
      { h: 'De ruimte', tag: 'KEUZE', p: 'Schuine wanden, een geblokte vloer met diep perspectief, een nachtelijk plafond en zwevende vormen: deze zaal klopt bewust niet helemaal – maar je kunt er gewoon doorheen lopen.' },
    ],
    concepts: ['surrealisme', 'automatisme', 'decalcomanie', 'biomorf', 'onderbewuste', 'ballingschap']
  },
  zaal4: {
    lead: 'In New York ontstaat een nieuwe, abstracte beeldtaal.',
    sections: [
      { h: 'Wat is abstractie?', tag: 'FEIT', p: 'Abstracte kunst beeldt geen herkenbare voorwerpen of figuren af. Ze werkt met de beeldaspecten zelf: kleur, lijn, vorm, ruimte, textuur en compositie. Mondriaan maakte al vanaf de jaren twintig geometrische abstractie.' },
      { h: 'Wat is abstract expressionisme?', tag: 'FEIT', p: 'Een stroming in New York, vooral rond 1945–1960, waarin kunstenaars als Pollock, de Kooning, Krasner, Rothko en Newman abstracte kunst maakten die emotie en innerlijke ervaring wilde uitdrukken. Criticus Robert Coates gebruikte de term in 1946 in The New Yorker. Er zijn twee hoofdrichtingen: de ‘gestische’ schilderkunst (action painting) en het ‘color field painting’.' },
      { h: 'Wat is action painting?', tag: 'FEIT', p: 'Bij action painting is het schilderij het spoor van een handeling. Pollock legde het doek op de vloer en liet verf druipen en slingeren; de Kooning schilderde, schraapte en schilderde opnieuw. De term werd in 1952 bedacht door Harold Rosenberg – na onze periode.' },
      { h: 'Anders dan traditionele schilderkunst', tag: 'INTERPRETATIE', p: 'Traditionele schilderkunst heeft een onderwerp, een middelpunt en diepte (perspectief). Hier is het vlak zelf het onderwerp, is er vaak geen middelpunt (all-over) en is het formaat zo groot dat je er bijna in staat.' },
      { h: 'Waarom is de context belangrijk?', tag: 'FEIT', p: 'Na de Holocaust en de atoombom vonden veel kunstenaars realistische of verhalende kunst ontoereikend. Rothko en Gottlieb schreven in 1943 dat alleen een ‘tragisch en tijdloos’ onderwerp geldig was. Ook speelden de emigratie van Europese kunstenaars en de sterke positie van de VS na 1945 een rol bij de opkomst van New York.' },
    ],
    concepts: ['abstractie', 'abstract expressionisme', 'action painting', 'druiptechniek', 'all-over', 'color field', 'zip']
  },
  zaal5: {
    lead: 'Na de storm begint het opbouwen, met kleur en hoop.',
    sections: [
      { h: 'Historische context', tag: 'FEIT', p: 'Na 1945 lagen grote delen van Europa in puin. Het Marshallplan (aangekondigd in 1947) gaf West-Europa Amerikaanse hulp. In 1945 werden de Verenigde Naties opgericht en in 1948 de Universele Verklaring van de Rechten van de Mens aangenomen. Tegelijk begon de Koude Oorlog.' },
      { h: 'Binnen of buiten de periode?', tag: 'KEUZE', p: 'Alle werken in deze zaal zijn gemaakt tussen 1942 en 1950 – behalve De verwoeste stad van Zadkine (1951–1953), die we duidelijk als latere vergelijking tonen. Ook de term ‘action painting’ (1952) en de bouw van veel wederopbouwwijken vallen na 1950.' },
      { h: 'Waarom deze werken samen?', tag: 'KEUZE', p: 'Victory Boogie Woogie en Matisse’ Jazz laten zien hoe kleur terugkeert. Léger en Moore tonen mensen die bouwen en beschermen. Appel (CoBrA) zoekt een kinderlijk nieuw begin. Dirksen en de Eames laten zien hoe grafische vormgeving en design meebouwden aan de nieuwe wereld.' },
      { h: 'Beeldaspecten', tag: 'INTERPRETATIE', p: 'Heldere primaire kleuren, open composities, organische curven (Eames, Moore) en eenvoudige, platte vormen (Matisse, Léger). De ruimte wordt lichter: er is daglicht en uitzicht.' },
    ],
    concepts: ['wederopbouw', 'CoBrA', 'Marshallplan', 'papierknipsel', 'pochoir', 'design']
  },
  finale: {
    lead: 'Ons eigen werk: van chaos naar hoop.',
    sections: [
      { h: 'Eigen praktijkwerk', tag: 'KEUZE', p: 'Eigen praktijkwerk van Milan, Berend, Polle en Constantijn – ontworpen voor deze tentoonstelling. De installatie ‘Na de storm’ en de studie ‘Storm en stilte’ zijn geen historische kunstwerken.' },
      { h: 'Hoe het werk aansluit', tag: 'INTERPRETATIE', p: 'We gebruiken de beeldtaal van het abstract expressionisme: all-over (Pollock), kleurvelden (Rothko) en een verticale lichtlijn (Newman). Onderin begint het werk met de verbrokkeling van zaal 1.' },
      { h: 'De vraag', tag: 'KEUZE', p: 'Moet kunst de werkelijkheid laten zien, of mag kunst juist laten voelen wat niet in woorden uit te drukken is? Geef je antwoord bij de reflectiezuil.' }
    ],
    concepts: ['installatie', 'all-over', 'zip', 'color field']
  }
};

export const GLOSSARY = {
  'propaganda': 'Beelden of teksten die mensen bewust willen overtuigen van een politieke boodschap. In de oorlog gebruikten alle partijen affiches, films en foto’s als propaganda.',
  'oorlogskunstenaar': 'Een kunstenaar die in opdracht van de overheid de oorlog vastlegt, zoals Paul Nash en Henry Moore voor de Britse War Artists’ Advisory Committee.',
  'grisaille': 'Schilderen in alleen grijstinten (zwart, wit, grijs). Picasso gebruikte het in Guernica en Het knekelhuis.',
  'kubisme': 'Stroming (vanaf ca. 1907, Picasso en Braque) waarin voorwerpen in vlakken worden gebroken en van meerdere kanten tegelijk worden getoond.',
  'documentaire fotografie': 'Fotografie die de werkelijkheid wil vastleggen en vaak een sociaal of historisch verhaal vertelt. Ook documentaire foto’s zijn keuzes van de fotograaf.',
  'dodendans': 'Een middeleeuws beeldmotief waarin skeletten met levenden dansen: iedereen, rijk of arm, is gelijk voor de dood.',
  'identiteit': 'Wie iemand is en tot welke groep hij of zij (gezien wordt te) behoren. In de oorlog werd identiteit vaak van buitenaf opgelegd, met papieren, sterren en labels.',
  'Executive Order 9066': 'Bevel van president Roosevelt van 19 februari 1942 waardoor mensen van Japanse afkomst aan de Amerikaanse westkust gedwongen naar kampen werden gebracht.',
  'Grote Migratie': 'De trek van miljoenen Afro-Amerikanen uit het zuiden naar het noorden van de VS, vanaf ongeveer 1915.',
  'expressionisme': 'Kunst (vanaf ca. 1905) waarin het uitdrukken van gevoel belangrijker is dan een natuurgetrouwe weergave: felle kleuren, vervorming, losse toets.',
  'zelfportret': 'Een portret dat de kunstenaar van zichzelf maakt. In oorlogstijd werd het zelfportret vaak een getuigenis.',
  'surrealisme': 'Stroming (vanaf 1924, Parijs) die het onderbewuste, de droom en het toeval wil verbeelden, vaak met vreemde combinaties van realistische dingen.',
  'automatisme': 'Werken zonder bewuste controle, zodat het onderbewuste ‘spreekt’: vrij tekenen, schrijven of schilderen.',
  'decalcomanie': 'Techniek waarbij verf tussen twee oppervlakken wordt geperst en weer losgetrokken, zodat toevallige structuren ontstaan (Max Ernst).',
  'biomorf': 'Vormen die lijken op levende organismen: cellen, organen, planten of dieren, zonder precies iets af te beelden.',
  'onderbewuste': 'Het deel van de geest waarvan we ons niet bewust zijn; volgens Freud de bron van dromen. Belangrijk voor het surrealisme.',
  'ballingschap': 'Gedwongen verblijf buiten het eigen land. Veel kunstenaars vluchtten in de jaren dertig en veertig voor de nazi’s.',
  'abstractie': 'Kunst die geen herkenbare voorwerpen afbeeldt, maar werkt met kleur, lijn, vorm en compositie zelf.',
  'abstract expressionisme': 'Stroming in New York (ca. 1945–1960) die met abstracte middelen emotie en innerlijke ervaring wil uitdrukken, vaak op groot formaat.',
  'action painting': 'Schilderkunst waarin het schilderij het spoor is van een lichamelijke handeling (term van Harold Rosenberg, 1952).',
  'druiptechniek': 'Techniek van Pollock (vanaf 1947): verf laten druipen en slingeren op een doek dat op de vloer ligt (‘dripping’).',
  'all-over': 'Een compositie zonder middelpunt waarin het hele vlak even belangrijk is.',
  'color field': 'Richting binnen het abstract expressionisme (o.a. Rothko, Newman) waarin grote kleurvlakken het belangrijkste middel zijn.',
  'zip': 'Newmans eigen woord voor de smalle verticale streep die zijn kleurvelden deelt én verbindt.',
  'wederopbouw': 'Het herstellen van steden, economieën en samenlevingen na de oorlog. In Nederland onder meer zichtbaar in Rotterdam.',
  'CoBrA': 'Internationale kunstenaarsgroep (1948–1951), genoemd naar Copenhagen, Brussel en Amsterdam, met onder anderen Karel Appel, Constant, Corneille en Asger Jorn. Ze zochten spontaniteit, zoals in kindertekeningen.',
  'Marshallplan': 'Amerikaans hulpprogramma (European Recovery Program), aangekondigd op 5 juni 1947, voor de economische wederopbouw van West-Europa (1948–1952).',
  'papierknipsel': 'Techniek waarbij met de schaar vormen uit beschilderd papier worden geknipt en geplakt (Matisse: ‘tekenen met de schaar’).',
  'pochoir': 'Sjabloondruktechniek waarmee kleur via uitgesneden sjablonen wordt aangebracht; geschikt voor heldere, vlakke kleuren.',
  'design': 'Het ontwerpen van gebruiksvoorwerpen. Na 1945 stond modern design voor vooruitgang: mooi, praktisch en betaalbaar.',
  'installatie': 'Een kunstwerk dat een ruimte inneemt en waar je omheen of doorheen kunt lopen.'
};

export const REFLECTION = {
  question: 'Moet kunst de werkelijkheid laten zien, of mag kunst juist laten voelen wat niet in woorden uit te drukken is?',
  options: [
    { id: 'werkelijkheid', label: 'Kunst moet de werkelijkheid laten zien', hint: 'Denk aan Lange, Sargent en Shahn: getuigen van wat er gebeurde.' },
    { id: 'gevoel', label: 'Kunst mag laten voelen wat niet in woorden past', hint: 'Denk aan Rothko, Newman en Pollock: emotie zonder afbeelding.' },
    { id: 'allebei', label: 'Allebei – het hangt af van het moment', hint: 'Denk aan Nash en Salomon: werkelijkheid én verbeelding tegelijk.' }
  ],
  example: [
    'In een periode van oorlog en onzekerheid is het belangrijk dat kunst de werkelijkheid laat zien. Zonder de foto’s van Dorothea Lange of het affiche van Ben Shahn zouden veel mensen niet hebben geweten wat er gebeurde. Zulke beelden zijn bewijs en herinnering tegelijk.',
    'Toch denken wij dat dat niet genoeg is. Na de Holocaust en de atoombom vonden veel kunstenaars dat een realistisch beeld tekortschoot. Een schilderij als Onement I van Barnett Newman laat geen enkele gebeurtenis zien, maar roept wel een gevoel op van stilte en van een nieuw begin. Dat kan een foto niet.',
    'Onze conclusie is daarom dat kunst allebei mag én moet: ze moet getuigen van wat er gebeurd is, en ze mag nieuwe werelden scheppen voor wat er nog niet in woorden te zeggen is. Juist in de jaren veertig zie je die twee wegen naast elkaar ontstaan.'
  ]
};

export const INSIGHTS = [
  { h: 'Oorlog veranderde alle media', p: 'Schilderkunst, affiches en vooral documentaire fotografie werden manieren om te getuigen van de oorlog.' },
  { h: 'Niet tonen kan sterker zijn', p: 'Shahn, Moore, Levy en Picasso laten het geweld zelf vaak niet zien – daardoor vult de kijker het in.' },
  { h: 'De droom als uitweg', p: 'Het surrealisme bood kunstenaars een taal voor angst, ballingschap en verlangen.' },
  { h: 'Van Parijs naar New York', p: 'Door de vlucht van Europese kunstenaars en de positie van de VS na 1945 werd New York het nieuwe centrum.' },
  { h: 'Een nieuwe beeldtaal', p: 'Het abstract expressionisme maakte gebaar, kleur en schaal tot het onderwerp: laten voelen in plaats van afbeelden.' },
  { h: 'Opbouwen met kleur', p: 'Na 1945 zochten kunstenaars en ontwerpers in Europa en de VS naar een nieuw begin: CoBrA, Matisse, Léger, de Eames.' }
];

// Korte tour: stops in vaste volgorde. Elke stop heeft een eigen tekst.
export const TOUR = [
  { kind: 'panel', id: 'title-wall', room: 'entree', text: 'Welkom bij NA DE STORM. Deze korte tour neemt je mee langs de belangrijkste werken. Je kunt op elk moment stoppen en zelf verder lopen.' },
  { kind: 'art', id: 'picasso-guernica', text: 'Guernica (1937) is onze historische context: zo zag kunst over oorlogsgeweld eruit vlak vóór 1940.' },
  { kind: 'art', id: 'nash-totes-meer', text: 'Zaal 1 – Een wereld in crisis. Nash maakt van vliegtuigwrakken een stille ‘dode zee’.' },
  { kind: 'art', id: 'shahn-nazi-brutality', text: 'Shahn toont het moment vóór het geweld. Grafische vormgeving als getuigenis.' },
  { kind: 'art', id: 'lange-american', text: 'Zaal 2 – De mens achter de geschiedenis. Eén winkelgevel vertelt het verhaal van 120.000 mensen.' },
  { kind: 'art', id: 'nussbaum-judenpass', text: 'Nussbaum houdt zijn paspoort omhoog: een zelfportret als getuigenis.' },
  { kind: 'art', id: 'ernst-europe', text: 'Zaal 3 – Dromen, symbolen en het onderbewuste. Ernst schildert een verwoest Europa met de techniek van het toeval.' },
  { kind: 'art', id: 'gorky-liver', text: 'Gorky is de brug van het surrealisme naar het abstract expressionisme.' },
  { kind: 'art', id: 'pollock-autumn', text: 'Zaal 4 – Een nieuwe beeldtaal. Het grootste werk van het museum: een spoor van beweging op menselijke schaal.' },
  { kind: 'art', id: 'rothko-no3', text: 'Rothko laat kleur zelf het onderwerp zijn.' },
  { kind: 'art', id: 'mondrian-victory', text: 'Zaal 5 – Op weg naar een andere toekomst. Mondriaans laatste, onvoltooide werk: ‘Victory’.' },
  { kind: 'art', id: 'appel-vragende', text: 'CoBrA zoekt een nieuw begin, maar vergeet de slachtoffers niet.' },
  { kind: 'art', id: 'eigen-installatie', text: 'De finale: ons eigen praktijkwerk, van chaos naar hoop. Bij de reflectiezuil kun je je eigen antwoord geven.' }
];
