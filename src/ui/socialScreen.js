/* ============================================================
   Sweetgram — the in-game social page.

   Post the photos she saved in the studio, watch the likes come in,
   collect followers, and take the brand deals that fame brings.
   ============================================================ */

import { el, $, fmt, clamp, pick } from '../core/utils.js';
import { S, save } from '../core/state.js';
import { sfx, haptic } from '../core/audio.js';
import { toast, confetti, candyRain, bumpPill } from '../core/fx.js';
import { openModal, confirmModal } from './modal.js';
import { drawDesign, drawPhoto } from '../render/candy.js';
import { BACKDROPS, FRAMES } from '../render/backdrop.js';
import {
  social, followers, tier, nextTier, progress, unlocked, SOCIAL_LEVEL,
  createPost, tickSocial, feed, deletePost, ensureDeals, finishDeal, HASHTAGS,
  currentReach, recentPostCount, wishes, dropWish, finishWish,
} from '../game/social.js';
import { getCandy } from '../data/candies.js';
import { getDeco } from '../data/decorations.js';
import { getColor } from '../data/palette.js';
import { go, subHeader } from './nav.js';
import { t, tName } from '../core/i18n.js';

let tickTimer = 0;

export function mountSocial(host){
  const wrap = el('div.screen.enter');
  wrap.append(subHeader(t('soc.title'), '📱'));

  if (!unlocked()){
    wrap.append(el('div.card',
      el('div.card-title', el('span.ico', '🔒'), t('soc.title')),
      el('p.tiny.muted.center', { style:{ padding:'10px 4px', lineHeight:'1.5' } },
        t('soc.lockedLevel', { n: SOCIAL_LEVEL }))));
    host.append(wrap);
    return;
  }

  const gained = tickSocial();
  ensureDeals();

  /* ── the profile card ── */
  const tr = tier(), nx = nextTier();
  wrap.append(el('div.card.profile',
    el('div.card-title', el('span.ico', tr.emoji), S.shopName, el('span.spacer'),
      el('span.sub', t('fame.' + tr.id))),
    el('div.stat-grid',
      el('div.stat', el('b', { id:'followerNum' }, fmt(followers())), el('span', t('soc.followers'))),
      el('div.stat', el('b', '❤️ ' + fmt(social().likes || 0)), el('span', t('soc.likes'))),
      el('div.stat', el('b', String(feed().length)), el('span', t('soc.posts'))),
    ),
    el('div.bar.grape', { style:{ margin:'10px 0 4px', height:'9px' } },
      el('i', { style:{ width:(progress() * 100) + '%' } })),
    el('p.tiny.muted.center', nx
      ? t('soc.toNext', { n: fmt(nx.min - followers()), name: t('fame.' + nx.id) })
      : t('soc.maxFame')),
    el('p.tiny.center', { style:{ marginTop:'6px', fontWeight:'800', color:'var(--pink-600)' } },
      t('soc.perk', { q: tr.queue, tip: Math.round((tr.tipMult - 1) * 100) })),
  ));

  if (gained.likes > 0){
    wrap.append(el('div.card.shine', { style:{
      background:'linear-gradient(120deg,#ffe6f2,#e8e0ff)', marginTop:'-4px',
    }},
      el('p.center', { style:{ fontSize:'14px', fontWeight:'900' } },
        t('soc.whileAway', { likes: fmt(gained.likes), fans: fmt(gained.followers) })),
    ));
  }

  /* ── post something ── */
  wrap.append(el('button.btn.grape.block.lg', { style:{ marginBottom:'6px' },
    onclick: openComposer }, t('soc.newPost')));
  const reach = currentReach();
  wrap.append(el('p.tiny' + (reach < .9 ? '' : '.muted'), { style:{
    textAlign:'center', marginBottom:'12px',
    fontWeight: reach < .9 ? '800' : '700',
    color: reach < .5 ? '#c0392b' : reach < .9 ? '#c98f14' : 'var(--ink-faint)',
  }}, reach < .9
    ? t('soc.reachLow', { n: Math.round(reach * 100) })
    : t('soc.reachFull')));

  /* ── what followers asked for ── */
  const wishList = wishes();
  if (wishList.length){
    const card = el('div.card',
      el('div.card-title', el('span.ico', '💬'), t('soc.wishes'), el('span.spacer'),
        el('span.sub', t('soc.wishesSub'))));
    for (const w of wishList) card.append(wishRow(w));
    wrap.append(card);
  }

  /* ── brand deals ── */
  const deals = social().deals || [];
  if (tr.deals > 0){
    const card = el('div.card',
      el('div.card-title', el('span.ico', '🤝'), t('soc.deals'), el('span.spacer'),
        el('span.sub', t('soc.dealsSub'))));
    if (!deals.length){
      card.append(el('p.tiny.muted.center', { style:{ padding:'8px 0' } }, t('soc.noDeals')));
    } else {
      for (const d of deals) card.append(dealRow(d));
    }
    wrap.append(card);
  } else {
    wrap.append(el('div.card',
      el('div.card-title', el('span.ico', '🤝'), t('soc.deals')),
      el('p.tiny.muted.center', { style:{ padding:'6px 0' } }, t('soc.dealsLocked'))));
  }

  /* ── the feed ── */
  const posts = feed();
  wrap.append(el('div.section-head', el('h2', t('soc.feed'))));
  if (!posts.length){
    wrap.append(el('div.empty', el('span.big', '📷'), t('soc.feedEmpty')));
  } else {
    for (const p of posts) wrap.append(postCard(p));
  }

  host.append(wrap);

  // likes keep landing while she is looking at the page
  clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (!document.body.contains(wrap)){ clearInterval(tickTimer); return; }
    const got = tickSocial();
    if (!got.likes) return;
    for (const p of feed()){
      const n = $('#lk-' + p.id);
      if (n) n.textContent = fmt(p.likes);
    }
    const f = $('#followerNum');
    if (f) f.textContent = fmt(followers());
    if (got.viral.length) celebrateViral(got.viral[0]);
  }, 8000);

  return () => clearInterval(tickTimer);
}

/* ══════════════ follower wishes ══════════════ */

function wishRow(w){
  const candy = getCandy(w.candy);
  const deco = w.deco ? getDeco(w.deco) : null;
  const bits = [
    tName('colorAdj', w.color, getColor(w.color).name.toLowerCase()),
    tName('candy', w.candy, candy.name).toLowerCase(),
  ];
  const ask = deco
    ? t('soc.wishWith', { what: bits.join(' '), deco: tName('deco', w.deco, deco.name).toLowerCase() })
    : t('soc.wishPlain', { what: bits.join(' ') });

  return el('div.deal',
    el('div.deal-ico', w.face),
    el('div.grow',
      el('b', { style:{ fontSize:'13px', fontWeight:'800' } }, w.name),
      el('div.tiny', { style:{ marginTop:'2px', fontStyle:'italic' } }, '“' + ask + '”'),
      el('div.tiny', { style:{ marginTop:'3px', fontWeight:'800', color:'#c98f14' } },
        `🪙 ${fmt(w.reward.coins)} · 👥 +${fmt(w.reward.followers)}`),
    ),
    el('div', { style:{ display:'flex', flexDirection:'column', gap:'5px' } },
      el('button.upg-buy', { onclick: () => startWish(w) }, t('soc.wishMake')),
      el('button.upg-sell', { onclick: () => {
        dropWish(w.id); sfx('remove'); toast(t('soc.wishSkipped'), '', '💬'); go('social');
      }}, '🚫'),
    ),
  );
}

function startWish(wish){
  import('./shopScreen.js').then(({ startFollowerWish }) => startFollowerWish(wish));
}

/** Called by the shop screen once a wish has been made. */
export function finishFollowerWish(wish, stars, design, onDone){
  const got = finishWish(wish, stars);
  sfx('sparkle'); confetti(34);

  const cv = el('canvas', { width:300, height:300, style:{
    width:'128px', height:'128px', margin:'0 auto', display:'block',
  }});
  drawDesign(cv.getContext('2d'), 300, design, 0);

  openModal({
    icon: wish.face,
    title: t('soc.wishDoneTitle', { name: wish.name }),
    sub: t('soc.wishDoneSub'),
    body:[cv, el('div.reward-row', { style:{ marginTop:'8px' } },
      el('div.reward', '🪙 +' + fmt(got.coins)),
      el('div.reward.xp', '👥 +' + fmt(got.followers)),
    )],
    dismissable:false,
    actions:[{ label:t('soc.dealDoneOk'), cls:'grape', onClick: () => onDone?.() }],
  });
}

/* ══════════════ the feed ══════════════ */

function postCard(p){
  const cv = el('canvas', { width:320, height:320, class:'post-art' });
  drawPhoto(cv.getContext('2d'), 320, p.design, 0, { backdrop: p.backdrop, frame: p.frame });

  const comments = el('div.post-comments');
  for (const c of p.comments.slice(0, 4)){
    comments.append(el('div.post-comment',
      el('span.pc-face', c.face),
      el('span.pc-name', c.name),
      el('span.pc-text', t(c.key)),
    ));
  }

  return el('div.post' + (p.viral ? '.viral' : ''),
    p.viral ? el('div.post-viral', '🔥 ' + t('soc.viral')) : null,
    el('div.post-head',
      el('span.post-avatar', '🧁'),
      el('span.post-shop', S.shopName),
      el('span.spacer'),
      el('button.post-del', { onclick: () => askDelete(p) }, '🗑'),
    ),
    el('div.post-frame', cv),
    el('div.post-meta',
      el('span.post-likes', '❤️ ', el('b', { id:'lk-' + p.id }, fmt(p.likes))),
      p.gained ? el('span.post-gain', '👥 +' + fmt(p.gained)) : null,
      p.stars ? el('span.post-stars', '⭐'.repeat(p.stars)) : null,
    ),
    p.caption ? el('div.post-caption', p.caption) : null,
    p.tags?.length
      ? el('div.post-tags', ...p.tags.map(tag => el('span', '#' + t('tag.' + tag))))
      : null,
    comments,
  );
}

function askDelete(p){
  confirmModal({
    icon:'🗑', title:t('soc.delTitle'), sub:t('soc.delSub'),
    yes:t('soc.delYes'),
    onYes: () => { deletePost(p.id); sfx('remove'); go('social'); },
  });
}

function celebrateViral(p){
  sfx('perfect'); confetti(70); candyRain(2); haptic([15, 40, 15, 40, 40]);
  const cv = el('canvas', { width:300, height:300, style:{
    width:'132px', height:'132px', margin:'0 auto', display:'block',
  }});
  drawPhoto(cv.getContext('2d'), 300, p.design, 0, { backdrop: p.backdrop, frame: p.frame });
  openModal({
    icon:'🔥', title:t('soc.viralTitle'), sub:t('soc.viralSub'),
    body:[cv, el('p.center', { style:{
      fontSize:'20px', fontWeight:'900', color:'var(--pink-600)', marginTop:'8px',
    }}, `❤️ ${fmt(p.target)}`)],
    actions:[{ label:t('soc.viralOk'), cls:'grape', onClick: () => go('social') }],
  });
}

/* ══════════════ composer ══════════════ */

function openComposer(){
  const photos = S.photos || [];
  if (!photos.length){
    return openModal({
      icon:'📷', title:t('soc.noPhotos'), sub:t('soc.noPhotosSub'),
      actions:[
        { label:t('soc.toFree'), cls:'mint', onClick: () => go('shop') },
        { label:t('coll.close'), cls:'ghost' },
      ],
    });
  }

  let chosen = photos[0];
  let tags = [];
  let backdrop = 'none';
  let frame = 'none';

  /* the shot as it will appear on the feed */
  const preview = el('canvas', { width:420, height:420, class:'compose-preview' });
  const pctx = preview.getContext('2d');
  const paint = () => drawPhoto(pctx, 420, chosen.design, 0, { backdrop, frame });
  paint();

  const grid = el('div.photo-picker');
  const cards = [];
  photos.slice(0, 24).forEach(ph => {
    const cv = el('canvas', { width:150, height:150 });
    drawDesign(cv.getContext('2d'), 150, ph.design, 0);
    const b = el('button.pick' + (ph === chosen ? '.on' : ''), { onclick: () => {
      chosen = ph;
      cards.forEach(c => c.node.classList.toggle('on', c.photo === ph));
      paint(); sfx('tap');
    }}, cv, ph.stars ? el('span.pick-stars', '⭐' + ph.stars) : null);
    cards.push({ node: b, photo: ph });
    grid.append(b);
  });

  /* backdrops + frames — the photo studio */
  const bdBar = el('div.chipbar');
  const bdChips = [];
  for (const b of BACKDROPS){
    const chip = el('button.chip' + (b.id === backdrop ? '.on' : ''), { onclick: () => {
      backdrop = b.id;
      bdChips.forEach(c => c.node.classList.toggle('on', c.id === backdrop));
      paint(); sfx('tap');
    }}, `${b.emoji} ${t('bd.' + b.id)}`);
    bdChips.push({ node: chip, id: b.id });
    bdBar.append(chip);
  }

  const frBar = el('div.chipbar');
  const frChips = [];
  for (const f of FRAMES){
    const chip = el('button.chip' + (f.id === frame ? '.on' : ''), { onclick: () => {
      frame = f.id;
      frChips.forEach(c => c.node.classList.toggle('on', c.id === frame));
      paint(); sfx('tap');
    }}, `${f.emoji} ${t('fr.' + f.id)}`);
    frChips.push({ node: chip, id: f.id });
    frBar.append(chip);
  }

  const caption = el('input.text-field', {
    type:'text', maxlength:60, placeholder:t('soc.captionPlaceholder'),
  });
  const quick = el('div.chipbar');
  for (const k of ['a', 'b', 'c', 'd']){
    const text = t('soc.caption.' + k);
    quick.append(el('button.chip', { onclick: () => {
      caption.value = text; sfx('tap');
    }}, text));
  }

  const tagbar = el('div.chipbar');
  for (const tag of HASHTAGS){
    const chip = el('button.chip', { onclick: () => {
      if (tags.includes(tag)) tags = tags.filter(x => x !== tag);
      else if (tags.length < 3) tags.push(tag);
      else return toast(t('soc.tagMax'), 'warn', '#️⃣');
      chip.classList.toggle('on', tags.includes(tag));
      sfx('tap');
    }}, '#' + t('tag.' + tag));
    tagbar.append(chip);
  }

  const reach = currentReach();

  openModal({
    icon:'📸', title:t('soc.composeTitle'), sub:t('soc.composeSub'),
    body:[
      preview,
      grid,
      el('p.tiny.muted', { style:{ margin:'8px 0 4px' } }, t('soc.pickBackdrop')),
      bdBar,
      el('p.tiny.muted', { style:{ margin:'8px 0 4px' } }, t('soc.pickFrame')),
      frBar,
      el('div', { style:{ padding:'8px 2px 6px' } }, caption),
      quick,
      el('p.tiny.muted', { style:{ margin:'8px 0 4px' } }, t('soc.pickTags')),
      tagbar,
      reach < .9
        ? el('p.tiny.center', { style:{ marginTop:'10px', fontWeight:'900', color:'#c0392b' } },
            t('soc.reachWarn', { n: recentPostCount(), p: Math.round(reach * 100) }))
        : null,
    ],
    actions:[
      { label:t('buy.notNow'), cls:'ghost' },
      { label:t('soc.publish'), cls:'grape', onClick: () => {
        const post = createPost(chosen, { caption: caption.value.trim(), tags, backdrop, frame });
        sfx('sparkle'); haptic([10, 25, 10]); confetti(30);
        toast(t('soc.published'), 'good', '📱');
        setTimeout(() => go('social'), 120);
        if (post.viral) setTimeout(() => celebrateViral(post), 900);
      }},
    ],
  });
}

/* ══════════════ brand deals ══════════════ */

function dealRow(d){
  const candy = getCandy(d.candy);
  return el('div.deal',
    el('div.deal-ico', d.emoji),
    el('div.grow',
      el('b', { style:{ fontSize:'13.5px', fontWeight:'800' } }, t('brand.' + d.brand)),
      el('div.tiny.muted', { style:{ marginTop:'2px' } },
        t('soc.dealAsk', { candy: tName('candy', d.candy, candy.name) })),
      el('div.tiny', { style:{ marginTop:'3px', fontWeight:'800', color:'#c98f14' } },
        `🪙 ${fmt(d.reward.coins)} · 💎 ${d.reward.gems} · 👥 +${fmt(d.reward.followers)}`),
      el('div.tiny.muted', { style:{ marginTop:'2px' } }, '#' + t('tag.' + d.tag)),
    ),
    el('button.upg-buy', { onclick: () => startDeal(d) }, t('soc.dealMake')),
  );
}

function startDeal(deal){
  import('./shopScreen.js').then(({ startBrandDeal }) => startBrandDeal(deal));
}

/** Called by the shop screen once the sponsor's candy has been graded. */
export function finishBrandDeal(deal, stars, design, onDone){
  const got = finishDeal(deal, stars);
  sfx('unlock'); confetti(50);

  const cv = el('canvas', { width:300, height:300, style:{
    width:'128px', height:'128px', margin:'0 auto', display:'block',
  }});
  drawDesign(cv.getContext('2d'), 300, design, 0);

  openModal({
    icon: deal.emoji,
    title: t('soc.dealDoneTitle', { name: t('brand.' + deal.brand) }),
    sub: t('soc.dealDoneSub'),
    body:[cv, el('div.reward-row', { style:{ marginTop:'8px' } },
      el('div.reward', '🪙 +' + fmt(got.coins)),
      got.gems ? el('div.reward.gem', '💎 +' + got.gems) : null,
      el('div.reward.xp', '👥 +' + fmt(got.followers)),
    )],
    dismissable:false,
    actions:[{ label:t('soc.dealDoneOk'), cls:'grape', onClick: () => onDone?.() }],
  });
}

/** Badge for the More hub: deals waiting and posts that went viral. */
export function socialBadge(){
  if (!unlocked()) return 0;
  return (social().deals || []).length;
}
