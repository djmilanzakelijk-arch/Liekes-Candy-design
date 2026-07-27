/* ============================================================
   Localisation — English + Dutch.

   UI strings live in DICT. Content names (candy, decorations,
   colours…) come from the data files in English; NL overrides
   are looked up here by id, so the data stays language-neutral.
   ============================================================ */

const STORE_KEY = 'liekes-candy-design/lang';

export const LANGS = [
  { id:'en', name:'English',    flag:'🇬🇧' },
  { id:'nl', name:'Nederlands', flag:'🇳🇱' },
];

let lang = 'en';

/** Guess from the browser the first time round. */
export function initLang(){
  const saved = localStorage.getItem(STORE_KEY);
  if (saved && DICT[saved]) { lang = saved; return lang; }
  const nav = (navigator.language || 'en').toLowerCase();
  lang = nav.startsWith('nl') ? 'nl' : 'en';
  return lang;
}
export const getLang = () => lang;

/** Anything holding generated text (order lines) re-renders on a change. */
const langListeners = new Set();
export function onLangChange(fn){ langListeners.add(fn); return () => langListeners.delete(fn); }

export function setLang(id){
  if (!DICT[id] || id === lang) return;
  lang = id;
  localStorage.setItem(STORE_KEY, id);
  document.documentElement.lang = id;
  for (const fn of [...langListeners]){
    try { fn(id); } catch (e){ console.error(e); }
  }
}
export const hasChosenLang = () => !!localStorage.getItem(STORE_KEY);

/** t('shop.title') → localised string. Supports {placeholders}. */
export function t(key, vars){
  let s = DICT[lang]?.[key] ?? DICT.en[key] ?? key;
  if (vars){
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

/**
 * Localised content name/description.
 * @param kind 'candy'|'deco'|'pack'|'color'|'colorAdj'|'flavor'|'upgrade'|'location'|'event'|'pers'|'rarity'|'cat'|'mission'|'occasion'
 */
export function tName(kind, id, fallback){
  return NAMES[lang]?.[kind]?.[id] ?? fallback ?? id;
}
export function tDesc(kind, id, fallback){
  return DESCS[lang]?.[kind]?.[id] ?? fallback ?? '';
}

/** Localised random dialogue for a personality bucket. */
export function tLines(persId, bucket, fallback){
  const l = LINES[lang]?.[persId]?.[bucket];
  return l && l.length ? l : fallback;
}

/* ══════════════════════════════════════════════════════
   UI strings
   ══════════════════════════════════════════════════════ */
const DICT = {
  en: {
    /* boot */
    'boot.1':'Warming up the chocolate…',
    'boot.2':'Polishing the sprinkles…',
    'boot.3':'Tying tiny ribbons…',
    'boot.4':'Dusting the glitter…',
    'boot.5':'Opening the shutters…',
    'boot.fail':'Something went wrong loading the shop.',

    /* tabs */
    'tab.shop':'Shop', 'tab.store':'Store', 'tab.play':'Play',
    'tab.book':'Book', 'tab.more':'More',

    /* shop screen */
    'shop.customers':'Customers',
    'shop.waiting':'{n} waiting',
    'shop.nobody':'The shop is empty — new customers are on their way!',
    'shop.special':'Daily Special',
    'shop.specialSub':'Bigger reward',
    'shop.specialBtn':'🌟 Take the special order',
    'shop.specialDone':'Already served today — come back tomorrow!',
    'shop.ways':'Ways to play',
    'shop.stats':'Shop stats',
    'shop.tapCustomer':'Tap a customer to take their order',
    'stat.orders':'Orders', 'stat.five':'5-star', 'stat.best':'Best streak',
    'stat.perfect':'Perfect', 'stat.earned':'Coins earned', 'stat.satisfaction':'Satisfaction',
    'stat.served':'Served', 'stat.avg':'Avg stars', 'stat.coins':'Coins',
    'stat.level':'Level',

    /* modes */
    'mode.endless':'Endless', 'mode.endlessSub':'Unlimited customers, no pressure',
    'mode.speed':'Speed', 'mode.speedSub':'Race the clock for combo coins',
    'mode.challenge':'Challenge', 'mode.challengeSub':'Very fussy, very detailed orders',
    'mode.free':'Free Design', 'mode.freeSub':'Decorate with zero rules',
    'mode.locked':'Level {n}',
    'mode.endlessTitle':'Endless Mode', 'mode.endlessBlurb':'Serve as many customers as you like. Leave any time.',
    'mode.speedTitle':'Speed Mode', 'mode.speedBlurb':'Half the patience, double the rush. How far can you get?',
    'mode.challengeTitle':'Challenge Mode', 'mode.challengeBlurb':'Maximum-detail orders from the fussiest customers alive.',
    'mode.start':'Start', 'mode.notNow':'Not now',
    'mode.next':'Next customer', 'mode.end':'End run',
    'mode.record':'New record!', 'mode.finished':'Run finished',
    'mode.back':'Back to shop',

    /* studio */
    'studio.free':'Free design',
    'studio.freeSub':'Make anything you like — then save it to Photo Mode.',
    'studio.hint':'Drag decorations onto the candy',
    'studio.undo':'↩︎ Undo', 'studio.clear':'🧹 Clear',
    'studio.serve':'✓ Serve', 'studio.save':'📸 Save',
    'studio.tab.candy':'Candy', 'studio.tab.color':'Colour', 'studio.tab.flavor':'Flavour',
    'studio.tab.pack':'Wrap', 'studio.tab.text':'Text',
    'studio.textPlaceholder':'Write something sweet…',
    'studio.textHint':'Up to 16 characters — it is piped onto the candy.',
    'studio.nothingUndo':'Nothing to undo',
    'studio.clearTitle':'Clear the candy?',
    'studio.clearSub':'Every decoration will be removed.',
    'studio.clearYes':'Clear',
    'studio.leaveTitle':'Leave the table?',
    'studio.leaveSub':'This order will be lost.',
    'studio.leaveYes':'Leave',
    'studio.tableFull':'Table is full ({n}) — upgrade the Decoration Table',
    'studio.tapToPlace':'Now tap the candy to place it',
    'studio.orderOf':"{name}'s order",
    'studio.gotIt':'Got it',
    'studio.savedPhoto':'Saved to Photo Mode',

    /* locks / purchases */
    'lock.level':'Unlocks at level {n}',
    'lock.candyLevel':'Reach level {n} to unlock {name}',
    'buy.title':'Buy {name}?',
    'buy.confirm':'Buy it',
    'buy.notNow':'Not now',
    'buy.noCoins':'Not enough coins',
    'buy.noGems':'Not enough gems',
    'buy.noFunds':'Not enough funds',
    'buy.unlocked':'{name} unlocked!',

    /* result */
    'res.served':'Order served', 'res.perfect':'Perfect order!',
    'res.walkedOut':'They walked out',
    'res.walkedLine':'I waited too long… I have to go.',
    'res.next':'Next', 'res.save':'📸 Save',
    'res.combo':'🔥 {n}× perfect streak — +{p}% bonus!',
    'part.candy':'Candy', 'part.color':'Colour', 'part.deco':'Decorations',
    'part.pack':'Packaging', 'part.text':'Message', 'part.tidy':'Tidiness',
    'res.tip':'tip',

    /* store */
    'store.title':'🛒 Store',
    'store.decorations':'✨ Decorations', 'store.packaging':'🎁 Packaging',
    'store.upgrades':'🏪 Upgrades', 'store.locations':'🌍 Locations',
    'store.all':'All', 'store.owned':'✅ Owned',
    'store.ownedTag':'✓ Owned',
    'store.empty':'Nothing here yet.',
    'store.eventTitle':'{name} exclusives',
    'store.eventSub':'Only available while the event runs!',
    'store.upgradeIntro':'Every upgrade permanently improves your shop.',
    'store.notInstalled':'Not installed',
    'store.max':'MAX',
    'store.upgradeTitle':'Upgrade {name}?',
    'store.upgradeSub':'Level {a} → {b} · 🪙 {cost}',
    'store.upgradeYes':'Upgrade',
    'store.upgradeDone':'{name} is now level {n}!',
    'store.newDeco':'New decoration!',
    'store.lovely':'Lovely!',
    'store.here':'📍 Here', 'store.move':'Move',
    'store.moveDone':'Now trading in {name}',
    'store.openTitle':'Open in {name}?',
    'store.openYes':'Open shop',
    'store.openedTitle':'New shop opened!',
    'store.amazing':'Amazing!',
    'store.payout':'💰 ×{n} payout',
    'store.value':'+{n}% value',

    /* collection */
    'coll.title':'📖 Collection Book',
    'coll.collected':'{a} of {b} collected',
    'coll.hint':'Buy decorations and level up to fill the book.',
    'coll.everything':'Everything', 'coll.candy':'🍬 Candy', 'coll.packs':'🎁 Wraps',
    'coll.notYet':'Not collected yet',
    'coll.keepPlaying':'Keep playing to discover this one.',
    'coll.unlockLevel':' · unlocks at level {n}',
    /* candy tools */
    'studio.tab.tools':'Tools',
    'studio.noTools':'This candy has no special tools.',
    'studio.toolOff':'None',
    'studio.toastLight':'Light', 'studio.toastMed':'Golden', 'studio.toastDark':'Dark',
    'studio.dipTip':'Just the tip', 'studio.dipHalf':'Half', 'studio.dipDeep':'Deep',
    'part.tools':'Tools',
    'tool.toast1':'lightly toasted', 'tool.toast2':'golden toasted', 'tool.toast3':'deeply toasted',
    'tool.tip':'just dipped', 'tool.half':'half dipped', 'tool.deep':'deeply dipped',
    'tool.dipPhrase':'{depth} in {color} chocolate',
    'tool.clause.fill':'filled with {v}',
    'tool.clause.dip':'{v}',
    'tool.clause.toast':'{v}',
    'tool.clause.dust':'dusted with {v}',
    'tool.clause.marble':'marbled with {v}',
    'tool.clause.swirl':'topped with {v} cream',

    /* staff morale + raises */
    'staff.morale':'Mood',
    'morale.great':'thriving', 'morale.good':'happy', 'morale.okay':'so-so',
    'morale.low':'unhappy', 'morale.awful':'miserable',
    'staff.raiseTitle':'Give {name} a raise?',
    'staff.raiseSub':'A one-off 🪙 {n}. Permanently better output and a big mood lift.',
    'staff.raiseYes':'Give the raise',
    'staff.raiseDone':'{name} is thrilled with the raise!',
    'staff.raiseMax':'TOP PAY',

    /* staff incidents */
    'sev.sub':'Your call, boss.',
    'sev.quit':'{name} handed in their apron and walked out.',
    'sev.cantafford':'You could not pay — {name} took it badly.',

    'sev.raise.title':'{name} wants a raise',
    'sev.raise.text':'"I have been putting in the hours and the shop is doing well. Any chance of a little more?"',
    'sev.raise.give':'Give the raise',
    'sev.raise.promise':'Promise to think about it',
    'sev.raise.refuse':'Say no',

    'sev.atecandy.title':'{name} ate the merchandise',
    'sev.atecandy.text':'"So… that lollipop for table three. It was RIGHT there. I only meant to taste it."',
    'sev.atecandy.laugh':'Laugh it off',
    'sev.atecandy.notip':'No tips this shift',
    'sev.atecandy.warn':'Formal warning',
    'sev.atecandy.fire':'Fire them',

    'sev.late.title':'{name} is late again',
    'sev.late.text':'"The tram, the weather, my alarm… honestly it was all three this time."',
    'sev.late.forgive':'Let it slide',
    'sev.late.docked':'Dock the hours',
    'sev.late.warn':'Formal warning',

    'sev.sick.title':'{name} is off sick',
    'sev.sick.text':'"I can barely stand up. I really do not want to sneeze near the truffles."',
    'sev.sick.paid':'Pay sick leave',
    'sev.sick.unpaid':'Unpaid — rules are rules',

    'sev.greatday.title':'{name} had a brilliant shift',
    'sev.greatday.text':'Three customers asked for them by name today. The queue never stopped smiling.',
    'sev.greatday.bonus':'Hand out a bonus',
    'sev.greatday.praise':'Praise them warmly',
    'sev.greatday.nothing':'Say nothing',

    'sev.poached.title':'Somebody wants to poach {name}',
    'sev.poached.text':'"The shop across the square offered me more. I would rather stay here, though…"',
    'sev.poached.counter':'Counter-offer',
    'sev.poached.letgo':'Wish them luck',

    'sev.brokemould.title':'{name} broke a mould',
    'sev.brokemould.text':'"It slipped. It was the good heart mould. I am so sorry."',
    'sev.brokemould.nevermind':'Accidents happen',
    'sev.brokemould.paydamage':'They pay for it',
    'sev.brokemould.warn':'Formal warning',

    'sev.timeoff.title':'{name} asks for a day off',
    'sev.timeoff.text':'"My sister is getting married. I would only need the one day, I promise."',
    'sev.timeoff.grant':'Of course — go',
    'sev.timeoff.deny':'Not this week',

    'sev.tastetest.title':'{name} wants to taste-test',
    'sev.tastetest.text':'"How am I supposed to recommend the pistachio filling if I have never tried it?"',
    'sev.tastetest.allow':'One piece a day',
    'sev.tastetest.nomore':'Absolutely not',
    /* moving to another address */
    'mv.button':'📦 Move my shop',
    'mv.buttonHint':'Carries your whole shop to another web address or another phone.',
    'mv.title':'Move your shop',
    'mv.sub':'Progress is stored per web address, so it needs carrying over.',
    'mv.step1':'Paste the address of the new site:',
    'mv.makeLink':'🔗 Create transfer link',
    'mv.linkReady':'Open this link on the device you want your shop on:',
    'mv.linkNote':'The link contains your whole shop. Saved photos are left behind to keep it short.',
    'mv.copy':'Copy link', 'mv.share':'Share',
    'mv.copied':'Link copied', 'mv.copyManual':'Select the text and copy it',
    'mv.needUrl':'Fill in the new address first',
    'mv.encodeFail':'Could not pack your save',
    'mv.fileIntro':'Or keep a backup file — works without any internet:',
    'mv.saveFile':'💾 Save file', 'mv.loadFile':'📂 Load file',
    'mv.fileSaved':'Backup saved', 'mv.badFile':'That file was not a save',
    'mv.close':'Close',
    'mv.incomingTitle':'A shop arrived!',
    'mv.incomingSub':'This link is carrying somebody\'s progress.',
    'mv.overwriteWarn':'Installing it replaces the shop you already have here.',
    'mv.keepMine':'Keep mine', 'mv.installIt':'Install it',
    'mv.aShop':'A candy shop',
    'mv.decos':'Decorations',
    'mv.doneTitle':'Shop restored!',
    'mv.doneSub':'Everything is back where it belongs.',
    'mv.reload':'Play',
    'mv.badLink':'That link or code was not readable',
    'mv.bannerTitle':'This shop is moving',
    'mv.bannerBody':'Tap to take your progress to the new address.',
    'mv.bannerGo':'Move',
    'set.exportHint':'Tap Copy, then paste the code somewhere safe — a note to yourself works fine.',
    'set.saveFile':'💾 Save as file',
    'set.paste':'📋 Paste from clipboard',
    'set.pasted':'Pasted',
    'set.clipEmpty':'Your clipboard was empty',
    'set.pasteManual':'Long-press the box and choose Paste',
    'set.importHint':'A code or a full transfer link both work.',
    'set.importEmpty':'Paste your code first',
    'set.importedSub':'Level {n} restored. Tap to play.',
    'studio.pipeHint':'👆 Drag across the candy to pipe cream',
    'studio.wipeCream':'🧽 Wipe cream',
    'studio.nozzleS':'Thin', 'studio.nozzleM':'Medium', 'studio.nozzleL':'Thick',
    'studio.tooMuchCream':'That is a lot of cream — wipe some first',
    'store.manageStaff':'👥 Manage employees',
    'coll.close':'Close',
    'coll.rewardOnly':' · level reward',
    'coll.rewardHint':'Only found in the pick-2 grid you open when you level up.',

    /* studio */
    'studio.tapDetails':'tap for details ›',

    /* level-up reward grid */
    'lr.title':'Level {n} reward',
    'lr.sub':'Pick 2 cards — keep whatever is underneath!',
    'lr.possible':'Possible prizes',
    'lr.picks':'{n} pick(s) left',
    'lr.done':'Nice choices!',
    'lr.collect':'Collect',
    'lvl.reward':'Open reward →',

    /* staff */
    'more.staff':'Employees',
    'more.staffSub':'{a} of {b} hired',
    'staff.title':'Employees',
    'staff.yourTeam':'Your team',
    'staff.applicants':'Applicants',
    'staff.refresh':'New every day',
    'staff.noApplicants':'Nobody applied today. Try a reroll!',
    'staff.reroll':'🔄 New applicants (🪙 {n})',
    'staff.emptySlot':'Empty slot — hire someone below',
    'staff.noSlots':'You have no employee slots yet. Buy the Employee upgrade in the store to open one.',
    'staff.goStore':'🛒 To the store',
    'staff.moreSlots':'Upgrade "Employee" in the store for another slot.',
    'staff.slotsUsed':'{a}/{b} slots',
    'staff.teamBonus':'Team bonus',
    'staff.perHour':'Idle / hour',
    'staff.tips':'Tips',
    'staff.patience':'Patience',
    'staff.hire':'Hire',
    'staff.fire':'Fire',
    'staff.hireTitle':'Hire {name}?',
    'staff.hired':'{name} joined the team!',
    'staff.fireTitle':'Let {name} go?',
    'staff.fireSub':'The slot opens up again, but the signing fee is not refunded.',
    'staff.fireYes':'Let them go',
    'staff.fired':'{name} left the shop.',
    'staff.fullWarn':'All slots are full — fire someone first.',
    'staff.cantAfford':'Not enough coins',
    'staff.legendTitle':'⭐ A legend is in town!',
    'staff.legendBody':'{name} is passing through and will take a job — but not for long.',
    'staff.tip':'Stars show overall quality. Traits can help or hurt: fire anyone who is not pulling their weight.',
    'staff.tier.rookie':'Rookie',
    'staff.tier.skilled':'Skilled',
    'staff.tier.expert':'Expert',
    'staff.tier.legend':'Legend',
    'trait.earlybird':'Early bird',
    'trait.charmer':'Charmer',
    'trait.zen':'Zen',
    'trait.tidy':'Tidy',
    'trait.quickhands':'Quick hands',
    'trait.clumsy':'Clumsy',
    'trait.moody':'Moody',
    'trait.sweettooth':'Sweet tooth',
    'trait.late':'Always late',
    'coll.new':'NEW',

    /* missions */
    'mis.title':'Missions',
    'mis.today':'Today', 'mis.resets':'Resets at midnight',
    'mis.career':'Career milestones',
    'mis.claim':'Claim',
    'mis.complete':'Mission complete: {text}',
    'mis.milestone':'Milestone reached: {text}',
    'mis.reward':'+{coins} coins{gems}',

    /* more hub */
    'more.title':'✨ More',
    'more.missions':'Missions', 'more.missionsSub':'{n} ready',
    'more.daily':'Daily Reward', 'more.dailyClaim':'Claim now!', 'more.dailyStreak':'Streak {n}',
    'more.photos':'Photo Mode', 'more.photosSub':'{n} saved',
    'more.leaderboard':'Leaderboards', 'more.leaderboardSub':'Compare your shop',
    'more.events':'Events', 'more.eventsSub':'See the calendar',
    'more.settings':'Settings', 'more.settingsSub':'Sound, music, language',
    'more.rename':'✏️ Rename shop',
    'more.renameTitle':'Rename your shop',
    'more.renamed':'Shop renamed!',
    'more.xpTo':'{a} / {b} XP to level {n}',
    'more.cancel':'Cancel', 'more.save':'Save',

    /* daily */
    'daily.title':'Daily Reward',
    'daily.streak':'{n}-day streak',
    'daily.ready':'Reward ready!', 'daily.tomorrow':'Come back tomorrow',
    'daily.day':'Day {n}',
    'daily.claimBtn':'🎁 Claim day {n}',
    'daily.claimed':'Already claimed today — see you tomorrow!',
    'daily.keepTitle':'Keep the streak alive',
    'daily.keepText':'Log in every day to climb the ladder. Day 7 always gives a mystery box — and the ladder restarts richer.',
    'daily.rewardTitle':'Day {n} reward!',
    'daily.rewardSub':'{n}-day streak — keep it up!',
    'daily.thanks':'Thanks!',
    'daily.coins':'+{n} coins', 'daily.gems':'+{n} gems',
    'daily.ribbon':'Ribbon', 'daily.mystery':'Mystery',

    /* photos */
    'photo.title':'Photo Mode',
    'photo.empty':'No creations saved yet.',
    'photo.emptyHint':'Save a candy after serving, or from Free Design.',
    'photo.openFree':'🎨 Open Free Design',
    'photo.madeFor':'Made for {name}',
    'photo.freeDesign':'Free design',
    'photo.download':'⬇️ Download', 'photo.delete':'🗑 Delete',
    'photo.saved':'Image saved',
    'photo.exportFail':'Could not export the image',
    'photo.deleteTitle':'Delete this photo?',
    'photo.deleteYes':'Delete',

    /* leaderboard */
    'lb.title':'Leaderboards',
    'lb.level':'Shop level', 'lb.streak':'Best decorating streak', 'lb.endless':'Endless run',
    'lb.note':'Rival shops are simulated locally — no account needed.',

    /* events */
    'ev.title':'Events',
    'ev.live':'{name} — live now!',
    'ev.liveTag':'LIVE',
    'ev.bonus':'+{n}% coins · {c} exclusive decorations',
    'ev.toast':'{name} is live — exclusive decorations in the store!',

    /* settings */
    'set.title':'Settings',
    'set.language':'Language',
    'set.music':'Music', 'set.sfx':'Sound effects',
    'set.haptics':'Vibration', 'set.hints':'Show hints', 'set.volume':'Volume',
    'set.data':'Your data',
    'set.dataText':'Progress is saved on this device only. Clearing browser data erases it.',
    'set.export':'⬆️ Export', 'set.import':'⬇️ Import',
    'set.reset':'🗑 Reset all progress',
    'set.aboutText':'A cosy candy decorating shop. Every candy, decoration and shop is drawn live on canvas — no image files at all.',
    'set.tipText':'Tip: hold and drag decorations to move them, tap to select, then resize or rotate.',
    'set.exportTitle':'Export save', 'set.exportSub':'Copy this code and keep it somewhere safe.',
    'set.copy':'Copy', 'set.copied':'Copied!', 'set.copyManual':'Select and copy manually',
    'set.done':'Done',
    'set.importTitle':'Import save', 'set.importSub':'This overwrites your current progress.',
    'set.importBtn':'Import', 'set.importPlaceholder':'Paste your save code…',
    'set.importBad':'That code did not look right',
    'set.exportFail':'Export failed',
    'set.resetTitle':'Reset everything?',
    'set.resetSub':'All coins, decorations and progress will be permanently deleted.',
    'set.resetYes':'Delete it all',
    'set.freshStart':'Fresh start!',

    /* level up */
    'lvl.title':'Level {n}!',
    'lvl.sub':'Your shop is growing. New content is now available.',
    'lvl.newCandy':'New candy unlocked:',
    'lvl.nice':'Nice!',

    /* idle */
    'idle.title':'While you were away',
    'idle.sub':'Your employee kept the shop running.',
    'idle.collect':'Collect',

    /* misc toasts */
    'toast.coins':'Earn coins by serving customers and finishing missions',
    'toast.gems':'Gems come from perfect orders, daily rewards and mystery boxes',
    'toast.tired':'A customer got tired of waiting…',
    'toast.langChanged':'Language changed to English',

    /* tutorial */
    'tut.1.t':"Welcome to Lieke's Candy Design!",
    'tut.1.b':'You run a candy decorating shop. Customers walk in with very specific requests — your job is to make exactly what they asked for.',
    'tut.2.t':'Pick a customer',
    'tut.2.b':'Tap any customer — in the shop or in the list — to take their order. Watch their patience bar: the faster you finish, the better your stars and tips.',
    'tut.3.t':'Decorate by dragging',
    'tut.3.b':'Choose the candy, its colour and flavour, then drag decorations straight onto it. Tap a decoration to resize, rotate or delete it.',
    'tut.4.t':'Earn 5 stars',
    'tut.4.b':'Stars come from accuracy — right candy, right colour, right decorations, right wrapping — plus speed. Perfect orders build a combo streak.',
    'tut.5.t':'Grow your shop',
    'tut.5.b':'Spend coins on new decorations, shop upgrades and whole new locations. Fill the collection book and complete daily missions!',
    'tut.next':'Next', 'tut.back':'Back', 'tut.go':"Let's go!",

    /* language picker */
    'lang.title':'Choose your language',
    'lang.sub':'You can change this any time in Settings.',

    /* order sentence bits */
    'ord.with':'with', 'ord.and':'and', 'ord.in':'in',
    'ord.pipe':'and pipe "{t}" on it',
    'ord.text':'Text: "{t}"',
  },

  nl: {
    'boot.1':'De chocolade smelten…',
    'boot.2':'Sprinkels oppoetsen…',
    'boot.3':'Kleine strikjes knopen…',
    'boot.4':'Glitter uitstrooien…',
    'boot.5':'De winkel openen…',
    'boot.fail':'Er ging iets mis bij het laden van de winkel.',

    'tab.shop':'Winkel', 'tab.store':'Shop', 'tab.play':'Spelen',
    'tab.book':'Boek', 'tab.more':'Meer',

    'shop.customers':'Klanten',
    'shop.waiting':'{n} wachten',
    'shop.nobody':'De winkel is leeg — er komen zo nieuwe klanten aan!',
    'shop.special':'Dagspecial',
    'shop.specialSub':'Grotere beloning',
    'shop.specialBtn':'🌟 Neem de speciale bestelling',
    'shop.specialDone':'Vandaag al gedaan — kom morgen terug!',
    'shop.ways':'Manieren om te spelen',
    'shop.stats':'Winkelstatistieken',
    'shop.tapCustomer':'Tik op een klant om de bestelling aan te nemen',
    'stat.orders':'Bestellingen', 'stat.five':'5 sterren', 'stat.best':'Beste reeks',
    'stat.perfect':'Perfect', 'stat.earned':'Munten verdiend', 'stat.satisfaction':'Tevredenheid',
    'stat.served':'Geholpen', 'stat.avg':'Gem. sterren', 'stat.coins':'Munten',
    'stat.level':'Niveau',

    'mode.endless':'Eindeloos', 'mode.endlessSub':'Onbeperkt klanten, geen stress',
    'mode.speed':'Snelheid', 'mode.speedSub':'Race tegen de klok voor combomunten',
    'mode.challenge':'Uitdaging', 'mode.challengeSub':'Heel kieskeurige, gedetailleerde orders',
    'mode.free':'Vrij ontwerpen', 'mode.freeSub':'Versier zonder regels',
    'mode.locked':'Niveau {n}',
    'mode.endlessTitle':'Eindeloze modus', 'mode.endlessBlurb':'Help zoveel klanten als je wilt. Stop wanneer je wilt.',
    'mode.speedTitle':'Snelheidsmodus', 'mode.speedBlurb':'Half zoveel geduld, dubbel zo spannend. Hoe ver kom jij?',
    'mode.challengeTitle':'Uitdagingsmodus', 'mode.challengeBlurb':'Bestellingen met maximale details van de meest kieskeurige klanten.',
    'mode.start':'Starten', 'mode.notNow':'Nu even niet',
    'mode.next':'Volgende klant', 'mode.end':'Stoppen',
    'mode.record':'Nieuw record!', 'mode.finished':'Ronde afgelopen',
    'mode.back':'Terug naar de winkel',

    'studio.free':'Vrij ontwerp',
    'studio.freeSub':'Maak wat je maar wilt — en bewaar het in de Fotomodus.',
    'studio.hint':'Sleep versieringen op het snoep',
    'studio.undo':'↩︎ Terug', 'studio.clear':'🧹 Wissen',
    'studio.serve':'✓ Afgeven', 'studio.save':'📸 Bewaren',
    'studio.tab.candy':'Snoep', 'studio.tab.color':'Kleur', 'studio.tab.flavor':'Smaak',
    'studio.tab.pack':'Verpakking', 'studio.tab.text':'Tekst',
    'studio.textPlaceholder':'Schrijf iets liefs…',
    'studio.textHint':'Maximaal 16 tekens — het wordt op het snoep gespoten.',
    'studio.nothingUndo':'Niets om ongedaan te maken',
    'studio.clearTitle':'Snoep leegmaken?',
    'studio.clearSub':'Alle versieringen worden verwijderd.',
    'studio.clearYes':'Leegmaken',
    'studio.leaveTitle':'Tafel verlaten?',
    'studio.leaveSub':'Deze bestelling gaat verloren.',
    'studio.leaveYes':'Verlaten',
    'studio.tableFull':'Tafel is vol ({n}) — upgrade de Versiertafel',
    'studio.tapToPlace':'Tik nu op het snoep om te plaatsen',
    'studio.orderOf':'Bestelling van {name}',
    'studio.gotIt':'Begrepen',
    'studio.savedPhoto':'Bewaard in de Fotomodus',

    'lock.level':'Vrij te spelen op niveau {n}',
    'lock.candyLevel':'Bereik niveau {n} om {name} vrij te spelen',
    'buy.title':'{name} kopen?',
    'buy.confirm':'Kopen',
    'buy.notNow':'Nu even niet',
    'buy.noCoins':'Niet genoeg munten',
    'buy.noGems':'Niet genoeg diamanten',
    'buy.noFunds':'Niet genoeg geld',
    'buy.unlocked':'{name} vrijgespeeld!',

    'res.served':'Bestelling geleverd', 'res.perfect':'Perfecte bestelling!',
    'res.walkedOut':'Ze liepen weg',
    'res.walkedLine':'Ik heb te lang gewacht… ik moet gaan.',
    'res.next':'Verder', 'res.save':'📸 Bewaren',
    'res.combo':'🔥 {n}× perfecte reeks — +{p}% bonus!',
    'part.candy':'Snoep', 'part.color':'Kleur', 'part.deco':'Versiering',
    'part.pack':'Verpakking', 'part.text':'Tekst', 'part.tidy':'Netheid',
    'res.tip':'fooi',

    'store.title':'🛒 Shop',
    'store.decorations':'✨ Versieringen', 'store.packaging':'🎁 Verpakking',
    'store.upgrades':'🏪 Upgrades', 'store.locations':'🌍 Locaties',
    'store.all':'Alles', 'store.owned':'✅ In bezit',
    'store.ownedTag':'✓ In bezit',
    'store.empty':'Hier is nog niets.',
    'store.eventTitle':'{name}-exclusieven',
    'store.eventSub':'Alleen te koop tijdens het evenement!',
    'store.upgradeIntro':'Elke upgrade verbetert je winkel voorgoed.',
    'store.notInstalled':'Nog niet geplaatst',
    'store.max':'MAX',
    'store.upgradeTitle':'{name} upgraden?',
    'store.upgradeSub':'Niveau {a} → {b} · 🪙 {cost}',
    'store.upgradeYes':'Upgraden',
    'store.upgradeDone':'{name} is nu niveau {n}!',
    'store.newDeco':'Nieuwe versiering!',
    'store.lovely':'Prachtig!',
    'store.here':'📍 Hier', 'store.move':'Verhuis',
    'store.moveDone':'Je verkoopt nu in {name}',
    'store.openTitle':'Winkel openen in {name}?',
    'store.openYes':'Winkel openen',
    'store.openedTitle':'Nieuwe winkel geopend!',
    'store.amazing':'Geweldig!',
    'store.payout':'💰 ×{n} opbrengst',
    'store.value':'+{n}% waarde',

    'coll.title':'📖 Verzamelboek',
    'coll.collected':'{a} van {b} verzameld',
    'coll.hint':'Koop versieringen en stijg in niveau om het boek te vullen.',
    'coll.everything':'Alles', 'coll.candy':'🍬 Snoep', 'coll.packs':'🎁 Verpakking',
    'coll.notYet':'Nog niet verzameld',
    'coll.keepPlaying':'Blijf spelen om deze te ontdekken.',
    'coll.unlockLevel':' · vanaf niveau {n}',
    /* snoepgereedschap */
    'studio.tab.tools':'Gereedschap',
    'studio.noTools':'Dit snoepje heeft geen speciaal gereedschap.',
    'studio.toolOff':'Geen',
    'studio.toastLight':'Licht', 'studio.toastMed':'Goudbruin', 'studio.toastDark':'Donker',
    'studio.dipTip':'Puntje', 'studio.dipHalf':'Half', 'studio.dipDeep':'Diep',
    'part.tools':'Gereedschap',
    'tool.toast1':'licht gebrand', 'tool.toast2':'goudbruin gebrand', 'tool.toast3':'donker gebrand',
    'tool.tip':'met het puntje', 'tool.half':'half', 'tool.deep':'diep',
    'tool.dipPhrase':'{depth} gedoopt in {color} chocolade',
    'tool.clause.fill':'gevuld met {v}',
    'tool.clause.dip':'{v}',
    'tool.clause.toast':'{v}',
    'tool.clause.dust':'bestrooid met {v}',
    'tool.clause.marble':'gemarmerd met {v}',
    'tool.clause.swirl':'met een toef {v} slagroom',

    /* stemming + loonsverhoging */
    'staff.morale':'Stemming',
    'morale.great':'geweldig', 'morale.good':'blij', 'morale.okay':'gaat wel',
    'morale.low':'ontevreden', 'morale.awful':'balen',
    'staff.raiseTitle':'{name} loonsverhoging geven?',
    'staff.raiseSub':'Eenmalig 🪙 {n}. Blijvend betere prestaties en een flinke stemmingsboost.',
    'staff.raiseYes':'Verhoging geven',
    'staff.raiseDone':'{name} is dolblij met de verhoging!',
    'staff.raiseMax':'TOPLOON',

    /* voorvallen */
    'sev.sub':'Jij beslist, baas.',
    'sev.quit':'{name} heeft het schort ingeleverd en is vertrokken.',
    'sev.cantafford':'Je kon niet betalen — {name} nam dat niet goed op.',

    'sev.raise.title':'{name} wil loonsverhoging',
    'sev.raise.text':'"Ik maak lange dagen en de winkel loopt goed. Kan er iets bij?"',
    'sev.raise.give':'Verhoging geven',
    'sev.raise.promise':'Beloven erover na te denken',
    'sev.raise.refuse':'Nee zeggen',

    'sev.atecandy.title':'{name} heeft de handel opgegeten',
    'sev.atecandy.text':'"Die lolly voor tafel drie… die lág daar gewoon. Ik wilde alleen even proeven."',
    'sev.atecandy.laugh':'Erom lachen',
    'sev.atecandy.notip':'Geen fooi deze dienst',
    'sev.atecandy.warn':'Officiële waarschuwing',
    'sev.atecandy.fire':'Ontslaan',

    'sev.late.title':'{name} is weer te laat',
    'sev.late.text':'"De tram, het weer, mijn wekker… eerlijk gezegd was het alle drie."',
    'sev.late.forgive':'Door de vingers zien',
    'sev.late.docked':'Uren inhouden',
    'sev.late.warn':'Officiële waarschuwing',

    'sev.sick.title':'{name} is ziek',
    'sev.sick.text':'"Ik kan amper staan. Ik wil echt niet naast de truffels gaan niezen."',
    'sev.sick.paid':'Ziekteverlof doorbetalen',
    'sev.sick.unpaid':'Onbetaald — regels zijn regels',

    'sev.greatday.title':'{name} had een topdienst',
    'sev.greatday.text':'Drie klanten vroegen vandaag speciaal naar deze medewerker. De rij bleef lachen.',
    'sev.greatday.bonus':'Bonus uitdelen',
    'sev.greatday.praise':'Hartelijk complimenteren',
    'sev.greatday.nothing':'Niets zeggen',

    'sev.poached.title':'Iemand wil {name} wegkapen',
    'sev.poached.text':'"De winkel aan de overkant biedt meer. Maar ik blijf liever hier…"',
    'sev.poached.counter':'Tegenbod doen',
    'sev.poached.letgo':'Succes wensen',

    'sev.brokemould.title':'{name} brak een mal',
    'sev.brokemould.text':'"Hij gleed uit mijn handen. Het was de mooie hartvorm. Het spijt me echt."',
    'sev.brokemould.nevermind':'Ongelukjes gebeuren',
    'sev.brokemould.paydamage':'Laten betalen',
    'sev.brokemould.warn':'Officiële waarschuwing',

    'sev.timeoff.title':'{name} vraagt een vrije dag',
    'sev.timeoff.text':'"Mijn zus gaat trouwen. Ik heb echt maar die ene dag nodig."',
    'sev.timeoff.grant':'Natuurlijk — ga maar',
    'sev.timeoff.deny':'Deze week niet',

    'sev.tastetest.title':'{name} wil proeven',
    'sev.tastetest.text':'"Hoe moet ik de pistachevulling aanraden als ik hem nooit geproefd heb?"',
    'sev.tastetest.allow':'Eén stukje per dag',
    'sev.tastetest.nomore':'Absoluut niet',
    /* verhuizen naar een ander adres */
    'mv.button':'📦 Mijn winkel verhuizen',
    'mv.buttonHint':'Neemt je hele winkel mee naar een ander webadres of een andere telefoon.',
    'mv.title':'Winkel verhuizen',
    'mv.sub':'Voortgang wordt per webadres bewaard, dus die moet je meenemen.',
    'mv.step1':'Plak het adres van de nieuwe site:',
    'mv.makeLink':'🔗 Verhuislink maken',
    'mv.linkReady':'Open deze link op het apparaat waar je winkel naartoe moet:',
    'mv.linkNote':'De link bevat je hele winkel. Opgeslagen foto\'s blijven achter om hem kort te houden.',
    'mv.copy':'Link kopiëren', 'mv.share':'Delen',
    'mv.copied':'Link gekopieerd', 'mv.copyManual':'Selecteer de tekst en kopieer hem',
    'mv.needUrl':'Vul eerst het nieuwe adres in',
    'mv.encodeFail':'Kon je opslag niet inpakken',
    'mv.fileIntro':'Of bewaar een back-upbestand — werkt ook zonder internet:',
    'mv.saveFile':'💾 Bestand opslaan', 'mv.loadFile':'📂 Bestand laden',
    'mv.fileSaved':'Back-up opgeslagen', 'mv.badFile':'Dat bestand was geen opslag',
    'mv.close':'Sluiten',
    'mv.incomingTitle':'Er is een winkel aangekomen!',
    'mv.incomingSub':'Deze link draagt iemands voortgang mee.',
    'mv.overwriteWarn':'Installeren vervangt de winkel die je hier al hebt.',
    'mv.keepMine':'Mijne houden', 'mv.installIt':'Installeren',
    'mv.aShop':'Een snoepwinkel',
    'mv.decos':'Versieringen',
    'mv.doneTitle':'Winkel hersteld!',
    'mv.doneSub':'Alles staat weer waar het hoort.',
    'mv.reload':'Spelen',
    'mv.badLink':'Die link of code was niet leesbaar',
    'mv.bannerTitle':'Deze winkel verhuist',
    'mv.bannerBody':'Tik om je voortgang mee te nemen naar het nieuwe adres.',
    'mv.bannerGo':'Verhuizen',
    'set.exportHint':'Tik op Kopiëren en plak de code ergens veilig — een notitie aan jezelf is prima.',
    'set.saveFile':'💾 Opslaan als bestand',
    'set.paste':'📋 Plakken vanaf klembord',
    'set.pasted':'Geplakt',
    'set.clipEmpty':'Je klembord was leeg',
    'set.pasteManual':'Houd het vak ingedrukt en kies Plakken',
    'set.importHint':'Een code of een complete verhuislink werkt allebei.',
    'set.importEmpty':'Plak eerst je code',
    'set.importedSub':'Level {n} hersteld. Tik om te spelen.',
    'studio.pipeHint':'👆 Sleep over het snoep om te spuiten',
    'studio.wipeCream':'🧽 Room weghalen',
    'studio.nozzleS':'Dun', 'studio.nozzleM':'Normaal', 'studio.nozzleL':'Dik',
    'studio.tooMuchCream':'Dat is veel room — haal er eerst wat weg',
    'store.manageStaff':'👥 Medewerkers beheren',
    'coll.close':'Sluiten',
    'coll.rewardOnly':' · levelbeloning',
    'coll.rewardHint':'Alleen te vinden in het kies-2 vakjesspel bij een nieuw level.',

    /* studio */
    'studio.tapDetails':'tik voor details ›',

    /* level-up reward grid */
    'lr.title':'Beloning level {n}',
    'lr.sub':'Kies 2 vakjes — wat eronder zit is voor jou!',
    'lr.possible':'Mogelijke prijzen',
    'lr.picks':'Nog {n} keuze(s)',
    'lr.done':'Mooie keuzes!',
    'lr.collect':'Ophalen',
    'lvl.reward':'Beloning openen →',

    /* medewerkers */
    'more.staff':'Medewerkers',
    'more.staffSub':'{a} van {b} in dienst',
    'staff.title':'Medewerkers',
    'staff.yourTeam':'Jouw team',
    'staff.applicants':'Sollicitanten',
    'staff.refresh':'Elke dag nieuw',
    'staff.noApplicants':'Vandaag niemand gesolliciteerd. Probeer opnieuw!',
    'staff.reroll':'🔄 Nieuwe sollicitanten (🪙 {n})',
    'staff.emptySlot':'Lege plek — neem hieronder iemand aan',
    'staff.noSlots':'Je hebt nog geen medewerkersplek. Koop de upgrade "Medewerker" in de winkel.',
    'staff.goStore':'🛒 Naar de winkel',
    'staff.moreSlots':'Upgrade "Medewerker" in de winkel voor nog een plek.',
    'staff.slotsUsed':'{a}/{b} plekken',
    'staff.teamBonus':'Teambonus',
    'staff.perHour':'Munten / uur',
    'staff.tips':'Fooi',
    'staff.patience':'Geduld',
    'staff.hire':'Aannemen',
    'staff.fire':'Ontslaan',
    'staff.hireTitle':'{name} aannemen?',
    'staff.hired':'{name} komt bij het team!',
    'staff.fireTitle':'{name} ontslaan?',
    'staff.fireSub':'De plek komt weer vrij, maar je krijgt het aanneemgeld niet terug.',
    'staff.fireYes':'Ontslaan',
    'staff.fired':'{name} heeft de winkel verlaten.',
    'staff.fullWarn':'Alle plekken zijn vol — ontsla eerst iemand.',
    'staff.cantAfford':'Niet genoeg munten',
    'staff.legendTitle':'⭐ Er is een legende in de stad!',
    'staff.legendBody':'{name} is op doorreis en wil werken — maar niet lang.',
    'staff.tip':'De sterren tonen de kwaliteit. Eigenschappen helpen of werken tegen: ontsla gerust wie slecht presteert.',
    'staff.tier.rookie':'Beginner',
    'staff.tier.skilled':'Ervaren',
    'staff.tier.expert':'Expert',
    'staff.tier.legend':'Legende',
    'trait.earlybird':'Vroege vogel',
    'trait.charmer':'Charmeur',
    'trait.zen':'Zen',
    'trait.tidy':'Netjes',
    'trait.quickhands':'Snelle handen',
    'trait.clumsy':'Onhandig',
    'trait.moody':'Chagrijnig',
    'trait.sweettooth':'Snoept mee',
    'trait.late':'Altijd te laat',
    'coll.new':'NIEUW',

    'mis.title':'Missies',
    'mis.today':'Vandaag', 'mis.resets':'Wordt om middernacht vernieuwd',
    'mis.career':'Mijlpalen',
    'mis.claim':'Ophalen',
    'mis.complete':'Missie voltooid: {text}',
    'mis.milestone':'Mijlpaal bereikt: {text}',
    'mis.reward':'+{coins} munten{gems}',

    'more.title':'✨ Meer',
    'more.missions':'Missies', 'more.missionsSub':'{n} klaar',
    'more.daily':'Dagbeloning', 'more.dailyClaim':'Nu ophalen!', 'more.dailyStreak':'Reeks {n}',
    'more.photos':'Fotomodus', 'more.photosSub':'{n} bewaard',
    'more.leaderboard':'Ranglijsten', 'more.leaderboardSub':'Vergelijk je winkel',
    'more.events':'Evenementen', 'more.eventsSub':'Bekijk de kalender',
    'more.settings':'Instellingen', 'more.settingsSub':'Geluid, muziek, taal',
    'more.rename':'✏️ Winkel hernoemen',
    'more.renameTitle':'Geef je winkel een naam',
    'more.renamed':'Winkel hernoemd!',
    'more.xpTo':'{a} / {b} XP tot niveau {n}',
    'more.cancel':'Annuleren', 'more.save':'Opslaan',

    'daily.title':'Dagbeloning',
    'daily.streak':'Reeks van {n} dagen',
    'daily.ready':'Beloning klaar!', 'daily.tomorrow':'Kom morgen terug',
    'daily.day':'Dag {n}',
    'daily.claimBtn':'🎁 Haal dag {n} op',
    'daily.claimed':'Vandaag al opgehaald — tot morgen!',
    'daily.keepTitle':'Houd je reeks in stand',
    'daily.keepText':'Log elke dag in om hogerop te komen. Dag 7 geeft altijd een mysteriedoos — daarna begint de ladder rijker opnieuw.',
    'daily.rewardTitle':'Beloning dag {n}!',
    'daily.rewardSub':'Reeks van {n} dagen — ga zo door!',
    'daily.thanks':'Bedankt!',
    'daily.coins':'+{n} munten', 'daily.gems':'+{n} diamanten',
    'daily.ribbon':'Lint', 'daily.mystery':'Mysterie',

    'photo.title':'Fotomodus',
    'photo.empty':'Nog geen creaties bewaard.',
    'photo.emptyHint':'Bewaar snoep na het afgeven, of vanuit Vrij ontwerpen.',
    'photo.openFree':'🎨 Open Vrij ontwerpen',
    'photo.madeFor':'Gemaakt voor {name}',
    'photo.freeDesign':'Vrij ontwerp',
    'photo.download':'⬇️ Downloaden', 'photo.delete':'🗑 Verwijderen',
    'photo.saved':'Afbeelding opgeslagen',
    'photo.exportFail':'Kon de afbeelding niet opslaan',
    'photo.deleteTitle':'Deze foto verwijderen?',
    'photo.deleteYes':'Verwijderen',

    'lb.title':'Ranglijsten',
    'lb.level':'Winkelniveau', 'lb.streak':'Beste versierreeks', 'lb.endless':'Eindeloze ronde',
    'lb.note':'Concurrenten worden lokaal gesimuleerd — geen account nodig.',

    'ev.title':'Evenementen',
    'ev.live':'{name} — nu bezig!',
    'ev.liveTag':'LIVE',
    'ev.bonus':'+{n}% munten · {c} exclusieve versieringen',
    'ev.toast':'{name} is begonnen — exclusieve versieringen in de shop!',

    'set.title':'Instellingen',
    'set.language':'Taal',
    'set.music':'Muziek', 'set.sfx':'Geluidseffecten',
    'set.haptics':'Trillen', 'set.hints':'Tips tonen', 'set.volume':'Volume',
    'set.data':'Jouw gegevens',
    'set.dataText':'Voortgang wordt alleen op dit apparaat bewaard. Browsergegevens wissen verwijdert alles.',
    'set.export':'⬆️ Exporteren', 'set.import':'⬇️ Importeren',
    'set.reset':'🗑 Alle voortgang wissen',
    'set.aboutText':'Een gezellige snoepversierwinkel. Elk snoepje, elke versiering en de hele winkel worden live op canvas getekend — helemaal zonder afbeeldingen.',
    'set.tipText':'Tip: houd versieringen vast om ze te verslepen, tik om te selecteren en pas dan de grootte of draaiing aan.',
    'set.exportTitle':'Opslag exporteren', 'set.exportSub':'Kopieer deze code en bewaar hem goed.',
    'set.copy':'Kopiëren', 'set.copied':'Gekopieerd!', 'set.copyManual':'Selecteer en kopieer handmatig',
    'set.done':'Klaar',
    'set.importTitle':'Opslag importeren', 'set.importSub':'Dit overschrijft je huidige voortgang.',
    'set.importBtn':'Importeren', 'set.importPlaceholder':'Plak hier je opslagcode…',
    'set.importBad':'Die code klopte niet',
    'set.exportFail':'Exporteren mislukt',
    'set.resetTitle':'Alles wissen?',
    'set.resetSub':'Alle munten, versieringen en voortgang worden definitief verwijderd.',
    'set.resetYes':'Alles verwijderen',
    'set.freshStart':'Fris begin!',

    'lvl.title':'Niveau {n}!',
    'lvl.sub':'Je winkel groeit. Er is nieuwe inhoud beschikbaar.',
    'lvl.newCandy':'Nieuw snoep vrijgespeeld:',
    'lvl.nice':'Leuk!',

    'idle.title':'Terwijl je weg was',
    'idle.sub':'Je medewerker hield de winkel draaiende.',
    'idle.collect':'Ophalen',

    'toast.coins':'Verdien munten door klanten te helpen en missies te voltooien',
    'toast.gems':'Diamanten krijg je van perfecte orders, dagbeloningen en mysteriedozen',
    'toast.tired':'Een klant was het wachten zat…',
    'toast.langChanged':'Taal gewijzigd naar Nederlands',

    'tut.1.t':'Welkom bij Lieke’s Candy Design!',
    'tut.1.b':'Jij runt een snoepversierwinkel. Klanten komen binnen met heel specifieke wensen — jouw taak is precies te maken wat ze vragen.',
    'tut.2.t':'Kies een klant',
    'tut.2.b':'Tik op een klant — in de winkel of in de lijst — om de bestelling aan te nemen. Let op de geduldbalk: hoe sneller je klaar bent, hoe meer sterren en fooi.',
    'tut.3.t':'Versieren doe je met slepen',
    'tut.3.b':'Kies het snoep, de kleur en de smaak, en sleep versieringen er daarna zo op. Tik op een versiering om die groter te maken, te draaien of weg te halen.',
    'tut.4.t':'Verdien 5 sterren',
    'tut.4.b':'Sterren krijg je voor nauwkeurigheid — juiste snoep, kleur, versiering en verpakking — plus snelheid. Perfecte orders bouwen een comboreeks op.',
    'tut.5.t':'Laat je winkel groeien',
    'tut.5.b':'Geef munten uit aan nieuwe versieringen, winkelupgrades en compleet nieuwe locaties. Vul het verzamelboek en voltooi dagelijkse missies!',
    'tut.next':'Verder', 'tut.back':'Terug', 'tut.go':'Beginnen!',

    'lang.title':'Kies je taal',
    'lang.sub':'Je kunt dit altijd aanpassen bij Instellingen.',

    'ord.with':'met', 'ord.and':'en', 'ord.in':'in',
    'ord.pipe':'en schrijf er "{t}" op',
    'ord.text':'Tekst: "{t}"',
  },
};

/* ══════════════════════════════════════════════════════
   Content names (Dutch overrides)
   ══════════════════════════════════════════════════════ */
const NAMES = {
  nl: {
    candy: {
      truffle:'Truffel', cupcake:'Cupcake', cakepop:'Cakepop',
      pretzel:'Chocoladekrakeling', icecream:'IJshoorntje',
      bar:'Chocoladereep', lolli:'Lolly', bonbon:'Bonbon', gummy:'Gummibeertje',
      marsh:'Marshmallow', cane:'Zuurstok', heart:'Chocoladehart', cookie:'Koekje',
      box:'Snoepdoos', donut:'Donut',
    },
    color: {
      pink:'Roze', blue:'Blauw', purple:'Paars', green:'Groen', yellow:'Geel',
      orange:'Oranje', red:'Rood', white:'Wit', black:'Zwart', brown:'Cacao',
      gold:'Goud', silver:'Zilver', rainbow:'Regenboog',
    },
    /* attributive form used inside order sentences */
    colorAdj: {
      pink:'roze', blue:'blauwe', purple:'paarse', green:'groene', yellow:'gele',
      orange:'oranje', red:'rode', white:'witte', black:'zwarte', brown:'bruine',
      gold:'gouden', silver:'zilveren', rainbow:'regenboogkleurige',
    },
    flavor: {
      milk:'Melkchocolade', strawberry:'Aardbei', vanilla:'Vanille', dark:'Pure chocolade',
      white:'Witte chocolade', lemon:'Citroen', blueberry:'Bosbes', mint:'Munt',
      caramel:'Gezouten karamel', raspberry:'Framboos', bubblegum:'Kauwgom', cotton:'Suikerspin',
    },
    cat: {
      icing:'Glazuur', sprinkle:'Sprinkels', ribbon:'Linten',
      flower:'Bloemen', charm:'Bedeltjes', sticker:'Stickers',
    },
    rarity: {
      common:'Gewoon', rare:'Zeldzaam', epic:'Episch',
      legendary:'Legendarisch', mythic:'Mythisch',
    },
    deco: {
      icing_swirl:'Glazuurroosje', drizzle:'Chocoladedruppels', white_drizzle:'Witte druppels',
      glaze:'Spiegelglazuur', icing_dots:'Gespoten stipjes', caramel_pool:'Karamelpoel',
      sprinkles:'Sprinkels', rainbow_spr:'Regenboogsprinkels', nonpareil:'Suikerparels',
      glitter:'Eetbare glitter', gold_dust:'Goudstof', star_dust:'Sterrenstof',
      crushed_nuts:'Gehakte noten', freeze_berry:'Vriesdroge bessen',
      ribbon:'Satijnen lint', bow:'Mooie strik', gold_ribbon:'Gouden lint',
      lace_ribbon:'Kanten lint', velvet_bow:'Fluwelen strik', silk_wrap:'Zijden wikkel',
      twine:'Rustiek touwtje',
      rose:'Suikerroos', daisy:'Madeliefje', blossom:'Kersenbloesem', leaf:'Muntblaadje',
      bouquet:'Klein boeket', orchid:'Gouden orchidee',
      pearls:'Eetbare parels', heart:'Snoephartje', star:'Suikerster', gem:'Snoepjuweel',
      diamond:'Suikerdiamant', crown:'Kroontje', butterfly:'Suikervlinder', cherry:'Cocktailkers',
      st_heart:'Hartsticker', st_star:'Stersticker', st_bear:'Beersticker', st_cat:'Kattensticker',
      st_moon:'Maansticker', candle:'Verjaardagskaarsje', wafer:'Wafelrolletje', macaron:'Mini-macaron',
      ev_rose_gold:'Rosé-gouden hart', ev_cupid:'Cupidosticker', ev_pumpkin:'Pompoenbedel',
      ev_web:'Spinnenweb', ev_snowflake:'Sneeuwvlok', ev_holly:'Hulsttakje',
      ev_egg:'Gespikkeld eitje', ev_shell:'Zeeschelp', ev_balloon:'Feestballon',
      rw_aurora_bow:'Poollichtstrik', rw_prism_glaze:'Prismaglazuur',
      rw_moon_dust:'Maanstof', rw_star_crown:'Sterrenkroon',
      rw_cocoa_pearls:'Cacaoparels', rw_velvet_rose:'Fluwelen roos',
    },
    tool: {
      fill:'Vulspuit', dip:'Chocoladedoop', toast:'Suikerbrander',
      dust:'Poederzeef', marble:'Marmerdraai', swirl:'Slagroomspuit',
    },
    filling: {
      pistachio:'pistache', hazelnut:'hazelnoot', strawberry:'aardbeiencrème',
      caramel:'karamel', mint:'muntcrème', raspberry:'frambozenjam',
      vanilla:'vanillecrème', ganache:'pure ganache',
    },
    dust: {
      sugar:'poedersuiker', cocoa:'cacao', matcha:'matcha',
      freeze:'bessenpoeder', gold:'goudpoeder',
    },
    pack: {
      none:'Geen verpakking', bag:'Papieren zakje', cello:'Cellofaan', foil:'Folie',
      giftbox:'Cadeaudoos', window:'Vensterdoos', luxury:'Luxe cadeaudoos',
      heartbox:'Hartendoos', jar:'Glazen pot', crystal:'Kristallen doos',
    },
    upgrade: {
      counter:'Toonbank', shelves:'Schappen', machines:'Snoepmachines',
      table:'Versiertafel', register:'Kassa', waiting:'Wachtruimte',
      walls:'Muren', floor:'Vloer', lighting:'Verlichting', music:'Muziekinstallatie',
      staff:'Medewerker',
    },
    location: {
      village:'Klein dorp', city:'Stadscentrum', beach:'Strandwinkel',
      xmas:'Kerstmarkt', mall:'Luxe winkelcentrum', festival:'Snoepfestival',
    },
    event: {
      valentine:'Valentijnsdag', easter:'Pasen', summer:'Zomerevenement',
      birthday:'Verjaardagsweek', halloween:'Halloween', christmas:'Kerstmis',
    },
    pers: {
      sweet:'Schatje', picky:'Perfectionist', rush:'Haastig', kid:'Enthousiast kind',
      lux:'Fijnproever', chill:'Ontspannen', vip:'VIP-gast',
    },
    occasion: {
      birthday:'voor een verjaardag', wedding:'voor een bruiloft',
      thanks:'als bedankje', sorry:'als excuus',
      treat:'gewoon voor mezelf', party:'voor een feestje',
    },
    mission: {
      orders10:'Voltooi 10 bestellingen', orders20:'Voltooi 20 bestellingen',
      five5:'Verdien vijf 5-sterrenreviews', perfect3:'Maak 3 perfecte bestellingen',
      coins500:'Verdien 500 munten', coins2000:'Verdien 2.000 munten',
      deco30:'Plaats 30 versieringen', choc10:'Versier 10 chocoladerepen',
      lolli10:'Versier 10 lolly’s', wrap8:'Verpak 8 bestellingen',
      tip1000:'Verzamel 1.000 munten aan fooi', streak5:'Bereik een reeks van 5 perfecte orders',
      unlock1:'Speel een nieuwe versiering vrij', photo3:'Bewaar 3 creaties in de Fotomodus',
      c_orders25:'Help 25 klanten', c_orders100:'Help 100 klanten', c_orders500:'Help 500 klanten',
      c_five25:'Verdien 25 vijfsterrenreviews', c_five150:'Verdien 150 vijfsterrenreviews',
      c_coins10k:'Verdien in totaal 10.000 munten', c_coins100k:'Verdien in totaal 100.000 munten',
      c_streak10:'Haal een reeks van 10 perfecte orders', c_deco20:'Bezit 20 versieringen',
      c_deco40:'Bezit 40 versieringen', c_candy6:'Speel 6 snoepsoorten vrij',
      c_candy10:'Speel alle snoepsoorten vrij', c_loc3:'Bezit 3 winkellocaties',
      c_lvl10:'Bereik winkelniveau 10', c_lvl20:'Bereik winkelniveau 20',
      c_perfect50:'Maak 50 perfecte bestellingen',
    },
  },
};

const DESCS = {
  nl: {
    candy: {
      bar:'Een klassieke reep met breekbare blokjes.',
      lolli:'Gedraaide suiker op een papieren stokje.',
      bonbon:'Een gevulde chocoladekoepel met een spuitkrul.',
      gummy:'Taai, glanzend en een beetje doorschijnend.',
      marsh:'Zacht kussentje van geroosterde suiker.',
      cane:'Gehaakte pepermuntstok met spiraalstrepen.',
      heart:'Romantisch gegoten hart, perfect voor rozen.',
      cookie:'Boterig gebak met stukjes chocolade.',
      box:'Een assortimentsdoos — het luxe pronkstuk.',
      donut:'Speciale geglazuurde ring met een dikke druip.',
    },
    location: {
      village:'Waar het allemaal begon. Gezellig, rustig, aardige klanten.',
      city:'Drukkere rij, grotere budgetten, minder geduld.',
      beach:'Vakantiegangers die in de zon gul fooi geven.',
      xmas:'Lichtjes, glühwein en feestelijke uitgaven.',
      mall:'Alleen fijnproevers. Enorme fooien, keiharde eisen.',
      festival:'De grote finale. Eindeloos klanten, legendarische beloningen.',
    },
    upgrade: {
      counter:'Een bredere toonbank bedient meer klanten tegelijk.',
      shelves:'Toon je voorraad zodat klanten duurder snoep bestellen.',
      machines:'Sneller gieten geeft je meer tijd per bestelling.',
      table:'Meer ruimte betekent meer versiering op één snoepje.',
      register:'Vlottere betalingen leveren grotere fooien op.',
      waiting:'Comfortabele stoelen vertragen het geduldverlies.',
      walls:'Nieuw behang tilt de sfeer in de winkel omhoog.',
      floor:'Gepolijste tegels. Klanten merken het.',
      lighting:'Warme spotjes maken het snoep onweerstaanbaar.',
      music:'Een rustige playlist houdt iedereen ontspannen.',
      staff:'Een assistent maakt snoep voor, en verdient zo passief munten.',
    },
    event: {
      valentine:'Rozen, hartjes en rosé-goud. Liefde is lucratief.',
      easter:'Overal pasteltinten en heel veel gespikkelde eitjes.',
      summer:'Strandsfeer, zeeschelpen en citrussmaken.',
      birthday:'De winkel is jarig! Ballonnen, kaarsjes en dubbele fooi.',
      halloween:'Spinnenwebglazuur en pompoenen. Eng maar zoet.',
      christmas:'Zuurstokken, sneeuwvlokken en heel gulle klanten.',
    },
  },
};

/* ══════════════════════════════════════════════════════
   Customer dialogue (Dutch)
   ══════════════════════════════════════════════════════ */
const LINES = {
  nl: {
    sweet: {
      greet:['Hoi! Neem gerust de tijd, hoor.','Hallo! Het ruikt hier heerlijk.','Wat is het hier gezellig!'],
      happy:['Dit is nog mooier dan ik me had voorgesteld!','Wat heb jij een zachte hand.','Ik word er bijna emotioneel van, zo schattig.'],
      okay:['Dank je wel, het is prachtig.','Lief! Heel erg bedankt.','Dat is prima zo.'],
      sad:['Oh… dat is niet helemaal wat ik voor me zag.','Hmm. Misschien de volgende keer?','Ik eet het toch wel op, hoor.'],
    },
    picky: {
      greet:['Ik heb een heel specifiek verzoek.','Luister alsjeblieft goed.','Precisie is belangrijk voor mij.'],
      happy:['Vlekkeloos. Echt vlekkeloos.','Dát is nou vakmanschap.','Ik heb geen enkele opmerking. Geen.'],
      okay:['Acceptabel. Niet uitzonderlijk.','Het kan ermee door.','Prima. Het is prima.'],
      sad:['Dit is niet wat ik gevraagd heb.','Heb je de bestelling überhaupt gelezen?','Teleurstellend, eerlijk gezegd.'],
    },
    rush: {
      greet:['Snel snel, mijn bus vertrekt zo!','Ik ben ZO laat, schiet alsjeblieft op!','Zo snel als je kunt, graag!'],
      happy:['Perfect én snel! Je bent een held.','Fantastisch, dankje, doeiii!','Je hebt me gered!'],
      okay:['Top, ik moet rennen!','Bedankt! Dag!','Gelukt, doei!'],
      sad:['Bah, heb ik daar zo lang op gewacht?','Geen tijd om te klagen. Dag.','Dat duurde eeuwen.'],
    },
    kid: {
      greet:['Ik heb AL mijn zakgeld gespaard!','Kun je het superkleurig maken?!','Dit is de beste winkel OOIT!'],
      happy:['WAUW! Kijk dan!','Mama! MAMA! Kijk wat ik heb!','Het is het coolste dat ik heb.'],
      okay:['Cool, bedankt!','Jeej! Snoep!','Vet!'],
      sad:['Ohh… ik wilde meer sprinkels.','Dat is niet de kleur die ik zei.','Oh. Oké dan.'],
    },
    lux: {
      greet:['Geld speelt hier geen rol.','Ik wil iets voortreffelijks.','Verras me, schat.'],
      happy:['Goddelijk. Werkelijk goddelijk.','Ik ga dit aan iedereen vertellen.','Elke munt waard.'],
      okay:['Aanvaardbaar voor de prijs.','Mm. Toereikend.','Ik heb beter gezien, maar goed.'],
      sad:['Ik had veel meer verwacht.','Dit is de reputatie van de winkel onwaardig.','Nee. Gewoon… nee.'],
    },
    chill: {
      greet:['Echt geen haast, hoor.','Wat jij mooi vindt is prima.','Neem rustig de tijd, vriend.'],
      happy:['Oh wat prachtig. Dank je.','Je hebt het echt geweldig gedaan.','Mooi werk.'],
      okay:['Top, bedankt.','Dat werkt voor mij.','Lekker, dankje.'],
      sad:['Ach, geeft niks.','Geen stress. Volgende keer.','Het is goed zo.'],
    },
    vip: {
      greet:['Ik heb buitengewone verhalen gehoord.','Mijn bestelling is… uitgebreid. Klaar?','Alleen het allerbeste is goed genoeg.'],
      happy:['Magnifiek. Je hebt talent.','Ik bestel er meteen honderd bij.','Een meesterwerk. Echt waar.'],
      okay:['Hm. Niet je beste werk, vermoed ik.','Bruikbaar.','Ik neem het. Deze keer.'],
      sad:['Ik ben diep teleurgesteld.','Mijn verwachtingen zijn niet waargemaakt.','Hier spreken we niet meer over.'],
    },
  },
};

/* ══════════════════════════════════════════════════════
   Order sentence builders
   ══════════════════════════════════════════════════════ */
export const ORDER_PHRASES = {
  en: {
    openers:['Could I get','I would love','May I have','I am after','Please make me','I would like','Can you do'],
    closers:['please!','if you can.','thank you!','that would be perfect.','you are the best.','no rush.','as pretty as possible!'],
    numbers:{ 2:'two', 3:'three' },
  },
  nl: {
    openers:['Mag ik','Ik wil graag','Ik zoek','Maak alsjeblieft','Ik heb zin in','Doe mij','Ik zou graag'],
    closers:['alsjeblieft!','als het kan.','dank je wel!','dat zou perfect zijn.','je bent de beste.','geen haast.','zo mooi mogelijk!'],
    numbers:{ 2:'twee', 3:'drie' },
  },
};

/** Dutch plurals for candy — English is derived by rule instead. */
const CANDY_PLURAL_NL = {
  bar:'chocoladerepen', lolli:"lolly's", bonbon:'bonbons', gummy:'gummibeertjes',
  marsh:'marshmallows', cane:'zuurstokken', heart:'chocoladeharten', cookie:'koekjes',
  box:'snoepdozen', donut:'donuts',
  truffle:'truffels', cupcake:'cupcakes', cakepop:'cakepops',
  pretzel:'chocoladekrakelingen', icecream:'ijshoorntjes',
};
export const candyPluralNl = id => CANDY_PLURAL_NL[id];

export const phrases = () => ORDER_PHRASES[lang] || ORDER_PHRASES.en;
