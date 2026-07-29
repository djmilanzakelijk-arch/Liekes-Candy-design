/* ============================================================
   Sweetgram — posting, likes and getting famous.

   Photos she saves in the studio can be posted. A post collects likes
   over real time and turns some of them into followers; a good one can
   go viral. Followers are the shop's fame, which the rest of the game
   reads: a longer queue, better tips, customers who mention they found
   her online, influencers, and brand deals.
   ============================================================ */

import {
  S, save, emit, addCoins, addGems, addXp, bump,
} from '../core/state.js';
import {
  fameTier, nextFame, fameProgress, postQuality, viralChance, likeTarget,
  likeCurve, followersFrom, commentBand, commentCount, randomCommenter,
  reachPenalty, SPAM_WINDOW_MS, HASHTAGS, BRANDS, dealReward,
  WISH_LIKES, MAX_WISHES, WISH_LIFETIME_MS, wishReward,
} from '../data/social.js';
import { stagingBonus } from '../render/backdrop.js';
import { getCandy, CANDIES } from '../data/candies.js';
import { DECORATIONS, getDeco } from '../data/decorations.js';
import { COLORS, COLOR_UNLOCK } from '../data/palette.js';
import { todayKey, uid, clamp, pick, pickN, rand, randI } from '../core/utils.js';

/** Posts older than this stop gathering likes — the feed moves on. */
const POST_LIFE_MIN = 60 * 20;
/** Nobody keeps an infinite feed on a phone. */
const MAX_POSTS = 40;
/** Level at which the social page opens up. */
export const SOCIAL_LEVEL = 3;

export const social = () => {
  if (!S.social){
    S.social = {
      followers: 0, posts: [], likes: 0, viral: 0,
      deals: [], dealDate: '', unseen: 0, wishes: [],
    };
  }
  if (!S.social.wishes) S.social.wishes = [];
  return S.social;
};

export const followers = () => social().followers || 0;
export const tier = () => fameTier(followers());
export const nextTier = () => nextFame(followers());
export const progress = () => fameProgress(followers());
export const unlocked = () => S.level >= SOCIAL_LEVEL;

export function addFollowers(n){
  if (!n) return 0;
  const s = social();
  const before = tier().id;
  s.followers = Math.max(0, Math.round(s.followers + n));
  bump('followers', Math.max(0, n));
  if (tier().id !== before) emit('fameup', { tier: tier() });
  emit('state');
  save();
  return n;
}

/* ══════════════ posting ══════════════ */

/** How much reach the NEXT post would get right now, 0..1. */
export const currentReach = () => reachPenalty(social().posts);

/** Posts made inside the spam window. */
export const recentPostCount = () =>
  social().posts.filter(p => Date.now() - p.ts < SPAM_WINDOW_MS).length;

/**
 * Put a saved photo on the feed.
 * @param photo  an entry from S.photos
 * @param opt    { caption, tags:[], backdrop, frame }
 */
export function createPost(photo, opt = {}){
  const s = social();
  const quality = clamp(
    postQuality(photo.design, { stars: photo.stars })
      + stagingBonus(opt.backdrop, opt.frame), .06, 1);
  // posting five things in a row reaches almost nobody
  const penalty = reachPenalty(s.posts);
  const viral = Math.random() < viralChance(quality, s.followers, penalty);

  const post = {
    id: uid(),
    ts: Date.now(),
    design: JSON.parse(JSON.stringify(photo.design)),
    caption: (opt.caption || '').slice(0, 60),
    tags: (opt.tags || []).slice(0, 3),
    backdrop: opt.backdrop || 'none',
    frame: opt.frame || 'none',
    quality: Math.round(quality * 100) / 100,
    stars: photo.stars || 0,
    viral,
    penalty: Math.round(penalty * 100) / 100,
    likes: 0,
    target: likeTarget(quality, s.followers, viral, penalty),
    comments: makeComments(quality),
    gained: 0,
  };
  s.posts.unshift(post);
  if (s.posts.length > MAX_POSTS) s.posts.length = MAX_POSTS;
  if (viral) s.viral = (s.viral || 0) + 1;
  bump('posts');

  // a post lands with a first flurry rather than starting at zero
  tickSocial();
  save();
  emit('state');
  return post;
}

function makeComments(quality){
  const band = commentBand(quality);
  const n = randI(1, 3);
  const keys = [1, 2, 3, 4, 5];
  return pickN(keys, n).map(k => ({ ...randomCommenter(), key: `soc.c.${band}.${k}` }));
}

/**
 * Advance every post's like count to where it should be by now, and
 * turn the new likes into followers. Safe to call as often as you like.
 * @returns { likes, followers, viral:[…] } — what changed since last time
 */
export function tickSocial(){
  const s = social();
  const now = Date.now();
  let newLikes = 0, newFollowers = 0;
  const wentViral = [];

  for (const p of s.posts){
    const mins = (now - p.ts) / 60000;
    if (mins > POST_LIFE_MIN && p.likes >= p.target) continue;
    const want = Math.round(p.target * likeCurve(mins));
    if (want <= p.likes) continue;

    const delta = want - p.likes;
    p.likes = want;
    newLikes += delta;

    const gained = followersFrom(delta);
    p.gained = (p.gained || 0) + gained;
    newFollowers += gained;

    // the comment thread fills out as the post travels
    const wantComments = commentCount(p.likes);
    while (p.comments.length < wantComments){
      const band = commentBand(p.quality);
      p.comments.push({ ...randomCommenter(), key: `soc.c.${band}.${randI(1, 5)}` });
    }
    if (p.viral && !p.viralSeen && p.likes > p.target * .4){
      p.viralSeen = true;
      wentViral.push(p);
    }
    // once a post has travelled, somebody in the comments asks for something
    if (!p.wished && p.likes >= WISH_LIKES){
      p.wished = true;
      addWish();
    }
  }

  if (newLikes){
    s.likes = (s.likes || 0) + newLikes;
    bump('likes', newLikes);
  }
  if (newFollowers) addFollowers(newFollowers);
  if (newLikes || newFollowers){ save(); emit('state'); }

  return { likes: newLikes, followers: newFollowers, viral: wentViral };
}

/** Posts the player has not looked at since they gathered likes. */
export const feed = () => social().posts;

export function deletePost(id){
  const s = social();
  s.posts = s.posts.filter(p => p.id !== id);
  save(); emit('state');
}

/* ══════════════ follower wishes ══════════════
   Not a sponsor with a contract — just a follower in the comments who
   would love to see something specific. Small, frequent and personal. */

export function pruneWishes(){
  const s = social();
  const now = Date.now();
  const before = s.wishes.length;
  s.wishes = s.wishes.filter(w => w.expires > now);
  if (s.wishes.length !== before) save();
  return s.wishes;
}

export const wishes = () => pruneWishes();

/** Build one wish out of something she can actually make. */
function addWish(){
  const s = social();
  if (pruneWishes().length >= MAX_WISHES) return null;

  const candies = CANDIES.filter(c => S.owned.candies.includes(c.id));
  const decos = DECORATIONS.filter(d => S.owned.decos.includes(d.id));
  const colors = COLORS.filter(c => (COLOR_UNLOCK[c.id] ?? 99) <= S.level);
  if (!candies.length || !colors.length) return null;

  const wish = {
    id: uid(),
    ...randomCommenter(),
    candy: pick(candies).id,
    color: pick(colors).id,
    deco: decos.length && Math.random() < .7 ? pick(decos).id : null,
    reward: wishReward(s.followers),
    expires: Date.now() + WISH_LIFETIME_MS,
  };
  s.wishes.push(wish);
  save();
  return wish;
}

export const wishById = id => wishes().find(w => w.id === id) || null;

export function dropWish(id){
  const s = social();
  s.wishes = s.wishes.filter(w => w.id !== id);
  save(); emit('state');
}

/** Pay out a fulfilled wish. */
export function finishWish(wish, stars){
  dropWish(wish.id);
  const scale = clamp(.4 + stars * .16, .4, 1.2);
  const coins = Math.round(wish.reward.coins * scale);
  const gained = Math.round(wish.reward.followers * scale);
  addCoins(coins);
  addXp(Math.round(30 * scale));
  addFollowers(gained);
  bump('wishes');
  save(); emit('state');
  return { coins, followers: gained };
}

/* ══════════════ brand deals ══════════════ */

/**
 * Sponsors turn up once she is worth being seen with, and only as many
 * as her fame tier allows. Refreshed daily so there is a reason to look.
 */
export function ensureDeals(){
  const s = social();
  const today = todayKey();
  const slots = tier().deals;

  s.deals = (s.deals || []).filter(d => !d.done);
  if (slots <= 0){ s.deals = []; return s.deals; }
  // One batch a day. Finishing them all means you are done until tomorrow —
  // a sponsor that reappears the moment you deliver is not an offer.
  if (s.dealDate === today) return s.deals;

  const owned = CANDIES.filter(c => S.owned.candies.includes(c.id));
  if (!owned.length) return s.deals;

  const list = [];
  for (let i = 0; i < slots; i++){
    const brand = pick(BRANDS);
    const candy = pick(owned);
    const difficulty = clamp(rand(.3, .5) + S.level / 40, 0, 1);
    list.push({
      id: uid(),
      brand: brand.id,
      emoji: brand.emoji,
      candy: candy.id,
      tag: pick(brand.tags),
      difficulty: Math.round(difficulty * 100) / 100,
      reward: dealReward(s.followers, difficulty),
      done: false,
    });
  }
  s.deals = list;
  s.dealDate = today;
  save();
  return s.deals;
}

export const dealById = id => (social().deals || []).find(d => d.id === id) || null;

/**
 * Pay out a finished brand deal.
 * @param stars  how the sponsor's candy was graded
 */
export function finishDeal(deal, stars){
  const s = social();
  const target = s.deals.find(d => d.id === deal.id);
  if (target) target.done = true;
  s.deals = s.deals.filter(d => !d.done);

  // a sloppy job still pays, just not well — the sponsor saw it too
  const scale = clamp(.35 + stars * .16, .35, 1.15);
  const coins = Math.round(deal.reward.coins * scale);
  const gems = stars >= 4 ? deal.reward.gems : 0;
  const gained = Math.round(deal.reward.followers * scale);

  addCoins(coins);
  if (gems) addGems(gems);
  addXp(Math.round(60 * scale));
  addFollowers(gained);
  bump('deals');
  save(); emit('state');
  return { coins, gems, followers: gained };
}

/* ══════════════ what the shop gets out of it ══════════════ */

/** Followers earned by serving a customer who found her online. */
export function followersFromCustomer(customer, stars){
  if (!customer?.fromSocial && !customer?.influencer) return 0;
  const base = customer.influencer ? 90 : 18;
  const gained = Math.round(base * (.4 + stars * .16) * (1 + followers() / 30000));
  return addFollowers(gained);
}

export { HASHTAGS };
