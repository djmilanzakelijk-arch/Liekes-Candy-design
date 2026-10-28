// Plattegrond en inrichting van het museum.
// Eenheden in meters. x loopt naar het oosten, z naar het zuiden (noord = -z).
// Elke zaal is een rechthoek [x0, x1, z0, z1]; muren staan BUITEN de rechthoek
// (dikte WALL_T), zodat aangrenzende zalen precies 2 × WALL_T uit elkaar liggen.

export const WALL_T = 0.3;
export const EYE_HEIGHT = 1.65;

// Doorgangen tussen zalen. `side` is de zijde van zaal `a`; voor `b` is het de
// tegenoverliggende zijde. `from`/`to` lopen langs de muur (x voor N/Z, z voor O/W).
export const DOORS = [
  { id: 'd-entree-z1', a: 'entree', b: 'zaal1', side: 'N', from: -2.5, to: 2.5, height: 4.4 },
  { id: 'd-z1-z2', a: 'zaal1', b: 'zaal2', side: 'N', from: -7.5, to: -3.5, height: 3.6 },
  { id: 'd-z2-z3', a: 'zaal2', b: 'zaal3', side: 'N', from: 3, to: 7, height: 3.8 },
  { id: 'd-z3-z4', a: 'zaal3', b: 'zaal4', side: 'E', from: -62, to: -57, height: 4.5 },
  { id: 'd-z4-z5', a: 'zaal4', b: 'zaal5', side: 'S', from: 21, to: 26, height: 5 },
  { id: 'd-z5-fin', a: 'zaal5', b: 'finale', side: 'S', from: 21.1, to: 26.1, height: 5 },
  { id: 'd-fin-entree', a: 'finale', b: 'entree', side: 'W', from: 9, to: 13, height: 4.4 }
];

// De route: welke deur leidt vanuit elke zaal naar de volgende.
export const ROUTE = [
  { room: 'entree', next: 'zaal1', door: 'd-entree-z1' },
  { room: 'zaal1', next: 'zaal2', door: 'd-z1-z2' },
  { room: 'zaal2', next: 'zaal3', door: 'd-z2-z3' },
  { room: 'zaal3', next: 'zaal4', door: 'd-z3-z4' },
  { room: 'zaal4', next: 'zaal5', door: 'd-z4-z5' },
  { room: 'zaal5', next: 'finale', door: 'd-z5-fin' },
  { room: 'finale', next: 'entree', door: 'd-fin-entree' }
];

export const SPAWN = { x: 0, z: 15.2, yaw: 0 };

export const ROOMS = [
  {
    id: 'entree',
    nr: 0,
    label: 'Entree',
    title: 'De wereld staat stil',
    rect: [-10, 10, 0, 22],
    height: 12,
    theme: {
      wall: '#2c2b29', wallRough: 0.92, floor: 'stone', floorColor: '#3a3835',
      ceiling: 'coffer', ceilingColor: '#1f1e1c', trim: '#b08d57',
      ambient: 0.55, key: 1.0, keyColor: '#ffe3bf', wash: '#ffd9a8', washStrength: 0.85,
      fog: '#14120f', mood: 'entree'
    },
    pillars: [[-6, 5], [6, 5], [-6, 16.5], [6, 16.5]],
    benches: [{ x: -3.2, z: 19.4, rot: 0, len: 2.2 }, { x: 3.2, z: 19.4, rot: 0, len: 2.2 }],
    slots: [
      { art: 'picasso-guernica', wall: 'S', at: 0 }
    ],
    panels: [
      { id: 'title-wall', kind: 'title', wall: 'N', at: 0, y: 7.6, w: 15, h: 5 },
      { id: 'intro', kind: 'intro', wall: 'E', at: 4.6, y: 2.25, w: 2.7, h: 2.9, action: 'about' },
      { id: 'credits', kind: 'credits', wall: 'E', at: 17.8, y: 2.3, w: 2.5, h: 3.0, action: 'credits' },
      { id: 'timeline-wall', kind: 'timeline', wall: 'W', at: 11, y: 2.45, w: 17.2, h: 2.7, action: 'timeline' }
    ],
    stele: null
  },
  {
    id: 'zaal1',
    nr: 1,
    label: 'Zaal 1',
    title: 'Een wereld in crisis',
    curator: 'Milan',
    rect: [-10, 10, -22.6, -0.6],
    height: 5.2,
    theme: {
      wall: '#34383c', wallRough: 0.95, floor: 'oak-dark', floorColor: '#2d241c',
      ceiling: 'track', ceilingColor: '#2a2c2f', trim: '#6f7276',
      ambient: 0.4, key: 0.8, keyColor: '#dfe6ff', wash: '#e8ecff', washStrength: 1.0,
      fog: '#0b0c0e', mood: 'crisis'
    },
    partitions: [{ id: 'p1', cx: 0, cz: -7, len: 9, rot: 0, h: 3.8 }],
    benches: [{ x: 3.5, z: -18.6, rot: 0, len: 2.2 }],
    slots: [
      { art: 'klee-tod-und-feuer', wall: 'W', at: -4.5 },
      { art: 'nash-totes-meer', wall: 'p1:a', at: 1.6 },
      { art: 'moore-sleepers', wall: 'W', at: -11 },
      { art: 'shahn-nazi-brutality', wall: 'E', at: -5 },
      { art: 'nussbaum-triumph', wall: 'p1:b', at: 0 },
      { art: 'sargent-jaws', wall: 'E', at: -12 },
      { art: 'picasso-charnel', wall: 'N', at: 3.5 },
      { art: 'levy-nagasaki', wall: 'E', at: -19 }
    ],
    stele: { x: -4.4, z: -3.1, faceTo: [0, -0.6] }
  },
  {
    id: 'zaal2',
    nr: 2,
    label: 'Zaal 2',
    title: 'De mens achter de geschiedenis',
    curator: 'Constantijn',
    rect: [-10, 10, -45.2, -23.2],
    height: 5.6,
    theme: {
      wall: '#57524c', wallRough: 0.95, floor: 'oak', floorColor: '#5a4632',
      ceiling: 'track', ceilingColor: '#3a3734', trim: '#8a7a64',
      ambient: 0.45, key: 0.95, keyColor: '#fff0dc', wash: '#ffe6c4', washStrength: 0.95,
      fog: '#14110e', mood: 'mens'
    },
    partitions: [{ id: 'p2', cx: 0, cz: -34.5, len: 9, rot: Math.PI / 2, h: 3.6 }],
    benches: [{ x: 5.6, z: -29.2, rot: Math.PI / 2, len: 1.8 }],
    slots: [
      { art: 'lange-american', wall: 'W', at: -28.5 },
      { art: 'lange-mochida', wall: 'W', at: -33.6 },
      { art: 'adams-nakamura', wall: 'W', at: -39.6 },
      { art: 'parks-gothic', wall: 'p2:b', at: -3 },
      { art: 'nussbaum-judenpass', wall: 'p2:b', at: 3 },
      { art: 'lawrence-migration', wall: 'p2:a', at: 3 },
      { art: 'salomon-leben', wall: 'p2:a', at: -3 },
      { art: 'hopper-nighthawks', wall: 'E', at: -29.2 },
      { art: 'munch-klokken', wall: 'E', at: -40.4 }
    ],
    stele: { x: -1.9, z: -25.7, faceTo: [-5.5, -23.2] }
  },
  {
    id: 'zaal3',
    nr: 3,
    label: 'Zaal 3',
    title: 'Dromen, symbolen en het onderbewuste',
    curator: 'Berend',
    rect: [-10, 10, -70.8, -45.8],
    height: 7.5,
    theme: {
      wall: '#384850', wallRough: 0.9, floor: 'checker', floorColor: '#1b1c1e',
      ceiling: 'night', ceilingColor: '#0e1630', trim: '#c9a86a',
      ambient: 0.42, key: 0.9, keyColor: '#d8e0ff', wash: '#fff2d6', washStrength: 1.0,
      fog: '#0a0d16', mood: 'droom'
    },
    partitions: [
      { id: 'p3a', cx: -3.8, cz: -55.2, len: 6.5, rot: 0.26, h: 4.2 },
      { id: 'p3b', cx: 3.4, cz: -63.6, len: 5.4, rot: -0.36, h: 3.8 }
    ],
    benches: [],
    slots: [
      { art: 'kandinsky-bleu', wall: 'W', at: -50.5 },
      { art: 'ernst-europe', wall: 'W', at: -58.6 },
      { art: 'miro-escape', wall: 'p3a:a', at: 1.3 },
      { art: 'tanning-birthday', wall: 'p3a:b', at: 0 },
      { art: 'lam-jungle', wall: 'N', at: -4.6 },
      { art: 'magritte-empire', wall: 'N', at: 4.2 },
      { art: 'kahlo-column', wall: 'p3b:a', at: 0 },
      { art: 'gorky-liver', wall: 'E', at: -66.6 }
    ],
    stele: { x: 8.0, z: -48.6, faceTo: [5, -45.8] }
  },
  {
    id: 'zaal4',
    nr: 4,
    label: 'Zaal 4',
    title: 'Een nieuwe beeldtaal',
    curator: 'Milan',
    rect: [10.6, 36.6, -70.8, -36],
    height: 10,
    theme: {
      wall: '#e8e5de', wallRough: 0.9, floor: 'concrete', floorColor: '#8e8a83',
      ceiling: 'skylight', ceilingColor: '#efede8', trim: '#9a958c',
      ambient: 0.9, key: 1.2, keyColor: '#fffaf0', wash: '#fff6e8', washStrength: 0.55,
      fog: '#2a2926', mood: 'abstract'
    },
    benches: [
      { x: 23.6, z: -61.6, rot: 0, len: 2.6 },
      { x: 31.2, z: -55, rot: Math.PI / 2, len: 2.2 }
    ],
    slots: [
      { art: 'mondrian-broadway', wall: 'W', at: -66.6 },
      { art: 'pollock-autumn', wall: 'N', at: 23.6 },
      { art: 'rothko-no3', wall: 'E', at: -59.5 },
      { art: 'newman-onement', wall: 'E', at: -50.2 },
      { art: 'dekooning-excavation', wall: 'E', at: -42.2 },
      { art: 'pollock-shewolf', wall: 'W', at: -50.2 },
      { art: 'krasner-untitled', wall: 'W', at: -42.2 }
    ],
    stele: { x: 14.4, z: -55.2, faceTo: [10.6, -59.5] }
  },
  {
    id: 'zaal5',
    nr: 5,
    label: 'Zaal 5',
    title: 'Op weg naar een andere toekomst',
    curator: 'Polle',
    rect: [10.6, 36.6, -35.4, -6],
    height: 8,
    theme: {
      wall: '#f1efe9', wallRough: 0.9, floor: 'oak-light', floorColor: '#b99a74',
      ceiling: 'skylight', ceilingColor: '#f4f2ee', trim: '#b9b2a4',
      ambient: 1.0, key: 1.15, keyColor: '#fffdf6', wash: '#fffaf0', washStrength: 0.45,
      fog: '#2f2e2b', mood: 'toekomst'
    },
    windows: { wall: 'E', from: -32.4, to: -8.8, sill: 0.7, head: 6.2 },
    partitions: [{ id: 'p5', cx: 29.2, cz: -21, len: 10, rot: Math.PI / 2, h: 4.2 }],
    benches: [{ x: 33.6, z: -14.2, rot: Math.PI / 2, len: 2.2 }],
    sculptures: [{ art: 'moore-family', x: 18.4, z: -11.6, rot: 0.6 }],
    slots: [
      { art: 'mondrian-victory', wall: 'W', at: -29 },
      { art: 'matisse-icarus', wall: 'p5:b', at: 3.4 },
      { art: 'leger-constructeurs', wall: 'W', at: -18 },
      { art: 'appel-vragende', wall: 'p5:b', at: -3.4 },
      { art: 'dirksen-marshall', wall: 'N', at: 15.6 },
      { art: 'eames-lcw', wall: 'N', at: 31.4 },
      { art: 'moore-family', sculpture: true },
      { art: 'zadkine-stad', wall: 'p5:a', at: 0 }
    ],
    stele: { x: 19.4, z: -32.7, faceTo: [23.5, -35.4] }
  },
  {
    id: 'finale',
    nr: 6,
    label: 'Finale',
    title: 'Wat bouwen we opnieuw op?',
    curator: 'Milan, Berend, Polle en Constantijn',
    rect: [10.6, 36.6, -5.4, 22],
    height: 14,
    theme: {
      wall: '#dedad2', wallRough: 0.92, floor: 'terrazzo', floorColor: '#cfc9bd',
      ceiling: 'oculus', ceilingColor: '#e9e6df', trim: '#b08d57',
      ambient: 0.75, key: 1.1, keyColor: '#fff4e0', wash: '#fff1d8', washStrength: 0.6,
      fog: '#262421', mood: 'finale'
    },
    installation: { x: 23.6, z: 8.3, radius: 3.2 },
    benches: [{ x: 23.6, z: 15.8, rot: 0, len: 2.6 }],
    slots: [
      { art: 'eigen-doek', wall: 'E', at: 8.3 }
    ],
    panels: [
      { id: 'reflection', kind: 'kiosk', x: 15.4, z: 2.2, faceTo: [23.6, 8.3], action: 'reflection' },
      { id: 'end', kind: 'end', wall: 'S', at: 23.6, y: 2.2, w: 2.8, h: 2.3, action: 'end' }
    ],
    stele: { x: 19.0, z: -2.5, faceTo: [23.6, -5.4] }
  }
];

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
export const DOOR_BY_ID = Object.fromEntries(DOORS.map((d) => [d.id, d]));
