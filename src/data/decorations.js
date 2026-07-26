/* ============================================================
   Decoration library + packaging.
   cat        grouping shown as a tray tab
   art        key into render/decoArt.js
   colorable  the player's chosen accent colour tints it
   layer      paint order on the candy (low → first)
   ============================================================ */

export const DECO_CATS = [
  { id:'icing',    name:'Icing',    emoji:'🧁' },
  { id:'sprinkle', name:'Sprinkles',emoji:'✨' },
  { id:'ribbon',   name:'Ribbons',  emoji:'🎀' },
  { id:'flower',   name:'Flowers',  emoji:'🌸' },
  { id:'charm',    name:'Charms',   emoji:'💎' },
  { id:'sticker',  name:'Stickers', emoji:'🌟' },
];

export const DECORATIONS = [
  /* ── ICING / DRIZZLE ───────────────────────────────── */
  { id:'icing_swirl',  name:'Icing Swirl',    cat:'icing', art:'icingSwirl', rarity:'common', price:0,    unlock:1, colorable:true,  layer:1, size:1,   desc:'A soft piped rosette of buttercream.' },
  { id:'drizzle',      name:'Choc Drizzle',   cat:'icing', art:'drizzle',    rarity:'common', price:0,    unlock:1, colorable:true,  layer:1, size:1.1, desc:'Zig-zag ribbons of melted chocolate.' },
  { id:'white_drizzle',name:'White Drizzle',  cat:'icing', art:'drizzle',    rarity:'common', price:120,  unlock:2, colorable:false, layer:1, size:1.1, fixed:'white', desc:'Creamy white chocolate lace.' },
  { id:'glaze',        name:'Mirror Glaze',   cat:'icing', art:'glaze',      rarity:'rare',   price:520,  unlock:6, colorable:true,  layer:1, size:1.3, desc:'Glossy poured glaze that mirrors the light.' },
  { id:'icing_dots',   name:'Piped Dots',     cat:'icing', art:'icingDots',  rarity:'common', price:180,  unlock:3, colorable:true,  layer:1, size:1,   desc:'A neat row of buttercream pearls.' },
  { id:'caramel_pool', name:'Caramel Pool',   cat:'icing', art:'caramelPool',rarity:'rare',   price:640,  unlock:8, colorable:false, layer:1, size:1.2, fixed:'yellow', desc:'Slow golden caramel with a salt crust.' },

  /* ── SPRINKLES / GLITTER ───────────────────────────── */
  { id:'sprinkles',    name:'Sprinkles',      cat:'sprinkle', art:'sprinkles',  rarity:'common', price:0,   unlock:1, colorable:true,  layer:2, size:1,   desc:'Classic jimmies scattered by hand.' },
  { id:'rainbow_spr',  name:'Rainbow Sprinkles', cat:'sprinkle', art:'sprinkles', rarity:'rare', price:380, unlock:2, colorable:false, layer:2, size:1, fixed:'rainbow', desc:'Every colour at once. Always a winner.' },
  { id:'nonpareil',    name:'Nonpareils',     cat:'sprinkle', art:'nonpareil',  rarity:'common', price:200, unlock:3, colorable:true,  layer:2, size:1,   desc:'Tiny crunchy sugar beads.' },
  { id:'glitter',      name:'Edible Glitter', cat:'sprinkle', art:'glitter',    rarity:'epic',   price:900, unlock:5, colorable:true,  layer:5, size:1.1, desc:'Shimmering dust that catches every angle.' },
  { id:'gold_dust',    name:'Gold Dust',      cat:'sprinkle', art:'glitter',    rarity:'legendary', price:2200, unlock:10, colorable:false, layer:5, size:1.15, fixed:'gold', desc:'24-carat shimmer. Pure luxury.' },
  { id:'star_dust',    name:'Star Dust',      cat:'sprinkle', art:'starDust',   rarity:'mythic', price:9,   currency:'gem', unlock:16, colorable:true, layer:5, size:1.2, desc:'Sugar comets that drift and twinkle.' },
  { id:'crushed_nuts', name:'Crushed Nuts',   cat:'sprinkle', art:'nuts',       rarity:'common', price:220, unlock:4, colorable:false, layer:2, size:1, fixed:'brown', desc:'Toasted hazelnut rubble.' },
  { id:'freeze_berry', name:'Freeze-Dried Berries', cat:'sprinkle', art:'berries', rarity:'rare', price:700, unlock:7, colorable:false, layer:2, size:1, fixed:'red', desc:'Tart ruby shards of real fruit.' },

  /* ── RIBBONS / BOWS / WRAP ─────────────────────────── */
  { id:'ribbon',       name:'Satin Ribbon',   cat:'ribbon', art:'ribbon',    rarity:'common', price:0,    unlock:1, colorable:true,  layer:3, size:1,   desc:'A smooth satin band tied around the middle.' },
  { id:'bow',          name:'Pretty Bow',     cat:'ribbon', art:'bow',       rarity:'common', price:150,  unlock:2, colorable:true,  layer:4, size:1,   desc:'A hand-tied bow with soft tails.' },
  { id:'gold_ribbon',  name:'Gold Ribbon',    cat:'ribbon', art:'ribbon',    rarity:'rare',   price:560,  unlock:4, colorable:false, layer:3, size:1, fixed:'gold', desc:'Woven gold thread with a metallic sheen.' },
  { id:'lace_ribbon',  name:'Lace Ribbon',    cat:'ribbon', art:'lace',      rarity:'epic',   price:1150, unlock:9, colorable:true,  layer:3, size:1,   desc:'Delicate sugar lace, wedding-grade.' },
  { id:'velvet_bow',   name:'Velvet Bow',     cat:'ribbon', art:'bow',       rarity:'epic',   price:1400, unlock:11, colorable:true, layer:4, size:1.2, velvet:true, desc:'Plush deep-pile bow with a soft edge.' },
  { id:'silk_wrap',    name:'Silk Wrap',      cat:'ribbon', art:'silkWrap',  rarity:'legendary', price:2600, unlock:14, colorable:true, layer:6, size:1.5, desc:'A whole sheet of shimmering candy silk.' },
  { id:'twine',        name:'Rustic Twine',   cat:'ribbon', art:'twine',     rarity:'common', price:190,  unlock:5, colorable:false, layer:3, size:1, fixed:'brown', desc:'Homely kitchen string, tied twice.' },

  /* ── FLOWERS ───────────────────────────────────────── */
  { id:'rose',         name:'Sugar Rose',     cat:'flower', art:'rose',      rarity:'rare',   price:640,  unlock:4, colorable:true,  layer:4, size:1,   desc:'Layered petals piped one at a time.' },
  { id:'daisy',        name:'Daisy',          cat:'flower', art:'daisy',     rarity:'common', price:240,  unlock:3, colorable:true,  layer:4, size:1,   desc:'Cheerful five-petal blossom.' },
  { id:'blossom',      name:'Cherry Blossom', cat:'flower', art:'blossom',   rarity:'rare',   price:820,  unlock:8, colorable:true,  layer:4, size:1,   desc:'Delicate spring petals, faintly perfumed.' },
  { id:'leaf',         name:'Mint Leaf',      cat:'flower', art:'leaf',      rarity:'common', price:160,  unlock:4, colorable:false, layer:4, size:1, fixed:'green', desc:'A crisp candied mint leaf.' },
  { id:'bouquet',      name:'Petit Bouquet',  cat:'flower', art:'bouquet',   rarity:'legendary', price:2900, unlock:15, colorable:true, layer:4, size:1.3, desc:'A tiny arranged posy. Show-stopping.' },
  { id:'orchid',       name:'Golden Orchid',  cat:'flower', art:'orchid',    rarity:'mythic', price:14, currency:'gem', unlock:18, colorable:false, layer:4, size:1.2, fixed:'gold', desc:'A single impossible bloom of spun gold.' },

  /* ── CHARMS: pearls, hearts, stars, gems ───────────── */
  { id:'pearls',       name:'Edible Pearls',  cat:'charm', art:'pearls',    rarity:'rare',   price:600,  unlock:5, colorable:true,  layer:4, size:1,   desc:'A strand of lustrous sugar pearls.' },
  { id:'heart',        name:'Candy Heart',    cat:'charm', art:'heart',     rarity:'common', price:130,  unlock:2, colorable:true,  layer:4, size:1,   desc:'A glossy little heart.' },
  { id:'star',         name:'Sugar Star',     cat:'charm', art:'star',      rarity:'common', price:130,  unlock:2, colorable:true,  layer:4, size:1,   desc:'Five perfect points.' },
  { id:'gem',          name:'Candy Gem',      cat:'charm', art:'gem',       rarity:'epic',   price:1250, unlock:9, colorable:true,  layer:4, size:1,   desc:'A faceted jewel of hard sugar.' },
  { id:'diamond',      name:'Sugar Diamond',  cat:'charm', art:'diamond',   rarity:'legendary', price:3200, unlock:13, colorable:false, layer:4, size:1.1, fixed:'silver', desc:'Brilliant-cut and blindingly clear.' },
  { id:'crown',        name:'Tiny Crown',     cat:'charm', art:'crown',     rarity:'legendary', price:3400, unlock:16, colorable:false, layer:4, size:1.1, fixed:'gold', desc:'For candy of genuine royal standing.' },
  { id:'butterfly',    name:'Sugar Butterfly',cat:'charm', art:'butterfly', rarity:'mythic', price:16, currency:'gem', unlock:19, colorable:true, layer:4, size:1.15, desc:'Wings that flutter if you watch closely.' },
  { id:'cherry',       name:'Glacé Cherry',   cat:'charm', art:'cherry',    rarity:'common', price:170,  unlock:3, colorable:false, layer:4, size:1, fixed:'red', desc:'The finishing touch on anything.' },

  /* ── STICKERS / TOPPERS / TEXT ─────────────────────── */
  { id:'st_heart',     name:'Heart Sticker',  cat:'sticker', art:'sticker', rarity:'common', price:110, unlock:2, colorable:true, layer:5, size:1, glyph:'💗', desc:'Puffy foil heart sticker.' },
  { id:'st_star',      name:'Star Sticker',   cat:'sticker', art:'sticker', rarity:'common', price:110, unlock:2, colorable:true, layer:5, size:1, glyph:'⭐', desc:'A shiny little star.' },
  { id:'st_bear',      name:'Bear Sticker',   cat:'sticker', art:'sticker', rarity:'rare',   price:480, unlock:6, colorable:true, layer:5, size:1, glyph:'🧸', desc:'Cuddly bear face on foil.' },
  { id:'st_cat',       name:'Cat Sticker',    cat:'sticker', art:'sticker', rarity:'rare',   price:480, unlock:7, colorable:true, layer:5, size:1, glyph:'🐱', desc:'A very smug little cat.' },
  { id:'st_moon',      name:'Moon Sticker',   cat:'sticker', art:'sticker', rarity:'epic',   price:1100,unlock:10,colorable:true, layer:5, size:1, glyph:'🌙', desc:'Glows a little in low light.' },
  { id:'candle',       name:'Birthday Candle',cat:'sticker', art:'candle',  rarity:'rare',   price:520, unlock:6, colorable:true, layer:4, size:1, desc:'Lit wick with a dancing flame.' },
  { id:'wafer',        name:'Wafer Roll',     cat:'sticker', art:'wafer',   rarity:'common', price:230, unlock:5, colorable:false, layer:4, size:1, fixed:'brown', desc:'Crisp rolled wafer, snapped to length.' },
  { id:'macaron',      name:'Mini Macaron',   cat:'sticker', art:'macaron', rarity:'epic',   price:1300,unlock:12,colorable:true, layer:4, size:1, desc:'A perfect Parisian miniature.' },

  /* ── EVENT EXCLUSIVES (sold only in season) ────────── */
  { id:'ev_rose_gold', name:'Rose-Gold Heart',cat:'charm',   art:'heart',   rarity:'legendary', price:1900, unlock:5, colorable:false, layer:4, size:1.15, fixed:'gold', event:'valentine', desc:'Valentine exclusive — blush-gold and glowing.' },
  { id:'ev_cupid',     name:'Cupid Sticker',  cat:'sticker', art:'sticker', rarity:'epic',      price:1200, unlock:4, colorable:true, layer:5, size:1, glyph:'💘', event:'valentine', desc:'Valentine exclusive.' },
  { id:'ev_pumpkin',   name:'Pumpkin Charm',  cat:'charm',   art:'pumpkin', rarity:'epic',      price:1250, unlock:4, colorable:false, layer:4, size:1, fixed:'orange', event:'halloween', desc:'Halloween exclusive — carved and grinning.' },
  { id:'ev_web',       name:'Spider Web',     cat:'icing',   art:'web',     rarity:'rare',      price:760,  unlock:3, colorable:true, layer:1, size:1.3, event:'halloween', desc:'Halloween exclusive — piped icing web.' },
  { id:'ev_snowflake', name:'Snowflake',      cat:'charm',   art:'snowflake',rarity:'epic',     price:1150, unlock:4, colorable:true, layer:4, size:1, event:'christmas', desc:'Christmas exclusive — no two alike.' },
  { id:'ev_holly',     name:'Holly Sprig',    cat:'flower',  art:'holly',   rarity:'rare',      price:690,  unlock:3, colorable:false, layer:4, size:1, fixed:'green', event:'christmas', desc:'Christmas exclusive.' },
  { id:'ev_egg',       name:'Speckled Egg',   cat:'charm',   art:'egg',     rarity:'rare',      price:700,  unlock:3, colorable:true, layer:4, size:1, event:'easter', desc:'Easter exclusive — hand-speckled.' },
  { id:'ev_shell',     name:'Sea Shell',      cat:'charm',   art:'shell',   rarity:'epic',      price:1180, unlock:4, colorable:true, layer:4, size:1, event:'summer', desc:'Summer exclusive — sounds like the sea.' },
  { id:'ev_balloon',   name:'Party Balloon',  cat:'sticker', art:'balloon', rarity:'epic',      price:1220, unlock:4, colorable:true, layer:4, size:1.1, event:'birthday', desc:'Birthday Week exclusive.' },

  /* ── LEVEL-UP REWARDS ──────────────────────────────────
     `reward:true` keeps these out of the store — the only way to
     get them is the pick-2 grid you open when you level up. */
  { id:'rw_aurora_bow',  name:'Aurora Bow',      cat:'ribbon',   art:'bow',      rarity:'mythic',    price:0, unlock:1, colorable:false, fixed:'rainbow', layer:4, size:1.25, reward:true, desc:'Level reward — a bow woven from northern lights.' },
  { id:'rw_prism_glaze', name:'Prism Glaze',     cat:'icing',    art:'glaze',    rarity:'legendary', price:0, unlock:1, colorable:false, fixed:'rainbow', layer:1, size:1.35, reward:true, desc:'Level reward — glaze that splits the light.' },
  { id:'rw_moon_dust',   name:'Moon Dust',       cat:'sprinkle', art:'starDust', rarity:'legendary', price:0, unlock:1, colorable:false, fixed:'silver',  layer:5, size:1.2,  reward:true, desc:'Level reward — silver comets in slow orbit.' },
  { id:'rw_star_crown',  name:'Starlight Crown', cat:'charm',    art:'crown',    rarity:'mythic',    price:0, unlock:1, colorable:false, fixed:'silver',  layer:4, size:1.15, reward:true, desc:'Level reward — cool silver, warm prestige.' },
  { id:'rw_cocoa_pearls',name:'Cocoa Pearls',    cat:'charm',    art:'pearls',   rarity:'epic',      price:0, unlock:1, colorable:false, fixed:'brown',   layer:4, size:1,    reward:true, desc:'Level reward — dark, glossy and impossibly round.' },
  { id:'rw_velvet_rose', name:'Velvet Rose',     cat:'flower',   art:'rose',     rarity:'legendary', price:0, unlock:1, colorable:true,  layer:4, size:1.2, reward:true, desc:'Level reward — deep petals with a matte bloom.' },
];

export const DECO_BY_ID = Object.fromEntries(DECORATIONS.map(d => [d.id, d]));
export const getDeco = id => DECO_BY_ID[id];

/** Free from day one. */
export const STARTER_DECOS = ['icing_swirl', 'drizzle', 'sprinkles', 'ribbon'];

/* ── Packaging ─────────────────────────────────────────
   Applied to the whole design rather than placed by hand. */
export const PACKAGING = [
  { id:'none',      name:'No Wrap',        art:'none',     rarity:'common',    price:0,    unlock:1,  bonus:0,    desc:'Served bare, straight from the table.' },
  { id:'bag',       name:'Paper Bag',      art:'bag',      rarity:'common',    price:0,    unlock:1,  bonus:.03,  desc:'Simple kraft bag with a folded top.' },
  { id:'cello',     name:'Cellophane',     art:'cello',    rarity:'common',    price:260,  unlock:2,  bonus:.06,  desc:'Crinkly clear wrap twisted at the ends.' },
  { id:'foil',      name:'Foil Wrap',      art:'foil',     rarity:'rare',      price:720,  unlock:4,  bonus:.10,  desc:'Mirror-bright foil pressed to shape.' },
  { id:'giftbox',   name:'Gift Box',       art:'giftbox',  rarity:'rare',      price:1100, unlock:6,  bonus:.14,  desc:'Sturdy card box with a lift-off lid.' },
  { id:'window',    name:'Window Box',     art:'window',   rarity:'epic',      price:1900, unlock:9,  bonus:.20,  desc:'Boxed with a clear window to show it off.' },
  { id:'luxury',    name:'Luxury Gift Box',art:'luxury',   rarity:'legendary', price:3600, unlock:12, bonus:.30,  desc:'Padded, gold-embossed, ribbon-tied.' },
  { id:'heartbox',  name:'Heart Box',      art:'heartbox', rarity:'epic',      price:2100, unlock:10, bonus:.22,  desc:'A padded satin heart. Say no more.' },
  { id:'jar',       name:'Glass Jar',      art:'jar',      rarity:'rare',      price:980,  unlock:8,  bonus:.13,  desc:'Corked apothecary jar with a label.' },
  { id:'crystal',   name:'Crystal Case',   art:'crystal',  rarity:'mythic',    price:24, currency:'gem', unlock:17, bonus:.45, desc:'Faceted display case. Museum energy.' },
];

export const PACK_BY_ID = Object.fromEntries(PACKAGING.map(p => [p.id, p]));
export const getPack = id => PACK_BY_ID[id] || PACK_BY_ID.none;
export const STARTER_PACKS = ['none', 'bag'];
