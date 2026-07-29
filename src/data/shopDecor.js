/* ============================================================
   Shop decoration — the bits and pieces you put around the shop.

   Six spots, and a piece for each kind of spot. Nothing here changes
   how the game plays beyond a little shop mood; it is there so the
   shop looks like hers rather than like everybody else's.
   ============================================================ */

/** Where a piece can go. */
export const SLOTS = [
  { id:'ceiling', kind:'ceiling', emoji:'🎊' },
  { id:'wallL',   kind:'wall',    emoji:'🖼️' },
  { id:'wallMid', kind:'wall',    emoji:'🕰️' },
  { id:'floorL',  kind:'floor',   emoji:'🪴' },
  { id:'floorR',  kind:'floor',   emoji:'💡' },
  { id:'counter', kind:'counter', emoji:'🍰' },
];
export const SLOT_BY_ID = Object.fromEntries(SLOTS.map(s => [s.id, s]));

export const DECOR = [
  /* ── across the ceiling ── */
  { id:'bunting',  kind:'ceiling', emoji:'🎊', price:900,  unlock:1, mood:2 },
  { id:'balloons', kind:'ceiling', emoji:'🎈', price:1600, unlock:5, mood:3 },
  { id:'lanterns', kind:'ceiling', emoji:'🏮', price:2600, unlock:9, mood:4 },

  /* ── on the wall ── */
  { id:'poster',   kind:'wall', emoji:'🖼️', price:700,  unlock:1, mood:2 },
  { id:'clock',    kind:'wall', emoji:'🕰️', price:1400, unlock:4, mood:2 },
  { id:'neon',     kind:'wall', emoji:'✨', price:3400, unlock:11, mood:5 },

  /* ── on the floor ── */
  { id:'plant',    kind:'floor', emoji:'🪴', price:800,  unlock:1, mood:2 },
  { id:'gumball',  kind:'floor', emoji:'🔴', price:2200, unlock:7, mood:4 },
  { id:'lamp',     kind:'floor', emoji:'💡', price:1500, unlock:5, mood:3 },

  /* ── on the counter ── */
  { id:'cakestand',kind:'counter', emoji:'🍰', price:1100, unlock:3, mood:3 },
  { id:'tipjar',   kind:'counter', emoji:'🫙', price:600,  unlock:1, mood:1 },
  { id:'vase',     kind:'counter', emoji:'💐', price:1800, unlock:6, mood:3 },
];
export const DECOR_BY_ID = Object.fromEntries(DECOR.map(d => [d.id, d]));

/** Everything that fits a given spot. */
export const decorFor = kind => DECOR.filter(d => d.kind === kind);

/** Shop mood from everything currently on show. */
export function decorMood(placed = {}){
  let n = 0;
  for (const id of Object.values(placed)){
    n += DECOR_BY_ID[id]?.mood || 0;
  }
  return n;
}

/**
 * Where each spot sits in the diorama, as fractions of its width and
 * height, plus how big the piece is drawn. The floor pieces are drawn
 * before the counter so they read as standing behind it.
 */
export const ANCHORS = {
  ceiling: { x:.50, y:.030, size:1.00, behind:true },
  wallL:   { x:.085, y:.115, size:.145, behind:true },
  wallMid: { x:.320, y:.520, size:.165, behind:true },
  floorL:  { x:.055, y:.700, size:.150, behind:true },
  floorR:  { x:.945, y:.700, size:.150, behind:true },
  counter: { x:.560, y:.700, size:.150, behind:false },
};
