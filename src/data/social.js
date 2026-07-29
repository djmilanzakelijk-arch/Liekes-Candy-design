/* ============================================================
   Sweetgram — the in-game social page.

   Pure data and maths only (no state import), so orders.js and
   state.js can both read from it without a circular dependency.

   Photos of your candy get posted, collect likes over real time and
   earn followers. Followers are fame: a famous shop draws a longer
   queue, better tips, customers who say they found you online, and
   the occasional influencer or brand deal.
   ============================================================ */

import { clamp, rand, pick } from '../core/utils.js';
import { getDeco } from './decorations.js';

/* ══════════════ fame ══════════════ */

export const FAME = [
  { id:'seed',  min:0,      emoji:'🌱', queue:0, tipMult:1.00, influencer:.00, deals:0 },
  { id:'local', min:300,    emoji:'📍', queue:0, tipMult:1.04, influencer:.06, deals:1 },
  { id:'known', min:2000,   emoji:'⭐', queue:1, tipMult:1.08, influencer:.11, deals:1 },
  { id:'star',  min:10000,  emoji:'🌟', queue:1, tipMult:1.14, influencer:.17, deals:2 },
  { id:'viral', min:45000,  emoji:'🔥', queue:2, tipMult:1.20, influencer:.24, deals:2 },
  { id:'icon',  min:200000, emoji:'👑', queue:2, tipMult:1.30, influencer:.32, deals:3 },
];

export function fameTier(followers = 0){
  let out = FAME[0];
  for (const t of FAME) if (followers >= t.min) out = t;
  return out;
}
export const nextFame = (followers = 0) => FAME.find(t => t.min > followers) || null;

/** 0..1 through the current tier, for the progress bar. */
export function fameProgress(followers = 0){
  const cur = fameTier(followers), nxt = nextFame(followers);
  if (!nxt) return 1;
  return clamp((followers - cur.min) / (nxt.min - cur.min), 0, 1);
}

/** How often a walk-in says they found the shop online. */
export const socialPullChance = (followers = 0) =>
  clamp(followers / 4000, 0, .45);

/* ══════════════ how good is this photo? ══════════════ */

const RARE = new Set(['epic', 'legendary', 'mythic']);

/**
 * Score a design as a post, 0..1. Effort shows: more pieces, rarer
 * pieces, piped cream, tool work and nice packaging all read well.
 * @param meta.stars  the grade it earned, when the photo came from an order
 */
export function postQuality(design, meta = {}){
  const items = design?.items || [];
  let q = 0;
  q += clamp(items.length / 8, 0, 1) * .26;
  q += clamp((design?.strokes || []).length / 4, 0, 1) * .08;
  q += Object.keys(design?.tools || {}).length ? .12 : 0;
  q += design?.pack && design.pack !== 'none' ? .12 : 0;
  q += design?.text ? .06 : 0;

  const rare = items.filter(i => RARE.has(getDeco(i.id)?.rarity)).length;
  q += clamp(rare / 4, 0, 1) * .16;

  if (meta.stars) q += (meta.stars / 5) * .20;
  return clamp(q, .06, 1);
}

/* ══════════════ likes and going viral ══════════════ */

/* ── the algorithm does not like spam ──
   Without this you could post twenty saved photos in a row and collect
   twenty posts' worth of followers inside an hour, which flattens the
   whole climb. Each extra post inside the window reaches far fewer
   people, and the composer says so before you publish. */

/** Posts inside this window count against the next one. */
export const SPAM_WINDOW_MS = 6 * 3600 * 1000;

/** Reach multiplier for the next post: 1 → .55 → .30 → .17 → … */
export function reachPenalty(posts = [], now = Date.now()){
  const recent = posts.filter(p => now - p.ts < SPAM_WINDOW_MS).length;
  return Math.pow(.55, recent);
}

/** Chance this post takes off. Good photos travel; so does a big following. */
export const viralChance = (quality, followers = 0, penalty = 1) =>
  clamp((.03 + quality * .22 + Math.min(.08, followers / 200000)) * penalty, 0, .38);

/** Where the like count ends up. */
export function likeTarget(quality, followers = 0, viral = false, penalty = 1){
  const base = 25 + quality * 340;
  const reach = 1 + Math.pow(Math.max(0, followers), .62) / 26;
  return Math.max(5, Math.round(base * reach * penalty * (viral ? rand(7, 12) : 1)));
}

/**
 * Fraction of the final like count reached after `mins` minutes.
 * Fast at first, then a long tail — about half within half an hour.
 * The +1.5 is a small head start, so a fresh post never sits at zero
 * likes while she is still looking at it.
 */
export const likeCurve = mins => 1 - Math.exp(-(Math.max(0, mins) + 1.5) / 42);

/** Followers earned from a batch of new likes. */
export const followersFrom = likes => Math.round(likes * rand(.10, .17));

/* ══════════════ trimmings ══════════════ */

export const HASHTAGS = [
  'candy', 'handmade', 'sweettooth', 'pastel', 'cute',
  'smallshop', 'foodie', 'sprinkles', 'chocolate', 'gift',
];

export const COMMENTER_FACES = [
  '🧒','👧','🧑','👩','👨','🧓','🐰','🦊','🐻','🐼','🦄','🐝','🐸','🐨',
];
export const COMMENTER_NAMES = [
  'sugarbee', 'mila.xo', 'noor_', 'tinytreats', 'kiki', 'jasperr',
  'lottevanb', 'zoetzus', 'bonbonbo', 'yara.k', 'sprinkleking', 'dailycandy',
  'mrs.marzipan', 'fenna', 'oma_riet', 'chocoholic',
];

/** Which bucket of comment lines fits this post. */
export const commentBand = q => (q > .72 ? 'wow' : q > .42 ? 'good' : 'nice');

/** How many comments a post collects, given how many likes it has. */
export const commentCount = likes => clamp(Math.round(Math.log10(Math.max(10, likes)) * 1.6), 1, 5);

export const randomCommenter = () => ({
  name: pick(COMMENTER_NAMES),
  face: pick(COMMENTER_FACES),
});

/* ══════════════ brand deals ══════════════ */

/**
 * Sponsors who turn up once you are worth being seen with. `pay` and
 * `gems` scale with your following, so a deal is always worth taking.
 */
export const BRANDS = [
  { id:'cocoa',    emoji:'🍫', tags:['chocolate','handmade'] },
  { id:'petals',   emoji:'🌸', tags:['pastel','cute'] },
  { id:'sprinkle', emoji:'✨', tags:['sprinkles','candy'] },
  { id:'gift',     emoji:'🎀', tags:['gift','handmade'] },
  { id:'market',   emoji:'🧺', tags:['smallshop','foodie'] },
];

/* ══════════════ follower wishes ══════════════
   A post that travels far enough gets a comment asking for something
   specific. Making it is worth coins and a nice bump of followers. */

/** Likes a post needs before somebody asks for something. */
export const WISH_LIKES = 220;
/** Never let more than this many pile up unanswered. */
export const MAX_WISHES = 3;
/** A wish is withdrawn if it is ignored this long. */
export const WISH_LIFETIME_MS = 8 * 3600 * 1000;

export function wishReward(followers = 0){
  const reach = 1 + Math.pow(Math.max(0, followers), .55) / 70;
  return {
    coins: Math.round(220 * reach / 10) * 10,
    followers: Math.round(70 * reach),
  };
}

export function dealReward(followers = 0, difficulty = .5){
  const reach = 1 + Math.pow(Math.max(0, followers), .55) / 52;
  return {
    coins: Math.round((450 + difficulty * 900) * reach / 10) * 10,
    gems: difficulty > .6 ? 2 : 1,
    followers: Math.round((120 + difficulty * 380) * reach),
  };
}
