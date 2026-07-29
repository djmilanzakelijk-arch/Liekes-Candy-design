/* ============================================================
   Customer + order generation.
   Orders are only ever built from content the player actually owns,
   so every request is genuinely completable.
   ============================================================ */

import { S, bonuses } from '../core/state.js';
import { CANDIES, getCandy } from '../data/candies.js';
import { DECORATIONS, getDeco, PACKAGING, getPack } from '../data/decorations.js';
import { COLORS, getColor, COLOR_UNLOCK, RARITY } from '../data/palette.js';
import {
  PERSONALITIES, PERS_BY_ID, CUSTOMER_NAMES, CUSTOMER_FACES, OCCASIONS,
} from '../data/customers.js';
import { t, tName, tLines, getLang, phrases, candyPluralNl } from '../core/i18n.js';
import { activeEvent } from '../data/events.js';
import { getLocation } from '../data/upgrades.js';
import { fameTier, socialPullChance } from '../data/social.js';
import { FILLINGS, DUSTS, toolsForCandy, toolLabel, TOOL_BY_ID } from '../data/tools.js';
import { pick, pickN, randI, rand, uid, clamp, listJoin, shuffle } from '../core/utils.js';

/* ── helpers: what can the player actually use right now? ── */
export const ownedCandies = () => S.owned.candies.map(getCandy).filter(Boolean);
export const ownedDecos   = () => S.owned.decos.map(getDeco).filter(Boolean);
export const ownedPacks   = () => S.owned.packs.map(getPack).filter(Boolean);
export const unlockedColors = () => COLORS.filter(c => (COLOR_UNLOCK[c.id] ?? 99) <= S.level);

const GIFT_NAMES = ['Lieke','Mila','Sam','Mum','Dad','Emma','Noah','Nina','Sofie','Luca','you','Grandma','Team'];
const GIFT_WORDS = ['Love','Thanks','Sorry','Yay','Best','Hi','XOXO','Sweet'];

/**
 * Build one order.
 * @param opt { difficulty 0..1, vip, forceCandy, forceEvent }
 */
export function makeOrder(opt = {}){
  const diff = clamp(opt.difficulty ?? Math.min(1, (S.level - 1) / 16), 0, 1);
  const ev = activeEvent();
  const vip = !!opt.vip;

  const candies = ownedCandies();
  const decos = ownedDecos();
  const colors = unlockedColors();
  const packs = ownedPacks().filter(p => p.id !== 'none');

  // ── candy ──
  let candy;
  if (opt.forceCandy && S.owned.candies.includes(opt.forceCandy)) candy = getCandy(opt.forceCandy);
  else if (ev && Math.random() < .35 && S.owned.candies.includes(ev.favCandy)) candy = getCandy(ev.favCandy);
  else candy = pick(candies);

  // ── occasion flavours the request ──
  const occasion = Math.random() < .55 ? pick(OCCASIONS) : null;

  // ── colour ──
  let colorPool = colors;
  if (occasion){
    const liked = colors.filter(c => occasion.colors.includes(c.id));
    if (liked.length && Math.random() < .7) colorPool = liked;
  } else if (ev){
    const liked = colors.filter(c => ev.favColors.includes(c.id));
    if (liked.length && Math.random() < .5) colorPool = liked;
  }
  const color = pick(colorPool);

  // ── decorations ──
  const wantCount = vip
    ? clamp(3 + Math.round(diff * 2), 3, 5)
    : clamp(1 + Math.round(diff * 2.4 + rand(-.4, .6)), 1, 4);

  let pool = decos;
  if (occasion){
    const liked = decos.filter(d => occasion.decos.includes(d.id));
    // bias towards themed decorations without excluding the rest
    pool = liked.length ? [...liked, ...liked, ...decos] : decos;
  }
  const chosen = [];
  const seen = new Set();
  for (const d of shuffle(pool)){
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    chosen.push(d);
    if (chosen.length >= wantCount) break;
  }

  const wants = chosen.map(d => {
    // sometimes the customer is specific about the decoration's colour too
    const specific = !d.fixed && d.colorable && Math.random() < (.3 + diff * .35 + (vip ? .3 : 0));
    return {
      id: d.id,
      color: specific ? pick(colors).id : null,
      count: (!vip && Math.random() < .18 && diff > .3) ? randI(2, 3) : 1,
    };
  });

  // ── packaging ──
  const wantsPack = packs.length > 0 && (vip || Math.random() < .25 + diff * .5);
  const pack = wantsPack ? pick(packs) : null;

  // ── personalised text ──
  const wantsText = S.level >= 8 && (vip ? Math.random() < .7 : Math.random() < .12 + diff * .22);
  const text = wantsText
    ? (Math.random() < .5 ? pick(GIFT_NAMES) : pick(GIFT_WORDS))
    : null;

  // ── quantity (cosmetic — affects payout) ──
  const quantity = Math.random() < .18 ? randI(2, 3) : 1;

  // ── tools: fillings, dips, torching… ──
  const tools = {};
  const toolable = toolsForCandy(candy.id);
  if (toolable.length && S.level >= 4){
    const chance = vip ? .85 : .2 + diff * .45;
    if (Math.random() < chance){
      const howMany = vip && Math.random() < .5 ? 2 : 1;
      for (const tool of pickN(toolable, howMany)){
        tools[tool.id] = randomToolValue(tool.id, colors);
      }
    }
  }

  const order = {
    id: uid(),
    candy: candy.id,
    color: color.id,
    wants,
    tools,
    pack: pack ? pack.id : null,
    text,
    quantity,
    occasion: occasion?.id ?? null,
    event: ev?.id ?? null,
    vip,
    difficulty: diff,
  };
  order.line = describeOrder(order);
  order.checklist = orderChecklist(order);
  return order;
}

/** A concrete setting a customer can ask for, per tool. */
function randomToolValue(id, colors){
  switch (id){
    case 'fill':   return pick(FILLINGS).id;
    case 'dust':   return pick(DUSTS).id;
    case 'toast':  return randI(1, 3);
    case 'dip':    return { color: pick(colors).id, depth: pick([.28, .45, .72]) };
    case 'marble': return pick(colors).id;
    case 'swirl':  return pick(colors).id;
    default:       return null;
  }
}


/** Localised phrase for one configured tool, e.g. "pistachio". */
export function toolPhrase(id, val){
  if (val == null) return '';
  switch (id){
    case 'fill':   return tName('filling', val, FILLINGS.find(f => f.id === val)?.name ?? val);
    case 'dust':   return tName('dust', val, DUSTS.find(d => d.id === val)?.name ?? val);
    case 'toast':  return t('tool.toast' + val);
    case 'dip':    return t('tool.dipPhrase', {
                     color: tName('colorAdj', val.color, getColor(val.color).name.toLowerCase()),
                     depth: t(val.depth > .6 ? 'tool.deep' : val.depth < .35 ? 'tool.tip' : 'tool.half'),
                   });
    case 'marble': return tName('colorAdj', val, getColor(val).name.toLowerCase());
    case 'swirl':  return tName('colorAdj', val, getColor(val).name.toLowerCase());
    default:       return String(val);
  }
}

/** The clause appended to an order line for each requested tool. */
function toolClauses(o){
  return Object.entries(o.tools || {}).map(([id, val]) =>
    t('tool.clause.' + id, { v: toolPhrase(id, val) }));
}

/** Human-readable one-liner shown to the player, in the active language. */
export function describeOrder(o){
  return getLang() === 'nl' ? describeNl(o) : describeEn(o);
}

function describeEn(o){
  const candy = getCandy(o.candy);
  const noun = (o.quantity > 1 ? plural(candy.name) : candy.name).toLowerCase();
  const colorWord = getColor(o.color).name.toLowerCase();
  const p = phrases();
  const qty = o.quantity > 1
    ? p.numbers[o.quantity] + ' '
    : (/^[aeiou]/.test(colorWord) ? 'an ' : 'a ');

  const decoBits = o.wants.map(w => {
    const d = getDeco(w.id);
    if (!d) return null;
    const col = w.color ? getColor(w.color).name.toLowerCase() + ' ' : '';
    const n = w.count > 1 ? `${w.count} ` : '';
    return `${n}${col}${d.name.toLowerCase()}${w.count > 1 ? 's' : ''}`;
  }).filter(Boolean);

  let s = `${qty}${colorWord} ${noun}`;
  if (decoBits.length) s += ` with ${listJoin(decoBits)}`;
  // Tool clauses sit behind the decorations, each set off by a comma.
  // Run together they read as one item — "dusted with matcha with drizzle"
  // parses as a single "matcha drizzle" that does not exist.
  const tc = toolClauses(o);
  if (tc.length) s += ', ' + listJoin(tc);
  if (o.pack) s += `, in ${aOrAn(getPack(o.pack).name.toLowerCase())}`;

  const occ = OCCASIONS.find(x => x.id === o.occasion);
  if (occ) s += ` ${occ.label}`;
  if (o.text) s += `, ${t('ord.pipe', { t:o.text })}`;

  return `${pick(p.openers)} ${s} — ${pick(p.closers)}`;
}

function describeNl(o){
  const candy = getCandy(o.candy);
  const p = phrases();
  const noun = o.quantity > 1
    ? (candyPluralNl(o.candy) || tName('candy', o.candy, candy.name).toLowerCase())
    : tName('candy', o.candy, candy.name).toLowerCase();
  const colorWord = tName('colorAdj', o.color, getColor(o.color).name.toLowerCase());
  const qty = o.quantity > 1 ? p.numbers[o.quantity] + ' ' : 'een ';

  const decoBits = o.wants.map(w => {
    const d = getDeco(w.id);
    if (!d) return null;
    const col = w.color ? tName('colorAdj', w.color, '') + ' ' : '';
    const n = w.count > 1 ? `${w.count}× ` : '';
    return `${n}${col}${tName('deco', w.id, d.name).toLowerCase()}`;
  }).filter(Boolean);

  let s = `${qty}${colorWord} ${noun}`;
  if (decoBits.length) s += ` met ${listJoinNl(decoBits)}`;
  // Gereedschapszinnen achter de versieringen, met een komma ertussen:
  // "bestrooid met matcha met chocoladedruppels" leest anders als één
  // product ("matcha chocoladedruppels") dat niet bestaat.
  const tc = toolClauses(o);
  if (tc.length) s += ', ' + listJoinNl(tc);
  if (o.pack) s += `, in een ${tName('pack', o.pack, getPack(o.pack).name).toLowerCase()}`;

  const occ = OCCASIONS.find(x => x.id === o.occasion);
  if (occ) s += ` ${tName('occasion', occ.id, occ.label)}`;
  if (o.text) s += `, ${t('ord.pipe', { t:o.text })}`;

  return `${pick(p.openers)} ${s} — ${pick(p.closers)}`;
}

const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
const aOrAn = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;

function listJoinNl(parts){
  parts = parts.filter(Boolean);
  if (parts.length <= 1) return parts[0] || '';
  return parts.slice(0, -1).join(', ') + ' en ' + parts[parts.length - 1];
}

function plural(n){
  if (/y$/.test(n)) return n.slice(0, -1) + 'ies';
  if (/(s|x|z|ch|sh)$/.test(n)) return n + 'es';
  return n + 's';
}

/** Structured checklist the studio shows as tick-boxes. */
export function orderChecklist(o){
  const candy = getCandy(o.candy);
  const rows = [
    { key:'candy', label:tName('candy', o.candy, candy.name), icon:candy.emoji },
    { key:'color', label:tName('color', o.color, getColor(o.color).name), icon:'🎨' },
  ];
  for (const w of o.wants){
    const d = getDeco(w.id);
    rows.push({
      key:'deco:' + w.id,
      // adjective form, so it reads "Witte sprinkels" not "Wit Sprinkels"
      label:(w.count > 1 ? w.count + '× ' : '')
           + (w.color ? cap(tName('colorAdj', w.color, getColor(w.color).name)) + ' '
                        + tName('deco', w.id, d.name).toLowerCase()
                      : tName('deco', w.id, d.name)),
      icon:'✨',
    });
  }
  for (const [id, val] of Object.entries(o.tools || {})){
    rows.push({
      key:'tool:' + id,
      label:`${tName('tool', id, TOOL_BY_ID[id]?.name ?? id)}: ${toolPhrase(id, val)}`,
      icon:TOOL_BY_ID[id]?.emoji ?? '🔧',
    });
  }
  if (o.pack) rows.push({ key:'pack', label:tName('pack', o.pack, getPack(o.pack).name), icon:'🎁' });
  if (o.text) rows.push({ key:'text', label:t('ord.text', { t:o.text }), icon:'✍️' });
  return rows;
}

/* ── customers ───────────────────────────────────────── */

/** Base seconds of patience before upgrades / personality. */
function basePatience(order){
  const candy = getCandy(order.candy);
  const work = 36 + order.wants.length * 14 + (order.pack ? 10 : 0) + (order.text ? 9 : 0);
  // new shopkeepers get extra breathing room
  const grace = S.level < 3 ? 1.45 : S.level < 6 ? 1.2 : 1;
  return work * candy.time * grace;
}

export function makeCustomer(opt = {}){
  const vipRoll = opt.vip ?? (Math.random() < (S.level >= 5 ? .09 : 0));
  const pers = vipRoll ? PERS_BY_ID.vip : pick(PERSONALITIES.filter(p => !p.vip));
  const order = makeOrder({ vip: vipRoll, difficulty: opt.difficulty });

  const b = bonuses();
  const loc = getLocation(S.location);
  const seconds = basePatience(order) * pers.patience * b.patienceMult * (opt.timeScale ?? 1);

  // The more people follow the shop, the more of the queue turns up
  // because they saw it online — and some of those are influencers.
  const fans = S.social?.followers || 0;
  const fame = fameTier(fans);
  const fromSocial = !vipRoll && Math.random() < socialPullChance(fans);
  const influencer = fromSocial && Math.random() < fame.influencer;
  const reach = influencer ? 1.7 : fromSocial ? 1.15 : 1;

  return {
    id: uid(),
    name: pick(CUSTOMER_NAMES),
    face: opt.vip ? '👑' : influencer ? '🤳' : pick(CUSTOMER_FACES),
    pers,
    vip: vipRoll,
    fromSocial,
    influencer,
    order,
    favColor: order.color,
    favCandy: order.candy,
    budget: Math.round(getCandy(order.candy).base * (1.4 + Math.random() * 1.6) * loc.payMult * reach),
    greeting: pick(tLines(pers.id, 'greet', pers.greet)),
    patience: seconds,
    maxPatience: seconds,
    served: false,
    createdAt: Date.now(),
  };
}

/** A themed, higher-paying order that refreshes daily. */
export function makeDailySpecial(){
  const c = makeCustomer({ difficulty: Math.min(1, .5 + S.level / 24) });
  c.special = true;
  c.face = '🌟';
  c.greeting = "I'm here for today's special — make it count!";
  c.patience *= 1.25;
  c.maxPatience = c.patience;
  return c;
}
