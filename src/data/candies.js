/* ============================================================
   Candy types — the canvas the player decorates.
   `art`  → key into render/candyArt.js
   `zone` → normalised rect (0..1) where decorations are expected to sit;
            used to place auto-decor and to judge "on the candy".
   ============================================================ */

export const CANDIES = [
  {
    id:'bar', name:'Chocolate Bar', emoji:'🍫', art:'bar',
    unlock:1, base:34, time:1.0, shape:'rectangular',
    zone:{ x:.5, y:.5, w:.42, h:.62 },
    desc:'A classic moulded bar with snap-off squares.',
  },
  {
    id:'lolli', name:'Lollipop', emoji:'🍭', art:'lolli',
    unlock:1, base:28, time:.9, shape:'round',
    zone:{ x:.5, y:.42, w:.48, h:.48 },
    desc:'Swirled sugar on a paper stick.',
  },
  {
    id:'bonbon', name:'Bonbon', emoji:'🍬', art:'bonbon',
    unlock:3, base:46, time:1.05, shape:'domed',
    zone:{ x:.5, y:.5, w:.46, h:.42 },
    desc:'A filled chocolate dome with a piped curl.',
  },
  {
    id:'gummy', name:'Gummy Bear', emoji:'🐻', art:'gummy',
    unlock:5, base:40, time:.95, shape:'jelly',
    zone:{ x:.5, y:.5, w:.4, h:.52 },
    desc:'Chewy, glossy and slightly see-through.',
  },
  {
    id:'marsh', name:'Marshmallow', emoji:'☁️', art:'marsh',
    unlock:7, base:38, time:.9, shape:'pillowy',
    zone:{ x:.5, y:.52, w:.44, h:.4 },
    desc:'Soft pillow of toasted sugar fluff.',
  },
  {
    id:'cane', name:'Candy Cane', emoji:'🍬', art:'cane',
    unlock:9, base:52, time:1.1, shape:'striped',
    zone:{ x:.5, y:.55, w:.34, h:.5 },
    desc:'Hooked peppermint stick with spiral stripes.',
  },
  {
    id:'heart', name:'Chocolate Heart', emoji:'💝', art:'heart',
    unlock:11, base:64, time:1.15, shape:'heart',
    zone:{ x:.5, y:.48, w:.46, h:.42 },
    desc:'Romantic moulded heart, perfect for roses.',
  },
  {
    id:'cookie', name:'Cookie', emoji:'🍪', art:'cookie',
    unlock:13, base:58, time:1.05, shape:'round',
    zone:{ x:.5, y:.5, w:.46, h:.46 },
    desc:'Buttery bake studded with chocolate chunks.',
  },
  {
    id:'box', name:'Gift Candy Box', emoji:'🎁', art:'box',
    unlock:15, base:96, time:1.35, shape:'boxed',
    zone:{ x:.5, y:.52, w:.5, h:.4 },
    desc:'An assortment box — the luxury centrepiece.',
  },
  {
    id:'donut', name:'Donut', emoji:'🍩', art:'donut',
    unlock:18, base:72, time:1.15, shape:'ring', event:true,
    zone:{ x:.5, y:.5, w:.5, h:.5 },
    desc:'Special-event glazed ring with a fat icing drip.',
  },
  {
    id:'truffle', name:'Truffle', emoji:'🍫', art:'truffle',
    unlock:4, base:50, time:1.0, shape:'round',
    zone:{ x:.5, y:.52, w:.44, h:.44 },
    desc:'Hand-rolled ganache under a matte cocoa coat.',
  },
  {
    id:'cupcake', name:'Cupcake', emoji:'🧁', art:'cupcake',
    unlock:6, base:66, time:1.1, shape:'domed',
    zone:{ x:.5, y:.42, w:.42, h:.36 },
    desc:'Sponge in a paper case under a tall frosting swirl.',
  },
  {
    id:'cakepop', name:'Cake Pop', emoji:'🍡', art:'cakepop',
    unlock:8, base:54, time:.95, shape:'round',
    zone:{ x:.5, y:.42, w:.42, h:.42 },
    desc:'A coated cake ball on a stick. Endlessly dippable.',
  },
  {
    id:'pretzel', name:'Choc Pretzel', emoji:'🥨', art:'pretzel',
    unlock:10, base:62, time:1.05, shape:'looped',
    zone:{ x:.5, y:.5, w:.46, h:.44 },
    desc:'Salted pretzel drowned in chocolate. Sweet and salty.',
  },
  {
    id:'icecream', name:'Ice Cream Cone', emoji:'🍦', art:'icecream',
    unlock:12, base:78, time:1.2, shape:'stacked',
    zone:{ x:.5, y:.36, w:.4, h:.34 },
    desc:'Two scoops on a waffle cone — melting slowly.',
  },
];

export const CANDY_BY_ID = Object.fromEntries(CANDIES.map(c => [c.id, c]));
export const getCandy = id => CANDY_BY_ID[id] || CANDIES[0];

/** Candy the player owns before doing anything at all. */
export const STARTER_CANDIES = ['bar', 'lolli'];
