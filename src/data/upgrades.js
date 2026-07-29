/* ============================================================
   Shop upgrades + locations
   Every upgrade has 5 levels. `effect(level)` returns the bonus.
   ============================================================ */

export const UPGRADES = [
  { id:'counter',   name:'Counter',        emoji:'🪵', cost:[0,450,1100,2400,5200],
    desc:'A wider counter fits more customers at once.',
    effect:l => ({ queue: 2 + Math.ceil(l / 2) }), label:l => `Queue ${2 + Math.ceil(l/2)}` },

  { id:'shelves',   name:'Shelves',        emoji:'🗄️', cost:[0,380,900,2000,4400],
    desc:'Display stock so customers order pricier candy.',
    effect:l => ({ priceMult: 1 + l * .06 }), label:l => `+${l*6}% price` },

  { id:'machines',  name:'Candy Machines', emoji:'⚙️', cost:[0,600,1500,3200,6800],
    desc:'Faster moulding gives you more time per order.',
    effect:l => ({ timeMult: 1 + l * .09 }), label:l => `+${l*9}% time` },

  { id:'table',     name:'Decoration Table',emoji:'🎨', cost:[0,520,1300,2900,6200],
    desc:'More room means more decorations fit on one candy.',
    effect:l => ({ maxDecos: 8 + l * 3 }), label:l => `${8 + l*3} slots` },

  { id:'register',  name:'Cash Register',  emoji:'💳', cost:[0,700,1700,3600,7600],
    desc:'Smoother payments earn you bigger tips.',
    effect:l => ({ tipMult: 1 + l * .12 }), label:l => `+${l*12}% tips` },

  { id:'waiting',   name:'Waiting Area',   emoji:'🛋️', cost:[0,420,1050,2300,5000],
    desc:'Comfy seats slow down the patience drain.',
    effect:l => ({ patienceMult: 1 + l * .10 }), label:l => `+${l*10}% patience` },

  { id:'walls',     name:'Walls',          emoji:'🖼️', cost:[0,300,780,1800,3900],
    desc:'Fresh wallpaper lifts the shop mood.',
    effect:l => ({ satisfaction: l * 3 }), label:l => `+${l*3} vibe` },

  { id:'floor',     name:'Floor',          emoji:'🧱', cost:[0,300,780,1800,3900],
    desc:'Polished tiles. Customers notice.',
    effect:l => ({ satisfaction: l * 3 }), label:l => `+${l*3} vibe` },

  { id:'lighting',  name:'Lighting',       emoji:'💡', cost:[0,560,1400,3000,6400],
    desc:'Warm display lights make candy look irresistible.',
    effect:l => ({ starBonus: l * .04, satisfaction: l * 2 }), label:l => `+${(l*4)}% shine` },

  { id:'music',     name:'Music System',   emoji:'🎵', cost:[0,340,860,1900,4200],
    desc:'A calm playlist keeps everybody relaxed.',
    effect:l => ({ patienceMult: 1 + l * .05, satisfaction: l * 4 }), label:l => `+${l*5}% calm` },

  // the slot count itself lives in state.js (STAFF_SLOTS) — the later
  // levels are worth more than one pair of hands
  { id:'staff',     name:'Employee',       emoji:'🧑‍🍳', cost:[0,1200,2800,6000,12000],
    desc:'Room for more staff behind the counter, and more couriers on the road.',
    effect:l => ({ idleCoins: l * 14 }),
    label:l => `${[0,1,2,4,6][l] ?? 0} places · ${l*14}/hr idle` },
];

export const UPG_BY_ID = Object.fromEntries(UPGRADES.map(u => [u.id, u]));
export const MAX_UPG_LEVEL = 4;

/** Merge every upgrade effect into one flat bonus object. */
export function computeBonuses(levels = {}){
  const out = {
    queue:2, priceMult:1, timeMult:1, maxDecos:8, tipMult:1,
    patienceMult:1, satisfaction:0, starBonus:0, idleCoins:0,
  };
  for (const u of UPGRADES){
    const lv = levels[u.id] || 0;
    if (!lv) continue;
    const e = u.effect(lv);
    for (const [k, v] of Object.entries(e)){
      if (k === 'priceMult' || k === 'timeMult' || k === 'tipMult' || k === 'patienceMult') out[k] *= v;
      else if (k === 'queue' || k === 'maxDecos') out[k] = Math.max(out[k], v);
      else out[k] += v;
    }
  }
  return out;
}

/* ── Locations ───────────────────────────────────────── */
export const LOCATIONS = [
  { id:'village',   name:'Small Village',    emoji:'🏡', cost:0,     level:1,
    payMult:1.0, sky:['#ffe6f2','#ffd0e4'], accent:'#ff8ec0',
    desc:'Where it all began. Cosy, quiet, kind customers.' },
  { id:'city',      name:'City Center',      emoji:'🏙️', cost:4500,  level:6,
    payMult:1.35, sky:['#e2f1ff','#c4e2ff'], accent:'#5aabff',
    desc:'Busier queue, bigger budgets, less patience.' },
  { id:'beach',     name:'Beach Shop',       emoji:'🏖️', cost:12000, level:10,
    payMult:1.6, sky:['#d9f4ff','#ffeec9'], accent:'#48cfa6',
    desc:'Holiday crowds who tip generously in the sun.' },
  { id:'xmas',      name:'Christmas Market', emoji:'🎄', cost:26000, level:14,
    payMult:1.9, sky:['#e8f0ff','#dfeaff'], accent:'#e2504f',
    desc:'Fairy lights, mulled wine and festive spending.' },
  { id:'mall',      name:'Luxury Mall',      emoji:'💍', cost:52000, level:18,
    payMult:2.3, sky:['#f6f0ff','#efe6ff'], accent:'#9a6bff',
    desc:'Connoisseurs only. Enormous tips, brutal standards.' },
  { id:'festival',  name:'Candy Festival',   emoji:'🎡', cost:98000, level:22,
    payMult:2.9, sky:['#fff0e0','#ffe0f0'], accent:'#ffc94d',
    desc:'The big one. Endless customers, legendary rewards.' },
];

export const LOC_BY_ID = Object.fromEntries(LOCATIONS.map(l => [l.id, l]));
export const getLocation = id => LOC_BY_ID[id] || LOCATIONS[0];
