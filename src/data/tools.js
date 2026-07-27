/* ============================================================
   Candy tools — the things you do TO the candy itself, as opposed
   to decorations you stick ON it.

   Tools are free: each one unlocks together with the candy that
   supports it, so a chocolate bar always comes with the filler.
   ============================================================ */

/** Cream fillings for the Cream Filler. */
export const FILLINGS = [
  { id:'pistachio',  name:'Pistachio',      emoji:'🥜', base:'#a8c96a', dark:'#6f8f3a', light:'#d6e8ac' },
  { id:'hazelnut',   name:'Hazelnut',       emoji:'🌰', base:'#c08b5c', dark:'#7d4f28', light:'#e6c39a' },
  { id:'strawberry', name:'Strawberry Cream',emoji:'🍓', base:'#ff9ab5', dark:'#d4467f', light:'#ffd0e0' },
  { id:'caramel',    name:'Caramel',        emoji:'🍯', base:'#e0a13c', dark:'#a46a16', light:'#ffd98a' },
  { id:'mint',       name:'Mint Cream',     emoji:'🌿', base:'#7fe4c6', dark:'#2e9e6b', light:'#c8f5e6' },
  { id:'raspberry',  name:'Raspberry Jam',  emoji:'🫐', base:'#e0417b', dark:'#8f1440', light:'#ff9ab5' },
  { id:'vanilla',    name:'Vanilla Cream',  emoji:'🌼', base:'#fff0d0', dark:'#d9bd8a', light:'#fffaf0' },
  { id:'ganache',    name:'Dark Ganache',   emoji:'🖤', base:'#4a2c17', dark:'#20120a', light:'#7d4f28' },
];
export const FILL_BY_ID = Object.fromEntries(FILLINGS.map(f => [f.id, f]));

/** Powders for the Sugar Duster. */
export const DUSTS = [
  { id:'sugar',  name:'Icing Sugar', emoji:'❄️', color:'#ffffff' },
  { id:'cocoa',  name:'Cocoa',       emoji:'🍫', color:'#5a3821' },
  { id:'matcha', name:'Matcha',      emoji:'🍵', color:'#8fbf6a' },
  { id:'freeze', name:'Berry Powder',emoji:'🍓', color:'#e0417b' },
  { id:'gold',   name:'Gold Powder', emoji:'✨', color:'#ffc94d' },
];
export const DUST_BY_ID = Object.fromEntries(DUSTS.map(d => [d.id, d]));

/**
 * kind decides which editor the studio shows:
 *   'fill'  → pick a filling
 *   'dip'   → pick a colour, drag the depth
 *   'level' → a 0-3 intensity stepper
 *   'dust'  → pick a powder
 *   'color' → pick a colour
 */
export const TOOLS = [
  {
    id:'fill', name:'Cream Filler', emoji:'🧴', kind:'fill',
    desc:'Cut the candy open and pipe a cream centre inside.',
    candies:['bar','bonbon','cookie','donut','cupcake','cakepop','truffle','macaronBig'],
  },
  {
    id:'dip', name:'Chocolate Dipper', emoji:'🍫', kind:'dip',
    desc:'Dunk the bottom half into melted chocolate.',
    candies:['lolli','marsh','cane','cookie','pretzel','cakepop','icecream','truffle','bar'],
  },
  {
    id:'toast', name:'Sugar Torch', emoji:'🔥', kind:'level',
    desc:'Scorch the surface to a toasted caramel brown.',
    candies:['marsh','cupcake','icecream','cookie','pretzel','donut'],
  },
  {
    id:'dust', name:'Sugar Duster', emoji:'🌨️', kind:'dust',
    desc:'Sift a fine powder over the whole thing.',
    candies:['bar','bonbon','truffle','cookie','donut','cupcake','heart','macaronBig','marsh'],
  },
  {
    id:'marble', name:'Marble Swirl', emoji:'🌀', kind:'color',
    desc:'Swirl a second chocolate through the first.',
    candies:['bar','bonbon','heart','truffle','box','lolli'],
  },
  {
    id:'swirl', name:'Cream Whipper', emoji:'🍦', kind:'color',
    desc:'Pipe a tall whipped-cream crown on top.',
    candies:['cupcake','donut','icecream','cakepop','marsh'],
  },
];
export const TOOL_BY_ID = Object.fromEntries(TOOLS.map(t => [t.id, t]));

/** Which tools this candy supports. */
export const toolsForCandy = candyId => TOOLS.filter(t => t.candies.includes(candyId));

/** Strip tool settings that the current candy cannot use. */
export function pruneTools(tools, candyId){
  const allowed = new Set(toolsForCandy(candyId).map(t => t.id));
  const out = {};
  for (const [k, v] of Object.entries(tools || {})){
    if (allowed.has(k) && v != null) out[k] = v;
  }
  return out;
}

/** Short human label for a configured tool, used in orders and checklists. */
export function toolLabel(id, value){
  if (value == null) return '';
  switch (id){
    case 'fill':   return FILL_BY_ID[value]?.name ?? value;
    case 'dust':   return DUST_BY_ID[value]?.name ?? value;
    case 'toast':  return ['', 'lightly toasted', 'toasted', 'deeply toasted'][value] || 'toasted';
    case 'dip':    return 'dipped';
    case 'marble': return 'marbled';
    case 'swirl':  return 'whipped cream';
    default:       return String(value);
  }
}
