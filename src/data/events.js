/* ============================================================
   Seasonal events + daily reward ladder
   Windows are month/day ranges evaluated against the local date.
   ============================================================ */

export const EVENTS = [
  {
    id:'valentine', name:"Valentine's Day", emoji:'💘',
    from:[2,1], to:[2,20],
    grad:['#ff8ec0','#e0417b'],
    blurb:'Roses, hearts and rose-gold. Love is profitable.',
    payMult:1.35, favCandy:'heart', favColors:['pink','red','white'],
  },
  {
    id:'easter', name:'Easter', emoji:'🐣',
    from:[3,20], to:[4,15],
    grad:['#a8e6cf','#ffd3b6'],
    blurb:'Pastel everything and a lot of speckled eggs.',
    payMult:1.25, favCandy:'bonbon', favColors:['yellow','green','purple'],
  },
  {
    id:'summer', name:'Summer Event', emoji:'🌊',
    from:[6,15], to:[8,20],
    grad:['#5aabff','#ffcf47'],
    blurb:'Beach vibes, sea shells and citrus flavours.',
    payMult:1.3, favCandy:'lolli', favColors:['blue','yellow','orange'],
  },
  {
    id:'birthday', name:'Birthday Week', emoji:'🎂',
    from:[7,20], to:[7,31],
    grad:['#9a6bff','#ff8ec0'],
    blurb:"The shop's birthday! Balloons, candles and double tips.",
    payMult:1.5, favCandy:'cookie', favColors:['rainbow','pink','yellow'],
  },
  {
    id:'halloween', name:'Halloween', emoji:'🎃',
    from:[10,15], to:[11,2],
    grad:['#ff9a4d','#5b2ec2'],
    blurb:'Spider-web icing and pumpkins. Spooky but sweet.',
    payMult:1.35, favCandy:'gummy', favColors:['orange','black','purple'],
  },
  {
    id:'christmas', name:'Christmas', emoji:'🎄',
    from:[12,1], to:[12,31],
    grad:['#e2504f','#48cfa6'],
    blurb:'Candy canes, snowflakes and very generous shoppers.',
    payMult:1.45, favCandy:'cane', favColors:['red','green','gold'],
  },
];

/** Returns the event running on `date`, or null. */
export function activeEvent(date = new Date()){
  const m = date.getMonth() + 1, d = date.getDate();
  const v = m * 100 + d;
  for (const e of EVENTS){
    const a = e.from[0] * 100 + e.from[1];
    const b = e.to[0] * 100 + e.to[1];
    if (a <= b ? (v >= a && v <= b) : (v >= a || v <= b)) return e;
  }
  return null;
}

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));

/* ── Daily login ladder (7 days, then loops with a bonus) ── */
export const DAILY_REWARDS = [
  { day:1, kind:'coins', amount:150,  emoji:'🪙', label:'150' },
  { day:2, kind:'coins', amount:280,  emoji:'🪙', label:'280' },
  { day:3, kind:'deco',  amount:1,    emoji:'🎀', label:'Ribbon' },
  { day:4, kind:'coins', amount:520,  emoji:'🪙', label:'520' },
  { day:5, kind:'gems',  amount:3,    emoji:'💎', label:'3' },
  { day:6, kind:'coins', amount:900,  emoji:'🪙', label:'900' },
  { day:7, kind:'mystery', amount:1,  emoji:'🎁', label:'Mystery' },
];

/** Mystery box loot table. */
export const MYSTERY_LOOT = [
  { kind:'coins', min:400, max:1600, weight:40, emoji:'🪙' },
  { kind:'gems',  min:2,   max:8,    weight:22, emoji:'💎' },
  { kind:'deco',  rarity:'rare',     weight:20, emoji:'🎀' },
  { kind:'deco',  rarity:'epic',     weight:12, emoji:'💜' },
  { kind:'deco',  rarity:'legendary',weight:5,  emoji:'👑' },
  { kind:'deco',  rarity:'mythic',   weight:1,  emoji:'🦋' },
];
